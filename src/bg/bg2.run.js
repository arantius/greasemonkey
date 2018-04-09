import {_} from '/src/util.js';

import {executeUserscriptOnNavigation} from '/src/bg/execute.js';
chrome.webNavigation.onCommitted.addListener(executeUserscriptOnNavigation);

import {onHeadersReceivedDetectUserScript} from '/src/bg/user-script-detect.js';
chrome.webRequest.onHeadersReceived.addListener(
    onHeadersReceivedDetectUserScript,
    {'urls': ['*://*/*.user.js'], 'types': ['main_frame']},
    ['blocking', 'responseHeaders']);

import {loadUserScripts} from '/src/bg/user-script-registry.js';
loadUserScripts();

// Import things which directly register themselves as some kind of handler.
import '/src/bg/on-message.js';
import '/src/bg/on-user-script-notification.js';
import '/src/bg/on-user-script-open-in-tab.js';
import '/src/bg/on-user-script-xhr.js';
import '/src/bg/value-store.js';
import '/src/bg/welcome.run.js';
