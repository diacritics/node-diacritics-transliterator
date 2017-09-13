/*!***************************************************
 * node-diacritics-transliterator module exports
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const Util = require("./src/util");
module.exports = require("./src/diacritics");
module.exports.getData = require("./src/cache").getData;
module.exports.transliterate = require("./src/transliterate").transliterate;
module.exports.createRegExp = require("./src/regexp").createRegExp;
module.exports.replacePlaceholder =
    require("./src/placeholder").replacePlaceholder;
module.exports.getDiacritics = Util.getDiacritics;
module.exports.formatUnicode = Util.formatUnicode;
