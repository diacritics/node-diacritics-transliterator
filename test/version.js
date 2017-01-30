/*!***************************************************
 * node-diacritics-transliterator version tests
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const test = require("ava"),
    d = require("../index.js");

function setVersion(value) {
    d.version = value;
    return d.version;
}

test("Set & Get API version", t => {
    const v = d.version;
    t.is(setVersion(-1), v);
    t.is(setVersion(0), v);
    t.is(setVersion(9999), v);
    t.is(setVersion("x"), v);
    t.is(setVersion("v0.1"), v);
    t.is(setVersion("9999"), v);
    t.is(setVersion(null), v);
    t.is(setVersion(undefined), v);
    t.is(d.version, v);
});
