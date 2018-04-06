'use strict';
define('bg/bg.run', require => {

const {executeUserscriptOnNavigation} = require('/bg/execute.js');
chrome.webNavigation.onCommitted.addListener(executeUserscriptOnNavigation);

const {onHeadersReceivedDetectUserScript} = require('/bg/user-script-detect.js');
chrome.webRequest.onHeadersReceived.addListener(
  onHeadersReceivedDetectUserScript,
  {'urls': ['*://*/*.user.js'], 'types': ['main_frame']},
  ['blocking', 'responseHeaders']);

const UserScriptRegistry = require('/bg/user-script-registry.js');
UserScriptRegistry._loadUserScripts();

function welcome() {
  const wantToShowUrl
      = 'https://www.greasespot.net/2017/09/greasemonkey-4-announcement.html';

  chrome.storage.local.get('previousWelcomeUrl', items => {
    let previousWelcomeUrl = items.previousWelcomeUrl;
    if (previousWelcomeUrl != wantToShowUrl) {
      chrome.storage.local.set({'previousWelcomeUrl': wantToShowUrl,}, () => {
        if (chrome.runtime.lastError) {
          console.warn(
            'Could not set previousWelcomeUrl.', chrome.runtime.lastError);
          return;
        }
        chrome.tabs.create({'url': wantToShowUrl});
      });
    }
  });
};
welcome();

});
