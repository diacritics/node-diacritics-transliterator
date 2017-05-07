/*!***************************************************
 * node-diacritics-transliterator replaceRlaceholder
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const Diacritics = require("./diacritics"),
    Cache = require("./cache"),
    Util = require("./util"),

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
        "source": {
            parent: "metadata",
            type: "array",
            validEnd: true // flag needed for target values set as an array
        },
        "country": {
            parent: "metadata",
            type: "array",
            validEnd: true // flag needed for target values set as an array
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

class Placeholder {
    /**
     * Callback used while iterating through each data result
     * @callback placeholder~replacePlaceholderEachCallback
     * @param {util~extractDataProcessing}
     * @param {object} data - data result for the filter;target query
     * @param {array} target - data targeted to include in the placeholder
     * @return {string} - specific data to include in the placeholder
     */
    /**
     * Callback used to finalize the data which will replace the placeholder
     * @callback placeholder~replacePlaceholderFinalizeCallback
     * @param {string} placeholder - current placeholder string being processed
     * @param {array} result - resulting processed data as an array.
     * @return {string} - string used to replace the placeholder
     */
    /**
     * replacePlaceholder options
     * @typedef placeholder~replacePlaceholderOptions
     * @type {object.<string>}
     * @property {string} [placeholder="<% diacritics: {data} %>"] - template of
     * placeholder to target within the string
     * @property {string[]} [exclude=[]] - array of specific languages or
     * diacritics to exclude
     * @property {string} [joiner=", "] - string used to join the result array;
     * but only useful if the `done` callback function is not defined
     * @property {placeholder~replacePlaceholderEachCallback} [each]
     * @property {placeholder~replacePlaceholderFinalizeCallback} [done]
     * @access private
     */
    /**
     * Replaces placeholder(s) within the string with the targeted diacritic
     * values. The placeholder contains a data string
     * @param  {string} string - Text and/or HTML with a diacritic placeholder
     * value(s) to be replaced
     * @param  {placeholder~replacePlaceholderOptions} [settings] - user set
     * options
     * @return {string} - processed string, or original string if no
     * placeholder, or an invalid placeholder is found
     * @return {string} original string with all valid placeholders replaced
     * by data retreived from the database
     * @example
     * The `<% diacritics: base=o;equivalents.unicode %>` placeholder
     * will  be replaced with `\\u00FC, u\\u0308, \\u00FA, u\\u0301` - this
     * example is only showing the results from `de` and `es` languages; there
     * will be a lot more once there is more data. The result can be reformatted
     * using the `each` callback function.
     * @access public
     */
    static replacePlaceholder(string, settings = {}) {
        Util.checkString(string);
        const options = Object.assign({
            placeholder: "<% diacritics: {data} %>",
            exclude: [],
            joiner: ", ",
            // callbacks
            each: null, // (data, target) => data[target]
            done: null  // (placeholder, result) => result.join(", ")
        }, settings);
        Placeholder.extractSettings(string, options).forEach(placeholder => {
            if(placeholder.valid) {
                string = Placeholder.processPlaceholder(
                    placeholder,
                    string,
                    options
                );
            }
        });
        return string;
    }

    /**
     * @typedef placeholder~returnExtractedArray
     * @type {object.<string>}
     * @property {string} name - path element name, if valid
     * @property {string[]} array - path element array, if valid; set as an
     * empty if not set
     * @property {string} message - exists only if the path in invalid
     */
    /**
     * Extract an array from a string; ignore case unless it is a diacritic
     * @param {string} string - path item extracted from the placeholder
     * @return {placeholder~returnExtractedArray}
     * @access private
     */
    static extractArray(string) {
        let result = { name: "", array: [] },
            parts = string.match(Placeholder.regexpExtractArray);
        if(parts) {
            result.name = parts[1].toLowerCase();
            // ignore "[*]" in placeholders
            if(parts[2] && parts[2] !== "[*]") {
                result.array = Placeholder.convertToArray(
                    // make all path elements lower case except
                    // any set diacritic filters
                    result.name === "diacritic" ?
                        parts[2] :
                        parts[2].toLowerCase()
                );
            }
        }
        return result.name && result.name in tree ? result : {
            message: `"${string}" (${result.name}) is not a valid path`
        };
    }

    /**
     * Convert a string with square brackets and comma-separated values into an
     * array; return an array with any numbers parsed into numerical values
     * @param  {string} string - a string containing internalized square
     * brackets
     * @return {array} - array containing strings and/or numeric values parsed
     * into integers as they are expected to be used as an array index
     * @example convertToArray("[1,2,3,a,b,c]"); => [1,2,3,"a","b","c"]
     * @access private
     */
    static convertToArray(string) {
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
     * Return partial match index of an element in an array
     * @param  {array} array - an array of items
     * @param  {string} string - a string to match inside the array
     * @return {boolean} - true if found
     * @example
     * matchInArray(['abc', 'def', 'ghi'], 'zzz.abc.123') => true;
     * matchInArray(['abc', 'def', 'ghi'], 'def=z') => true
     * matchInArray(['abc', 'def', 'ghi'], '[ghi]') => true
     * @access private
     */
    static matchInArray(array, string) {
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
     * Get variants from cache, or API
     * @param  {string} type - API filter type (alphabet, continent or language)
     * @param  {string} code - API filter query
     * @return {object|Error} - Variants associated with filter type, or error
     * message
     * @access private
     */
    static getVariants(type, code) {
        Util.checkString(code);
        const url = Cache.formatQuery(type, code);
        if(type === "variant") {
            const obj = {};
            obj.type = type;
            obj.variant = code;
            // just in case this function gets called for "variant"
            return Cache.getData(obj, { ignoreMessage: true });
        }
        if(Cache.cache[url]) {
            return Cache.cache[url];
        }
        // not cached, get data from API
        return Cache.getJSON(url, { ignoreMessage: true });
    }

    /**
     * Process each extracted placeholder
     * @param {object} placeholder - one placeholder element from
     * {placeholder~extractPlaceholderReturn} array
     * @param {string} string - original string passed to the replacePlaceholder
     * function
     * @param {placeholder~replacePlaceholderOptions} options
     * @return {string} string - a modified version of the original string with
     * the current valid placeholder replaced with the targeted data
     * @access private
     */
    static processPlaceholder(placeholder, string, options) {
        let data = {},
            filters = placeholder.type,
            // combine essential data for the followPath function
            fpvars = Placeholder.getFPvars(placeholder, options);
        // query database stuff first
        if(filters === "diacritic") {
            // get diacritics data
            fpvars.database = Util.getDiacritics(placeholder.code);
        } else if(filters === "base" || filters === "decompose") {
            data[filters] = placeholder.code;
            // get base or decompose data from database or cache
            fpvars.database = Cache.getProcessed(data, options);
        } else {
            // get language, alphabet or continent data
            fpvars.database = Placeholder.getVariants(
                filters,
                placeholder.code
            );
        }
        // travel down the database path & get target value
        fpvars = Placeholder.followPath(fpvars);
        return Placeholder.finalizePlaceholder(
            placeholder,
            string,
            fpvars
        );
    }

    /**
     * Replace the placeholder in the original string with the finalized
     * processed data
     * @param {object} placeholder - one placeholder element from
     * {placeholder~extractPlaceholderReturn} array
     * @param {string} string - original string passed to the replacePlaceholder
     * function
     * @param {placeholder~followPathVariables} fpvars
     * @return {string} string - a modified version of the original string with
     * the current valid placeholder replaced with the targeted data
     * @access private
     */
    static finalizePlaceholder(placeholder, string, fpvars) {
        let val,
            // keep only unique values
            results = fpvars.results.filter((value, index, self) => {
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
            if(typeof fpvars.options.done === "function") {
                results = fpvars.options.done(results);
            }
            if(Array.isArray(results)) {
                results = results.join(fpvars.options.joiner);
            }
            string = (string || "")
                .split(placeholder.placeholder)
                .join(results);
        }
        return string;
    }

    /**
     * @typedef {placeholder~validatePathReturn}
     * @type {object.<(array, object, boolean)>}
     * @property {string[]} path - the path in the database object from variant
     * to result
     * @property {object} xref - cross-reference of all path elements with any
     * extracted & parsed values from the placeholder data string
     * @property {number[]} filter - contains post-filtering numeric indexs to
     * be applied to the final results; occurs immediately before the "done"
     * callback is executed
     * @property {boolean} valid - true if the path is valid
     * @property {string} message - returned message if the placeholder is not
     * valid
     */
    /**
     * Takes a placeholder data string & creates a `path` array using the
     * defined tree & a `xref` object with any extracted values from the
     * placeholder string
     * @param  {string} string - placeholder data (from {data} filter;target)
     * @return {placeholder~validatePathReturn}
     * @example
     * validatePath("equivalents[1,2].raw")
     * @access private
     */
    static validatePath(string) {
        let obj,
            results = {
                valid: false,
                filters: []
            },
            vpvars = {
                string: string,
                path: [],
                xref: {},
                valid: false
            };
        if(!string) {
            results.message = "Cannot process an empty string";
            return results;
        }
        // traverse path from final target, going up to [root], e.g.
        // string = "equivalents[1,2].raw" results in
        // path = ["raw", "equivalents", ..., "variant"]
        // xref contains extracted values for every path item
        // xref = {"raw":"raw", "equivalents":[1,2], ..., "variant":"variant"}
        const parts = string.split(".").reverse();
        // check for post-filter definition
        // e.g. equivalents[raw, unicode].[0,1,2] (post filter first 3 results)
        obj = parts[0].match(Placeholder.regexpExtractArray);
        // test for an array in the string
        if(obj && /^\[.+\]$/.test(obj)) {
            results.filters = Placeholder.convertToArray(obj[0]);
            // remove post-filter from path
            parts.shift();
        }
        vpvars.parts = parts;
        vpvars.filters = results.filters;
        vpvars = Placeholder.buildPath(vpvars);
        if(vpvars.valid) {
            vpvars = Placeholder.updateXref(vpvars);
        }
        if(vpvars.valid) {
            vpvars = Placeholder.postFilters(vpvars);
        }
        if(vpvars.valid) {
            results.xref = vpvars.xref;
            results.path = vpvars.path;
            results.valid = vpvars.valid;
            results.target = vpvars.string;
        }
        // the path can still be valid, but have an error message
        // because data[invalid].raw would be ignored, and data.raw would
        // be used instead
        if(vpvars.message && !Placeholder.testing) {
            console.error(vpvars.message);
        }
        return results;
    }

    /**
     * @typedef {placeholder~validatePathObject}
     * @type {object}
     * @property {placeholder~validatePathReturn} string
     * @property {placeholder~validatePathReturn} path
     * @property {placeholder~validatePathReturn} xref
     * @property {placeholder~validatePathReturn} valid
     * @property {string[]} parts - parts of the extracted path
     * @property {string[]} filters - post filters extracted from path
     */
    /**
     * Build path starting from the last target up to the root
     * @param {placeholder~validatePathObject} vpvars
     * @return {placeholder~validatePathObject}
    */
    static buildPath(vpvars) {
        let parent, index,
            // start processing the path
            obj = Placeholder.extractArray(vpvars.parts[0]);
        if(obj.message) {
            vpvars.message = obj.message;
            return vpvars;
        }
        // get initial (last) value in the path
        if(obj.array && obj.array.length) {
            vpvars.xref[obj.name] = obj.array;
        } else {
            vpvars.xref[obj.name] = obj.name;
        }
        vpvars.path.push(obj.name);
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
            vpvars.path.push(parent);
            vpvars.xref[parent] = parent;
            parent = tree[parent] && tree[parent].parent;
            index++;
        }
        vpvars.path.reverse();
        // start out with a valid path
        vpvars.valid = true;
        return vpvars;
    }

    /**
     * Update xref with arrays, if set
     * @param {placeholder~validatePathObject} vpvars
     * @return {placeholder~validatePathObject}
     */
    static updateXref(vpvars) {
        if(vpvars.message) {
            return vpvars;
        }
        // Extract data from placeholder string while iterating down the tree
        // the tree is stored in a `path` array & extracted data is saved to the
        // `xref` object for cross-reference
        vpvars.parts.reverse().forEach(part => {
            const obj = Placeholder.extractArray(part),
                // ignore "[*]" placeholders
                arry = obj.array && obj.array.length;
            if(vpvars.valid && (vpvars.path.includes(obj.name) || arry)) {
                if(arry) {
                    // if set to "diacritic[\u00FC].raw", make sure the array is
                    // set to the diacritic xref
                    vpvars.xref[obj.name] = obj.array;
                }
            } else {
                if(obj.message) {
                    vpvars.message = obj.message;
                    console.error(obj.message);
                }
                vpvars.valid = false;
            }
        });
        return vpvars;
    }

    /**
     * Validate & apply post filters
     * @param {placeholder~validatePathObject} vpvars
     * @return {placeholder~validatePathObject}
     */
    static postFilters(vpvars) {
        if(vpvars.message) {
            return vpvars;
        }
        // make sure target path is a string (invalid target)
        let obj = vpvars.path[vpvars.path.length - 1];
        if(!tree[obj] || (tree[obj] && tree[obj].type !== "string")) {
            if(tree[obj].type === "array" && tree[obj].validEnd) {
                vpvars.valid = true;
            } else if(Array.isArray(vpvars.xref[obj])) {
                // check each array item & remove invalid entries
                vpvars.xref[obj] = vpvars.xref[obj].filter(
                    (item, index, self) => {
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
                    }
                );
                // All filters were removed, remove the array
                if(vpvars.xref[obj].length === 0) {
                    vpvars.xref[obj] = obj;
                    // check if the target node is an object and make it invalid
                    if(tree[obj].type === "object") {
                        vpvars.valid = false;
                    }
                }
            } else {
                vpvars.valid = false;
            }
        }
        return vpvars;
    }

    /**
     * @typedef {placeholder~extractPlaceholderReturn}
     * @type {object[]} - an array is added to the object for each placeholder
     * found
     * @property {string} placeholder - placeholder to replace
     * @property {string} type - The metadata or data filter type
     * (e.g. "language")
     * @property {string} code - The filter type value (e.g. "de")
     * @property {string[]} path - path leading from variant to target data,
     * e.g. * a "raw" target creates a path = [ "variant", "data", "diacritic",
     * "equivalents", "equiv-index", "raw" ]
     * @property {object} xref - The values extracted from the placeholder data;
     * it is used as a cross-reference to path
     * @property {boolean} valid - true if the path is valid
     */
    /**
     * Extract placeholder(s) settings from the string
     * @param  {string} string - string content to be processed
     * @param  {placeholder~replacePlaceholderOptions} [options] - Optional
     * options
     * @return {placeholder~extractPlaceholderReturn}
     * @access private
     */
    static extractSettings(string, options) {
        let result = [],
            // escape special RegExp characters
            str = Util.escapeRegExp(
                options.placeholder.split(/\{\s*data\s*\}/i)
            );
        str.forEach((item, index) => {
            // ignore whitespace inside the placeholder
            str[index] = item.replace(/\s+/g, "\\s*");
        });
        const regexp = new RegExp(str.join("(.+?)"), "gumi"),
            // match entire placeholder(s)
            placeholders = string.match(regexp);
        if(placeholders) {
            result = Placeholder.extractFromPlaceholder(placeholders, regexp);
        }
        return result;
    }

    /**
     * Extract Data from each placeholder
     * @param {string[]} placeholders - Array of extracted placeholders
     * @param {RegExp} regexp - Regular expression of the placeholder option
     * set in placeholder~replacePlaceholderOptions
     * @return {placeholder~extractPlaceholderReturn}
     */
    static extractFromPlaceholder(placeholders, regexp) {
        let string,
            result = [];
        placeholders.forEach((placeholder, index) => {
            result[index] = {
                type: false,
                code: false,
                filter: false,
                valid: false,
                path: [],
                placeholder: new RegExp(
                    // create regular expression for final replacement
                    Util.escapeRegExp(placeholder).replace(/\s+/g, "\\s*"),
                    "i"
                )
            };
            // see http://stackoverflow.com/q/1520800/145346
            regexp.lastIndex = 0;
            const opt = regexp.exec(placeholder);
            if(opt && opt[1]) {
                result[index] = Placeholder.processAndExtractData(
                    result[index],
                    opt[1]
                );
            }
            if(result[index].type && result[index].code && result[index].path) {
                result[index].valid = true;
            } else if(!Placeholder.testing) {
                // don't display this output during testing - too much spam!
                string = result[index];
                console.error(
                    `Invalid placeholder data
${placeholder}
type = ${string.type ? "valid (" + string.type + ")" : "invalid"}
code = ${string.code ? "valid (" + string.code + ")" : "invalid"}
target = ${string.target ? "valid (" + string.target + ")" : "invalid"}`
                );
            }
        });
        return result;
    }

    /**
     * Process & extract data
     * @param {placeholder~extractPlaceholderReturn} result
     * @param {string} part - extracted placeholder string
     * @return {placeholder~extractPlaceholderReturn}
     */
    static processAndExtractData(result, part) {
        // extract data & process parts {filter;target}
        part.replace(/\s+/g, "").split(";").forEach((item, indx) => {
            let tmp,
                string = item.split("=");
            // the first item is the "filter" (e.g. decompose=u)
            // the second item is the "target" data (e.g.
            // alphabet)
            if(indx === 0 && string) {
                // remove "/v1/?" route from filter
                tmp = (string[0] || "").replace(/\/v\d+\/\?/, "");
                if(Placeholder.matchInArray(Diacritics.validFilters, tmp)) {
                    // double check (see first test, double
                    // nested placeholder)
                    tmp = tmp.toLowerCase().trim();
                    if(Diacritics.validFilters.includes(tmp)) {
                        // e.g. "decompose=u" => type = "decompose"
                        result.type = tmp;
                        // preliminary setting of valid flag to allow
                        // processing of next step
                        result.valid = true;
                    }
                }
                if(string[1]) {
                    // e.g. "decompose=u" => code = "u"
                    result.code = (string[1] || "").trim();
                }
            } else if(Placeholder.matchInArray(Object.keys(tree), item)) {
                string = Placeholder.validatePath(item);
                result.path = string.valid ? string.path : null;
                result.xref = string.valid ? string.xref : false;
                result.target = string.target;
                result.filters = string.filters;
            }
        });
        return result;
    }

    /**
     * Get path name function
     * @typedef placeholder~followPathGetPath
     * @type {function}
     * @param {object|array} obj - current object or array to process
     * @param {string|number} keys - current object string or array index
     * @access private
     */
    /**
     * Save path name function
     * @typedef placeholder~followPathSavePath
     * @type {function}
     * @param {object|array} obj - current object or array to process
     * @param {string|number} key - current object string or array index
     * @access private
     */
    /**
     * followPath variables - object passed between functions to build a path
     * up the database tree and apply matching filters. Once the results
     * have been obtained, the database is queried and the placeholder string is
     * processed and returned
     * @typedef placeholder~followPathVariables
     * @type {object.<(array, object, string)>}
     * @param {object} database - full returned database object
     * @param {array}  path - path key from {placeholder~validatePathReturn}
     * @param {object} xref - xref key from {placeholder~validatePathReturn}
     * @param {array} results - placeholder path results
     * @param {number} indx - current tree path index
     * @param {array} filters - post results filters to be applied
     * @param {placeholder~replacePlaceholderOptions} options
     * @param {placeholder~followPathGetPath} getPath
     * @param {placeholder~followPathSavePath} savePath
     */
     /**
      * Get Follow Path (FP) variables
      * @param {string} placeholder - current placeholder string
      * @param {placeholder~replacePlaceholderOptions} options
      * @return {placeholder~followPathVariables}
      */
    static getFPvars(placeholder, options) {
        // combine essential data for the followPath function
        const fpvars = {
            database: "", // added later
            path: placeholder.path,
            xref: placeholder.xref,
            results: [],
            // filters added for the special case of equivalents.[1,2]
            // which filters the final result
            filters: [],
            options
        };
        fpvars.savePath = function(obj, key) {
            let value = typeof obj === "string" ? obj : obj[key];
            if(typeof fpvars.options.each === "function") {
                value = fpvars.options.each(fpvars.database, obj, key);
            }
            // allow "source", "continent" & "country" to be combined
            if(Array.isArray(value) && tree[key].validEnd) {
                value = value.join(fpvars.options.joiner);
            }
            // don't include undefined or empty values
            if(typeof value !== "undefined" && value !== "") {
                fpvars.results.push(value);
            }
        };
        fpvars.getPath = function(obj, keys) {
            if(obj && Array.isArray(keys)) {
                keys.forEach(item => {
                    // obj is a string when the database contains a string
                    // instead of an array (e.g. continent)
                    fpvars.savePath(obj, item);
                });
            } else if(
                obj &&
                (typeof obj[keys] === "string" || Array.isArray(obj[keys]))
            ) {
                fpvars.savePath(obj, keys);
            }
        };
        return fpvars;
    }

    /**
     * Extract all placeholder results
     * @param {placeholder~followPathVariables} fpvars
     * @return {array} - results array from {placeholder~followPathVariables}
     * @access private
     */
    static followPath(fpvars) {
        return fpvars.path.includes("metadata") ?
            Placeholder.extractPathMetadata(fpvars) :
            Placeholder.extractPathData(fpvars);
    }

    /**
     * Extract database metadata
     * @param {placeholder~followPathVariables} fpvars
     * @return {array} - results array from {placeholder~followPathVariables}
     * @access private
     */
    static extractPathMetadata(fpvars) {
        // handle metadata; e.g. variant[].metadata[]
        Util.extractData(fpvars.database, "metadata", params => {
            let obj,
                indx = fpvars.path.indexOf("metadata"),
                xref = fpvars.xref.variant,
                tmp = Array.isArray(xref);
            // handle variant[].metadata.. and variant.metadata...
            if(
                // placeholder variant array overrides the exclude option
                (tmp && xref.includes(params.variant)) ||
                // no placeholder variant array & variant not excluded
                (!tmp && !fpvars.options.exclude.includes(params.variant))
            ) {
                obj = fpvars.database[params.variant];
                // handle metadata[]
                fpvars.getPath(obj.metadata, fpvars.xref.metadata);
                indx++;
                tmp = fpvars.path[indx];
                // handle metadata keys
                fpvars.getPath(obj.metadata, fpvars.xref[tmp]);
                // handle continent[], source[]
                tmp = fpvars.path[indx];
                if(tmp) {
                    fpvars.getPath(obj.metadata[tmp], fpvars.xref[tmp]);
                }
            }
        });
        return fpvars;
    }

    /**
     * Extract database data
     * @param {placeholder~followPathVariables} fpvars
     * @return {array} - results array from {placeholder~followPathVariables}
     * @access private
     */
    static extractPathData(fpvars) {
        // handle data, e.g. variant[].data.diacritic[].mapping[] and
        // variant[].data.diacritic[].equivalents[]
        Util.extractData(fpvars.database, "data", params => {
            fpvars.indx = fpvars.path.indexOf("data");
            let xref = fpvars.xref.variant,
                isArray = Array.isArray(xref);
            // handle variant[].data.. and variant.data...
            if(
                // placeholder variant array overrides the exclude option
                (isArray && xref.includes(params.variant)) ||
                (
                    // no placeholder variant array & variant not excluded
                    !isArray &&
                    !fpvars.options.exclude.includes(params.variant) &&
                    // and diacritic not excluded
                    !fpvars.options.exclude.includes(params.diacritic)
                )
            ) {
                fpvars.indx++; // set path to "diacritic"
                Placeholder.processPathData(
                    params,
                    fpvars,
                    Array.isArray(fpvars.xref.diacritic)
                );
            }
        });
        return fpvars;
    }

    /**
     * Process diacritic path
     * @param {util~extractDataProcessing} params
     * @param {placeholder~followPathVariables} fpvars
     * @param {boolean} isArray - true if "variant" is set as an array in the
     * placeholder, e.g. variant["de", "es"]
     * @return {placeholder~followPathVariables}
     * @access private
     */
    static processPathData(params, fpvars, isArray) {
        // handle diacritic[]
        let obj, path, xref, filter, tmp;
        if(
            // specific diacritics set
            (isArray && fpvars.xref.diacritic.includes(params.diacritic)) ||
            // non-specific diacritics
            !isArray
        ) {
            obj = fpvars.database[params.variant].data[params.diacritic];
            // handle mapping[] or equivalents[]
            path = fpvars.path[++fpvars.indx]; // path to mapping or equivalents
            xref = fpvars.xref[path];
            if(path === "mapping") {
                tmp = fpvars.path[++fpvars.indx]; // path to base or decompose
                xref = Array.isArray(xref) ? xref : fpvars.xref[tmp];
                fpvars.getPath(obj.mapping, xref);
            } else {
                // get final target (e.g. raw, unicode, etc)
                tmp = fpvars.path[fpvars.indx + 1];
                // separate out any numeric values
                // equivalents[raw, unicode, 0, 1]
                filter = [];
                xref = (Array.isArray(xref) ? xref : []).filter(itm => {
                    // separate out numbers; save to returned filters
                    if(!isNaN(itm)) {
                        // save numbered equivalents[] to val.filters...
                        // as this filter is applied after all equivalents have
                        // been obtained & duplicates removed
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
                                    fpvars.savePath(item, elm);
                                }
                            });
                        }
                        if(item[tmp]) {
                            fpvars.savePath(item, tmp);
                        }
                    }
                });
            }
        }
        return fpvars;
    }

}

// test for [1,2,3] or [\u00FC,\u00DC]
Placeholder.regexpExtractArray = /([^[]+)?(\[.*\])?/;
// testing flag
Placeholder.testing = false;

module.exports = Placeholder;
