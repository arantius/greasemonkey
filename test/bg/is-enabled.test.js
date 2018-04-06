'use strict';
define('test/bg/is-enabled', require => {
const {
  getGlobalEnabled,
  setGlobalEnabled,
  toggleGlobalEnabled,
} = require('src/bg/is-enabled');


describe('bg/is-enabled', () => {
  // Leave GM globally enabled after these tests run.
  after(() => {
    setGlobalEnabled(true);
  });

  it('passes data between setGlobalEnabled() and getGlobalEnabled()', () => {
    setGlobalEnabled(true);
    assert.equal(getGlobalEnabled(), true);
    setGlobalEnabled(false);
    assert.equal(getGlobalEnabled(), false);
  });

  it('toggles enabled state', () => {
    setGlobalEnabled(true);
    assert.equal(getGlobalEnabled(), true);
    toggleGlobalEnabled();
    assert.equal(getGlobalEnabled(), false);
  });
});
});
