'use strict';
// user-script-obj.js looks up the extension version from the manifest
chrome.runtime.getManifest.returns({'version': 1});

// See comment for details
// https://github.com/greasemonkey/greasemonkey/pull/2812#issuecomment-358776737
navigator.storage.persist = () => Promise.resolve(true);

// In tests, never complain about missing translations.
function _(str) {
  return str;
}

require.config({
  baseUrl: '/base',  // Karma serves files under /base by default.
  //deps: Object.keys(window.__karma__.files),
  callback: window.__karma__.start,
});
