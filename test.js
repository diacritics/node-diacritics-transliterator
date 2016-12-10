import test from "ava";
import d from "./";
import request from "./node_modules/sync-request";

// uncomment out next line to debug this script
// d.debug = true;

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
                "ñ": diacritics.es.es.data["ñ"]
            }
        },
        de: {
            metadata: diacritics.de.de.metadata,
            data: {
                "ß": diacritics.de.de.data["ß"]
            }
        }
    };
    t.deepEqual(d.getDiacritics("abcñ-ß123"), result);
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
