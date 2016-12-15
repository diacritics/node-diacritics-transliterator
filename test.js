import test from "ava";
import d from "./";
import request from "./node_modules/sync-request";

// change boolean to debug this script
d.debug = {
    server: false, // log server & cache interactions
    regexp: false, // log module RegExp creation
    regexpTests: false // log RegExp tests
};

// get current diacritics.json directly
const dist = "https://raw.githubusercontent.com/diacritics/database/dist/v" +
    d.maxVersion + "/diacritics.json",
    response = request("GET", dist),
    diacritics = response.statusCode === 200 ?
        JSON.parse(response.getBody().toString()) :
        {};

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
    t.is(d.setVersion("v1"), "v1");
    d.maxVersion = max;
});

test("Get Language", t => {
    t.deepEqual(d.getLanguage("German"), diacritics.de);
    t.deepEqual(d.getLanguage("test"), {
        message: "Language 'test' was not found"
    });
    // make sure user set version is handled
    d.currentVersion = "v999";
    const error = d.getLanguage("test");
    d.currentVersion = "v" + d.maxVersion;
    t.truthy(error.message.match("error: 404"));
});

test("Get Variant", t => {
    // ensure current version is set, as all ava tests are run in parallel
    d.currentVersion = "v" + d.maxVersion;
    t.deepEqual(d.getVariant("de"), diacritics.de);
    t.deepEqual(d.getVariant("test"), {
        message: "Variant 'test' was not found"
    });
});

test("Get Continent", t => {
    // ensure current version is set, as all ava tests are run in parallel
    d.currentVersion = "v" + d.maxVersion;
    // Antarctica... this may change once more data is added
    t.deepEqual(d.getContinent("an"), diacritics.es);
    t.deepEqual(d.getContinent("test"), {
        message: "Continent 'test' was not found"
    });
});

test("Get Alphabet", t => {
    // ensure current version is set, as all ava tests are run in parallel
    d.currentVersion = "v" + d.maxVersion;
    // only compare one variant, or things could get messy once the database
    // gets bigger
    t.deepEqual(d.getAlphabet("latn").es, diacritics.es.es);
    t.deepEqual(d.getAlphabet("test"), {
        message: "Alphabet 'test' was not found"
    });
});

test("Format unicode", t => {
    t.is(d.formatUnicode("T\\u00E9st"), "Tést");
    t.is(d.formatUnicode("\\u00C4 Te\\u0301st"), "Ä Tést");
});

test("Get Diacritics", t => {
    // ensure current version is set, as all ava tests are run in parallel
    d.currentVersion = "v" + d.maxVersion;
    // only compare a unique diacritics, or things could get messy once the
    // database gets bigger
    const result = {
        es: {
            metadata: diacritics.es.es.metadata,
            data: {
                "ñ": diacritics.es.es.data["ñ"],
                "¿": diacritics.es.es.data["¿"]
            }
        },
        de: {
            metadata: diacritics.de.de.metadata,
            data: {
                "ß": diacritics.de.de.data["ß"]
            }
        }
    };
    t.deepEqual(d.getDiacritics("¿abcñ-ß123"), result);
    t.deepEqual(d.getDiacritics("test"), {
        message: "No diacritics found"
    });
});

test("Get Base", t => {
    // ensure current version is set, as all ava tests are run in parallel
    d.currentVersion = "v" + d.maxVersion;
    // only compare a unique base, or things could get messy once the database
    // gets bigger
    const result = {
        de: {
            metadata: diacritics.de.de.metadata,
            data: {
                "ß": diacritics.de.de.data["ß"]
            }
        }
    };
    // getBase will accept a single base string, or array
    t.deepEqual(d.getBase("ß"), result);
    t.deepEqual(d.getBase(["&"]), {
        message: "No matching bases found"
    });
});

test("Get Decompose", t => {
    // ensure current version is set, as all ava tests are run in parallel
    d.currentVersion = "v" + d.maxVersion;
    // only compare a unique base, or things could get messy once the database
    // gets bigger
    const result = {
        de: {
            metadata: diacritics.de.de.metadata,
            data: {
                "ß": diacritics.de.de.data["ß"]
            }
        }
    };
    // getBase will accept a single base string, or array
    t.deepEqual(d.getDecompose("ss"), result);
    t.deepEqual(d.getDecompose(["&", "test"]), {
        message: "No matching decomposes found"
    });
});

test("Transliterate", t => {
    // ensure current version is set, as all ava tests are run in parallel
    d.currentVersion = "v" + d.maxVersion;
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

const regexpTests = [{
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
        each: function(character, result, data, index) {
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
        finalize: function(array, joiner) {
            // match whole words only
            array.unshift("\\b");
            array.push("\\b");
            return array.join(joiner);
        }
    },
    tests: [
        [ "true", "t\u00E9st", "finalize; match whole word" ],
        [ "true", "te\u0301st", "finalize; match whole word" ],
        [ "false", "ste\u0301st", "finalize; no internal match" ],
        [ "false", "t\u00E9sts", "finalize; no internal match" ],
        [ "false", "1234", "defaults; don't match everything"]
    ]
}];

test("Create RegExp", t => {
    // ensure current version is set, as all ava tests are run in parallel
    d.currentVersion = "v" + d.maxVersion;
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
            if (d.debug.regexpTests) {
              console.log(
                  `${decodeUnicode(regexp.toString())}` +
                  `.test("${decodeUnicode(item[1])}")`,
                  item[2]);
            }
            // reset lastIndex or next test fails
            // see http://stackoverflow.com/q/1520800/145346
            regexp.lastIndex = 0;
        });
    });
});

// used for debugging
function debugFormat(val) {
    // return ignore leading zero if hex <= FFFF
    let size = val < 0x10000 ? -4 : -5;
    return "\\u" + ("00000" + val.toString(16)).toUpperCase().slice(size);
};
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
