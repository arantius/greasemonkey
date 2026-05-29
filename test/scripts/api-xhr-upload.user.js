// ==UserScript==
// @name     GM.xhr upload test
// @description Upload a page back to itself just to test behavior.
// @version  1
// @match    <all_urls>
// @grant    GM.xmlHttpRequest
// ==/UserScript==

GM.xmlHttpRequest({
  'method': 'POST',
  'url': location.href,
  'data': document.documentElement.innerHTML,
  'onload': resp => console.log('upload test onload()'),
  'upload': {
    'onabort': resp => console.log('upload test upload.onabort()'),
    'onerror': resp => console.log('upload test upload.onerror()'),
    'onload': resp => console.log('upload test upload.onload()'),
    'onprogress': resp => console.log('upload test upload.onprogress()'),
  }
});
