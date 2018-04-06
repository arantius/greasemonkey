'use strict';
define('src/util', require => {


const defaultIconUrl = chrome.runtime.getURL('skin/userscript.png');


function _(str, ...subs) {
  let result = chrome.i18n.getMessage.call(null, str, subs);
  if (!result) console.warn('Missing i18n str:', str);
  return result || str;
}


/** The URL of an icon to display for the given script (placeholder if none). */
function iconUrl(userScript) {
  return userScript.iconBlob
      ? URL.createObjectURL(userScript.iconBlob)
      : defaultIconUrl;
}


function logUnhandledError() {
  if (chrome.runtime.lastError) {
    console.error('GM Unhandled:', chrome.runtime.lastError);
  }
}


function openUserScriptEditor(scriptUuid) {
  let url = chrome.runtime.getURL('src/content/edit-user-script.html')
      + '#' + scriptUuid;
  chrome.tabs.create({
    'active': true,
    'url': url,
  }, () => {
    if (chrome.runtime.lastError) {
      console.error('openUserScriptEditor:', chrome.runtime.lastError);
    }
  });
}


function registerCommonRivetsFormatters() {
  rivets.formatters.i18n = _;
  rivets.formatters.i18nBool = (cond, t, f) => _(cond ? t : f);
  rivets.formatters.empty = value => value.length == 0;
  rivets.formatters.not = value => !value;
}


return {
  '_': _,
  'defaultIconUrl': defaultIconUrl,
  'iconUrl': iconUrl,
  'logUnhandledError': logUnhandledError,
  'openUserScriptEditor': openUserScriptEditor,
  'registerCommonRivetsFormatters': registerCommonRivetsFormatters,
}});
