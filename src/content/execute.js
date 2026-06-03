'use strict';

async function executeUserscript(runAt) {
  const scripts = await new Promise((resolve) => {
    chrome.runtime.sendMessage({
      'name': 'ListUserScripts',
      'runAt': runAt,
      'url': window.location.href,
      'stripContent': false,
    }, resolve);
  });

  for (const script of scripts) {
    try {
      // Execute in the page context.
      const scriptElement = document.createElement('script');
      scriptElement.textContent = script.evalContent;
      (document.head || document.documentElement).appendChild(scriptElement);
      scriptElement.remove();
    } catch (e) {
      console.error('Failed to execute userscript:', script.name, e);
    }
  }
}
