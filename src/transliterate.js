/*!***************************************************
 * node-diacritics-transliterator transliterate
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const Util = require("./util");

class Transliterate {
    /**
     * Transliterate diacritics in the given string
     * @param  {string} string - Text containing diacritic(s) to transliterate
     * @param  {string} type - Set to "decompose" or "base" (default)
     * @param  {string} languageVariant - optional set to language variant
     * @return {string} - processed string, or original string if no diacritics
     * found; note that if a languageVariant parameter is set and the string
     * contains a diacritic not found in that language variant, it will not be
     * processed!
     * @access public
     */
    static transliterate(string, type = "base", languageVariant) {
        Util.checkString(string);
        if(type !== "base" && type !== "decompose") {
            throw new TypeError(
                "Transliterate Error: Invalid 'type' value " +
                "(use 'base' or 'decompose')"
            );
        }
        let result = string;
        const data = Util.getDiacritics(string),
            // non-normalized diacritic list
            diacritics = Util.findDiacritics(string);
        if(diacritics) {
            diacritics.forEach(diacritic => {
                const normalized = diacritic.normalize("NFKC"),
                    results = {};
                Util.extractData(data, "data", params => {
                    let diacritic = params.diacritic;
                    if(
                        // target selected variant
                        languageVariant === params.languageVariant ||
                        // if undefined, then use first available entry
                        typeof languageVariant === "undefined" &&
                        !results[diacritic]
                    ) {
                        results[diacritic] =
                            Transliterate.extractMapping(
                                params.data[diacritic], type
                            );
                    }
                });
                // results may be undefined if no languageVariant found
                if(typeof results[diacritic] !== "undefined") {
                    result = result.replace(
                        new RegExp(`(${normalized})`, "g"),
                        results[diacritic]
                    );
                }
            });
        }
        return result;
    }

    /**
     * Extract mapping data giving priority to the indicated mapping type
     * @param  {object} data - data[diacritic] object which contains mapping
     * @param  {string} [type="base"] - mapping type (e.g. "decompose" or
     * "base")
     * @return {string} - Base or decompose value
     * @access private
     */
    static extractMapping(data, type = "base") {
        // allow misspelling & capitalization of "decompose"
        if(type.slice(0,1).toLowerCase() === "d") {
            // priority decompose > base
            return data.mapping.decompose || data.mapping.base;
        }
        // priority base > decompose
        return data.mapping.base || data.mapping.decompose;
    }
}

module.exports = Transliterate;
