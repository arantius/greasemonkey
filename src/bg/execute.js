'use strict';
define('src/bg/execute', require => {
const {getGlobalEnabled} = require('src/bg/is-enabled');
const UserScriptRegistry = require('src/bg/user-script-registry');


function executeUserscriptOnNavigation(detail) {
  if (false === getGlobalEnabled()) return;

  var userScriptIterator = UserScriptRegistry.scriptsToRunAt(detail.url);
  for (let userScript of userScriptIterator) {
    let options = {
      'code': userScript.evalContent,
      'matchAboutBlank': true,
      'runAt': 'document_' + userScript.runAt,
    };
    if (detail.frameId) options.frameId = detail.frameId;
    chrome.tabs.executeScript(detail.tabId, options, result => {
      let err = chrome.runtime.lastError;
      if (!err) return;

      // TODO: i18n?
      if (err.message.startsWith('Message manager disconnected')) return;
      if (err.message.startsWith('No matching message handler')) return;

      // TODO: Better indication of the root cause.
      console.error(
          'Could not execute user script', userScript.toString(), '\n', err);
    });
  }
}


return {
  'executeUserscriptOnNavigation': executeUserscriptOnNavigation,
}});
