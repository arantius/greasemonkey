'use strict';
define('src/bg/is-enabled', require => {

let isEnabled = true;
chrome.storage.local.get('globalEnabled', v => {
  isEnabled = v['globalEnabled'];
  if ('undefined' == typeof isEnabled) isEnabled = true;
  setIcon();
});


function getGlobalEnabled() {
  return !!isEnabled;
}


function onEnabledQuery(message, sender, sendResponse) {
  sendResponse(isEnabled);
}


function onEnabledSet(message, sender, sendResponse) {
  setGlobalEnabled(message.enabled);
}


function onEnabledToggle(message, sender, sendResponse) {
  try {
    toggleGlobalEnabled();
    sendResponse(isEnabled);
  } catch (e) { console.error(e); }
}


function setGlobalEnabled(enabled) {
  isEnabled = !!enabled;
  chrome.runtime.sendMessage({
    'name': 'EnabledChanged',
    'enabled': isEnabled,
  }, logUnhandledError);
  setIcon();
  chrome.storage.local.set({'globalEnabled': enabled});
}


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


function toggleGlobalEnabled() {
  setGlobalEnabled(!isEnabled);
}


return {
  'getGlobalEnabled': getGlobalEnabled,
  'onEnabledQuery': onEnabledQuery,
  'onEnabledSet': onEnabledSet,
  'onEnabledToggle': onEnabledToggle,
  'setGlobalEnabled': setGlobalEnabled,
  'toggleGlobalEnabled': toggleGlobalEnabled,
}});
