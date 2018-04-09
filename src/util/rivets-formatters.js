'use strict';

import {_} from '/src/util.js';


rivets.formatters.i18n = _;
rivets.formatters.i18nBool = (cond, t, f) => _(cond ? t : f);
rivets.formatters.empty = value => value.length == 0;
rivets.formatters.not = value => !value;
