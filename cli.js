#!/usr/bin/env node
/*!***************************************************
 * node-diacritics-transliterator cli
 * Diacritic transliteration tools using diacritics.io
 * API from http://api.diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";
const meow = require("meow"),
    d = require("./index.js"),
    // specific function help text file
    help = require("./src/cli-help.js"),
    cli = meow(help.overall),
    // cli.input is an array of strings
    // diacritics "test" "test2" => cli.input = ["test", "test2"]
    input = (cli.input || []).join(" "),
    flags = cli.flags,
    errorMsg = "function requires an input string",
    xref = {
        fu: flags.formatUnicode      || flags.fu ? "fu" : "",
        tr: flags.transliterate      || flags.tr ? "tr" : "",
        cr: flags.createRegExp       || flags.cr ? "cr" : "",
        rp: flags.replacePlaceholder || flags.rp ? "rp" : ""
    };

let options = {},
    result = "";

// help overrides all other settings
if(flags.h) {
    result = Object.keys(xref).find(el => {
        return xref[el] !== "";
    });
    // if no result, show overall help text
    return console.log(help[xref[result] || "overall"]);
}

// formatUnicode
if(xref.fu) {
    if(input.trim() !== "") {
        console.log(d.formatUnicode(input));
        process.exit();
    }
    console.log(help.fu);
    console.error(`\n  **Diacritics formatUnicode ${errorMsg}**`);
    process.exit(1);
}

// transliterate
if(xref.tr) {
    if(input.trim() !== "") {
        result = d.transliterate(
            input,
            // optional type (base or decompose)
            flags.t || flags.type || "base",
            flags.v || flags.variant || "" // optional variant
        );
        console.log(result);
        process.exit();
    }
    console.log(help.tr);
    console.error(`\n  **Diacritics transliterate ${errorMsg}**`);
    process.exit(1);
}

// createRegExp
if(xref.cr) {
    // "no-" prefix handled by meow
    options.caseSensitive = setOpt(flags.c, flags.caseSensitive, true);
    options.diacritics = setOpt(flags.d, flags.diacritics, true);
    options.flags = setOpt(flags.f, flags.flags, "gu");
    options.ignoreJoiners = setOpt(flags.j, flags.ignoreJoiners, false);
    options.includeEquivalents = setOpt(
        flags.e,
        flags.includeEquivalents,
        true
    );
    options.nonDiacritics = setOpt(flags.n, flags.nonDiacritics, true);
    options.replaceDiacritic = setOpt(flags.r, flags.replaceDiacritic, "\\S");
    if(input.trim() !== "") {
        result = d.createRegExp(input, options);
        console.log(decodeUnicode(result.toString()));
        process.exit();
    }
    console.log(help.cr);
    console.error(`\n  **Diacritics createRegExp ${errorMsg}**`);
    process.exit(1);
}

// replacePlaceholder
if(xref.rp) {
    // "no-" prefix handled by meow
    options.placeholder = setOpt(
        flags.p,
        flags.placeholder,
        "<% diacritics: {data} %>"
    );
    options.exclude = (
        setOpt(flags.e, flags.exclude, "") || ""
    ).split(/\s*,\s*/);
    options.joiner = setOpt(flags.j, flags.joiner, ", ");
    if(input.trim() !== "") {
        console.log(d.replacePlaceholder(input, options));
        process.exit();
    }
    console.log(help.rp);
    console.error(`\n  **Diacritics replacePlaceholder ${errorMsg}**`);
    process.exit(1);
}

console.log(help.overall);

// helper functions
function setOpt(value1, value2, dflt) {
    let result = typeof value1 !== "undefined" ? value1 : value2;
    return typeof result !== "undefined" ? result : dflt;
}
// show RegExp joiners in the console
function debugFormat(val) {
    // return ignore leading zero if hex <= FFFF
    let size = val < 0x10000 ? -4 : -5;
    return "\\u" + ("00000" + val.toString(16)).toUpperCase().slice(size);
}
function decodeUnicode(str) {
    const len = str.length;
    let chr, low,
        result = [],
        indx = 0;
    while(indx < len) {
        chr = str.charCodeAt(indx++);
        if(chr > 0x0020 && chr < 0x007F) {
            // plain character
            result.push(str.charAt(indx - 1));
        } else if(chr >= 0xD800 && chr <= 0xDBFF) {
            // surrogate pair
            low = str.charCodeAt(indx++);
            result.push(
                debugFormat(0x10000 + ((chr - 0xD800) << 10) | (low - 0xDC00))
            );
        } else {
            // Basic Multilingual Plane (BMP) character
            result.push(debugFormat(chr));
        }
    }
    return result.join("");
}
