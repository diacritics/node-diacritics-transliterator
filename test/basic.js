/*!***************************************************
 * node-diacritics-transliterator basic tests
 * http://diacritics.io/
 * Copyright (c) 2016-2017, Julian Motz & Rob Garrison
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
import test from "ava";
import d from "../index.js";
import request from "../node_modules/sync-request";

require("fs").readFile("test/settings.json", "utf8", (err, data) => {
    if(err) {
        throw err;
    }
    d.debug = JSON.parse(data);
});

// get current diacritics.json directly
const dist = "https://raw.githubusercontent.com/diacritics/database/dist/v" +
    d.maxVersion + "/diacritics.json",
    response = request("GET", dist),
    diacritics = response.statusCode === 200 ?
        JSON.parse(response.getBody().toString()) :
        {};

test("Get Language", t => {
    t.deepEqual(d.getLanguage("German"), diacritics.de);
    t.deepEqual(d.getLanguage("es"), diacritics.es);
    t.deepEqual(d.getLanguage("test"), {
        message: "Language 'test' was not found"
    });
});

test("Get Variant", t => {
    t.deepEqual(d.getVariant("de"), diacritics.de);
    t.deepEqual(d.getVariant("es"), diacritics.es);
    t.deepEqual(d.getVariant("test"), {
        message: "Variant 'test' was not found"
    });
});

test("Get Continent", t => {
    // Antarctica... this may change once more data is added
    t.deepEqual(d.getContinent("an"), diacritics.es);
    t.deepEqual(d.getContinent("test"), {
        message: "Continent 'test' was not found"
    });
});

test("Get Alphabet", t => {
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
