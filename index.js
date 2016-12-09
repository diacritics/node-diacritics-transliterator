/*!***************************************************
 * node-diacritics-transliterator
 * http://diacritics.io/
 * Copyright (c) 2016, Julian Motz & Rob Garrison
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const databaseURL = "http://api.diacritics.io/",

    request = require("sync-request"),
    regenerate = require("regenerate"),
    fs = require("fs");

/**
 * Get current API version from module package.json; sets
 * `module.exports.currentVersion` and `module.exports.maxVersion`
 * @access protected
 */
function getCurrentVersion() {
    let current = 1;
    const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"));
    if(pkg && pkg.version) {
        const major = parseInt(pkg.version.split(".")[0], 10);
        // beta testing major version = 0
        current = major > 1 ? major : 1;
    }
    module.exports.currentVersion = "v" + current;
    // make readonly?... modified in test.js for testing
    module.exports.maxVersion = current;
}

/**
 * Creates an API url to access a specific type of data
 * @param  {string} type - API filter type (e.g. "language", "variant", etc)
 * @param  {string} code - API filter query (e.g. "de", "Austria", etc)
 * @return {string} - Full API url
 * @access protected
 */
function formatURL(type, code) {
    return databaseURL + module.exports.currentVersion + `/?${type}=${code}`;
}

/**
 * Retrieve information from the diacritic database
 * @param  {string} url - The database query
 * @return {object} - Database response, package.json, or error message
 * @access protected
 */
function getJSON(url) {
    let result,
        response = request("GET", url);
    if(response.statusCode === 200) {
        result = JSON.parse(response.getBody().toString());
        if(module.exports.debug) {
            console.log(
                url + "; response: " +
                (result.message ? result.message : "loaded")
            );
        }
        // return error message, package.json, or next object layer
        return result.message || result.version ? result : nextLayer(result);
    } else {
        result = `${url}; error: ${response.statusCode}`;
        if(module.exports.debug) {
            console.log(result);
        }
        return {
            "message": result
        };
    }
}

/**
 * cached database values to minimize server interaction
 * module.exports.cachev1 = {
 *     alphabet:   {"Latn": [...]}, // array of variant keys
 *     continent:  {"EU": [...]},   // array of variant keys
 *     language:   {"de": [...]},   // array of variant keys
 *     // variant metadata & data
 *     variants:   {"de":{ metadata: {...}, data: {...}}},
 *     // diacritic variants with only data for the specific diacritic
 *     diacritics: {"ü": {
 *         "de": { metadata: {...}, data: {"ü" : {...}}}
 *         "es": { metadata: {...}, data: {"ü" : {...}}}
 *     }}
 * };
 * module.exports.cachev2 = {
 *     alphabet: {"Cyrl":[...]}, ...
 * };
 */
/**
 * get current cache
 * @return {object} - Cache for current version
 * @access protected
 */
function getCache() {
    const ver = "cache" + module.exports.currentVersion;
    if(typeof module.exports[ver] === "undefined") {
        module.exports[ver] = {
            alphabet: {},
            continent: {},
            language: {},
            variants: {},
            diacritics: {}
        };
    }
    return module.exports[ver];
}

/**
 * Convert database formatted language objects:
 * {"de": {"de": {...}}, "es": {"es": {...}}}
 * into an object containing all variants inside of each language object:
 * {"de": {...}, "es": {...}}
 * Also, store all variants and diacritics to a cache to minimize database
 * calls for duplicate information
 * @param  {object} result - Language object returned from the database
 * @return {object} - Restructured language variants object
 * @access protected
 */
function nextLayer(result) {
    let obj = {};
    const cache = getCache();
    Object.keys(result).forEach(lang => {
        Object.keys(result[lang]).forEach(variant => {
            obj[variant] = result[lang][variant];

            // save all variants to cache
            cache[variant] = result[lang][variant];

            // save all diacritics to cache
            const data = result[lang][variant];
            Object.keys(data.data).forEach(diacritic => {
                const dCache = cache.diacritics;
                if(!dCache[diacritic]) {
                    dCache[diacritic] = {};
                }
                // include lang metadata & data
                dCache[diacritic][lang] = {
                    metadata: data.metadata,
                    data: {}
                };
                dCache[diacritic][lang].data[diacritic] = data.data[diacritic];
            });
        });
    });
    return obj;
}

/**
 * Get variants from cache, or API
 * @param  {string} type - API filter type (alphabet, continent or language)
 * @param  {string} code - API filter query
 * @return {object} - Variants associated with filter type or error message
 * @access private
 */
function getVariants(type, code) {
    const cache = getCache(),
        url = formatURL(type, code);
    let results = {};
    if(cache[type][code]) {
        // alphabet, continent & language cache contains an array of variant
        // keys
        cache[type][code].forEach(variant => {
            results[variant] = cache.variant[variant];
        });
        if(module.exports.debug) {
            console.log(url + "; {loaded from cache}");
        }
        return results;
    }
    // not cached, get data from API
    results = getJSON(url);
    if(!results.message) {
        // save array of variants codes into cache
        cache[type][code] = Object.keys(results);
    }
    return results;
}

/**
 * Creates an array of diacritics values from the given string
 * @param  {string} string
 * @return {array|null}
 * @access protected
 */
function findDiacritics(string) {
/*  alternative to using regenerate?
    return string.match(/[^\u0020-\u00A0]/g);
*/
    const matchUnicode = regenerate(Array.from(string))
        // remove standard symbols, numbers & alphabet
        .removeRange(0x0020, 0x00A0)
        .toRegExp('g');
    return string.match(matchUnicode);
}

/**
 * Convert unicode formatted within the database (`\\uHHHH` where H = hex), into
 * an actual unicode character. Using `.replace(/\\\u/g, "\u")` will appear to
 * work, but it does not create an actual unicode character; so we must use
 * `.fromCharCode()`
 * @param  {string} string - String with database formatted unicode value(s)
 * @return {string} - String containing actual unicode value(s)
 * @access protected
 */
/* ********** Not used yet! commented out to prevent lint error **********
function formatUnicode(string) {
    return (string || "").toString().replace(/\\\u(\w{4})/g, function(m, hex) {
        return String.fromCharCode(parseInt(hex, 16));
    });
}
*/

/*****************************************************
 * Low level functions
 *****************************************************/
/**
 * Get currently set API version
 * @return {string} - Version formatted as "v#" where "#" is the version number
 * @example
 * require("diacritics-transliterator").getVersion();
 * @access public
 */
module.exports.getVersion = () => {
    return module.exports.currentVersion;
}

/**
 * Set API version
 * @param  {string|number} version - All non-digits will be ignored
 * @return {string} - Version formatted as "v#" where "#" is the version number
 * @example
 * require("diacritics-transliterator").setVersion("v1");
 * @access public
 * @todo add method to retrieve current
 */
module.exports.setVersion = version => {
    version = parseInt((version || "").toString().replace(/[^\d.]/g, ""), 10);
    if(version > 0 && version <= module.exports.maxVersion) {
        module.exports.currentVersion = "v" + version;
    }
    return module.exports.currentVersion;
}

/**
 * Get variant from cache, or API
 * @param  {string} code - API filter query
 * @return {object} - Variant (meta)data or error message
 * @access public
 */
module.exports.getVariant = code => {
    const cache = getCache(),
        url = formatURL("variant", code);
    if(cache[code]) {
        // return cached variant
        let result = {};
        result[code] = cache[code];
        if(module.exports.debug) {
            console.log(url + "; {loaded from cache}");
        }
        return result;
    } else {
        return getJSON(url);
    }
}

/**
 * Get language from cache, or API
 * @param  {string} code - API filter query
 * @return {object} - Variants associated queried language or error message
 * @access public
 */
module.exports.getLanguage = code => {
    return getVariants("language", code);
};

/**
 * Get alphabet from cache, or API
 * @param  {string} code - API filter query
 * @return {object} - Variants associated queried alphabet or error message
 * @access public
 */
module.exports.getAlphabet = code => {
    return getVariants("alphabet", code);
}

/**
 * Get alphabet from cache, or API
 * @param  {string} code - API filter query
 * @return {object} - Variants associated queried continent or error message
 * @access public
 */
module.exports.getContinent = code => {
    return getVariants("continent", code);
}

/**
 * Data processing functions
 * @access public
 **/
/**
 * Get diacritic data of selected character(s) from cache, or API
 * @param  {string} string - Diacritic(s) to find
 * @return {string} - Diacritic data for each character found or error message
 * @access public
 */
module.exports.getDiacritics = string => {
    // normalize string to use the same compatibilty-composed values contained
    // in the database
    string = string.normalize("NFKC");
    let result = {};
    // get diacritic(s) from the string
    const diacritics = findDiacritics(string),
        cache = getCache();
    if(diacritics) {
        diacritics.forEach(diacritic => {
            let url = formatURL("diacritic", encodeURI(diacritic)),
                data = {};
            if(cache.diacritics[diacritic]) {
                // get cached variant
                data = cache.diacritics[diacritic];
                if(module.exports.debug) {
                    console.log(url + "; {loaded from cache}");
                }
            } else {
                data = getJSON(url);
            }
            if(!data.message) {
                Object.keys(data).forEach(variant => {
                    result[variant] = data[variant];
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

// provide debug information to console
module.exports.debug = false;

// Initialize module
getCurrentVersion();
