/*!***************************************************
 * node-diacritics-transliterator transliterate tests
 * http://diacritics.io/
 * Copyright (c) 2016-2017, Julian Motz & Rob Garrison
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
import test from "ava";
import d from "../index.js";

require("fs").readFile("test/settings.json", "utf8", (err, data) => {
    if(err) {
        throw err;
    }
    d.debug = JSON.parse(data);
});

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
});
