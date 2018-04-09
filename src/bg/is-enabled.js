'use strict';
/*
This file is responsible for tracking and exposing the global "enabled" state
of Greasemonkey.
*/

import {registerMessageHandler} from '/src/bg/on-message.js';


let isEnabled = true;
chrome.storage.local.get('globalEnabled', v => {
  isEnabled = v['globalEnabled'];
  if ('undefined' == typeof isEnabled) isEnabled = true;
  setIcon();
});

///////////////////////////////////////////////////////////////////////////////

export function getGlobalEnabled() {
  return !!isEnabled;
}


export function setGlobalEnabled(enabled) {
  isEnabled = !!enabled;
  chrome.runtime.sendMessage({
    'name': 'EnabledChanged',
    'enabled': isEnabled,
  }, logUnhandledError);
  setIcon();
  chrome.storage.local.set({'globalEnabled': enabled});
}


export function toggleGlobalEnabled() {
  setGlobalEnabled(!isEnabled);
}

///////////////////////////////////////////////////////////////////////////////

registerMessageHandler('EnabledQuery', (message, sender, sendResponse) => {
  sendResponse(isEnabled);
});


registerMessageHandler('EnabledSet', (message, sender, sendResponse) => {
  setGlobalEnabled(message.enabled);
});


registerMessageHandler('EnabledToggle', (message, sender, sendResponse) => {
  try {
    toggleGlobalEnabled();
    sendResponse(isEnabled);
  } catch (e) { console.error(e); }
});

///////////////////////////////////////////////////////////////////////////////

function setIcon() {
  // Firefox for Android does not have setIcon
  // https://developer.mozilla.org/en-US/Add-ons/WebExtensions/API/browserAction/setIcon#Browser_compatibility
  if (!chrome.browserAction.setIcon) {
    return;
  }
  let iconPath = chrome.extension.getURL('skin/icon.svg');
  if (isEnabled) {
    chrome.browserAction.setIcon({'path': iconPath});
  } else {
    let img = document.createElement('img');
    img.onload = function() {
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      ctx.globalAlpha = 0.5;
      ctx.drawImage(img, 0, 0);
      chrome.browserAction.setIcon({
        'imageData': ctx.getImageData(0, 0, img.width, img.height),
      });
    };
    img.src = iconPath;
  }
}
