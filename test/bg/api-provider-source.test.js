'use strict';
describe('bg/api-provider-source', () => {
  let SUPPORTED_APIS, apiProviderSource;
  before(done => {
    require(['src/bg/api-provider-source'], a => {
      SUPPORTED_APIS = a.SUPPORTED_APIS;
      apiProviderSource = a.apiProviderSource;

      for (let apiName of SUPPORTED_APIS) {
        it('handles ' + apiName, () => {
          let source = apiProviderSource({'grants': [apiName]});
          assert(source.match(new RegExp(apiName + ' = ')));
        });
      }

      done();
    });
  });

  it('handles grant none', () => {
    let source = apiProviderSource({'grants': ['none']});
    assert(source.match(/No grants/));
  });

  it('handles no grants', () => {
    let source = apiProviderSource({'grants': []});
    assert(source.match(/No grants/));
  });
});
