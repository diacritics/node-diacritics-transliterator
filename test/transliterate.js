/*!***************************************************
 * node-diacritics-transliterator transliterate tests
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const test = require("ava"),
    d = require("../index.js");

test("Transliterate", t => {
    t.is(d.transliterate("¿abcñ-ß123?", "decompose", "de"), "¿abcñ-ss123?");
    // base of ß is still ß
    t.is(d.transliterate("¿abcñ-ß123?", "base", "de"), "¿abcñ-ß123?");
    t.is(d.transliterate("¿abcñ-ß123?", "decompose", "es"), "?abcn-ß123?");
    t.is(d.transliterate("¿abcñ-ß123?", "base", "es"), "?abcn-ß123?");
    t.is(d.transliterate("¿abcñ-ß123?", "decompose"), "?abcn-ss123?");
    // the next two tests have equivalent results
    t.is(d.transliterate("¿abcñ-ß123?", "base"), "?abcn-ß123?");
    t.is(d.transliterate("¿abcñ-ß123?"), "?abcn-ß123?");
    // no variant found, return original string
    t.is(d.transliterate("¿abcñ-ß123?", "base", "test"), "¿abcñ-ß123?");

    // invalid string
    let error = t.throws(() => {
        d.transliterate(1234, "base", "de");
    }, Error);
    t.is(error.message, "Error: Invalid input string");

    // invalid type, throw error
    function invalidType(type, languageVariant) {
        error = t.throws(() => {
            d.transliterate("¿abcñ-ß123?", type, languageVariant);
        }, Error);
        t.is(
            error.message,
            "Transliterate Error: Invalid 'type' value " +
            "(use 'base' or 'decompose')"
        );
    }
    invalidType("test", "de");
    invalidType("test", "test");
});
