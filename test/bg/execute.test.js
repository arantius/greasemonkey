'use strict';
describe('test/bg/execute', () => {
  let UserScriptRegistry, executeUserscriptOnNavigation;
  before(done => {
    require(['src/bg/user-script-registry', 'src/bg/execute'], (u, e) => {
      UserScriptRegistry = u;
      executeUserscriptOnNavigation = e.executeUserscriptOnNavigation;

      sinon.stub(UserScriptRegistry, 'scriptsToRunAt');

      done();
    });
  });

  after(() => UserScriptRegistry.scriptsToRunAt.restore());

  it('uses tabs.executeScript', () => {
    chrome.tabs.executeScript.callsArg(2);
    UserScriptRegistry.scriptsToRunAt.returns([{}]);
    executeUserscriptOnNavigation({});
    assert(chrome.tabs.executeScript.calledOnce);
  });
});
