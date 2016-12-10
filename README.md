# node-diacritics-transliterator

> Diacritic transliteration tools using diacritics.io API

## Installation

```console
$ npm install diacritics-transliterator
```

## Usage

```js
var diacritics = require("diacritics-transliterator");
diacritics.setVersion("v1");
var de = diacritics.getLanguage("German");
// {"de":{...}}
```

## Contents

- Basic functions
  - [diacritics.setVersion(version)](#diacriticssetversionversion)
  - [diacritics.getVersion()](#diacriticsgetversion)
  - [diacritics.getLanguage(code)](#diacriticsgetlanguagecode)
  - [diacritics.getVariant(code)](#diacriticsgetvariantcode)
  - [diacritics.getAlphabet(code)](#diacriticsgetalphabetcode)
  - [diacritics.getContinent(code)](#diacriticsgetcontinentcode)
  - [diacritics.formatUnicode(string)](#diacriticsformatunicodestring)
- Data processing functions
  - [diacritics.getDiacritics(string)](#diacriticsgetdiacriticsstring)
  - [diacritics.getBase(array)](#diacriticsgetbasearray)
  - [diacritics.getDecompose(array)](#diacriticsgetdecomposearray)
- Transliteration functions
  - [diacritics.transliterate(string [, type][, variant]))](#diacriticstransliteratestring--type-variant)
  - [diacritics.createRegExp(string [, options])](#diacriticscreateregexpstring--options)
  - [diacritics.replacePlaceholder(string [, options])](#diacriticsreplaceplaceholderstring--options)

## API

### Initializing

Each API method requires the `diacritics-transliterator` module.

```js
var diacritics = require("diacritics-transliterator");
```

### Basic functions

#### diacritics.setVersion(version)

Upon initialization, this module is set to the latest major release version of the diacritics API. To change the version, use this function to set the API to the desired _major_ release.

The `version` parameter (`string` or `number`) will accept the following values:

- `v#`, where `v` is the abbreviation for "version" and `1` is the major release value.
- `1`, where `1` is a numeric value or string.
- Parsed values must be greater than zero and less than or equal to the current major release version.

```js
var diacritics = require("diacritics-transliterator");
diacritics.setVersion("v1"); // "v1" returned
```

Invalid values will be ignored and the version will remain unchanged.

The returned value will be a string with a leading "v" (for version) followed by the currently set version number.

#### diacritics.getVersion()

Upon initialization, this function will always return the current major release version of the diacritics API.

```js
var diacritics = require("diacritics-transliterator");
diacritics.getVersion(); // "v1" returned
```

The returned value will be a string with a leading "v" (for version) followed by the currently set version number.

#### diacritics.getLanguage(code)

Returns the variant(s) metadata and data for the selected language code.

The `code` parameter (type: `string`) will accept any of the following case insensitive values:

- [ISO 639-1](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) language code (e.g. `de`)
- The language written in English (e.g. `German`)
- The language written in the native language (e.g. `Deutsch`)

The returned value will be an object which includes the root language and any variants.

```js
var diacritics = require("diacritics-transliterator");
var german = diacritics.getLanguage("de");
/*
{
    "de": {
        "metadata": { ... }
        "data": { ... }
    }
}
*/
```

If a language is not found, an object with an error "message" is returned.

```js
var diacritics = require("diacritics-transliterator");
var test = diacritics.getLanguage("test");
// { "message": "Language 'test' was not found" }
```

#### diacritics.getVariant(code)

Returns the metadata and data for the selected language variant code.

The `code` parameter (type: `string`) will accept any of the following case insensitive values:

- language variant code (e.g. `de`)
- The language variant name written in English.

The returned value will be an object which includes only the variant language.

```js
var diacritics = require("diacritics-transliterator");
var german = diacritics.getVariant("de");
/*
{
    "de": {
        "metadata": { ... }
        "data": { ... }
    }
}
*/
```

If a variant is not found, an object with an error "message" is returned.

```js
var diacritics = require("diacritics-transliterator");
var test = diacritics.getVariant("test");
// { "message": "Variant 'test' was not found" }
```

#### diacritics.getAlphabet(code)

Returns the metadata and data for all languages matching the given alphabet code.

The `code` parameter (type: `string`) must be set using a [ISO 15924](https://en.wikipedia.org/wiki/ISO_15924) case insensitive script code value, e.g. `Latn`.

The returned value will be an object containing all languages that match the set alphabet.

```js
var diacritics = require("diacritics-transliterator");
var latin = diacritics.getAlphabet("latn");
/*
{
    "de": {
        "metadata": { ... }
        "data": { ... }
    },
    "es": {
        "metadata": { ... }
        "data": { ... }
    }
}
*/
```

If an alphabet is not found, an object with an error "message" is returned.

```js
var diacritics = require("diacritics-transliterator");
var test = diacritics.getAlphabet("test");
// { "message": "Alphabet 'test' was not found" }
```

#### diacritics.getContinent(code)

Returns the metadata and data for all languages matching the given continent code.

The `code` parameter (type: `string`) must be set using a [ISO-3166](https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_by_continent_%28data_file%29) case insensitive value, e.g. `EU`:

The returned value will be an object containing all languages that match the set continent.

```js
var diacritics = require("diacritics-transliterator");
var antarctica = diacritics.getContinent("an");
/*
{
    "es": {
        "metadata": { ... }
        "data": { ... }
    }
}
*/
```

If a continent is not found, an object with an error "message" is returned.

```js
var diacritics = require("diacritics-transliterator");
var test = diacritics.getContinent("test");
// { "message": "Continent 'test' was not found" }
```

#### diacritics.formatUnicode(string)

Converts the escaped unicode as stored within the database (`\\uHHHH` where H = hex) into actual unicode characters. Using `.replace(/\\\u/g, "\u")` will appear to work, but it does not create an actual unicode character; so we must use `.fromCharCode()` to properly convert the string.

The `string` parameter (type: `string`) can contain regular characters as well as the escaped unicode characters. Diacritics within the string will not be modified.

The returned string will have replaced any escaped unicode with the equivalent unicode value

```js
var diacritics = require("diacritics-transliterator");
var string = diacritics.formatUnicode("T\\u00E9st");
// "Tést"
```

### Data processing functions

#### diacritics.getDiacritics(string)

Returns the metadata and data for all matching diacritics within the string.

The `string` parameter (type: `string`) contains one or more diacritics to process.

The returned value will be an object containing all languages that match each diacritic, but the language data will only contain the matching diacritic.

```js
var diacritics = require("diacritics-transliterator");
var data = diacritics.getDiacritics("abcñ-ß123");
/*
{
    "de": {
        "metadata": {...},
        "data: {
            "ß": {...}
        }
    },
    "es": {
        "metadata": {...},
        "data": {
            "ñ": {...}
        }
    }
}
*/
```

If no diacritics are found in the string, an object with an error "message" is returned.

```js
var diacritics = require("diacritics-transliterator");
var test = diacritics.getDiacritics("test");
// { "message": "No diacritics found" }
```

#### diacritics.getBase(array)

Returns the base data for the matching base value within the array.

The `array` parameter contains either an `array` of diacritic base string, or a `string` containing a single base (internally converted into an array), of characters to process.

The returned value will be an object containing all languages that match each diacritic base value, but the language data will only contain the matching diacritic.

```js
var diacritics = require("diacritics-transliterator");
var data = diacritics.getBase(["u"]);
/*
{
    "de": {
        "metadata": {...},
        "data: {
            "ü": {...}
        }
    },
    "es": {
        "metadata": {...},
        "data": {
            "ú": {...},
            "ü": {...}
        }
    }
}
*/
```

If no matching bases are found in the database, an object with an error "message" is returned.

```js
var diacritics = require("diacritics-transliterator");
var test = diacritics.getBase(["&"]);
// { "message": "No matching bases found" }
```

#### diacritics.getDecompose(array)

Returns the decompose data for the matching decompose values within the array.

The `array` parameter contains either an `array` of diacritic decompose string, or a `string` containing a single decompose string (internally converted into an array), of characters to process.

The returned value will be an object containing all languages that match each diacritic decompose value, but the language data will only contain the matching diacritic.

```js
var diacritics = require("diacritics-transliterator");
var data = diacritics.getDecompose(["ss"]);
/*
{
    "de": {
        "metadata": {...},
        "data: {
            "ß": {...}
        }
    }
}
*/
```

If no matching decomposes are found in the database, an object with an error "message" is returned.

```js
var diacritics = require("diacritics-transliterator");
var test = diacritics.getDecompose(["&", "test"]);
// { "message": "No matching decomposes found" }
```

### Transliteration functions

#### diacritics.transliterate(string [, type][, variant])

Replaces diacritics within the string with either the base or decomposed value.

- The `string` parameter (type: `string`) will replace any diacritic characters with base or decomposed values. Any non-diacritics characters will not be modified.
- The `type` parameter (type: `string`) is set to either "base" or "decompose". Defaults to "base". If a "base" value is not found, a "decompose" value will be used instead; and vice-versa.
- The `variant` optional parameter (type: `string`) is set using the language variant. If no variant is provided, the first matching language for the diacritic will be used.

The returned value will be a string with all matching diacritics replaced with the set "base" or "decompose" value.

```js
var diacritics = require("diacritics-transliterator");
var german = diacritics.transliterate("ü", "decompose" "de"); // "ue"
var spanish = diacritics.transliterate("ü", "base", "es"); // "u"
var generic = diacritics.transliterate("ü"); // "u"
```

#### diacritics.createRegExp(string [, options])

Creates a regular expression that matches the processed string, or original string if no diacritics are found.

- The `string` parameter (type: `string`) contains text with or without diacritic characters to be processed into a regular expression.
- The `options` parameter (type: `object`) contains the following settings:
  - `diacritics` - (type: `boolean`) defaults to `true`. Include all diacritics in the string; if `false`, the regex will replace the diacritic with a `\S`.
  - `nonDiacritics` - (type: `boolean`) defaults to `true`. Include all non-diacritics in the string.
  - `includeEquivalents` - (type: `boolean`) defaults to `true`. Include all diacritic equivalents within the regular expression.
  - `caseSensitive` - (type: `boolean`) defaults to `true`. Include case sensitive diacritic matches.
  - `ignoreJoiners` - (type: `boolean`) defaults to `false`. Include word joiners between each string character to match soft hyphens, zero width space, zero width non-joiner and zero width joiners in the regular expression.
  - `flags` - (type: `string`) defaults to `"g"` - Regular expression flags to include.
  - `each` - (type: `function`) modify resulting regular expression string for the current character; this callback has two parameters:
    - The `character` parameter contains the current character being processed.
    - The `result` parameter contains the regular expression string equivalent of the current character (e.g. character "ü" may yield a result of "(\u00FC|u\u0308)").
    - return a string or a modified string that is to be used in the regular expression.

The returned value will be a regular expression (type: `RegExp`) that matches the string and any variations as set by the options.

Examples:

* Default settings

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        diacritics: true,
        nonDiacritics: true,
        includeEquivalents: true,
        caseSensitive: true,
        ignoreJoiners: false,
        flags: "g",
        each: function(character, result) {
            // modify result as desired
            return result;
        }
    });
    // /T(\u00E9|e\u0301)st/g
    ```

* Non-diacritics only (diacritic and letter plus combining diacritic are each replaced by `\S`)

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        diacritics: false
    });
    // /T(\S|\S\S)st/g
    ```

* Diacritics only (non-diacritics are not even referenced)

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        nonDiacritics: false
    });
    // /(\u00E9|e\u0301)/g
    ```

* Do not include equivalents

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        includeEquivalents: false
    });
    // /T\u00E9st/g
    ```

* Case insensitive

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Ä Tést", {
        caseSensitive: false
    });
    // /(\u00C4|A\u0308|\u00E4|a\u0308)\sT(\u00C9|E\u0301|\u00E9|e\u0301)st/g
    ```

* Include joiners (soft hyphens, zero width space, zero width non-joiner and zero width joiners)

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        ignoreJoiners: true
    });
    // /T[\\u00ad|\\u200b|\\u200c|\\u200d]?(\u00E9|e\u0301)[\\u00ad|\\u200b|\\u200c|\\u200d]?s[\\u00ad|\\u200b|\\u200c|\\u200d]?t/g
    ```

* Regular expression flags

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        flags: "gi"
    });
    // /T(\u00E9|e\u0301)st/gi
    ```

* Each callback

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("ä tést", {
        each: function(character, result) {
            // ignore the "ä" diacritic
            return character === "ä" ? character : result;
        }
    });
    // /ä t(\u00E9|e\u0301)st/g
    ```

If no diacritics are found, then the regular expression will include the original text.

This method is not meant to be used on HTML, and will escape any regular expression-like characters (e.g. `^(test)$` string becomes `\^\(test\)\$`).

#### diacritics.replacePlaceholder(string [, options])

Replaces placeholder(s) within the string with the targeted diacritic values:
- The `string` parameter (type: `string`)  contains text and/or HTML with a diacritic placeholder value(s) to be replaced.
  - The query string contains two parts: `type;data`
  - The `type` will match the diacritics.io database queries (e.g. `base=o`)
  - The `data` will target the data to include (e.g. `alphabet`, `native`, `base`, `decompose` or `equivalents.unicode`) - including `metadata` or `data` is not required.
  - Example: `<% diacritics: base=o;equivalents.unicode %>` will be replaced with `\\u00FC,u\\u0308,\\u00FA,u\\u0301` - this example is only showing the results from `de` and `es` languages; there will be a lot more once there is more data. The result can be reformatted using the `output` callback function.
- The `options` parameter contains the following settings:
  - `placeholder` - (type: `string`) format defaults to `<% diacritics: {query} %>`.
  - `output` - (type: `function`) function to allow customization of the output string: `function(placeholder, result) { return result.join(""); }`

The returned value will be a `string` (converted from an array by the `output` callback) containing unique diacritic that match the query string values - all duplicates are removed.

```js
var diacritics = require("diacritics-transliterator");
var string = diacritics.replacePlaceholder("'u' is the base for '<% diacritics: base=u;equivalents.html_hex %>'", {
    output: function(placeholder, result) {
        // modify result as desired
        return result.join(", ");
    }
});
// "'u' is the base for '&#x00FC;, u&#x0308;, &#x00FA;, u&#x0301;'"
```

To convert escaped unicode (e.g. `\\u00FC`) into actual unicode, use the [`diacritics.formatUnicode`](#diacriticsformatUnicodestring) function, or use the `base.raw` data type:

var diacritics = require("diacritics-transliterator");
var string = diacritics.replacePlaceholder("'u' is the base for '<% diacritics: base=u;equivalents.unicode %>'", {
    output: function(placeholder, result) {
        return diacritics.formatUnicode(result.join(", "));
    }
});
// "'u' is the base for 'ü, ü, ú, ú'"

---

## Related

- [diacritics database](https://github.com/diacritics/database).
- [diacritics API](https://github.com/diacritics/api).

## [License](LICENSE)

MIT © [Julian Motz](https://github.com/julmot)
