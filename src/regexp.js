/*!***************************************************
 * node-diacritics-transliterator createRegExp
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const Util = require("./util");

class RegEx {
    /**
     * Callback to create a regular expression
     * @callback regex~createRegExpCallback
     * @param {string} character - current non-normalized character being
     * processed (use `character.normalize("NFKC")` to make the character
     * compatible with the database entry)
     * @param {string} result - regular expression string equivalent of the
     * current character (e.g. character "ü" may yield a result of
     * "(\u00FC|u\u0308)")
     * @param {object} data - the complete diacritic data object associated with
     * the regular expression string (e.g.
     * `{lang: {variant: {diacritic: {...}}}}`
     * @param {number} index - the current character index. This index matches
     * the character position from the original regular expression `string`
     * parameter
     * @return {string} - string or a modified string that is to be used in the
     * resulting regular expression. Any returned falsy values will not be added
     * to the final regular expression.
     */
    /**
     * Callback to finalize the regular expression
     * @callback regex~createRegExpFinalize
     * @param {string[]} array - array of each character to be added to the
     * regular expression. Each array item is created from the original string
     * split, and will contain diacritics (if `diacritics` is `true`), or non-
     * diacritics (if `nonDiacritics` is `true`), but not both
     * @param {string} joiner - A a string used to `.join()` the `array`
     * parameter into its final regular expression string. When the
     * `ignoreJoiners` option is `false`, this string is empty (`""`), and when
     * the `ignoreJoiners` option is `true`, this string value becomes
     * `"[\u00ad|\u200b|\u200c|\u200d]?"`. Return the final regular expression
     * string once it has been created
     * @return {string}
     */
    /**
     * @typedef regex~createRegExpOptions
     * @type {object.<string>}
     * @property {boolean} [caseSensitive=true] - When `true`, case sensitive
     * diacritics are matched; if `false`, both upper and lower case versions of
     * the diacritic are included
     * @property {boolean} [diacritics=true] - When `true`, all diacritics from
     * the `string` option are included; if `false`, all diacritics within the
     * regular expression will be replaced with a `\\S` (set by the
     * `replaceDiacritic` option).
     * @property {string} [flags="gu"] - Flags to include when creating the
     * regular expression
     * @property {boolean} [ignoreJoiners=false] - When `true`, word joiners to
     * match soft hyphens, zero width space, zero width non-joiner and zero
     * width joiners are added between each character in the regular expression
     * @property {boolean} [includeEquivalents=true] - When `true`, all
     * diacritic equivalents within the regular expression are included; if
     * `false`, only the diacritics in the `string` option are processed
     * @property {boolean} [nonDiacritics=true] - When `true`, all
     * non-diacritics from the string are included; if `false`, non-diacritics
     * are excluded so that only diacritics are targeted by the regular
     * expression
     * @property {string}  [replaceDiacritic="\\S"] - Character used to replace
     * diacritics when the `diacritics` option is `false`. Note, the range
     * `{1,2}` is only added if the diacritic contains multiple characters (e.g.
     * letter + combining diacritic) and the `replaceDiacritic` option is set as
     * `"\\S"` (e.g. `e\u00e9` becomes `\\S{1,2}`. Make sure to double escape
     * any regular expression special characters
     * @property {regex~createRegExpCallback} [each=null]
     * @property {regex~createRegExpFinalize} [done=null]
     */
    /**
     * Create regular expression to target the given string with or without
     * diacritics
     * @param  {string} string - Text with or without diacritic characters to be
     * processed into a regular expression that matches this value
     * @param  {regex~createRegExpOptions} [options] - Options object
     * @return {RegExp} - Regular expression that matches the processed string,
     * or original string if no diacritics are included
     * @access public
     */
    static createRegExp(string, options = {}) {
        Util.checkString(string);
        options = Object.assign({
            caseSensitive: true,
            diacritics: true,
            flags: "gu",
            ignoreJoiners: false,
            includeEquivalents: true,
            nonDiacritics: true,
            replaceDiacritic: "\\S",
            // callbacks
            each: null, // (character, result, data, index) => result
            done: null  // (array, joiner) => array.join(joiner)
        }, options);
        let regexp = [],
            array = [],
            result = options.caseSensitive ?
                string :
                string.toLowerCase() + string.toUpperCase(),
            // non-normalized diacritic list
            diacritics = Util.findDiacritics(result, { regexp: true }),
            vars = {
                options,
                data: Util.getDiacritics(result),
                matches: string.match(diacritics) || []
            };
        array = Util.escapeRegExp(Array.from(string));
        array.forEach((character, index) => {
            result = RegEx.processCharacter(vars, character);
            if(typeof options.each === "function") {
                result = options.each(character, result, vars.data, index);
            }
            // don't add falsy values to regex
            if(result) {
                regexp.push(result);
            }
        });
        regexp = RegEx.finalizeRegExp(regexp, options);
        return new RegExp(regexp, options.flags);
    }

    /**
     * Save equivalents with or without non-diacritics into a string, which
     * will be used in the resulting regular expression
     * @param {string[]} equivalents - Array returned from the
     * RegEx.extractEquivalents function
     * @param {boolean} includeNonDiacritics - value of the nonDiacritics option
     * @return {string} - string containing each diacritic or non-diacritic,
     * as determined by the option, separated by a vertical bar. Or, a single
     * equivalent if no other equivalents are found, or if the
     * includeEquivalents is false
     */
    static saveEquivalents(equivalents, includeNonDiacritics) {
        if(equivalents.length > 1) {
            return includeNonDiacritics ?
                `(${equivalents.join("|")})` :
                // if nonDiacritics is false; combine all matching
                // diacritics after processing; This adds a trailing
                // pipe that must be removed!!
                `${equivalents.join("|")}|`;
        }
        return equivalents[0];
    }

    /**
     * Determine the length of a diacritic match & replace it with an the value
     * from the options object replaceDiacritics followed by a matching
     * length of surrogates; for example: "\u00DC" will be replaced by "\\S"
     * and "e\u0301" will be replaced with "\\S{1,2}"
     * @param {string} character - the current character being processed from
     * the original string; it may have a length if it is a diacritic with
     * surrogates
     * @param {string[]} equivalents - Array returned from the
     * RegEx.extractEquivalents function
     * @param {regex~createRegExpOptions} opts - Options object
     * @return {string} - resulting string with any diacritics replaced
     */
    static ignoreDiacritics(character, equivalents, opts) {
        let result = opts.replaceDiacritic,
            indx = character.length;
        if(opts.includeEquivalents) {
            // find longest equivalent
            indx = 1;
            equivalents.forEach(equivalent => {
                indx = Math.max(indx, equivalent.length);
            });
        }
        // only use the {x,y} quantifier if the replacement is set to "\\S"
        if(opts.replaceDiacritic === "\\S") {
            // "e\u0301" will be replaced with "\\S{1,2}"
            result = opts.replaceDiacritic +
                (indx > 1 ? `{1,${indx}}` : "");
        }
        return result;
    }

    /**
     * @typedef regex~processCharacterVariables
     * @type {object}
     * @property {regex~createRegExpOptions} options
     * @property {object} data - All data for each diacritic found or error
     * message as returned by the Util.getDiacritics function
     * @property {array} matches - matches from the original string, as found
     * by using a .match() with a regular expression from Util.findDiacritics
     */
    /**
     * Process each character in the given string. Handle both diacritics &
     * non diacritics based on the user setting
     * @param {regex~processCharacterVariables} vars
     * @param {string} character - the current character being processed from
     * the original string; it may have a length if it is a diacritic with
     * surrogates
     * @return {string} resulting character processed for the final RegExp
     */
    static processCharacter(vars, character) {
        let result = "";
        const isDiacritic = vars.matches.includes(character),
            includeNonDiacritics = vars.options.nonDiacritics,
            equivalents = vars.options.includeEquivalents ?
                RegEx.extractEquivalents(
                    vars,
                    character.normalize("NFKC")
                ) :
                [character];
        if(vars.options.diacritics && isDiacritic) {
            result = RegEx.saveEquivalents(equivalents, includeNonDiacritics);
        } else if(includeNonDiacritics) {
            result = vars.matches.includes(character) ?
                // ignore diacritics
                RegEx.ignoreDiacritics(character, equivalents, vars.options) :
                character;
        }
        return result;
    }

    /**
     * Extract raw equivalents data for use in regular expression & placeholders
     * @param {regex~processCharacterVariables} vars
     * @param  {string} diacritic - the diacritic character to target
     * @return {array} - array containing unique diacritic equivalents
     * @access private
     */
    static extractEquivalents(vars, diacritic) {
        let result = [],
            loop = obj => {
                obj.equivalents.forEach(equivalent => {
                    result.push(equivalent.raw);
                });
            };
        Util.extractData(vars.data, "data", params => {
            let key = params.diacritic;
            if(diacritic === key) {
                if (vars.options.caseSensitive) {
                    loop(params.data[key]);
                } else {
                    loop(params.data[key.toLowerCase()]);
                    loop(params.data[key.toUpperCase()]);
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
     * Process final RegExp
     * @param {string[]} regexp - array of the final regular expression parts
     * @param {regex~createRegExpOptions} [options] - Options object
     * @return {string} - RegExp string, immediately before using new RegExp
     */
    static finalizeRegExp(regexp, options) {
        let joiner = regexp.length && options.ignoreJoiners ?
            "[\u00ad|\u200b|\u200c|\u200d]?" : "";
        if(options.diacritics && !options.nonDiacritics) {
            // only diacritics are processed, wrap them all
            regexp.unshift("(");
            // remove trailing pipe
            regexp[regexp.length - 1] = regexp[regexp.length - 1]
                .replace(/\|$/, "");
            regexp.push(")");
        }
        if(typeof options.done === "function") {
            regexp = options.done(regexp, joiner);
        }
        // just in case...
        if(Array.isArray(regexp)) {
            regexp = regexp.join(joiner);
        }
        return regexp;
    }
}

module.exports = RegEx;
