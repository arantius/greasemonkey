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

var testFiles = Object.keys(window.__karma__.files)
    .filter(v => v.match(/\.test\.js$/))
    .map(v => v.replace('/base/', ''))
    .map(v => v.replace('.js', ''));
require.config({
  baseUrl: '/base/',  // Karma serves files under /base by default.
  deps: testFiles,
  callback: mocha.run,
});


/*
// ????
// Mostly based on http://karma-runner.github.io/1.0/plus/requirejs.html

var testFiles = Object.keys(window.__karma__.files)
    .filter(v => v.match(/\.test\.js$/))
//    .map(v => v.replace('/base/', '/'))
    ;
console.log('loading test deps:', '\n' + testFiles.join('\n'));
require.config({
  baseUrl: '/base',  // Karma serves files under /base by default.
  deps: testFiles,
  callback: continueSetup,  //window.__karma__.start,
});


function continueSetup() {
  console.log('require', require);



  console.log('window.__karma__.start', window.__karma__.start);
  debugger;
  window.__karma__.start();
}
*/
