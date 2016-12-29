/*!***************************************************
 * node-diacritics-transliterator
 * http://diacritics.io/
 * Copyright (c) 2016–2017, Julian Motz & Rob Garrison
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const databaseURL = "http://api.diacritics.io/",
    request = require("sync-request"),
    regenerate = require("regenerate"),
    // valid API filters
    validFilters = {
        metadata: [
            "alphabet",
            "continent",
            "language",
            "variant",
        ],
        data: [
            "base",
            "decompose",
            "diacritic"
        ]
    },
    // cross-reference of database values starting from the language variant.
    // Used by placeholder function
    tree = {
        "variant": {
            parent: "[root]",
            type: "object"
        },
        "metadata": {
            parent: "variant",
            type: "object"
        },
        "alphabet": {
            parent: "metadata",
            type: "string"
        },
        "continent": {
            parent: "metadata",
            type: "string"
        },
        "language": {
            parent: "metadata",
            type: "string"
        },
        "native": {
            parent: "metadata",
            type: "string"
        },
        "sources": {
            parent: "metadata",
            type: "array",
            validEnd: true
        },
        "countries": {
            parent: "metadata",
            type: "array",
            validEnd: true
        },
        "data": {
            parent: "variant",
            type: "object"
        },
        "diacritic": {
            parent: "data",
            type: "object"
        },
        "mapping": {
            parent: "diacritic",
            type: "object"
        },
        "base": {
            parent: "mapping",
            type: "string"
        },
        "decompose": {
            parent: "mapping",
            type: "string"
        },
        "equivalents": {
            parent: "diacritic",
            type: "array",
            validEnd: false
        },
        // the following targets have an object as their parent, so this makes
        // it difficult to add in the placeholder, so we'll just "assume"
        // it's an array... "equivalents[1,2,3].raw";
        // Also "raw" or "equivalents.raw" is the same as "equivalents[*].raw"
        "raw": {
            parent: "equivalents",
            type: "string"
        },
        "unicode": {
            parent: "equivalents",
            type: "string"
        },
        "html_decimal": {
            parent: "equivalents",
            type: "string"
        },
        "html_hex": {
            parent: "equivalents",
            type: "string"
        },
        "encoded_uri": {
            parent: "equivalents",
            type: "string"
        },
        "html_entity": {
            parent: "equivalents",
            type: "string"
        }
    };

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
    module.exports.maxVersion = current;
}

/**
 * Checks if the input is a string
 * @param {*} value - value to check the typeof
 * @return {object|undefined}
 */
function checkString(value) {
    let undefined;
    if(typeof value !== "string") {
        return {
            message: "Error: Invalid input string"
        };
    }
    return undefined;
}

/**
 * Checks if the input is a string or array
 * @param {*} value - value to check the typeof
 * @return {object|undefined}
 */
function checkStringOrArray(value) {
    let undefined;
    if(typeof value !== "string" && !Array.isArray(value)) {
        return {
            message: "Error: Invalid input; use a string or array"
        };
    }
    return undefined;
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
    let error = checkString(code);
    if(error) {
        return error;
    }
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
 * Convert a string with square brackets and comma-separated values into an
 * array; return an array with any numbers parsed into numerical values
 * @param  {string} string - a string containing internalized square brackets
 * @return {array} - array containing strings and/or numeric values parsed into
 * integers as they are expected to be used as an array index
 * @example convertToArray("[1,2,3,a,b,c]"); => [1,2,3,"a","b","c"]
 * @access private
 */
function convertToArray(string) {
    if(string === "[]") {
        return [];
    }
    return string
        .replace(/[[\]]/g, "")
        .trim()
        .split(/\s*,\s*/)
        .map(item => {
            return isNaN(item) ? item : parseInt(item, 10);
        });
}

/**
 * @typedef {diacritics~validatePathReturn}
 * @type {object.<(array, object, boolean)>}
 * @property {string[]} path - the path in the database object from variant to
 * result
 * @property {object} xref - cross-reference of all path elements with any
 * extracted & parsed values from the placeholder data string
 * @property {number[]} filter - contains post-filtering numeric indexs to be
 * applied to the final results; occurs immediately before the "done" callback
 * is executed
 * @property {boolean} valid - true if the path is valid
 */
/**
 * Takes a placeholder data string & creates a `path` array using the defined
 * tree & a `xref` object with any extracted values from the placeholder string
 * @param  {string} string - placeholder data (from {data} filter;target)
 * @return {diacritics~validatePathReturn}
 * @example
 * validatePath("equivalents[1,2].raw")
 * @access private
 */
function validatePath(string) {
    let parent, index, obj,
        results = {
            "valid": false,
            "filters": []
        },
        valid = true,
        path = [], // added to results if valid
        xref = {}; // added to results if valid
    if(!string) {
        return {
            message: "Cannot process an empty string"
        };
    }
    // traverse path from final target, going up to [root], e.g.
    // string = "equivalents[1,2].raw" results in
    // path = ["raw", "equivalents", ..., "variant"]
    // xref contains extracted values for every path item
    // xref = {"raw":"raw", "equivalents":[1,2], ..., "variant":"variant"}
    const parts = string.split(".").reverse(),
        // test for [1,2,3] or [\u00FC,\u00DC]
        extractArray = /([^[]+)?(\[.*\])?/,
        isArray = /^\[.+\]$/,
        extract = str => {
            let result = { name: "", array: [] },
                pts = str.match(extractArray);
            if(pts) {
                result.name = pts[1].toLowerCase();
                // ignore "[*]" in placeholders
                if(pts[2] && pts[2] !== "[*]") {
                    result.array = convertToArray(
                        // make all path elements lower case except
                        // any set diacritic filters
                        result.name === "diacritic" ?
                            pts[2] :
                            pts[2].toLowerCase()
                    );
                }
            }
            return result.name && result.name in tree ? result : {
                message: `"${string}" (${result.name}) is not a valid path`
            };
        };
    // check for post-filter definition
    // e.g. equivalents[raw, unicode].[0,1,2] (post filter first 3 results)
    obj = parts[0].match(extractArray);
    if(obj && isArray.test(obj)) {
        results.filters = convertToArray(obj[0]);
        // remove post-filter from path
        parts.shift();
    }
    obj = extract(parts[0]);
    if(!obj || obj && obj.message) {
        return obj && obj.message || {
            message: `${string} is invalid`
        };
    }
    // get initial (last) value in the path
    if(obj.array && obj.array.length) {
        xref[obj.name] = obj.array;
    } else {
        xref[obj.name] = obj.name;
    }
    path.push(obj.name);
    parent = tree[obj.name] && tree[obj.name].parent;
    // go up the path & validate; build path up from starting point using
    // the defined tree
    index = 0;
    while(
        typeof parent !== "undefined" &&
        parent !== "[root]" &&
        // limit iterations
        index < 50
    ) {
        path.push(parent);
        xref[parent] = parent;
        parent = tree[parent] && tree[parent].parent;
        index++;
    }
    path.reverse();
    // Extract data from placeholder string while iterating down the tree
    // the tree is stored in a `path` array & extracted data is saved to the
    // `xref` object for cross-reference
    parts.reverse().forEach(part => {
        const obj = extract(part),
            // ignore "[*]" placeholders
            arry = obj.array && obj.array.length;
        if(valid && (path.includes(obj.name) || arry)) {
            if(arry) {
                // if set to "diacritic[\u00FC].raw", make sure the array is set
                // to the diacritic xref
                xref[obj.name] = obj.array;
            }
        } else {
            if(obj.message) {
                console.error(obj.message);
            }
            valid = false;
        }
    });
    // make sure target path is a string (invalid target)
    obj = path[path.length - 1];
    if(!tree[obj] || (tree[obj] && tree[obj].type !== "string")) {
        if(tree[obj].type === "array" && tree[obj].validEnd) {
            valid = true;
        } else if(Array.isArray(xref[obj])) {
            // check each array item & remove invalid entries
            xref[obj] = xref[obj].filter((item, index, self) => {
                if(
                    // ignore numeric values
                    (isNaN(item) && !tree[item]) ||
                    // find item in tree
                    (tree[item] &&
                        (
                            // type can be a string or array
                            tree[item].type === "object" ||
                            // must be a child of the path
                            tree[item].parent !== obj
                        )
                    )
                ) {
                    return false;
                }
                return self.indexOf(item) === index;
            });
            // All filters were removed, remove the array
            if(xref[obj].length === 0) {
                xref[obj] = obj;
                // check if the target node is an object and make it invalid
                if(tree[obj].type === "object") {
                    valid = false;
                }
            }
        } else {
            valid = false;
        }
    }
    if(valid) {
        results.xref = xref;
        results.path = path;
        results.valid = valid;
        results.target = string;
    }
    return results;
}

/**
 * @typedef {diacritics~extractPlaceholderReturn}
 * @type {object[]} - an array is added to the object for each placeholder found
 * @property {string} placeholder - placeholder to replace
 * @property {string} type - The metadata or data filter type (e.g. "language")
 * @property {string} code - The filter type value (e.g. "de")
 * @property {string[]} path - path leading from variant to target data, e.g
 * a "raw" target creates a path = [ "variant", "data", "diacritic",
 * "equivalents", "equiv-index", "raw" ]
 * @property {object} xref - The values extracted from the placeholder data;
 * it is used as a cross-reference to path
 * @property {boolean} valid - true if the path is valid
 */
/**
 * Extract placeholder(s) settings from the string
 * @param  {string} string - string content to be processed
 * @param  {diacritics~replacePlaceholderOptions} [options] - Optional options
 * @return {diacritics~extractPlaceholderReturn}
 * @access private
 */
function extractPlaceholderSettings(string, options) {
    let result = [],
        // escape special RegExp characters
        str = escapeRegExp(options.placeholder.split(/\{\s*data\s*\}/i));
    str.forEach((item, index) => {
        // ignore whitespace inside the placeholder
        str[index] = item.replace(/\s+/g, "\\s*");
    });
    const regexp = new RegExp(str.join("(.+?)"), "gumi"),
        // match entire placeholder(s)
        placeholders = string.match(regexp);
    if(placeholders) {
        placeholders.forEach((placeholder, index) => {
            result[index] = {
                type: false,
                code: false,
                filter: false,
                valid: false,
                placeholder: new RegExp(
                    // create regular express for final replacement
                    escapeRegExp(placeholder).replace(/\s+/g, "\\s*"),
                    "i"
                ),
            };
            // see http://stackoverflow.com/q/1520800/145346
            regexp.lastIndex = 0;
            const opt = regexp.exec(placeholder);
            if(opt && opt[1]) {
                // extract data & process parts {filter;target}
                opt[1].replace(/\s+/g, "").split(";").forEach((item, indx) => {
                    let tmp;
                    str = item.split("=");
                    // the first item is the "filter" (e.g. decompose=u)
                    // the second item is the "target" data (e.g. alphabet)
                    if(indx === 0 && str) {
                        // remove "/v1/?" route from filter
                        // TODO: maybe this should set the version?
                        tmp = (str[0] || "").replace(/\/v\d+\/\?/, "");
                        if(
                            matchInArray(validFilters.metadata, tmp) ||
                            matchInArray(validFilters.data, tmp)
                        ) {
                            // double check (see first test, double nested
                            // placeholder)
                            tmp = tmp.toLowerCase().trim();
                            if(
                                validFilters.metadata.includes(tmp) ||
                                validFilters.data.includes(tmp)
                            ) {
                                // e.g. "decompose=u" => type = "decompose"
                                result[index].type = tmp;
                            }
                        }
                        if(str[1]) {
                            // e.g. "decompose=u" => code = "u"
                            result[index].code = (str[1] || "").trim();
                        }
                    } else if(matchInArray(Object.keys(tree), item)) {
                        str = validatePath(item);
                        result[index].path = str.valid ? str.path : false;
                        result[index].xref = str.valid ? str.xref : false;
                        result[index].target = str.target;
                        result[index].filters = str.filters;
                    }
                });
            }
            if(module.exports.debug.placeholder) {
                console.log('placeholder extracted:\n', result[index]);
            }
            if(result[index].type && result[index].code && result[index].path) {
                result[index].valid = true;
            } else if(
                // don't show error messages while testing - too much spam!
                !module.exports.testing
            ) {
                str = result[index];
                console.error(
                    `Invalid placeholder data
  ${placeholder}
  type = ${str.type ? "valid (" + str.type + ")" : "invalid"}
  code = ${str.code ? "valid (" + str.code + ")" : "invalid"}
  target = ${str.target ? "valid (" + str.target + ")" : "invalid"}`
                );
            }
        });
    }
    return result;
}

/**
 * Return partial match index of an element in an array, e.g.
 * matchInArray(['abc', 'def', 'ghi'], 'zzz.abc.123') => true;
 * matchInArray(['abc', 'def', 'ghi'], 'def=z') => true
 * matchInArray(['abc', 'def', 'ghi'], '[ghi]') => true
 * @param  {array} array - an array of items
 * @param  {string} string - a string to match inside the array
 * @return {boolean} - true if found
 */
function matchInArray(array, string) {
    let result = false;
    array.forEach(item => {
        if(!result) {
            let partials = (string || "").toLowerCase().split(/[\W]/);
            partials.forEach(segment => {
                if(segment === item) {
                    result = true;
                }
            });
        }
    });
    return result;
}

/**
 * Escape regular expression characters in a string or inside of an array
 * @param {array|string} item
 * @return {array|string} - new array or string
 * @access protected
 */
function escapeRegExp(item) {
    let result = [],
        isString = typeof item === "string",
        array = isString ? [item] : item;
    array.forEach((character, index) => {
        result[index] = character.replace(/[$()*+\-.\/?[\\\]^{|}]/g, "\\$&");
    });
    return isString ? result[0] : result;
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
    let error = checkString(code);
    if(error) {
        return error;
    }
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
    const error = checkString(string);
    if(error) {
        return error;
    }
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
    let result = {},
        error = checkString(string);
    if(error) {
        return error;
    }
    // normalize string to use the same compatibilty-composed values contained
    // in the database
    string = string.normalize("NFKC");
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
 * @param  {(string|string[])} array - A string of a single base string or an
 * array of diacritic base string characters to process
 * @return {object} - Base data for each diacritic base found or error message
 * @access public
 */
module.exports.getBase = array => {
    const error = checkStringOrArray(array);
    if(error) {
        return error;
    }
    return getProcessed("base", array);
}

/**
 * Get diacritic decompose data of selected character(s) from cache, or API
 * @param  {(string|string[])} array - A string of a single decompose string or
 * an array of diacritic decompose string characters to process
 * @return {object} - Decompose data for each diacritic found or error message
 * @access public
 */
module.exports.getDecompose = array => {
    const error = checkStringOrArray(array);
    if(error) {
        return error;
    }
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
    let result = checkString(string);
    if(result) {
        return result;
    }
    result = string;
    if(type !== "base" && type !== "decompose") {
        throw new Error("Error: Invalid 'type' value");
    }
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
 * @property {diacritics~createRegExpCallback} [each=null]
 * @property {diacritics~createRegExpFinalize} [done=null]
 */
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
    let indx, regexp, array, result,
        error = checkString(string);
    if(error) {
        return error;
    }
    options = Object.assign({
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
    }, options);
    regexp = [];
    array = [];
    result = options.caseSensitive ?
        string :
        string.toLowerCase() + string.toUpperCase();
    const data = module.exports.getDiacritics(result),
        // non-normalized diacritic list
        diacritics = findDiacritics(string, { regexp: true }),
        matches = string.match(diacritics) || [];
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
            `"${string}" converted to RegExp => `,
            new RegExp(regexp, options.flags).toString()
        );
    }
    return new RegExp(regexp, options.flags);
}

/**
 * followPath variables
 * @typedef diacritics~followPathVariables
 * @type {object.<(array, object, string)>}
 * @param {object} database - full returned database object
 * @param {array}  path - path key from {diacritics~validatePathReturn},
 * @param {object} xref - xref key from {diacritics~validatePathReturn}
 * @param {string} joiner - joiner from {diacritics~replacePlaceholderOptions}
 * @param {array} exclude - exclude from {diacritics~replacePlaceholderOptions}
 * @param {diacritics~replacePlaceholderEachCallback} each
 */
/**
 * Recursive function to get all placeholder results
 * @param {object} database - subobject of the language database object
 * @param {diacritics~followPathVariables} [vars]
 * @return {array} - results array from {diacritics~followPathVariables}
 * @access private
 */
function followPath(database, vars) {
    let val = {
        results: [],
        // filters added for the special case of equivalents[1,2]
        // which filters the final result
        filters: []
    };
    const saveValue = (obj, key) => {
            let value = typeof obj === "string" ? obj : obj[key];
            if(typeof vars.each === "function") {
                value = vars.each(database, obj, key);
            }
            // allow "source", "continent" & "country" to be combined
            if(Array.isArray(value) && tree[key].validEnd) {
                value = value.join(vars.joiner);
            }
            // don't include undefined or empty values
            if(typeof value !== "undefined" && value !== "") {
                val.results.push(value);
            }
        },
        getVals = (obj, keys) => {
            if(obj && Array.isArray(keys)) {
                keys.forEach(item => {
                    // obj is a string when the database contains a string
                    // instead of an array (e.g. continent)
                    saveValue(obj, item);
                });
            } else if(
                obj &&
                (typeof obj[keys] === "string" || Array.isArray(obj[keys]))
            ) {
                saveValue(obj, keys);
            }
        };
    if(vars.path.includes("metadata")) {
        // handle metadata; e.g. variant[].metadata[]
        extractData(database, "metadata", params => {
            let obj,
                indx = vars.path.indexOf("metadata"),
                xref = vars.xref.variant,
                tmp = Array.isArray(xref);
            // handle variant[].metadata.. and variant.metadata...
            if(
                // placeholder variant array overrides the exclude option
                (tmp && xref.includes(params.variant)) ||
                // no placeholder variant array & variant not excluded
                (!tmp && !vars.exclude.includes(params.variant))
            ) {
                obj = database[params.variant];
                // handle metadata[]
                getVals(obj.metadata, vars.xref.metadata, indx);
                indx++;
                tmp = vars.path[indx];
                // handle metadata keys
                getVals(obj.metadata, vars.xref[tmp], indx);
                // handle continent[], source[]
                tmp = vars.path[indx];
                if(tmp) {
                    getVals(obj.metadata[tmp], vars.xref[tmp], indx);
                }
            }
        });
    } else {
        // handle data, e.g. variant[].data.diacritic[].mapping[] and
        // variant[].data.diacritic[].equivalents[]
        extractData(database, "data", params => {
            let obj, path, filter,
                indx = vars.path.indexOf("data"),
                xref = vars.xref.variant,
                tmp = Array.isArray(xref);
            // handle variant[].data.. and variant.data...
            if(
                // placeholder variant array overrides the exclude option
                (tmp && xref.includes(params.variant)) ||
                (
                    // no placeholder variant array & variant not excluded
                    !tmp &&
                    !vars.exclude.includes(params.variant) &&
                    // and diacritic not excluded
                    !vars.exclude.includes(params.diacritic)
                )
            ) {
                indx++; // set path to "diacritic"
                tmp = Array.isArray(vars.xref.diacritic);
                // handle diacritic[]
                if(
                    (
                        // specific diacritics set
                        tmp &&
                        vars.xref.diacritic.includes(params.diacritic)
                    // non-specific diacritics
                    ) || !tmp
                ) {
                    obj = database[params.variant].data[params.diacritic];
                    // handle mapping[] or equivalents[]
                    path = vars.path[++indx]; // path to mapping or equivalents
                    xref = vars.xref[path];
                    if(path === "mapping") {
                        tmp = vars.path[++indx]; // path to base or decompose
                        xref = Array.isArray(xref) ? xref : vars.xref[tmp];
                        getVals(obj.mapping, xref, indx);
                    } else {
                        // get final target (e.g. raw, unicode, etc)
                        tmp = vars.path[indx + 1];
                        // separate out any numeric values
                        // equivalents[raw, unicode, 0, 1]
                        filter = [];
                        xref = (Array.isArray(xref) ? xref : []).filter(itm => {
                            // separate out numbers; save to returned filters
                            if(!isNaN(itm)) {
                                // save numbered equivalents[] to val.filters...
                                // as this filter is applied after all
                                // equivalents have been obtained & duplicates
                                // removed
                                filter.push(parseInt(itm, 10));
                                return false;
                            }
                            return true;
                        });
                        obj[path].forEach((item, indx) => {
                            if(
                                // no filter; include all equivalents
                                !filter.length ||
                                // filter defined; only include named values
                                filter.length && filter.includes(indx)
                            ) {
                                if(xref.length) {
                                    xref.forEach(elm => {
                                        if(item[elm]) {
                                            saveValue(item, elm);
                                        }
                                    });
                                }
                                if(item[tmp]) {
                                    saveValue(item, tmp);
                                }
                            }
                        });
                    }
                }
            }
        });
    }
    return val;
}

/**
 * Callback used while iterating through each data result
 * @callback diacritics~replacePlaceholderEachCallback
 * @param {diacritic~extractDataProcessing}
 * @param {object} data - data result for the filter;target query
 * @param {array} target - data targeted to include in the placeholder
 * @return {string} - specific data to include in the placeholder
 */
/**
 * Callback used to finalize the data which will replace the placeholder
 * @callback diacritics~replacePlaceholderFinalizeCallback
 * @param {string} placeholder - current placeholder string being processed
 * @param {array} result - resulting processed data as an array. For example, if
 * the placeholder
 * @return {string} - string used to replace the placeholder
 */
/**
 * replacePlaceholder options
 * @typedef diacritics~replacePlaceholderOptions
 * @type {object.<string>}
 * @property {string} [placeholder="<% diacritics: {data} %>"] - template of
 * placeholder to target within the string
 * @property {string[]} [exclude=[]] - array of specific languages or diacritics
 * to exclude
 * @property {string} [joiner=", "] - string used to join the result array; but
 * only useful if the `done` callback function is not defined
 * @property {diacritics~replacePlaceholderEachCallback} [each]
 * @property {diacritics~replacePlaceholderFinalizeCallback} [done]
 * @access private
 */
/**
 * Replaces placeholder(s) within the string with the targeted diacritic values.
 * The placeholder contains a data string
 * @param  {string} string - Text and/or HTML with a diacritic placeholder
 * value(s) to be replaced
 * @param  {diacritics~replacePlaceholderOptions} [options] - user set options
 * @return {string} - processed string, or original string if no placeholder, or
 * an invalid placeholder is found
 * @example The `<% diacritics: base=o;equivalents.unicode %>` placeholder will
 * be replaced with `\\u00FC, u\\u0308, \\u00FA, u\\u0301` - this example is
 * only showing the results from `de` and `es` languages; there will be a lot
 * more once there is more data. The result can be reformatted using the `each`
 * callback function.
 * @access public
 */
module.exports.replacePlaceholder = (string, options = {}) => {
    const error = checkString(string);
    if(error) {
        return error;
    }
    options = Object.assign({
        placeholder: "<% diacritics: {data} %>",
        exclude: [],
        joiner: ", ",
        // callbacks
        each: null, // (data, target) => data[target]
        done: null  // (placeholder, result) => result.join(", ")
    }, options);
    extractPlaceholderSettings(string, options).forEach(placeholder => {
        if(placeholder.valid) {
            let database, results, val,
                tmp = placeholder.type;
            // query database stuff first
            if(tmp === "diacritic") {
                // get diacritics data
                database = module.exports.getDiacritics(placeholder.code);
            } else if(tmp === "base" || tmp === "decompose") {
                // get base or decompose data from database or cache
                database = getProcessed(tmp, [placeholder.code]);
            } else {
                // get language, alphabet or continent data
                database = getVariants(tmp, placeholder.code);
            }
            if(database && database.message) {
                if(module.exports.debug.placeholder) {
                    console.log(database.message, placeholder);
                }
                return;
            }
            // travel down the database & get target value
            tmp = followPath(
                database,
                // combine essential data for the followPath function
                {
                    database: database,
                    path: placeholder.path,
                    xref: placeholder.xref,
                    each: options.each,
                    exclude: options.exclude,
                    joiner: options.joiner
                }
            );
            // keep only unique values
            results = tmp.results.filter((value, index, self) => {
                return self.indexOf(value) === index;
            });
            if(results.length) {
                // apply any post-filtering, if defined
                if(placeholder.filters && placeholder.filters.length) {
                    val = results.filter((value, index) => {
                        return isNaN(index) ?
                            value :
                            placeholder.filters.includes(index);
                    });
                    results = val;
                }
                if(typeof options.done === "function") {
                    results = options.done(results);
                }
                if(Array.isArray(results)) {
                    results = results.join(options.joiner);
                }
                string = (string || "")
                    .split(placeholder.placeholder)
                    .join(results);
            }
        }
    });
    return string;
}

/**
 * Expose private functions for testing
 * @access public
 */
module.exports.testMode = () => {
    module.exports.testing = {
        extractPlaceholderSettings: extractPlaceholderSettings
    }
};

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
