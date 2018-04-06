'use strict';
define('bg/on-message', require => {

const messageHandlers = (() => {
  let backup = require('/bg/backup.js');
  let enabled = require('/bg/is-enabled.js');
  let registry = require('/bg/user-script-registry.js');
  let valueStore = require('/bg/value-store.js');
  return {
    'ApiDeleteValue': valueStore.onApiDeleteValue,
    'ApiGetValue': valueStore.onApiGetValue,
    'ApiListValues': valueStore.onApiListValues,
    'ApiSetValue': valueStore.onApiSetValue,
    'ExportDatabase': backup.onExportDatabase,
    'EnabledQuery': enabled.onEnabledQuery,
    'EnabledSet': enabled.onEnabledSet,
    'EnabledToggle': enabled.onEnabledToggle,
    'UserScriptGet': registry.onUserScriptGet,
    'UserScriptInstall': registry.onUserScriptInstall,
    'ApiGetResourceBlob': registry.onApiGetResourceBlob,
    'UserScriptToggleEnabled': registry.onUserScriptToggleEnabled,
    'UserScriptUninstall': registry.onUserScriptUninstall,
  };
})();
const myPrefix = chrome.runtime.getURL('');


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (!message.name) {
    console.error('Background received message without name!', message, sender);
    return;
  }

  if (!message.name.startsWith('Api') && !sender.url.startsWith(myPrefix)) {
    // Messages named "Api*" can come from anywhere (i.e. _content_ scripts,
    // where we execute user scripts).  These are handlers for the GM APIs.
    // Otherwise, only accept messages coming from our own source prefix.
    throw new Error(
        `ERROR refusing to handle "${message.name}" `
        + `message from sender "${sender.url}".`);
  }

  var handler = messageHandlers[message.name];
  if (!handler) {
    console.error(
        'Background has no handler for message:', message, 'sender:', sender);
    return;
  }

  return handler(message, sender, sendResponse);
});

});
