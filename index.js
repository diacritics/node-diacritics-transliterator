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
 * Support functions
 * @access protected
 */
/**
 * Get current API version from diacritics/api package.json; sets
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
        if(module.exports.debug.server) {
            console.log(
                url + "; response: " +
                (result.message ? result.message : "loaded")
            );
        }
        // return error message, package.json
        if(result.message || result.version) {
            return result;
        }
        // save data to cache
        if(!module.exports.cache[url]) {
            module.exports.cache[url] = nextLayer(result);
        }
        return module.exports.cache[url];
    } else {
        result = `${url}; error: ${response.statusCode}`;
        if(module.exports.debug.server) {
            console.log(result);
        }
        return {
            "message": result
        };
    }
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
    Object.keys(result).forEach(lang => {
        Object.keys(result[lang]).forEach(variant => {
            obj[variant] = result[lang][variant];
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
    const url = formatURL(type, code);
    if(type === "variant") {
        // just in case this function gets called for "variant"
        return module.exports.getVariant(code);
    }
    if(module.exports.cache[url]) {
        if(module.exports.debug.server) {
            console.log(url + "; {loaded from cache}");
        }
        return module.exports.cache[url];
    }
    // not cached, get data from API
    return getJSON(url);
}

/**
 * findDiacritics options
 * @typedef diacritics~findDiacriticsOptions
 * @type {object.<string>}
 * @property {boolean} [regexp=false] - if false, return diacritics matches
 * array; if true, returns the regular expression
 */
/**
 * Creates an array of diacritics values from the given string
 * @param  {string} string
 * @param  {diacritics~findDiacriticsOptions} [options] - options object
 * @return {(?array|RegExp)}
 * @access protected
 */
function findDiacritics(string, options = {regexp: false}) {
    const matchUnicode = regenerate(Array.from(string))
        // remove standard symbols, numbers & alphabet
        .removeRange(0x0020, 0x00A0)
        .toRegExp('g');
    return options.regexp ? matchUnicode : string.match(matchUnicode);
}

/**
 * Process diacritic base or decompose value of selected character(s) in the
 * given string or array from the cache, or API
 * @param  {string} type - type of data to obtain (e.g. "decompose" or "base")
 * @param  {(string|string[])} array - A string of a single base or decompose
 * string (converted into an array), or an array of diacritic base or decompose
 * string characters to process
 * @return {object} - Base or decompose data for each found array entry, or
 * an error message
 * @access private
 */
function getProcessed(type, array) {
    let result = {};
    if(!Array.isArray(array)) {
        array = [array];
    }
    array.forEach(elm => {
        let url = formatURL(type, elm),
            data = {};
        if(module.exports.cache[url]) {
            // get cached values
            data = module.exports.cache[url];
            if(module.exports.debug.server) {
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
 * @param  {object} data - data[diacritic] object which contains mapping
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
 * @typedef diacritic~extractDataProcessing
 * @type {object}
 * @property {object} data - targeted portion of database
 * @property {string} variant - current variant being processed
 * @property {(string|undefined)} diacritic - current diacritic; only defined
 * when processing "data" (not "metadata")
 */
/**
 * Extra diacritic mappings from language.data and return an object containing
 * a `diacritic:replacement value` key:value pairing for quick reference
 * @param  {object} database - language.data object
 * @param  {string} [type="data"] - target object ("metadata" or "data")
 * @param  {diacritic~extractDataProcessing} process - callback to process data
 * @access private
 */
function extractData(database, type = "data", process) {
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

/**
 * Extract raw equivalents data for use in regular expression & placeholders
 * @param  {object} data - data[diacritic] object which contains equivalents
 * @param  {string} diacritic - the diacritic character to target
 * @param  {diacritics~createRegExpOptions} [options] - Options object
 * @return {array} - array containing unique diacritic equivalents
 * @access private
 */
function extractEquivalents(data, diacritic, options) {
    let result = [];
    extractData(data, "data", params => {
        if(diacritic === params.diacritic) {
            params.data[params.diacritic.toLowerCase()].equivalents.forEach(
                equivalent => {
                    result.push(equivalent.raw);
                }
            );
            if(!options.caseSensitive) {
                params.data[params.diacritic.toUpperCase()].equivalents.forEach(
                    equivalent => {
                        result.push(equivalent.raw);
                    }
                );
            }
        }
    });
    // remove duplicates
    result = result.filter((value, index, self) => {
        return self.indexOf(value) === index;
    });
    return result.length ? result : [diacritic];
}

/**
 * Escape regular expression characters inside of an array
 * @param {array} array
 * @return {array} - new array
 * @access protected
 */
function escapeRegExp(array) {
    let result = [];
    array.forEach((character, index) => {
        result[index] = character.replace(/[$()*+\-.\/?[\\\]^{|}]/g, "\\$&");
    });
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
 * @param  {(string|number)} version - All non-digits will be ignored
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
    const url = formatURL("variant", code);
    if(module.exports.cache[url]) {
        // return cached variant
        if(module.exports.debug.server) {
            console.log(url + "; {loaded from cache}");
        }
        return module.exports.cache[url];
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
    const diacritics = findDiacritics(string);
    if(diacritics) {
        diacritics.forEach(diacritic => {
            let url = formatURL("diacritic", encodeURI(diacritic)),
                data = {};
            if(module.exports.cache[url]) {
                // get cached variant
                data = module.exports.cache[url];
                if(module.exports.debug.server) {
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
 * @param  {(string|string[])} array - A string of a single base string
 * (converted into an array), or an array of diacritic base string characters
 * to process
 * @return {object} - Base data for each diacritic base found or error message
 * @access public
 */
module.exports.getBase = array => {
    return getProcessed("base", array);
}

/**
 * Get diacritic decompose data of selected character(s) from cache, or API
 * @param  {(string|string[])} array - A string of a single decompose string
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
                transliterate = {};
            extractData(data, "data", params => {
                if(
                    // target selected variant
                    variant === params.variant ||
                    // if undefined, then use first available entry
                    typeof variant === "undefined" &&
                    !transliterate[params.diacritic]
                ) {
                    transliterate[params.diacritic] =
                        extractMapping(params.data[params.diacritic], type);
                }
            });
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
 * @param {string} character - current non-normalized character being processed
 * (use `character.normalize("NFKC")` to make the character compatible with the
 * database entry)
 * @param {string} result - regular expression string equivalent of the current
 * character (e.g. character "ü" may yield a result of "(\u00FC|u\u0308)")
 * @param {object} data - the complete diacritic data object associated with
 * the regular expression string (e.g. `{lang: {variant: {diacritic: {...}}}}`
 * @param {number} index - the current character index. This index matches the
 * character position from the original regular expression `string` parameter
 * @return {string} - string or a modified string that is to be used in the
 * resulting regular expression. Any returned falsy values will not be added
 * to the final regular expression.
 */
/**
 * Callback to finalize the regular expression
 * @callback diacritics~createRegExpFinalize
 * @param {string[]} array - array of each character to be added to the regular
 * expression. Each array item is created from the original string split, and
 * will contain diacritics (if `diacritics` is `true`), or non-diacritics (if
 * `nonDiacritics` is `true`), but not both
 * @param {string} joiner - A a string used to `.join()` the `array` parameter
 * into its final regular expression string. When the `ignoreJoiners` option is
 * `false`, this string is empty (`""`), and when the `ignoreJoiners` option is
 * `true`, this string value becomes `"[\u00ad|\u200b|\u200c|\u200d]?"`. Return
 * the final regular expression string once it has been created
 * @return {string}
 */
/**
 * Create Regular Expression options
 * @typedef diacritics~createRegExpOptions
 * @type {object.<string>}
 * @property {boolean} [diacritics=true] - When `true`, all diacritics from the
 * `string` option are included; if `false`, all diacritics within the regular
 * expression will be replaced with a `\\S` (set by the `replaceDiacritic`
 * option).
 * @property {string}  [replaceDiacritic="\\S"] - Character used to replace
 * diacritics when the `diacritics` option is `false`. Note, the range `{1,2}`
 * is only added if the diacritic contains multiple characters (e.g. letter +
 * combining diacritic) and the `replaceDiacritic` option is set as `"\\S"`
 * (e.g. `e\u00e9` becomes `\\S{1,2}`. Make sure to double escape any regular
 * expression special characters
 * @property {boolean} [nonDiacritics=true] - When `true`, all non-diacritics
 * from the string are included; if `false`, non-diacritics are excluded so that
 * only diacritics are targeted by the regular expression
 * @property {boolean} [includeEquivalents=true] - When `true`, all diacritic
 * equivalents within the regular expression are included; if `false`, only the
 * diacritics in the `string` option are processed
 * @property {boolean} [caseSensitive=true] - When `true`, case sensitive
 * diacritics are matched; if `false`, both upper and lower case versions of the
 * diacritic are included
 * @property {boolean} [ignoreJoiners=false] - When `true`, word joiners to
 * match soft hyphens, zero width space, zero width non-joiner and zero width
 * joiners are added between each character in the regular expression
 * @property {string} [flags="gu"] - Flags to include when creating the regular
 * expression
 * @property {diacritics~createRegExpCallback} [each]
 * @property {diacritics~createRegExpFinalize} [done]
 * @access private
 */
function regExpOptions() {
    return {
        diacritics: true,
        replaceDiacritic: "\\S",
        nonDiacritics: true,
        includeEquivalents: true,
        caseSensitive: true,
        ignoreJoiners: false,
        flags: "gu",
        // callbacks
        each: null, // (character, result, data, index) => result
        done: null  // (array, joiner) => array.join(joiner)
    };
}
/**
 * Create regular expression to target the given string with or without
 * diacritics
 * @param  {string} string - Text with or without diacritic characters to be
 * processed into a regular expression that matches this value
 * @param  {diacritics~createRegExpOptions} [options] - Options object
 * @return {RegExp} - Regular expression that matches the processed string, or
 * original string if no diacritics are included
 * @access public
 */
module.exports.createRegExp = (string, options = {}) => {
    options = Object.assign(regExpOptions(), options);
    let indx,
        regexp = [],
        array = [],
        result = options.caseSensitive ?
            string :
            string.toLowerCase() + string.toUpperCase();
    const data = module.exports.getDiacritics(result),
        // non-normalized diacritic list
        diacritics = findDiacritics(string, { regexp: true }),
        matches = string.match(diacritics);
    if(matches) {
        array = escapeRegExp(Array.from(string));
        array.forEach((character, index) => {
            result = ""; // clear result!
            const isDiacritic = matches.includes(character),
                equivalents = options.includeEquivalents ?
                extractEquivalents(data, character.normalize("NFKC"), options) :
                [character];
            if(options.diacritics && isDiacritic) {
                if(equivalents.length > 1) {
                    result = options.nonDiacritics ?
                        `(${equivalents.join("|")})` :
                        // if nonDiacritics is false; combine all matching
                        // diacritics after processing; This adds a trailing
                        // pipe that must be removed!!
                        `${equivalents.join("|")}|`;
                } else {
                    result = equivalents[0];
                }
            } else if(options.nonDiacritics) {
                result = character;
                // ignore diacritics
                if(matches.includes(character)) {
                    indx = character.length;
                    if(options.includeEquivalents) {
                        // find longest equivalent
                        indx = 1;
                        equivalents.forEach(equivalent => {
                            indx = Math.max(indx, equivalent.length);
                        });
                    }
                    if(options.replaceDiacritic === "\\S") {
                        // "e\u0301" will be converted into "\\S{1,2}"
                        result = options.replaceDiacritic +
                            (indx > 1 ? `{1,${indx}}` : "");
                    } else {
                        result = options.replaceDiacritic;
                    }
                }
            }
            if(typeof options.each === "function") {
                result = options.each(
                    character,
                    result,
                    data,
                    index
                );
            }
            // don't add falsy values to regex
            if(result) {
                regexp.push(result);
            }
        });
        if(options.diacritics && !options.nonDiacritics) {
            // only diacritics are processed, wrap them all
            regexp.unshift("(");
            // remove trailing pipe
            regexp[regexp.length - 1] = regexp[regexp.length - 1]
                .replace(/\|$/, "");
            regexp.push(")");
        }
    }
    result = regexp.length && options.ignoreJoiners ?
        "[\u00ad|\u200b|\u200c|\u200d]?" : "";
    if(typeof options.done === "function") {
        regexp = options.done(regexp, result);
    }
    // just in case...
    if(Array.isArray(regexp)) {
        regexp = regexp.join(result);
    }
    if(module.exports.debug.regexp) {
        console.log(
            new RegExp(regexp, options.flags).toString(),
            JSON.stringify(options).replace(/\s+/g, " ")
        );
    }
    return new RegExp(regexp, options.flags);
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
module.exports.replacePlaceholder = (string, options = {}) => {
    options = Object.assign(regExpOptions(), options);
    // to do
}

/**
 * Internal cache to prevent duplicate calls to the API
 * @access public
 */
module.exports.cache = {};

/**
 * Debug settings - sends output to console
 */
module.exports.debug = {
    server: false, // show server & cache interactions
    regexp: false, // show resulting regular expressions
    regexpTests: false, // show all regular expression tests
    placeholder: false // show string breakdown and results
};

/**
 * Initialize module
 */
getCurrentVersion();
