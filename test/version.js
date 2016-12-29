/*!***************************************************
 * node-diacritics-transliterator version tests
 * http://diacritics.io/
 * Copyright (c) 2016–2017, Julian Motz & Rob Garrison
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

test("Set & Get API version", t => {
    const max = d.maxVersion;
    // bump max version for testing
    d.maxVersion = 6;
    t.is(d.setVersion("2"), "v2");
    t.is(d.setVersion(3.4), "v3");
    t.is(d.setVersion("x4"), "v4");
    t.is(d.setVersion("5.675"), "v5");
    t.is(d.setVersion("x"), "v5");
    t.is(d.setVersion("v0.1"), "v5");
    t.is(d.setVersion("9999"), "v5");
    t.is(d.setVersion(null), "v5");
    t.is(d.setVersion(undefined), "v5");
    t.is(d.getVersion(), "v5");
    t.is(d.setVersion(max), "v" + max);
    d.maxVersion = max;
});

test("Get Language", t => {
    // make sure an incorrect user set version is handled
    d.currentVersion = "v999";
    const error = d.getLanguage("test");
    d.currentVersion = "v" + d.maxVersion;
    t.truthy(error.message.match("error: 404"));
});
