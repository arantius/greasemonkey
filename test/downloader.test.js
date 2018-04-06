'use strict';
define('test/downloader', require => {
const {Downloader} = require('/src/downloader.js');


describe('downloader', () => {
  const fakeReqs = [];
  let fakeXhr = null;

  beforeEach(() => {
    fakeReqs.length = 0;
    fakeXhr = sinon.useFakeXMLHttpRequest();
    fakeXhr.onCreate = xhr => {
      fakeReqs.push(xhr);
    }
  });

  after(() => {
    fakeXhr.restore();
  });

  it('downloads the given URL', async () => {
    let downloader = new Downloader();
    downloader.setScriptUrl('http://example/test.user.js');

    let result = downloader.start();
    assert.equal(fakeReqs.length, 1);
    fakeReqs[0].respond(
        200, {}, '// ==UserScript==\n// @name Fake\n// ==/UserScript==');

    let scriptDetails = await downloader.scriptDetails;
    assert.equal(scriptDetails.name, 'Fake');

    return result;
  });

  it('downloads @require', async () => {
    let downloader = new Downloader();
    downloader.setScriptUrl('http://example/test.user.js');
    downloader.setScriptContent(
        '// ==UserScript==\n// @require other.js\n// ==/UserScript==');

    let result = downloader.start();
    await downloader.scriptDetails;
    assert.equal(fakeReqs.length, 1);
    fakeReqs[0].respond(200, {}, 'alert()');

    let downloaderDetails = await downloader.details();
    assert.deepEqual(
        {'http://example/other.js': 'alert()'},
        downloaderDetails.requires);

    return result;
  });
});
});
