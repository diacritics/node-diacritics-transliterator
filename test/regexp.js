/*!***************************************************
 * node-diacritics-transliterator createRegExp tests
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

const regexpTests = [{
    // default settings; no diacritics
    regexp: "Test",
    options: {},
    tests: [
        [ "false", "T\u00E9st", "defaults; no diacritic matches" ],
        [ "false", "Te\u0301st", "defaults; no diacritic combiner matches" ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    // default settings
    regexp: "T\u00E9st",
    options: {}, // regexp options
    tests: [
        // ava test (true or false), .test(compare string), test description
        [ "true", "T\u00E9st", "defaults; diacritic" ],
        [ "true", "Te\u0301st", "defaults; base + combining diacritic" ],
        [ "false", "T\u00C9st", "defaults; don't match upper case diacritic" ],
        [
            "false",
            "TE\u0301st",
            "defaults; don't match upper case base + combining diacritic"
        ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    // ignore diacritics
    regexp: "T\u00E9st",
    options: { diacritics: false },
    tests: [
        [ "true", "T\u00E9st", "diacritics:false; diacritic" ],
        [
            "true",
            "Te\u0301st",
            "diacritics:false; base + combining diacritic"
        ],
        [
            "true",
            "Txst",
            "diacritics:false; works with any character"
        ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    // ignore diacritics & replaceDiacritic set to match anything
    regexp: "T\u00E9st",
    options: {
        diacritics: false,
        replaceDiacritic: ".+" // match everything, including whitespace
    },
    tests: [
        [ "true", "T\u00E9st", "diacritics:false&replaceDiacritic; original" ],
        [ "true", "Txst", "diacritics:false&replaceDiacritic; match x" ],
        [ "true", "T st", "diacritics:false&replaceDiacritic; match space" ],
        [
            "false",
            "Tst",
            "diacritics:false&replaceDiacritic; don't match removed character"
        ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    // ignore non-diacritics
    regexp: "T\u00E9st \u00FC",
    options: { nonDiacritics: false },
    tests: [
        [ "true", "T\u00E9st or Tr\u00FCst", "nonDiacritics:false; diacritic" ],
        [
            "true",
            "Te\u0301st or Tru\u0308st",
            "nonDiacritics:false; base + combining diacritic"
        ],
        [
            "true",
            "\u00E9 or \u00FC",
            "nonDiacritics:false; matches only the diacritic"
        ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    // ignore everything! regex becomes /(?:)/gu
    regexp: "T\u00E9st",
    options: { diacritics: false, nonDiacritics: false },
    tests: [
        [
            "true",
            "Anything",
            "diacritics:false,nonDiacritics:false; match everything!"
        ]
    ]
}, {
    // ignore equivalents
    regexp: "T\u00E9st",
    options: { includeEquivalents: false },
    tests: [
        [ "true", "T\u00E9st", "includeEquivalents:false; diacritic" ],
        [
            "false",
            "Te\u0301st",
            "includeEquivalents:false; base + combining diacritic"
        ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    // case insensitive
    regexp: "T\u00E9st",
    options: { caseSensitive: false },
    tests: [
        [ "true", "T\u00E9st", "caseSensitive:false; Lower case diacritic" ],
        [
            "true",
            "Te\u0301st",
            "caseSensitive:false; Lower case base + combining diacritic"
        ],
        [ "true", "T\u00C9st", "caseSensitive:false; Upper case diacritic" ],
        [
            "true",
            "TE\u0301st",
            "caseSensitive:false; Upper case base + combining diacritic"
        ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    /* Add joiners
     * \u00ad = soft hyphen
     * \u200b = zero-width space
     * \u200c = zero-width non-joiner
     * \u200d = zero-width joiner
     */
    regexp: "T\u00E9st",
    options: { ignoreJoiners: true },
    tests: [
        [ "true", "T\u00E9\u00adst", "ignoreJoiners:true; ignore soft hyphen" ],
        [
            "true",
            "Te\u0301s\u200bt",
            "ignoreJoiners:true; ignore zero-width space"
        ],
        [
            "true",
            "T\u200c\u00E9st",
            "ignoreJoiners:true; ignore zero-width non-joiner"
        ],
        [
            "true",
            "T\u200de\u0301\u200ds\u200dt",
            "ignoreJoiners:true; zero-width joiner between every letter"
        ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    // Regular expression flags
    regexp: "T\u00E9st",
    options: { flags: "giu" },
    tests: [
        [ "true", "T\u00E9st", "flags:'giu'; Lower case diacritic" ],
        [
            "true",
            "Te\u0301st",
            "flags:'giu'; Lower case base + combining diacritic"
        ],
        [ "true", "T\u00C9st", "flags:'giu'; Upper case diacritic" ],
        [
            "true",
            "TE\u0301st",
            "flags:'giu'; Upper case base + combining diacritic"
        ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    // each callback
    regexp: "a tést",
    options: {
        each: function(character, result) {
            // Replace space with whitespace character diacritic
            return character === " " ? "\\s" : result;
        }
    },
    tests: [
        // regular expression whitespace matches:
        // \f\n\r\t\v\u00a0\u1680\u180e\u2000-\u200a
        // \u2028\u2029\u202f\u205f\u3000\ufeff
        [ "true", "a t\u00E9st", "each; match space" ],
        [ "true", "a\tte\u0301st", "each; match tab" ],
        [ "true", "a\nte\u0301st", "each; match carriage return" ],
        [ "true", "a\rte\u0301st", "each; match line feed" ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}, {
    // finalize callback
    regexp: "tést",
    options: {
        done: function(array, joiner) {
            // match whole words only
            array.unshift("\\b");
            array.push("\\b");
            return array.join(joiner);
        }
    },
    tests: [
        [ "true", "t\u00E9st", "done; match whole word" ],
        [ "true", "te\u0301st", "done; match whole word" ],
        [ "false", "ste\u0301st", "done; no internal match" ],
        [ "false", "t\u00E9sts", "done; no internal match" ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}];

test("Create RegExp", t => {
    let regexp;
    regexpTests.forEach(tst => {
        regexp = d.createRegExp(tst.regexp, tst.options);
        tst.tests.forEach(item => {
            // [ test type, compare string, description ]
            // if using t[item[0]], failed tests don't show values
            if(item[0] === "true") {
                t.true(regexp.test(item[1]), item[2]);
            } else {
                t.false(regexp.test(item[1]), item[2]);
            }
            // reset lastIndex or next test fails
            // see http://stackoverflow.com/q/1520800/145346
            regexp.lastIndex = 0;
        });
    });
    // invalid string
    t.deepEqual(d.createRegExp(1234), {
        message: "Error: Invalid input string"
    });
});
