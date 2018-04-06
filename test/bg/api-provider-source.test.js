'use strict';
define('test/bg/api-provider-source', require => {
const {SUPPORTED_APIS, apiProviderSource}
    = require('/src/bg/api-provider-source.js');


describe('bg/api-provider-source', () => {
  console.log(1);
  console.log(2);

  for (let apiName of SUPPORTED_APIS) {
    it('handles ' + apiName, () => {
      let source = apiProviderSource({'grants': [apiName]});
      assert(source.match(new RegExp(apiName + ' = ')));
    });
  }

  it('handles grant none', () => {
    let source = apiProviderSource({'grants': ['none']});
    assert(source.match(/No grants/));
  });

  it('handles no grants', () => {
    let source = apiProviderSource({'grants': []});
    assert(source.match(/No grants/));
  });
});
});
