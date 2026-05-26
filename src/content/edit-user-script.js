'use strict';
let gUserScript = null;
let modalTimer = null;

const userScriptUuid = location.hash.substr(1);
const editorDocs = [];
const editorTabs = [];
const editorUrls = [];
const tabs = document.getElementById('tabs');
const gTplData = {
  'name': '',
  'modal': {
    'closeDisabled': true,
    'errorList': [],
    'title': _('saving'),
  },
  'editorOptions': {
    'continueComments': true,
    'matchBrackets': true,
    'showLineNumbers': true,
    'styleActiveLine': true,
  },
  'optionsMenuVisible': false,
};
// Change the title of the save icon (and more) to initial values.
tinybind.bind(document, gTplData);

document.querySelector('#modal footer button')
    .addEventListener('click', modalClose);

///////////////////////////////////////////////////////////////////////////////

function addRequireTab(url, content) {
  if (!url) return console.error('addRequireTab: missing URL!');
  if (!content) return console.error('addRequireTab: missing content!');
  let requireTab = document.createElement('li');
  requireTab.className = 'tab require';
  requireTab.textContent = nameForUrl(url);
  tabs.appendChild(requireTab);
  editorTabs.push(requireTab);
  editorDocs.push(createDoc(content, 'javascript'));
  editorUrls.push(url);
}

async function addResourceTab(resource) {
  if (!resource) return console.error('addResourceTab: missing resource!');
  let resourceTab = document.createElement('li');
  resourceTab.className = 'tab resource';
  resourceTab.textContent = resource.name;
  tabs.appendChild(resourceTab);
  editorTabs.push(resourceTab);

  let mode = null;
  if (resource.url.match(/\.css(\?|$)/)) mode = 'css';
  editorDocs.push(createDoc(await resource.blob.text(), mode));

  editorUrls.push(resource.url);
}

function nameForUrl(url) {
  return unescape(url.replace(/.*\//, '').replace(/[?#].*/, ''));
}

///////////////////////////////////////////////////////////////////////////////

let editor;
let createDoc;
(async function() {
  let {editorOptions} = await browser.storage.local.get('editorOptions');
  gTplData.editorOptions = Object.assign(gTplData.editorOptions, editorOptions);

  let gmOptions = await browser.runtime.sendMessage({'name': 'OptionsLoad'});
  const editorElem = document.getElementById('editor');
  if (gmOptions.useCodeMirror) {
    const macKeymap = CodeMirror.normalizeKeyMap({
      'Cmd-/': 'toggleComment',
      'Cmd-Space': 'autocomplete',
    });
    const pcKeymap = CodeMirror.normalizeKeyMap({
      'Ctrl-/': 'toggleComment',
      'Ctrl-Space': 'autocomplete',
    });

    const isMacKeymap = CodeMirror.keyMap.default == CodeMirror.keyMap.macDefault;

    editor = CodeMirror(
        editorElem,
        {
          'continueComments': gTplData.editorOptions.continueComments,
          'extraKeys': isMacKeymap ? macKeymap : pcKeymap,
          'foldGutter': true,
          'lineNumbers': gTplData.editorOptions.showLineNumbers,
          'matchBrackets': gTplData.editorOptions.matchBrackets,
          'styleActiveLine': gTplData.editorOptions.styleActiveLine,
          'tabSize': 2,
        });

    CodeMirror.commands.save = onSave;
    createDoc = (...args) => CodeMirror.Doc(...args);
  } else {
    editor = new SimpleEditor(editorElem);
    createDoc = (...args) => new SimpleEditorDoc(...args);
    // TODO: Hide editor options menu; it does not apply to simple editor.
  }

  editor.on('change', () => {
    let selectedTab = document.querySelector('#tabs .tab.active');
    let idx = editorTabs.indexOf(selectedTab);
    let selectedDoc = editorDocs[idx];
    if (selectedDoc.isClean()) {
      selectedTab.classList.remove('dirty');
    } else {
      selectedTab.classList.add('dirty');
    }
  });

  editor.on('swapDoc', doc => {
    if (doc.getMode().name == 'javascript') {
      doc.setOption('gutters', [
          'CodeMirror-lint-markers', 'CodeMirror-linenumbers',
          'CodeMirror-foldgutter']);
      doc.setOption('lint', true);
      doc.performLint();
    } else {
      doc.setOption('gutters', [
          'CodeMirror-linenumbers', 'CodeMirror-foldgutter']);
      doc.setOption('lint', false);
    }
  });

  gUserScript = await browser.runtime.sendMessage({
    'name': 'UserScriptGet',
    'uuid': userScriptUuid,
  });
  let scriptTab = document.createElement('li');
  scriptTab.className = 'tab active';
  scriptTab.textContent = i18nUserScript('name', gUserScript);
  tabs.appendChild(scriptTab);
  editorTabs.push(scriptTab);
  editorDocs.push(createDoc(gUserScript.content, 'javascript'));
  editorUrls.push(null);

  Object.keys(gUserScript.requiresContent).forEach(u => {
    addRequireTab(u, gUserScript.requiresContent[u]);
  });

  let parsedMeta = null;
  for (const [name, resource] of Object.entries(gUserScript.resources)) {
    if (!resource.mimetype.match(/^text\//)) continue;

    if (!resource.url) {
      // Scripts installed with a version before #2733 will not know their URL.
      // Back-fill this value by matching the name from freshly parsed metadata.
      // This is required for it to save properly.
      if (!parsedMeta) {
        parsedMeta = parseUserScript(
            gUserScript.content, gUserScript.downloadUrl);
      }
      for (const [n, u] of Object.entries(parsedMeta.resourceUrls)) {
        if (n == name) {
          resource.url = u;
          break;
        }
      }
    }

    await addResourceTab(resource);
  };

  editor.swapDoc(editorDocs[0]);
  editor.focus();

  gTplData.name = i18nUserScript('name', gUserScript);
})();

///////////////////////////////////////////////////////////////////////////////

document.addEventListener('click', event => {
  const clickedInOptions
      = document.getElementById('options').contains(event.target);
  const clickedInOptionsMenu
      = document.querySelector('#options menu').contains(event.target);
  if (gTplData.optionsMenuVisible && !clickedInOptionsMenu) {
    gTplData.optionsMenuVisible = false;
  } else if (!gTplData.optionsMenuVisible && clickedInOptions) {
    gTplData.optionsMenuVisible = true;
  }
});


document.getElementById('options').addEventListener('click', event => {
  let el = event.target;
  while (el && el.tagName != 'MENUITEM') el = el.parentNode;
  if (!el) return;

  let needsSave = false;
  switch (el.id) {
    case 'toggle-continue-comments':
      gTplData.editorOptions.continueComments = !gTplData.editorOptions.continueComments;
      if (editor.setOption) {
        editor.setOption('continueComments', gTplData.editorOptions.continueComments);
      }
      needsSave = true;
      break;
    case 'toggle-line-numbers':
      gTplData.editorOptions.showLineNumbers = !gTplData.editorOptions.showLineNumbers;
      if (editor.setOption) {
        editor.setOption('lineNumbers', gTplData.editorOptions.showLineNumbers);
      }
      needsSave = true;
      break;
    case 'toggle-match-brackets':
      gTplData.editorOptions.matchBrackets = !gTplData.editorOptions.matchBrackets;
      if (editor.setOption) {
        editor.setOption('matchBrackets', gTplData.editorOptions.matchBrackets);
      }
      needsSave = true;
      break;
    case 'toggle-style-active-line':
      gTplData.editorOptions.styleActiveLine = !gTplData.editorOptions.styleActiveLine;
      if (editor.setOption) {
        editor.setOption('styleActiveLine', gTplData.editorOptions.styleActiveLine);
      }
      needsSave = true;
      break;
  }

  if (needsSave) {
    // Marshall template bound values down to primitives.
    let save = {'editorOptions': {
      'showLineNumbers': !!gTplData.editorOptions.showLineNumbers,
      'matchBrackets': !!gTplData.editorOptions.matchBrackets,
    }};
    browser.storage.local.set(save);
  }
});

///////////////////////////////////////////////////////////////////////////////


/**
 * A very simple editor based on a textarea.
 * This is needed by screen reader users, as CodeMirror is unfortunately not
 * accessible.
 * This class simluates the parts of the CodeMirror API we need.
 */
class SimpleEditor {
  constructor(element) {
    this._doc = null;
    this._onChangeExternal = null;
    this._onSwapDoc = null;
    this._textarea = document.createElement("textarea");
    this._textarea.style["white-space"] = "pre-wrap";
    this._textarea.addEventListener("input", this._onChange.bind(this));
    this._textarea.addEventListener("keydown", this._onKeyDown.bind(this));
    element.appendChild(this._textarea);
  }

  getInputField() {
    return this._textarea;
  }

  focus() {
    this._textarea.focus();
  }

  swapDoc(doc) {
    this._doc = doc;
    this._textarea.value = doc.getValue();
    if (this._onSwapDoc) {
      this._onSwapDoc(doc);
    }
  }

  on(name, handler) {
    if (name == "change") {
      this._onChangeExternal = handler;
    } else if (name == "swapDoc") {
      this._onSwapDoc = handler;
    }
  }

  execCommand(command) {
    if (command == "save") {
      onSave();
    }
  }

  _onChange() {
    if (this._doc) {
      this._doc._currentValue = this._textarea.value;
    }
    if (this._onChangeExternal) {
      this._onChangeExternal();
    }
  }

  _onKeyDown(event) {
    if (event.ctrlKey && event.key == "s") {
      event.preventDefault();
      this.execCommand("save");
    }
  }
}

class SimpleEditorDoc {
  constructor(content, type) {
    this._savedValue = content;
    this._currentValue = content;
  }

  getValue() {
    return this._currentValue;
  }

  isClean() {
    return this._currentValue == this._savedValue;
  }

  markClean() {
    this._savedValue = this._currentValue;
  }

  getMode() {
    return {};
  }
}


///////////////////////////////////////////////////////////////////////////////

tabs.addEventListener('click', event => {
  if (event.target.classList.contains('tab')) {
    let selectedTab = document.querySelector('#tabs .tab.active');
    selectedTab.classList.remove('active');

    let newTab = event.target;
    newTab.classList.add('active');

    let idx = editorTabs.indexOf(newTab);
    editor.swapDoc(editorDocs[idx]);
    editor.focus();
  }
}, true);


document.getElementById('save').addEventListener('click', () => {
  editor.execCommand('save');
});


window.addEventListener('beforeunload', event => {
  let isDirty = editorDocs.some(doc => {
    return !doc.isClean();
  });
  if (isDirty) {
    event.preventDefault();
  }
});

///////////////////////////////////////////////////////////////////////////////

function modalClose() {
  clearTimeout(modalTimer);

  document.body.classList.remove('save');
  gTplData.modal.closeDisabled = true;
  gTplData.modal.errorList = [];
  editor.getInputField().focus();
}


function modalFill(e) {
  if (e instanceof DownloadError) {
    gTplData.modal.errorList = e.failedDownloads.map(
        d => _('ERROR_at_URL', d.error, d.url));
  } else if (e.message) {
    gTplData.modal.errorList = [e.message];
  } else {
    // Log the unknown error.
    console.error('Unknown save error saving script', e);
    gTplData.modal.errorList = [_('download_error_unknown')];
  }
  gTplData.modal.closeDisabled = false;
}


function modalOpen() {
  document.querySelector('#modal progress').value = 0;
  document.body.classList.add('save');
  editor.getInputField().blur();
}


function onSave() {
  if (document.querySelectorAll('#tabs .tab.dirty').length == 0) {
    return;
  }

  // Always use a downloader to save, in case of new remotes.
  let downloader = new UserScriptDownloader();
  downloader.setScriptUrl(gUserScript.downloadUrl);
  downloader.setScriptContent(editorDocs[0].getValue());

  let requires = {};
  let resources = {};
  for (let i = 1; i < editorDocs.length; i++) {
    let url = editorUrls[i];
    if (editorTabs[i].classList.contains('require')) {
      requires[url] = editorDocs[i].getValue();
    } else if (editorTabs[i].classList.contains('resource')) {
      let existingResource = null;
      for (let r of Object.values(gUserScript.resources)) {
        if (r.url != url) continue;
        existingResource = r;
        break;
      }
      if (!existingResource) {
        console.warn('While saving, could not find resource with URL', url);
        continue;
      }
      resources[url] = {
        'blob': new Blob(
            [editorDocs[i].getValue()],
            {'type': existingResource.mimetype}),
        'mimetype': existingResource.mimetype,
        'name': existingResource.name,
        'url': existingResource.url,
      };
    } else {
      console.warn(
          'When saving script, editor tab', i, 'had unsupported type',
          editorTabs[i].classList);
    }
  }
  downloader.setKnownRequires(requires);
  downloader.setKnownResources(resources);
  downloader.setKnownUuid(userScriptUuid);
  downloader.addProgressListener(() => {
    document.querySelector('#modal progress').value = downloader.progress;
  });

  modalTimer = setTimeout(modalOpen, 75);
  downloader
      .start()
      .then(() => {
        return browser.runtime.sendMessage({
          'name': 'UserScriptGet',
          'uuid': userScriptUuid,
        });
      })
      .then(userScript => {
        let details = userScript || gUserScript;
        document.querySelector('#modal progress').removeAttribute('value');
        return downloader.install('edit', !details.enabled);
      }).then(onSaveComplete)
      .catch(modalFill);
}


function onSaveComplete(savedDetails) {
  modalClose();

  gTplData.name = i18nUserScript('name', savedDetails);
  tabs.children[0].textContent = i18nUserScript('name', savedDetails);

  for (let i = editorDocs.length; i--; ) {
    let missing = false;
    if (editorTabs[i].classList.contains('require')) {
      let url = editorUrls[i];
      missing |= !(url in savedDetails.requiresContent);
    } else if (editorTabs[i].classList.contains('resource')) {
      let resourceName = editorTabs[i].textContent;
      missing |= !(resourceName in savedDetails.resources);
    }
    if (missing) {
      editorTabs[i].parentNode.removeChild(editorTabs[i]);
      editorDocs.splice(i, 1);
      editorTabs.splice(i, 1);
      editorUrls.splice(i, 1);
    } else {
      editorDocs[i].markClean();
      editorTabs[i].classList.remove('dirty');
    }
  }

  Object.keys(savedDetails.requiresContent).forEach(u => {
    if (editorUrls.indexOf(u) === -1) {
      addRequireTab(u, savedDetails.requiresContent[u]);
    }
  });
  Object.values(savedDetails.resources).forEach(r => {
    if (editorUrls.indexOf(r.url) === -1) {
      addResourceTab(r);
    }
  });
}
