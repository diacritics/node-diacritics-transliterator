/*!***************************************************
 * node-diacritics-transliterator placeholder tests
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

const testPlaceholder = [{
    string: "u:'<% diacritics:  %>'",
    result: "u:'<% diacritics:  %>'",
    name: "defaults; invalid no placeholder data"
}, {
    string: "u:'<% diacritics: <% diacritics: base=u;equivalents.html_hex %>'",
    result: "u:'<% diacritics: <% diacritics: base=u;equivalents.html_hex %>'",
    name: "defaults; invalid double placeholder"
}, {
    string: "u:'<% diacriticz: base=u;equivalents.html_hex %>'",
    result: "u:'<% diacriticz: base=u;equivalents.html_hex %>'",
    name: "defaults; invalid placeholder"
}, {
    string: "u:'<% diacritics: bas3=u;equivalents.html_hex %>'",
    result: "u:'<% diacritics: bas3=u;equivalents.html_hex %>'",
    name: "defaults; invalid api filter"
}, {
    string: "u:'<% diacritics: base=u;equivalents.html_h3x %>'",
    result: "u:'<% diacritics: base=u;equivalents.html_h3x %>'",
    name: "defaults; invalid path"
}, {
    string: "u:'<% diacritics: base=u;variant %>'",
    result: "u:'<% diacritics: base=u;variant %>'",
    name: "defaults; invalid path target"
}, {
    string: "u:'<% diacritics: base=u;metadata %>'",
    result: "u:'<% diacritics: base=u;metadata %>'",
    name: "defaults; invalid path target"
}, {
    string: "u:'<% diacritics: base=u;data %>'",
    result: "u:'<% diacritics: base=u;data %>'",
    name: "defaults; invalid path target"
}, {
    string: "u:'<% diacritics: base=u;diacritic %>'",
    result: "u:'<% diacritics: base=u;diacritic %>'",
    name: "defaults; invalid path target (can not end on an object)"
}, {
    string: "u:'<% diacritics: base=u;mapping %>'",
    result: "u:'<% diacritics: base=u;mapping %>'",
    name: "defaults; invalid path target (can not end on an object)"
}, {
    string: "u:'<% diacritics: base=u;mapping[test] %>'",
    result: "u:'<% diacritics: base=u;mapping[test] %>'",
    name: "defaults; invalid path target (invalid child)"
}, {
    string: "u:'<% diacritics: base=u;equivalents %>'",
    result: "u:'<% diacritics: base=u;equivalents %>'",
    name: "defaults; invalid path target (can not end on an object)"
}, {
    string: "u:'<% diacritics: base=u;data[test].raw %>'",
    path: ["variant", "data", "diacritic", "equivalents", "raw"],
    result: "u:'\u00FC, u\u0308, \u00FA, u\u0301'",
    name: "defaults; ignore data filters"
}, {
    string: "<% diacritics: alphabet=latn;variant[xx,yy].native %>",
    path: ["variant", "metadata", "native"],
    xref: {
        "variant": ["xx", "yy"],
        "metadata": "metadata",
        "native": "native"
    },
    result: "<% diacritics: alphabet=latn;variant[xx,yy].native %>",
    name: "defaults; invalid matching variants; no changes to string"
}, {
    string: "<% diacritics: /v1/?language=de;alphabet %>",
    path: ["variant", "metadata", "alphabet"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "alphabet": "alphabet"
    },
    result: "Latn",
    name: "defaults; ignore /v1/? in the filter"
}, {
    string: "<% diacritics: language=de;alphabet %>",
    path: ["variant", "metadata", "alphabet"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "alphabet": "alphabet"
    },
    result: "Latn",
    name: "defaults; 'de' alphabet, final path"
}, {
    string: "<% diacritics: language=de;metadata.alphabet %>",
    path: ["variant", "metadata", "alphabet"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "alphabet": "alphabet"
    },
    result: "Latn",
    name: "defaults; 'de' alphabet, partial path"
}, {
    string: "<% diacritics: language=de;variant.metadata.alphabet %>",
    path: ["variant", "metadata", "alphabet"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "alphabet": "alphabet"
    },
    result: "Latn",
    name: "defaults; 'de' alphabet, full path"
}, {
    string: "<% diacritics: language=es;sources[] %>",
    path: ["variant", "metadata", "sources"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "sources": "sources"
    },
    result: "https://en.wikipedia.org/wiki/Spanish_orthography"+
        "#Keyboard_requirements, https://en.wikipedia.org/wiki/Spanish_" +
        "language#Estimated_number_of_speakers, https://commons.wikimedia.org" +
        "/wiki/File:Idioma_espa%C3%B1ol_en_el_mundo.PNG, https://en.wikipedia" +
        ".org/wiki/Inverted_question_and_exclamation_marks",
    name: "defaults; 'es' all sources, final path"
}, {
    string: "<% diacritics: language=es;metadata[sources] %>",
    path: ["variant", "metadata"],
    xref: {
        "variant": "variant",
        "metadata": ["sources"]
    },
    result: "https://en.wikipedia.org/wiki/Spanish_orthography"+
        "#Keyboard_requirements, https://en.wikipedia.org/wiki/Spanish_" +
        "language#Estimated_number_of_speakers, https://commons.wikimedia.org" +
        "/wiki/File:Idioma_espa%C3%B1ol_en_el_mundo.PNG, https://en.wikipedia" +
        ".org/wiki/Inverted_question_and_exclamation_marks",
    name: "defaults; 'es' all sources, final path can be an array"
}, {
    string: "<% diacritics: LANGUAGE=DE;BASE %>",
    path: ["variant", "data", "diacritic", "mapping", "base"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "mapping": "mapping",
        "base": "base"
    },
    result: "u, U, o, O, a, A, \u00DF",
    name: "defaults; 'de' all bases, final path (ignore case)"
}, {
    string: "<% diacritics: language=de;data.base %>",
    path: ["variant", "data", "diacritic", "mapping", "base"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "mapping": "mapping",
        "base": "base"
    },
    result: "u, U, o, O, a, A, \u00DF",
    name: "defaults; 'de' all bases, partial path"
}, {
    string: "<% diacritics: language=de;decompose %>",
    path: ["variant", "data", "diacritic", "mapping", "decompose"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "mapping": "mapping",
        "decompose": "decompose"
    },
    result: "ue, UE, oe, OE, ae, AE, ss",
    name: "defaults; 'de' all decompose, final path"
}, {
    string: "<% diacritics: language=de;raw %>",
    path: ["variant", "data", "diacritic", "equivalents", "raw"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": "equivalents",
        "raw": "raw"
    },
    result: "\u00FC, u\u0308, \u00DC, U\u0308, \u00F6, o\u0308, \u00D6, " +
            "O\u0308, \u00E4, a\u0308, \u00C4, A\u0308, \u00DF",
    name: "defaults; 'de' all raw, final path"
}, {
    string: "<% diacritics: language=de;diacritic[\u00FC,\u00E4,\u00F6]" +
            ".unicode %>",
    path: [
        "variant", "data", "diacritic", "equivalents", "unicode"
    ],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": ["\u00FC", "\u00E4", "\u00F6"],
        "equivalents": "equivalents",
        "unicode": "unicode"
    },
    result: "\\u00FC, u\\u0308, \\u00F6, o\\u0308, \\u00E4, a\\u0308",
    name: "defaults; 'de' specific diacritics"
}, {
    string: "<% diacritics: language=de;metadata[language, native] %>",
    path: ["variant", "metadata"],
    xref: {
        "variant": "variant",
        "metadata": ["language", "native"]
    },
    result: "German, Deutsch",
    name: "defaults; 'de' return language & native"
}, {
    string: "<% diacritics: language=de;sources[0] %>",
    path: ["variant", "metadata", "sources"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "sources": [0]
    },
    result: "https://en.wikipedia.org/wiki/German_orthography#" +
            "Special_characters",
    name: "defaults; 'de' target first (and only) source"
}, {
    string: "<% diacritics: variant=es;continent[0,1] %>",
    path: ["variant", "metadata", "continent"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "continent": [0,1]
    },
    result: "NA, SA",
    name: "defaults; target first two continents where 'es' is spoken"
}, {
    string: "<% diacritics: variant=de;continent[0,1] %>",
    path: ["variant", "metadata", "continent"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "continent": [0,1]
    },
    result: "EU",
    name: "defaults; target first two continents where 'de' is spoken; but" +
          "the database contains a string, not an array"
}, {
    string: "<% diacritics: variant=de;countries[0,1] %>",
    path: ["variant", "metadata", "countries"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "countries": [0,1]
    },
    result: "AT, BE",
    name: "defaults; target first two countries where 'de' is official"
}, {
    string: "<% diacritics: language=es;sources[1,3] %>",
    path: ["variant", "metadata", "sources"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "sources": [1, 3]
    },
    result: "https://en.wikipedia.org/wiki/Spanish_language#" +
            "Estimated_number_of_speakers, https://en.wikipedia.org/wiki/" +
            "Inverted_question_and_exclamation_marks",
    name: "defaults; 'es' target second and fourth sources"
}, {
    string: "<% diacritics: alphabet=latn;variant[de].native %>",
    path: ["variant", "metadata", "native"],
    xref: {
        "variant": ["de"],
        "metadata": "metadata",
        "native": "native"
    },
    result: "Deutsch",
    name: "defaults; get all 'Latn' but limit to 'de' only"
}, {
    string: "<% diacritics: alphabet=latn;variant[de,es].native %>",
    path: ["variant", "metadata", "native"],
    xref: {
        "variant": ["de", "es"],
        "metadata": "metadata",
        "native": "native"
    },
    result: "Deutsch, Español",
    name: "defaults; get all 'Latn' but limit to 'de' & 'es'"
}, {
    string: "<% diacritics: base=u;equivalents.raw %>",
    path: ["variant", "data", "diacritic", "equivalents", "raw"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": "equivalents",
        "raw": "raw"
    },
    result: "\u00FC, u\u0308, \u00FA, u\u0301",
    name: "defaults; base 'u', get all raw"
}, {
    string: "<% diacritics: base=u;equivalents.raw.[0,2] %>",
    path: ["variant", "data", "diacritic", "equivalents", "raw"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": "equivalents",
        "raw": "raw"
    },
    result: "\u00FC, \u00FA",
    name: "defaults; base 'u'; get all raw but post filter first & third values"
}, {
    string: "<% diacritics: diacritic=\u00FC;variant[de].mapping" +
            "[base, decompose] %>",
    path: ["variant", "data", "diacritic", "mapping"],
    xref: {
        "variant": ["de"],
        "data": "data",
        "diacritic": "diacritic",
        "mapping": ["base", "decompose"]
    },
    result: "u, ue",
    name: "defaults; target diacritic, but limit to 'de' & specific mapping"
}, {
    string: "<% diacritics: diacritic=\u00E1;variant[es].equivalents" +
            "[raw, unicode] %>",
    path: ["variant", "data", "diacritic", "equivalents"],
    xref: {
        "variant": ["es"],
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": ["raw", "unicode"]
    },
    result: "\u00E1, \\u00E1, a\u0301, a\\u0301",
    name: "defaults; target diacritic, but limit to 'es' & specific mapping"
}, {
    string: "u:'<% diacritics: base=u;equivalents.html_hex %>'",
    path: ["variant", "data", "diacritic", "equivalents", "html_hex"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": "equivalents",
        "html_hex": "html_hex"
    },
    result: "u:'&#x00FC;, u&#x0308;, &#x00FA;, u&#x0301;'",
    name: "defaults; single placeholder"
}, {
    string: "u:'<% diacritics: base=u;raw %>'",
    path: ["variant", "data", "diacritic", "equivalents", "raw"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": "equivalents",
        "raw": "raw"
    },
    result: "u:'\u00FC, u\u0308, \u00FA, u\u0301'",
    name: "defaults; placeholder with only target"
}, {
    string: "u:'<%   diacritics:  base  =   u;  equivalents  .  raw   %>'",
    path: ["variant", "data", "diacritic", "equivalents", "raw"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": "equivalents",
        "raw": "raw"
    },
    result: "u:'\u00FC, u\u0308, \u00FA, u\u0301'",
    name: "defaults; placeholder with crazy spaces"
}, {
    string: "u:'<%diacritics:base=u;equivalents.raw%>'",
    path: ["variant", "data", "diacritic", "equivalents", "raw"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": "equivalents",
        "raw": "raw"
    },
    result: "u:'\u00FC, u\u0308, \u00FA, u\u0301'",
    name: "defaults; placeholder with no spaces"
}, {
    string: "u:'<% diacritics: base=u;equivalents.html_hex %>' & " +
            "a:'<% diacritics: base=a;equivalents.unicode %>'",
    path: ["variant", "data", "diacritic", "equivalents", "html_hex"],
    path2:  ["variant", "data", "diacritic", "equivalents", "unicode"],
    result: "u:'&#x00FC;, u&#x0308;, &#x00FA;, u&#x0301;' & " +
            "a:'\\u00E4, a\\u0308, \\u00E1, a\\u0301'",
    name: "defaults; multiple placeholders"
}, {
    string: "Alphabet = <% diacritics: decompose=ss; alphabet %>",
    path: ["variant", "metadata", "alphabet"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "alphabet": "alphabet"
    },
    result: "Alphabet = Latn",
    name: "defaults; get alphabet metadata"
}, {
    string: "Continent is <% diacritics: decompose=ss;continent %>",
    path: ["variant", "metadata", "continent"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "continent": "continent"
    },
    result: "Continent is EU",
    name: "defaults; get continent metadata"
}, {
    string: "Language(s): \"<% diacritics: decompose=ss; language %>\"",
    path: ["variant", "metadata", "language"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "language": "language"
    },
    result: "Language(s): \"German\"",
    name: "defaults; get language metadata"
}, {
    string: "Native language = <% diacritics: decompose=ss; native %>",
    path: ["variant", "metadata", "native"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "native": "native"
    },
    result: "Native language = Deutsch",
    name: "defaults; get native metadata"
}, {
    string: "<a href='<% diacritics: decompose=ss;sources %>'>source</a>",
    path: ["variant", "metadata", "sources"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "sources": "sources"
    },
    result: "<a href='https://en.wikipedia.org/wiki/German_orthography#" +
            "Special_characters'>source</a>",
    name: "defaults; create a source link"
}, {
    string: "<a href='<% diacritics: language=es;sources[1] %>'>source</a>",
    path: ["variant", "metadata", "sources"],
    xref: {
        "variant": "variant",
        "metadata": "metadata",
        "sources": [1]
    },
    result: "<a href='https://en.wikipedia.org/wiki/Spanish_language#" +
            "Estimated_number_of_speakers'>source</a>",
    name: "defaults; target a specific source"
}, {
    string: "u: '<% DIACRITICS: DIACRITIC=\u00E1;VARIANT[ES].MAPPING" +
            "[BASE, DECOMPOSE] %>'",
    path: ["variant", "data", "diacritic", "mapping"],
    xref: {
        "variant": ["es"],
        "data": "data",
        "diacritic": "diacritic",
        "mapping": ["base", "decompose"]
    },
    result: "u: 'a'",
    name: "defaults; target specific variant & specific mappings with an " +
          "undefined mapping (ignore case)"
}, {
    string: "<% diacritics: base=u;equivalents[0].raw %>",
    path: ["variant", "data", "diacritic", "equivalents", "raw"],
    xref: {
        "variant": "variant",
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": [0],
        "raw": "raw"
    },
    result: "\u00FC, \u00FA",
    name: "defaults; base 'u', limit to first equivalent in each diacritic"
}, {
    string: "u: '<% diacritics: diacritic=\u00E1;variant[es].equivalents" +
            "[raw, unicode, html_hex] %>'",
    path: ["variant", "data", "diacritic", "equivalents"],
    xref: {
        "variant": ["es"],
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": ["raw", "unicode", "html_hex"]
    },
    result: "u: '\u00E1, \\u00E1, &#x00E1;, a\u0301, a\\u0301, a&#x0301;'",
    name: "defaults; target specific variant & specific equivalents"
}, {
    string: "u: '<% diacritics: diacritic=\u00E1;variant[es, xx].equivalents" +
            "[raw, unicode, html_hex, sources, raw, unicode, 1] %>'",
    path: ["variant", "data", "diacritic", "equivalents"],
    xref: {
        "variant": ["es", "xx"],
        "data": "data",
        "diacritic": "diacritic",
        "equivalents": ["raw", "unicode", "html_hex", 1]
    },
    result: "u: 'a\u0301, a\\u0301, a&#x0301;'",
    name: "defaults; target specific variant & specific equivalents values, " +
        "but only use the second entry; also ignore invalid filter names"
}, {
    string: "<% diacritics: ALPHABET=LATN;VARIANT[DE,ES].DATA." +
            "DIACRITIC[\u00FC,\u00FA].EQUIVALENTS[UNICODE, ENCODED_URI] %>",
    path: ["variant", "data", "diacritic", "equivalents"],
    xref: {
        "variant": ["de", "es"],
        "data": "data",
        "diacritic": ["\u00FC", "\u00FA"],
        "equivalents": ["unicode", "encoded_uri"]
    },
    result: "\\u00FC, %C3%BC, u\\u0308, u%CC%88, \\u00FA, %C3%BA, u\\u0301, " +
            "u%CC%81",
    name: "defaults; multiple specified settings (ignore case)"
}, {
    string: "u:'<% diacritics: alphabet=latn;variant[de,es].diacritic" +
            "[\u00FC,\u00DC].raw %>'",
    path: ["variant", "data", "diacritic", "equivalents", "raw"],
    xref: {
        "variant": ["de", "es"],
        "data": "data",
        "diacritic": ["\u00FC", "\u00DC"],
        "equivalents": "equivalents",
        "raw": "raw"
    },
    result: "u:'\u00FC, u\u0308, \u00DC, U\u0308'",
    name: "defaults; target specific variants & specific diacritics"
}, {
    string: "<!== values: language=de;decompose ==>",
    path: ["variant", "data", "diacritic", "mapping", "decompose"],
    options: {
        placeholder: "<!== values:{data} ==>"
    },
    result: "ue, UE, oe, OE, ae, AE, ss",
    name: "defaults; 'de' all decompose, modified placeholder option"
}, {
    string: "<% diacritics: language=de;decompose %>",
    path: ["variant", "data", "diacritic", "mapping", "decompose"],
    options: {
        joiner: "-"
    },
    result: "ue-UE-oe-OE-ae-AE-ss",
    name: "defaults; 'de' all decompose, modified joiner option"
}, {
    string: "<% diacritics: language=de;decompose %>",
    path: ["variant", "data", "diacritic", "mapping", "decompose"],
    options: {
        exclude: ["\u00F6", "\u00D6", "\u00DF"]
    },
    result: "ue, UE, ae, AE",
    name: "defaults; 'de' exclude o-umlaut and sharp-S"
}, {
    string: "<% diacritics: language=de;decompose %>",
    path: ["variant", "data", "diacritic", "mapping", "decompose"],
    options: {
        each: (diacriticData, data, target) => {
            let result = data[target] || "";
            return result.replace(/e/i, "x");
        }
    },
    result: "ux, Ux, ox, Ox, ax, Ax, ss",
    name: "defaults; 'de' all decompose, modified each option"
}, {
    string: "<% diacritics: language=de;decompose %>",
    path: ["variant", "data", "diacritic", "mapping", "decompose"],
    options: {
        done: result => result.join("-")
    },
    result: "ue-UE-oe-OE-ae-AE-ss",
    name: "defaults; 'de' all decompose, modified done option"
}];

test("Placeholder Path builder", t => {
    // set test mode
    d.testMode();
    let defaults = {
        placeholder: "<% diacritics: {data} %>",
        exclude: [],
        joiner: ", "
    };
    testPlaceholder.forEach(item => {
        let options = item.options ?
                Object.assign({}, defaults, item.options) :
                defaults,
            result = d.testing.extractPlaceholderSettings(item.string, options),
            path = result[0] && result[0].valid ? result[0].path : null;
        t.deepEqual(path, item.path || null, item.string);
        // test second placeholder
        if(result[1]) {
            path = result[1] && result[1].valid ? result[1].path : null;
            t.deepEqual(path, item.path2 || null, item.string);
        }
        if(item.xref) {
            t.deepEqual(result[0].xref, item.xref);
        }
    });
});

test("Replace Placeholder", t => {
    testPlaceholder.forEach(item => {
        // skip invalid placeholders (no console error messages during testing)
        // these are tested by the path builder function
        if(item.result !== item.string) {
            let result = d.replacePlaceholder(item.string, item.options);
            t.is(result, item.result, item.name);
            if (result.message) {
                console.log(result.message);
            }
        }
    });
    // invalid string
    t.deepEqual(d.replacePlaceholder(1234), {
        message: "Error: Invalid input string"
    });
});
