/*!***************************************************
 * node-diacritics-transliterator basic tests
 * http://diacritics.io/
 * Copyright (c) 2016–2017, Julian Motz & Rob Garrison
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
    t.deepEqual(d.getLanguage(1234), {
        message: "Error: Invalid input string"
    });
});

test("Get Variant", t => {
    t.deepEqual(d.getVariant("de"), diacritics.de);
    t.deepEqual(d.getVariant("es"), diacritics.es);
    t.deepEqual(d.getVariant("test"), {
        message: "Variant 'test' was not found"
    });
    t.deepEqual(d.getVariant([1,2,3,4]), {
        message: "Error: Invalid input string"
    });
});

test("Get Continent", t => {
    // Antarctica... this may change once more data is added
    t.deepEqual(d.getContinent("an"), diacritics.es);
    t.deepEqual(d.getContinent("test"), {
        message: "Continent 'test' was not found"
    });
    t.deepEqual(d.getContinent(()=>console.log(123)), {
        message: "Error: Invalid input string"
    });
});

test("Get Alphabet", t => {
    // only compare one variant, or things could get messy once the database
    // gets bigger
    t.deepEqual(d.getAlphabet("latn").es, diacritics.es.es);
    t.deepEqual(d.getAlphabet("test"), {
        message: "Alphabet 'test' was not found"
    });
    t.deepEqual(d.getAlphabet({"a":true}), {
        message: "Error: Invalid input string"
    });
});

test("Format unicode", t => {
    t.is(d.formatUnicode("T\\u00E9st"), "Tést");
    t.is(d.formatUnicode("\\u00C4 Te\\u0301st"), "Ä Tést");

    // invalid inputs
    t.deepEqual(d.formatUnicode(1234), {
        message: "Error: Invalid input string"
    });
    t.deepEqual(d.formatUnicode([0,1,2,3,4]), {
        message: "Error: Invalid input string"
    });
    t.deepEqual(d.formatUnicode({a:"b",c:"d"}), {
        message: "Error: Invalid input string"
    });
    t.deepEqual(d.formatUnicode(), {
        message: "Error: Invalid input string"
    });
    t.deepEqual(d.formatUnicode(()=>console.log(123)), {
        message: "Error: Invalid input string"
    });
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
    t.deepEqual(d.getDiacritics(1234), {
        message: "Error: Invalid input string"
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
    t.deepEqual(d.getBase(1234), {
        message: "Error: Invalid input; use a string or array"
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
    t.deepEqual(d.getDecompose(1234), {
        message: "Error: Invalid input; use a string or array"
    });
});
