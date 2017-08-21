/*!***************************************************
 * node-diacritics-transliterator utilities
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const Cache = require("./cache"),
    regenerate = require("regenerate");

class Util {

    /**
     * Converts the escaped unicode as stored within the database
     * (`\\uHHHH` where H = hex) into actual unicode characters. Using
     * `.replace(/\\\u/g, "\u")` will appear to work, but it does not create an
     * actual unicode character; so we must use `.fromCharCode()` to properly
     * convert the string.
     * @param  {string} string - String with database formatted unicode value(s)
     * @return {string} - String containing actual unicode value(s)
     * @access private
     */
    static formatUnicode(string) {
        Util.checkString(string);
        return string.replace(/\\\u(\w{4})/g, (m, hex) => {
            return String.fromCharCode(parseInt(hex, 16));
        });
    }

    /**
     * Checks if the input is a string
     * @param {*} value - value to check the typeof
     * @access private
     */
    static checkString(value) {
        if(typeof value !== "string") {
            throw new TypeError("Error: Invalid input string");
        }
    }

    /**
     * Escape regular expression characters in a string or inside of an array
     * @param {array|string} item
     * @return {array|string} - new array or string
     * @access protected
     */
    static escapeRegExp(item) {
        let result = [],
            isString = typeof item === "string",
            array = isString ? [item] : item;
        array.forEach((elem, index) => {
            result[index] = elem.replace(/[$()*+\-./?[\\\]^{|}]/g, "\\$&");
        });
        return isString ? result[0] : result;
    }

    /**
     * Get diacritic data of selected character(s) from cache, or API
     * @param  {string} string - Diacritic(s) to find
     * @return {object} - All data for each diacritic found or error message
     * @access public
     */
    static getDiacritics(string) {
        Util.checkString(string);
        let result = {};
        // normalize string to use the same compatibilty-composed values
        // contained in the database
        string = string.normalize("NFKC");
        // get diacritic(s) from the string
        const diacritics = Util.findDiacritics(string);
        if(diacritics) {
            diacritics.forEach(diacritic => {
                let url = Cache.formatQuery("diacritic", diacritic),
                    data = Cache.cache[url] ?
                        // get cached variant
                        Cache.cache[url] :
                        Cache.getJSON(url, { ignoreMessage: true });
                if(!data.message) {
                    Object.keys(data).forEach(variant => {
                        if(!result[variant]) {
                            result[variant] = data[variant];
                        } else {
                            // add an additional diacritic to a given variant
                            result[variant].data[diacritic] =
                                data[variant].data[diacritic];
                        }
                    });
                }
            });
        }
        if(Object.keys(result).length === 0) {
            result = {
                "message": "No diacritics found"
            };
        }
        return result;
    }

    /**
     * findDiacritics options
     * @typedef util~findDiacriticsOptions
     * @type {object.<string>}
     * @property {boolean} [regexp=false] - if false, return diacritics matches
     * array; if true, returns the regular expression
     */
    /**
     * Creates an array of diacritics values from the given string
     * @param  {string} string
     * @param  {util~findDiacriticsOptions} [options] - options object
     * @return {(?array|RegExp)}
     * @access protected
     */
    static findDiacritics(string, options = {regexp: false}) {
        const matchUnicode = regenerate(Array.from(string))
            // remove standard symbols, numbers & alphabet
            .removeRange(0x0020, 0x00A0)
            .toRegExp('g');
        return options.regexp ? matchUnicode : string.match(matchUnicode);
    }

    /**
     * @typedef util~extractDataProcessing
     * @type {object}
     * @property {object} data - targeted portion of database
     * @property {string} variant - current variant being processed
     * @property {(string|undefined)} diacritic - current diacritic; only
     * defined when processing "data" (not "metadata")
     */
    /**
     * Extra diacritic mappings from language.data and return an object
     * containing a `diacritic:replacement value` key:value pairing for quick
     * reference
     * @param  {object} database - language.data object
     * @param  {string} [type="data"] - target object ("metadata" or "data")
     * @param  {util~extractDataProcessing} process - callback to process
     * data
     * @access private
     */
    static extractData(database, type = "data", process) {
        if(database && !database.message) {
            Object.keys(database).forEach(variant => {
                const data = {
                    data: database[variant][type],
                    variant: variant
                };
                if(type === "metadata") {
                    process(data);
                } else {
                    Object.keys(data.data).forEach(diacritic => {
                        data.diacritic = diacritic;
                        process(data);
                    });
                }
            });
        }
    }
}

module.exports = Util;
