/*!***************************************************
 * node-diacritics-transliterator core & cache
 * Diacritic transliteration tools using diacritics.io
 * API from http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const Diacritics = require("./diacritics"),
    request = require("sync-request"),
    // metadata list - the api supports multiple settings for metadata only,
    // e.g. /?continent=EU,OC
    metadata = [
        "alphabet",
        "continent",
        "country",
        "language"
    ];

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
            let val = params[filter],
                isArray = Array.isArray(val);
            if(Diacritics.validFilters.includes(filter) && val) {
                if(
                    (typeof val !== "string" && !isArray) ||
                    (isArray && typeof val[0] !== "string")
                ) {
                    throw new TypeError("Error: Invalid input string");
                }
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
            keys = typeof params === "object" && Object.keys(params) || [],
            // needsProcessing = false;
            // metadata for 2+ filters does not need extra processing
            // e.g. getData({ continent: ["eu", "na"] }) is supported by the api
            // getData({ base: ["u", "U"] }) needs to get "u" & "U" data
            // separately
            needsProcessing = keys.some(key => {
                return Array.isArray(params[key]) && !metadata.includes(key);
            });
        if (needsProcessing) {
            // use getProcessed just in case we're passing an array
            Cache.getProcessed(params, options);
        }
        url = Cache.formatURL(params);
        return Cache.getJSON(url, options);
    }

    /**
     * Extract out multi-value keys in data filters (metadata supports arrays)
     * @param {cache~filterParameters} params
     * @param {array} keys - keys of the param object
     * @return {object} - values with multiple settings
     */
    static extractKeys(params, keys) {
        const data = {};
        // split out metadata & non-array data filters
        keys.forEach(key => {
            if(!metadata.includes(key) && Array.isArray(params[key])) {
                data[key] = params[key];
            }
        });
        return data;
    }

    /**
     * Check Cache or get query from database
     * @param {cache~filterParameters} query - modified to only contain a
     * single data (not metadata) term if it was an array
     * @param {cache~responseOptions} options
     * @param {function} successCb - success callback
     */
    static checkCache(query, options, successCb) {
        const url = Cache.formatURL(query);
        let item = {};
        if(Cache.cache[url]) {
            // get cached values
            item = Cache.cache[url];
        } else {
            item = Cache.getJSON(url, options);
        }
        if(!item.message) {
            successCb(item);
        }
    }

    /**
     * Process diacritic base or decompose value of selected character(s) in the
     * given string or array from the cache, or API
     * @param {cache~filterParameters} params
     * @param {cache~responseOptions} options
     * @return {object} - Base or decompose data for each found array entry, or
     * an error message
     * @access private
     */
    static getProcessed(params, options) {
        let result = {};
        const keys = Object.keys(params),
            data = Cache.extractKeys(params, keys),
            dataKeys = Object.keys(data),
            callback = function(item) {
                Object.keys(item).forEach(variant => {
                    result[variant] = item[variant];
                });
            }
        if (!dataKeys.length) {
            // no extra processing needed (i.e. no arrays in data)
            Cache.checkCache(params, options, callback);
        } else {
            // loop through data & get info from the database
            dataKeys.forEach(key => {
                let type;
                if (data[key]) {
                    type = Object.assign({}, data);
                    if (Array.isArray(params[key])) {
                        params[key].forEach(item => {
                            type[key] = item;
                            Cache.checkCache(type, options, callback);
                        });
                    } else {
                        type[key] = params[key];
                        Cache.checkCache(type, options, callback);
                    }
                }
            });
        }
        if(Object.keys(result).length === 0) {
            result = {
                "message": "No matching results found for " + 
                    JSON.stringify(params)
            };
        }
        return result;
    }

    /**
     * @typedef cache~responseOptions
     * @type {object.<string>}
     * @property {boolean} [ignoreMessage=false] - ignore server messages; used
     * internally
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