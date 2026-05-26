'use strict';
describe('bg/execute', () => {
  before(() => {
    sinon.stub(UserScriptRegistry, 'scriptsToRunAt');
    // Ensure the promise is resolved
    UserScriptRegistry._loadUserScripts();
  });
  after(() => UserScriptRegistry.scriptsToRunAt.restore());

  it('uses tabs.executeScript', async () => {
    chrome.tabs.executeScript.callsArg(2);
    UserScriptRegistry.scriptsToRunAt.returns([{}]);
    await executeUserscriptOnNavigation({});
    assert(chrome.tabs.executeScript.calledOnce);
  });
});
