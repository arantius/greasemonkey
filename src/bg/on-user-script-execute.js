'use strict';

async function onUserScriptExecute(message, sender, sendResponse) {
  if (!sender.tab) return;

  const userScriptIterator = UserScriptRegistry.scriptsToRunAt(sender.tab.url);
  for (let userScript of userScriptIterator) {
    if (userScript.runAt !== message.runAt) continue;

    let options = {
      'code': userScript.evalContent,
      'matchAboutBlank': true,
      'runAt': 'document_' + userScript.runAt,
      'frameId': sender.frameId,
    };

    browser.tabs.executeScript(sender.tab.id, options).catch((err) => {
      // TODO: Better indication of the root cause.
      console.error(
          'Could not execute', userScript.toString(), '\n', err);
    });
  }
}
