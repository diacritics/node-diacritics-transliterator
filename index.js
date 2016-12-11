/*!***************************************************
 * node-diacritics-transliterator
 * http://diacritics.io/
 * Copyright (c) 2016, Julian Motz & Rob Garrison
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const databaseURL = "http://api.diacritics.io/",

    request = require("sync-request"),
    regenerate = require("regenerate");

/**
 * Get current API version from package package.json; sets
 * `module.exports.currentVersion` and `module.exports.maxVersion`
 * (https://github.com/diacritics/api/raw/master/package.json)
 * @access protected
 */
function getCurrentVersion() {
    let current = 1;
    const pkg = getJSON("https://git.io/v1Ejh");
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
 *     diacritics: {
 *     "ü": {
 *         "de": { metadata: {...}, data: {"ü": {...}}}
 *         "es": { metadata: {...}, data: {"ü": {...}}}
 *     }},
 *     base: {"u": {
 *         "de": { metadata: {...}, data: {"ü": {...}}}
 *         "es": { metadata: {...}, data: {"ú": {...}, "ü": {...}}}
 *     }},
 *     decompose: {"ss": {
 *         "de": { metadata: {...}, data: {"ß": {...}}}
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
            diacritics: {},
            base: {},
            decompose: {}
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
 * @return {?array}
 * @access protected
 */
function findDiacritics(string) {
    const matchUnicode = regenerate(Array.from(string))
        // remove standard symbols, numbers & alphabet
        .removeRange(0x0020, 0x00A0)
        .toRegExp('g');
    return string.match(matchUnicode);
}

/**
 * Process diacritic base or decompose value of selected character(s) in the
 * given string or array from the cache, or API
 * @param  {string} type - type of data to obtain (e.g. "decompose" or "base")
 * @param  {string|string[]} array - A string of a single base or decompose
 * string (converted into an array), or an array of diacritic base or decompose
 * string characters to process
 * @return {object} - Base or decompose data for each found array entry, or
 * an error message
 * @access private
 */
function getProcessed(type, array) {
    let result = {};
    const cache = getCache();
    if(!Array.isArray(array)) {
        array = [array];
    }
    array.forEach(elm => {
        let url = formatURL(type, elm),
            data = {};
        if(cache[type][elm]) {
            // get cached values
            data = cache[type][elm];
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
    if(Object.keys(result).length === 0) {
        result = {
            "message": `No matching ${type}s found`
        };
    }
    return result;
}

/**
 * Extract mapping data giving priority to the indicated mapping type
 * @param  {object} data - data[diacritic] object which contains mapping &
 * equivalents (not used by this function)
 * @param  {string} [type="base"] - mapping type (e.g. "decompose" or "base")
 * @return {string} - Base or decompose value
 * @access private
 */
function extractMapping(data, type = "base") {
    // allow misspelling & capitalization of "decompose"
    if(type.slice(0,1).toLowerCase() === "d") {
        // priority decompose > base
        return data.mapping.decompose || data.mapping.base;
    }
    // priority base > decompose
    return data.mapping.base || data.mapping.decompose;
}

/**
 * Extra diacritic mappings from language.data and return an object containing
 * a `diacritic:replacement value` key:value pairing for quick reference
 * @param  {object} data - language.data object
 * @param  {string} [type="base"] - mapping type (e.g. "decompose" or "base")
 * @param  {string} variant - language variant to target
 * @return {object} - diacritic mapping data using either the base or decompose
 * data for the selected variant, or first variant encountered if the variant
 * parameter is undefined
 * @access private
 */
function extractData(data, type = "base", variant) {
    let result = {};
    if(data && !data.message) {
        Object.keys(data).forEach(language => {
            const diacriticData = data[language].data;
            Object.keys(diacriticData).forEach(diacritic => {
                if (
                    // target selected variant
                    variant === language ||
                    // if undefined, then use first available entry
                    typeof variant === "undefined" && !result[diacritic]
                ) {
                    result[diacritic] =
                        extractMapping(diacriticData[diacritic], type);
                }
            });
        });
    }
    return result;
}

/**
 * Basic functions
 * @access public
 **/
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
 * Converts the escaped unicode as stored within the database
 * (`\\uHHHH` where H = hex) into actual unicode characters. Using
 * `.replace(/\\\u/g, "\u")` will appear to work, but it does not create an
 * actual unicode character; so we must use `.fromCharCode()` to properly
 * convert the string.
 * @param  {string} string - String with database formatted unicode value(s)
 * @return {string} - String containing actual unicode value(s)
 * @access protected
 */
module.exports.formatUnicode = string => {
    return (string || "").toString().replace(/\\\u(\w{4})/g, function(m, hex) {
        return String.fromCharCode(parseInt(hex, 16));
    });
}

/**
 * Data processing functions
 * @access public
 **/
/**
 * Get diacritic data of selected character(s) from cache, or API
 * @param  {string} string - Diacritic(s) to find
 * @return {object} - All data for each diacritic found or error message
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
                    if(!result[variant]) {
                        result[variant] = data[variant];
                    } else {
                        // add am additional diacritic to a given variant
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
 * Get diacritic base data of selected character(s) from cache, or API
 * @param  {string|string[]} array - A string of a single base string (converted
 * into an array), or an array of diacritic base string characters to process
 * @return {object} - Base data for each diacritic base found or error message
 * @access public
 */
module.exports.getBase = array => {
    return getProcessed("base", array);
}

/**
 * Get diacritic decompose data of selected character(s) from cache, or API
 * @param  {string|string[]} array - A string of a single decompose string
 * (converted into an array), or an array of diacritic decompose string
 * characters to process
 * @return {object} - Decompose data for each diacritic found or error message
 * @access public
 */
module.exports.getDecompose = array => {
    return getProcessed("decompose", array);
}

/**
 * Transliteration functions
 * @access public
 **/
/**
 * Transliterate diacritics in the given string
 * @param  {string} string - Text containing diacritic(s) to transliterate
 * @param  {string} type - Set to "decompose" or "base" (default)
 * @param  {string} variant - optional set to language variant to use
 * @return {string} - processed string, or original string if no diacritics
 * found; note that if a variant parameter is set and the string contains a
 * diacritic not found in that language variant, it will not be processed!
 * @access public
 */
module.exports.transliterate = (string, type = "base", variant) => {
    let result = string;
    const data = module.exports.getDiacritics(string),
        // non-normalized diacritic list
        diacritics = findDiacritics(string);
    if(diacritics) {
        diacritics.forEach(diacritic => {
            const normalized = diacritic.normalize("NFKC"),
                transliterate = extractData(data, type, variant);
            // transliterate may be undefined if no variant found
            if(typeof transliterate[diacritic] !== "undefined") {
                result = result.replace(
                    new RegExp(`(${normalized})`, "g"),
                    transliterate[diacritic]
                );
            }
        });
    }
    return result;
}

/**
 * Callback to create a regular expression
 * @callback diacritics~createRegExpCallback
 * @param {string} character - current character being processed
 * @param {string} result - regular expression string equivalent of the current
 * character (e.g. character "ü" may yield a result of "(\u00FC|u\u0308)")
 * @return {string} - string or a modified string that is to be used in the
 * regular expression
 */
/**
 * Create Regular Expression options
 * @typedef diacritics~createRegExpOptions
 * @type {object.<string>}
 * @property {boolean} [diacritics=true] - Include all diacritics in the string;
 * if `false`, the regex will replace the diacritic with a `\S`
 * @property {boolean} [nonDiacritics=true] - Include all non-diacritics in the
 * string
 * @property {boolean} [includeEquivalents=true] - Include all diacritic
 * equivalents within the regular expression
 * @property {boolean} [caseSensitive=true] - Include case sensitive diacritic
 * matches
 * @property {boolean} [ignoreJoiners=false] - Include word joiners between
 * each string character to match soft hyphens, zero width space, zero width
 * non-joiner and zero width joiners in the regular expression
 * @property {string} [flags="g"] - Regular expression flags to include
 * @property {diacritics~createRegExpCallback} [each]
 * @access private
 */
function regExpOptions() {
    return {
        diacritics: true,
        nonDiacritics: true,
        includeEquivalents: true,
        caseSensitive: true,
        ignoreJoiners: false,
        flags: "g",
        each: (character, result) => result
    };
}

/**
 * Create regular expression to target the given string with or without
 * diacritics
 * @param  {string} string - Text with or without diacritic characters to be
 * processed into a regular expression
 * @param  {diacritics~createRegExpOptions} [opt] - Optional options object
 * @return {RegExp} - Regular expression that matches the processed string, or
 * original string if no diacritics are found
 * @access public
 */
module.exports.createRegExp = (string, options = regExpOptions()) => {
    // to do
}

/**
 * Callback used when replacing placeholders
 * @callback diacritics~replacePlaceholderCallback
 * @param {string} placeholder - current placeholder string being processed
 * @param {array} result - resulting processed data as an array. For example, if
 * the placeholder
 * @return {string} - string used to replace the placeholder
 */
/**
 * Replaces placeholders options
 * @typedef diacritics~replacePlaceholderOptions
 * @type {object.<string>}
 * @property {string} [placeholder="<% diacritics: {query} %>"] - template of
 * placeholder to target within the string
 * @property {diacritics~replacePlaceholderCallback} [output]
 * @access private
 */
function placeholderOptions() {
    return {
        placeholder: "<% diacritics: {query} %>",
        output: (placeholder, result) => result.join(",")
    };
}
/**
 * Replaces placeholder(s) within the string with the targeted diacritic values.
 * The placeholder contains a query string
 * @param  {string} string - Text and/or HTML with a diacritic placeholder
 * value(s) to be replaced
 * @param  {diacritics~replacePlaceholderOptions} [opt] - Optional options
 * object
 * @return {string} - processed string, or original string if no diacritics
 * found
 * @example The `<% diacritics: base=o;equivalents.unicode %>` placeholder will
 * be replaced with `\\u00FC,u\\u0308,\\u00FA,u\\u0301` - this example is only
 * showing the results from `de` and `es` languages; there will be a lot more
 * once there is more data. The result can be reformatted using the `each`
 * callback function.
 * @access public
 */
module.exports.replacePlaceholder = (string, options = placeholderOpts()) => {
    // to do
}

// provide debug information to console
module.exports.debug = false;

// Initialize module
getCurrentVersion();
