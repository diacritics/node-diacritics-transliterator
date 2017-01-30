/*!***************************************************
 * node-diacritics-transliterator module exports
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const Util = require("./src/util");

/**
 * A user would need to create a new instance
 * @example
 * const transliterate = require("diacritics-transliterator").transliterate,
 *     instance = new transliterate();
 * console.log(instance.transliterate("some string with diacritics"));
 */
module.exports = require("./src/diacritics");
module.exports.getData = require("./src/cache").getData;
module.exports.getDiacritics = Util.getDiacritics;
module.exports.formatUnicode = Util.formatUnicode;
module.exports.transliterate = require("./src/transliterate").transliterate;
module.exports.createRegExp = require("./src/regexp").createRegExp;
module.exports.replacePlaceholder =
    require("./src/placeholder").replacePlaceholder;
