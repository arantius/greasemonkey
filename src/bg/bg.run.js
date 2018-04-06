'use strict';
define('src/bg/bg.run', require => {

const {executeUserscriptOnNavigation} = require('src/bg/execute');
chrome.webNavigation.onCommitted.addListener(executeUserscriptOnNavigation);

const {onHeadersReceivedDetectUserScript} = require('src/bg/user-script-detect');
chrome.webRequest.onHeadersReceived.addListener(
  onHeadersReceivedDetectUserScript,
  {'urls': ['*://*/*.user.js'], 'types': ['main_frame']},
  ['blocking', 'responseHeaders']);

const UserScriptRegistry = require('src/bg/user-script-registry');
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
