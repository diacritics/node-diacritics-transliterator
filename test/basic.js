/*!***************************************************
 * node-diacritics-transliterator basic tests
 * http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
"use strict";

const test = require("ava"),
    request = require("sync-request"),
    d = require("../index.js"),
    // get current diacritics.json directly
    dist = "https://raw.githubusercontent.com/diacritics/database/dist/" +
        d.version + "/diacritics.json",
    response = request("GET", dist),
    data = response.statusCode === 200 ?
        JSON.parse(response.getBody().toString()) :
        {},
    invalidInput = "Error: Invalid input string";

test("Get Language", t => {
    let error1, error2;
    // language (only), set as an array
    const result = {
        es: {
            metadata: data.es.es.metadata,
            data: data.es.es.data
        },
        de: {
            metadata: data.de.de.metadata,
            data: data.de.de.data
        }
    };
    t.deepEqual(d.getData({ language: "German" }), data.de);
    t.deepEqual(d.getData({ language: "es" }), data.es);
    t.deepEqual(d.getData({ language: ["German", "Spanish"] }), result);
    t.deepEqual(d.getData({
        language: ["German", "Spanish"],
        country: ["de", "ES"]
    }), result);
    // errors
    error1 = t.throws(() => {
        d.getData({ language: "test" });
    }, Error);
    t.is(error1.message, "Error: Language 'test' was not found");
    error2 = t.throws(() => {
        d.getData({ language: 1234 });
    }, Error);
    t.is(error2.message, invalidInput);
});

test("Get Variant", t => {
    t.deepEqual(d.getData({ variant: "de" }), data.de);
    t.deepEqual(d.getData({ variant: "es" }), data.es);
    // errors
    let error = t.throws(() => {
        d.getData({ variant: "test" });
    }, Error);
    t.is(error.message, "Error: Variant 'test' was not found");
    error = t.throws(() => {
        d.getData({ variant: [1,2,3,4] });
    }, Error);
    t.is(error.message, invalidInput);
});

test("Get Continent", t => {
    // Antarctica... this may change once more data is added
    t.deepEqual(d.getData({ continent: "an" }), data.es);
    // errors
    let error = t.throws(() => {
        d.getData({ continent: "test" });
    }, Error);
    t.is(error.message, "Error: Continent 'test' was not found");
    error = t.throws(() => {
        d.getData({ continent: () => console.log(123) });
    }, Error);
    t.is(error.message, invalidInput);
});

test("Get Alphabet", t => {
    // only compare one variant, or things could get messy once the database
    // gets bigger
    t.deepEqual(d.getData({ alphabet: "latn" }).es, data.es.es);
    // errors
    let error = t.throws(() => {
        d.getData({ alphabet: "test" });
    }, Error);
    t.is(error.message, "Error: Alphabet 'test' was not found");
    error = t.throws(() => {
        d.getData({ alphabet: {"a":true} });
    }, Error);
    t.is(error.message, invalidInput);
});

test("Format unicode", t => {
    t.is(d.formatUnicode("T\\u00E9st"), "Tést");
    t.is(d.formatUnicode("\\u00C4 Te\\u0301st"), "Ä Tést");

    // invalid input types
    let error = t.throws(() => {
        d.formatUnicode(1234);
    }, Error);
    t.is(error.message, invalidInput);

    error = t.throws(() => {
        d.formatUnicode([0,1,2,3,4]);
    }, Error);
    t.is(error.message, invalidInput);

    error = t.throws(() => {
        d.formatUnicode({a:"b",c:"d"});
    }, Error);
    t.is(error.message, invalidInput);

    error = t.throws(() => {
        d.formatUnicode();
    }, Error);
    t.is(error.message, invalidInput);

    error = t.throws(() => {
        d.formatUnicode(() => console.log(123));
    }, Error);
    t.is(error.message, invalidInput);
});

test("Get Diacritics", t => {
    // only compare a unique diacritics, or things could get messy once the
    // database gets bigger
    const result = {
        es: {
            metadata: data.es.es.metadata,
            data: {
                "ñ": data.es.es.data["ñ"],
                "¿": data.es.es.data["¿"]
            }
        },
        de: {
            metadata: data.de.de.metadata,
            data: {
                "ß": data.de.de.data["ß"]
            }
        }
    };
    t.deepEqual(d.getDiacritics("¿abcñ-ß123"), result);
    t.deepEqual(d.getDiacritics("test"), {
        message: "No diacritics found"
    });
    // invalid input
    let error = t.throws(() => {
        d.getDiacritics(1234);
    }, Error);
    t.is(error.message, invalidInput);
});

test("Get Base", t => {
    // only compare a unique base, or things could get messy once the
    // database gets bigger
    const result = {
        de: {
            metadata: data.de.de.metadata,
            data: {
                "ß": data.de.de.data["ß"]
            }
        }
    };
    // getData will accept a single base string, or array
    t.deepEqual(d.getData({ base: "ß" }), result);

    let error = t.throws(() => {
        d.getData({ base: ["&"] });
    }, Error);
    t.is(error.message, "Error: Base character '&' was not found");
    error = t.throws(() => {
        d.getData({ base: 1234 });
    }, Error);
    t.is(error.message, invalidInput);
});

test("Get Decompose", t => {
    // only compare a unique base, or things could get messy once the
    // database gets bigger
    const result = {
        de: {
            metadata: data.de.de.metadata,
            data: {
                "ß": data.de.de.data["ß"]
            }
        }
    };
    // getData will accept a single string, or array
    t.deepEqual(d.getData({ decompose: "ss" }), result);

    let error = t.throws(() => {
        d.getData({ decompose: ["ss", "&"] });
    }, Error);
    t.is(error.message, "Error: Decompose value '&' was not found");
    error = t.throws(() => {
        d.getData({ decompose: 1234 });
    }, Error);
    t.is(error.message, invalidInput);
});
