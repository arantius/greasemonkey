'use strict';
define('bg/user-script-registry', require => {
const {EVAL_CONTENT_VERSION, RunnableUserScript} = require('/src/user-script-obj.js');


/*
The registry of installed user scripts.

The `UserScriptRegistry` object owns a set of UserScript objects, and
exports methods for discovering them and their details.
*/

// TODO: Order?
let userScripts = {};

const dbName = 'greasemonkey';
const dbVersion = 1;
const scriptStoreName = 'user-scripts';


function blobToBuffer(blob) {
  if (!blob) return Promise.resolve(null);

  let reader = new FileReader();
  reader.readAsArrayBuffer(blob);
  return new Promise((resolve, reject) => {
    reader.onload = event => {
      resolve({'buffer': reader.result, 'type': blob.type});
    };
  });
}


function bufferToBlob(buffer) {
  if (!buffer) return buffer;
  if (buffer instanceof Blob) return buffer;
  return new Blob([buffer.buffer], {'type': buffer.type});
}


async function openDb() {
  if (navigator.storage && navigator.storage.persist) {
    await navigator.storage.persist();
  }

  return new Promise((resolve, reject) => {
    let dbOpen = indexedDB.open(dbName, dbVersion);
    dbOpen.onerror = event => {
      // Note: can get error here if dbVersion is too low.
      console.error('Error opening user-scripts DB!', event);
      reject(event);
    };
    dbOpen.onsuccess = event => {
      resolve(event.target.result);
    };
    dbOpen.onupgradeneeded = event => {
      let db = event.target.result;
      db.onerror = event => {
        console.error('Error upgrading user-scripts DB!', event);
        reject(event);
      };
      let store = db.createObjectStore(scriptStoreName, {'keypath': 'uuid'});
      // The generated from @name and @namespace ID.
      store.createIndex('id', 'id', {'unique': true});
    };
  });
}

///////////////////////////////////////////////////////////////////////////////

async function installFromDownloader(userScriptDetails, downloaderDetails) {
  let remoteScript = new RemoteUserScript(userScriptDetails);
  let scriptValues = downloaderDetails.valueStore;
  delete downloaderDetails.valueStore;

  let db = await openDb();
  let txn = db.transaction([scriptStoreName], "readonly");
  let store = txn.objectStore(scriptStoreName);
  let index = store.index('id');
  let req = index.get(remoteScript.id);
  db.close();

  return new Promise((resolve, reject) => {
    req.onsuccess = event => {
      resolve(req.result);
    };
    req.onerror = event => {
      reject(req.error);
    };
  }).then(foundDetails => {
    foundDetails = foundDetails || {};
    foundDetails.iconBlob = bufferToBlob(foundDetails.iconBlob);

    let userScript = new EditableUserScript(foundDetails);
    userScript
        .updateFromDownloaderDetails(userScriptDetails, downloaderDetails);
    return userScript;
  }).then(saveUserScript)
  .then(async (details) => {
    if (scriptValues) {
      await ValueStore.deleteStore(details.uuid);
      let setValues = Object.entries(scriptValues).map(([key, value]) => {
        return ValueStore.setValue(details.uuid, key, value);
      });
      await Promise.all(setValues);
    }
    return details.uuid;
  }).catch(err => {
    console.error('Error in installFromDownloader()', err);
    // Rethrow so caller can also deal with it
    throw err;
  });
}


async function loadUserScripts() {
  let db = await openDb();
  let txn = db.transaction([scriptStoreName], "readonly");
  let store = txn.objectStore(scriptStoreName);
  let req = store.getAll();
  db.close();

  return new Promise((resolve, reject) => {
    req.onsuccess = event => {
      resolve(req.result);
    };
    req.onerror = event => {
      reject(req.error);
    };
  }).then(loadDetails => {
    let savePromises = loadDetails.map(details => {
      details.iconBlob = bufferToBlob(details.iconBlob);

      if (details.evalContentVersion != EVAL_CONTENT_VERSION) {
        return saveUserScript(new EditableUserScript(details));
      } else {
        return details;
      }
    });
    return Promise.all(savePromises);
  }).then(saveDetails => {
    userScripts = {};
    saveDetails.forEach(details => {
      userScripts[details.uuid] = new EditableUserScript(details);
    });
  }).catch(err => {
    console.error('Failed to load user scripts', err);
  });
}


function onListUserScripts(message, sender, sendResponse) {
  let result = [];
  var userScriptIterator = UserScriptRegistry.scriptsToRunAt(
      null, message.includeDisabled);
  for (let userScript of userScriptIterator) {
    result.push(userScript.details);
  }
  sendResponse(result);
};


function onUserScriptGet(message, sender, sendResponse) {
  if (!message.uuid) {
    console.warn('UserScriptGet handler got no UUID.');
  } else if (!userScripts[message.uuid]) {
    console.warn(
      'UserScriptGet handler got non-installed UUID:', message.uuid);
  } else {
    sendResponse(userScripts[message.uuid].details);
  }
};


function onUserScriptInstall(message, sender, sendResponse) {
  return installFromDownloader(message.userScript, message.downloader);
}


function onApiGetResourceBlob(message, sender, sendResponse) {
  if (!message.uuid) {
    console.error('onApiGetResourceBlob handler got no UUID.');
    sendResponse(false);
    return;
  } else if (!message.resourceName) {
    console.error('onApiGetResourceBlob handler got no resourceName.');
    sendResponse(false);
    return;
  } else if (!userScripts[message.uuid]) {
    console.error(
        'onApiGetResourceBlob handler got non-installed UUID:', message.uuid);
    sendResponse(false);
    return;
  }
  checkApiCallAllowed('GM.getResourceUrl', message.uuid);

  let userScript = userScripts[message.uuid];
  let resource = userScript.resources[message.resourceName];
  if (!resource) {
    sendResponse(false);
  } else {
    sendResponse({
      'blob': resource.blob,
      'mimetype': resource.mimetype,
      'resourceName': message.resourceName,
    });
  }
};


function onUserScriptToggleEnabled(message, sender, sendResponse) {
  const userScript = userScripts[message.uuid];
  userScript.enabled = !userScript.enabled;
  return saveUserScript(userScript).then(() => {
    return {'enabled': userScript.enabled}
  });
};


async function onUserScriptUninstall(message, sender, sendResponse) {
  let db = await openDb();
  let txn = db.transaction([scriptStoreName], 'readwrite');
  let store = txn.objectStore(scriptStoreName);
  let req = store.delete(message.uuid);
  db.close();

  return new Promise((resolve, reject) => {
    req.onsuccess = event => {
      delete userScripts[message.uuid];
      resolve();
    };
    req.onerror = event => {
      console.error('onUserScriptUninstall() failure', event);
      reject(req.error);
    };
  }).then(() => {
    // TODO: The store may be orphaned if this fails
    return ValueStore.deleteStore(message.uuid);
  });
};


async function saveUserScript(userScript) {
  if (!(userScript instanceof EditableUserScript)) {
    throw new Error(
        'Cannot save this type of UserScript object: '
        + userScript.constructor.name);
  }

  userScript.calculateEvalContent();

  function onSaveError(error) {
    let message;
    if (error.name == 'ConstraintError') {
      // Most likely due to namespace / name conflict.
      message = _(
          'save_failed_NAME_already_in_NAMESPACE',
          JSON.stringify(userScript.name),
          JSON.stringify(userScript.namespace));
    } else {
      message = _('save_failed_unknown');
    }

    // TODO: Pass this message to the editor tab, not general notifications.
    let notificationOpts = {
      'iconUrl': '/skin/icon.svg',
      'message': message,
      'title': _('script_save_error'),
      'type': 'basic',
    };
    chrome.notifications.create(notificationOpts);
    // Rethrow to allow caller to deal with error
    throw error;
  }

  let details = userScript.details;
  details.id = userScript.id;  // Secondary index on calculated value.
  details.iconBlob = await blobToBuffer(details.iconBlob);  // See #2908.
  delete details.parsedDetails;

  let db = await openDb();
  let txn = db.transaction([scriptStoreName], 'readwrite');
  let store = txn.objectStore(scriptStoreName);
  let req = store.put(details, userScript.uuid);
  db.close();

  return new Promise((resolve, reject) => {
    req.onsuccess = event => {
      // In case this was for an install, now that the user script is saved
      // to the object store, also put it in the in-memory copy.
      userScripts[userScript.uuid] = userScript;
      // Create a new details object since the original was modified for saving
      let resDetails = userScript.details;
      resDetails.id = userScript.id;
      resolve(resDetails);
    };
    req.onerror = event => {
      reject(req.error);
    };
  }).catch(onSaveError);
}


function scriptByUuid(scriptUuid) {
  if (!userScripts[scriptUuid]) {
    throw new Error(
        'Could not find installed user script with uuid ' + scriptUuid);
  }
  return userScripts[scriptUuid];
}


// Generate user scripts to run at `urlStr`; all if no URL provided.
function* scriptsToRunAt(urlStr=null, includeDisabled=false) {
  let url = urlStr && new URL(urlStr);

  for (let uuid in userScripts) {
    let userScript = userScripts[uuid];
    try {
      if (!includeDisabled && !userScript.enabled) continue;
      if (url && !userScript.runsAt(url)) continue;
      yield userScript;
    } catch (e) {
      console.error(
          'Failed checking whether', userScript.toString(),
          'runs at', urlStr, ':', e);
    }
  }
}


return {
  '_loadUserScripts': loadUserScripts,
  '_saveUserScript': saveUserScript,
  'onListUserScripts': onListUserScripts,
  'onUserScriptGet': onUserScriptGet,
  'onUserScriptInstall': onUserScriptInstall,
  'onApiGetResourceBlob': onApiGetResourceBlob,
  'onUserScriptToggleEnabled': onUserScriptToggleEnabled,
  'onUserScriptUninstall': onUserScriptUninstall,
  'scriptByUuid': scriptByUuid,
  'scriptsToRunAt': scriptsToRunAt,
}});
