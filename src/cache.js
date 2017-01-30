/*!***************************************************
 * node-diacritics-transliterator core & cache
 * Diacritic transliteration tools using diacritics.io
 * API from http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const Diacritics = require("./diacritics"),
    request = require("sync-request");

/**
 * Internal cache to save responses from the diacritics API to minimize
 * repeated queries for the same information.
 * @return {object} - cache object with data indexed by URL
 * @access private
 */
class Cache {
    /**
     * Shortcut to call the formatURL function with only one parameter
     * @param  {string} key
     * @param  {string} value
     * @return {string|Error} - Full API url, or error message
     * @access private
     */
    static formatQuery(key, value) {
        if(typeof key !== "string" || typeof value !== "string") {
            throw new TypeError("Error: Invalid input string");
        }
        let data = {};
        data[key] = value;
        return Cache.formatURL(data);
    }

    /**
     * @typedef cache~filterParameters
     * @type {object.<string>}
     * @property {string} language
     * @property {string} variant
     * @property {string} alphabet
     * @property {string} continent
     * @property {string} country
     * @property {string} diacritic
     * @property {string} base
     * @property {string} decompose
     */
    /**
     * Creates an API url to access a specific type of data
     * @param  {cache~filterParameters} params - optional API filter parameters
     * @return {string|Error} - Full API url, or error message
     * @access private
     */
    static formatURL(params) {
        let query = [];
        Object.keys(params).map(filter => {
            if(Diacritics.validFilters.includes(filter) && params[filter]) {
                // TODO: add support for arrays when the API supports it
                query.push(filter + "=" + encodeURIComponent(params[filter]));
            }
        });
        if(query.length) {
            return `${Diacritics.databaseURL}${Diacritics.version}/?` +
                `${query.join("&")}`;
        }
        throw new Error(
            "Unable to access the API with empty or invalid filters"
        );
    }

    /**
     * Get filtered data from the cache, or API
     * @param {cache~filterParameters} params
     * @param {cache~responseOptions} options
     * @return {object|Error} - data matching variants with associated metadata
     * and any diacritic specific data
     * @access public
     */
    static getData(params, options) {
        let url,
            keys = typeof params === "object" && Object.keys(params);
        if (keys && keys.length === 1) {
            // use getProcessed just in case we're passing an array
            // *** Not supported by the API yet ***
            // e.g. diacritics.getData({ base: ["u", "U"] });
            return Cache.getProcessed(keys[0], params[keys[0]], options);
        }
        url = Cache.formatURL(params);
        return Cache.getJSON(url, options);
    }

    /**
     * Process diacritic base or decompose value of selected character(s) in the
     * given string or array from the cache, or API
     * @param {string} type - type of data to obtain (e.g. "decompose" or
     * "base")
     * @param {(string|string[])} array - A string of a single base or
     * decompose string (converted into an array), or an array of diacritic base
     * or decompose string characters to process
     * @param {cache~responseOptions} options
     * @return {object} - Base or decompose data for each found array entry, or
     * an error message
     * @access private
     */
    static getProcessed(type, array, options) {
        let result = {};
        if(!Array.isArray(array)) {
            array = [array];
        }
        array.forEach(elm => {
            let url = Cache.formatQuery(type, elm),
                data = {};
            if(Cache.cache[url]) {
                // get cached values
                data = Cache.cache[url];
            } else {
                data = Cache.getJSON(url, options);
            }
            if(!data.message) {
                Object.keys(data).forEach(variant => {
                    result[variant] = data[variant];
                });
            }
        });
        if(Object.keys(result).length === 0) {
            result = {
                "message": `No matching ${type}s found`
            };
        }
        return result;
    }

    /**
     * @typedef cache~responseOptions
     * @type {object.<string>}
     * @property {boolean} [ignoreMessage=false] - ignore server messages
     */
    /**
     * Retrieve information from the diacritic database
     * @param  {string} url - The database query
     * @param  {cache~responseOptions} options
     * @return {object|Error} - Database response, or error message
     * @access private
     */
    static getJSON(url, options = {}) {
        let result,
            response = request("GET", url);
        if(response.statusCode === 200) {
            result = JSON.parse(response.getBody().toString());
            // return error message
            if(result.message && options.ignoreMessage !== true) {
                throw new Error(`Error: ${result.message}`);
            }
            if (!result.message) {
                // combine languages to create an object containing variants
                result = Cache.nextLayer(result);
                // save data to cache
                if(!Cache.cache[url]) {
                    Cache.cache[url] = result;
                }
            }
            return result;
        }
        throw new Error(`Error: ${response.statusCode} response from ${url}`);
    }

    /**
     * Convert database formatted language objects:
     * {"de": {"de": {...}}, "es": {"es": {...}}}
     * into an object containing all variants inside of each language object:
     * {"de": {...}, "es": {...}}
     * @param  {object} result - Language object(s) returned from the database
     * @return {object} - Object containing language variants
     * @access private
     */
    static nextLayer(result) {
        let obj = {};
        Object.keys(result).forEach(lang => {
            Object.keys(result[lang]).forEach(variant => {
                obj[variant] = result[lang][variant];
            });
        });
        return obj;
    }
}

Cache.cache = {};

module.exports = Cache;