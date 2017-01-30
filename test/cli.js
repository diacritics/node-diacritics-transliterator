/*!***************************************************
 * node-diacritics-transliterator cli tests
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const test = require("ava"),
    ex = require("execa");

test("Testing formatUnicode cli", async t => {
    const {stdout} = await ex(
        "./cli.js",
        ["\\u00e9\\u00c9A\\u0301", "--fu"]
    );
    t.is(stdout, "éÉÁ");
});
test("Testing transliterate cli", async t => {
    const {stdout} = await ex(
        "./cli.js",
        ["¿Te gustan los diacríticos?", "--tr", "-v=es", "-t=base"]
    );
    t.is(stdout, "?Te gustan los diacriticos?");
});
test("Testing createRegExp cli", async t => {
    const {stdout} = await ex(
        "./cli.js",
        ["Tést", "--cr", "--no-c"]
    );
    t.is(stdout, "/T(\\u00E9|e\\u0301|\\u00C9|E\\u0301)st/gu");
});
test("Testing replacePlaceholder cli; no options", async t => {
    let {stdout} = await ex(
        "./cli.js",
        ["u='<% diacritics:base=u;equivalents.raw %>'", "--rp"]
    );
    // \u00FC, u\u0308, \u00FA, u\u0301
    t.is(stdout, "u='ü, ü, ú, ú'");
});
test("Testing replacePlaceholder cli; change joiner", async t => {
    let {stdout} = await ex(
        "./cli.js",
        ["u='<% diacritics:base=u;equivalents.raw %>'", "--rp", "--j=+"]
    );
    t.is(stdout, "u='ü+ü+ú+ú'");
});
