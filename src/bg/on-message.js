'use strict';
/*
This file sets up a message receiver, expecting to receive messages from
content scripts.  It dispatches to global methods registered in other
(background) scripts based on the `name` property of the received message,
and passes all arguments on to that callback.
*/

export function registerMessageHandler(name, handler) {
  console.log('registering handler', name, handler);
  if (name in messageHandlers) {
    throw new Error(`Collision; handler already registered for ${name}!`);
  }
  messageHandlers[name] = handler;
}

///////////////////////////////////////////////////////////////////////////////

const messageHandlers = {};
const myPrefix = chrome.runtime.getURL('');


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (!message.name) {
    console.error('Background received message without name!', message, sender);
    return;
  }

  if (!message.name.startsWith('Api') && !sender.url.startsWith(myPrefix)) {
    // Messages named "Api*" can come from anywhere (i.e. _content_ scripts,
    // where we execute user scripts).  These are handlers for the GM APIs.
    // Otherwise, only accept messages coming from our own source prefix.
    throw new Error(
        `ERROR refusing to handle "${message.name}" `
        + `message from sender "${sender.url}".`);
  }

  var handler = messageHandlers[message.name];
  if (!handler) {
    console.error(
        'Background has no handler for message:', message, 'sender:', sender);
    return;
  }

  return handler(message, sender, sendResponse);
});
