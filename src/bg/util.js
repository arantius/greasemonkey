'use strict';

import {scriptByUuid} from '/src/bg/user-script-registry.js';


// The user script of `userScriptUuid` has a @grant for `method`, or throw.
export function checkApiCallAllowed(method, userScriptUuid) {
  let userScript = scriptByUuid(userScriptUuid);
  if (!userScript.grants.includes(method)) {
    throw new Error(_('SCRIPT_does_not_grant_METHOD', userScript, method));
  }
}
