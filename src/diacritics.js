/*!***************************************************
 * node-diacritics-transliterator core & cache
 * Diacritic transliteration tools using diacritics.io
 * API from http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const currentAPIVersion = 1,
    databaseURL = "http://api.diacritics.io/",
    // if renaming any of the below values, also update the "tree" variable
    // in the placeholder.js file
    validFilters = [
        "alphabet",
        "continent",
        "country",
        "language",
        "variant",
        "base",
        "decompose",
        "diacritic"
    ];

/**
 * core diacritics module
 */
class Diacritics {
    /**
     * @param {string} version - Diacritics database current version
     */
    constructor(version = `v${currentAPIVersion}`) {
        /**
         * Diacritics database current version
         * @type {string}
         * @access protected
         */
        this._version = version;
    }

    /**
     * Get currently set API version
     * @return {string} - Major version formatted as "v#" where "#" is the
     * version number
     * @example
     * require("diacritics-transliterator").version;
     * @access public
     */
    get version() {
        return this._version;
    }

    /**
     * Set API version
     * @param  {(string|number)} version - All non-digits & decimal values will
     * be ignored
     * @return {string} - Version formatted as "v#" where "#" is the version
     * number
     * @example
     * require("diacritics-transliterator").version = "v1";
     * @access public
     * @todo add method to retrieve current
     */
    set version(version) {
        version = parseInt(
            (version || "").toString().replace(/[^\d.]/g, ""),
            10
        );
        if(version > 0 && version <= currentAPIVersion) {
            this._version = `v${version}`;
        }
        return `v${this._version}`;
    }
}

let exporting = new Diacritics();
exporting.databaseURL = databaseURL;
exporting.validFilters = validFilters;
module.exports = exporting;
