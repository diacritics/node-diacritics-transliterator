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

## API

### Contents

- [Initializing](#initializing)
- [Basic functions](#basic-functions)
  - [diacritics.setVersion(version)](#diacriticssetversionversion)
  - [diacritics.getVersion()](#diacriticsgetversion)
  - [diacritics.getLanguage(code)](#diacriticsgetlanguagecode)
  - [diacritics.getVariant(code)](#diacriticsgetvariantcode)
  - [diacritics.getAlphabet(code)](#diacriticsgetalphabetcode)
  - [diacritics.getContinent(code)](#diacriticsgetcontinentcode)
  - [diacritics.formatUnicode(string)](#diacriticsformatunicodestring)
- [Data processing functions](#data-processing-functions)
  - [diacritics.getDiacritics(string)](#diacriticsgetdiacriticsstring)
  - [diacritics.getBase(array)](#diacriticsgetbasearray)
  - [diacritics.getDecompose(array)](#diacriticsgetdecomposearray)
- [Transliteration functions](#transliteration-functions)
  - [diacritics.transliterate(string [, type][, variant]))](#diacriticstransliteratestring--type-variant)
  - [diacritics.createRegExp(string [, options])](#diacriticscreateregexpstring--options)
  - [diacritics.replacePlaceholder(string [, options])](#diacriticsreplaceplaceholderstring--options)

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
/* data =>
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
// test => { "message": "Language 'test' was not found" }
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
/* german =>
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
// test => { "message": "Variant 'test' was not found" }
```

#### diacritics.getAlphabet(code)

Returns the metadata and data for all languages matching the given alphabet code.

The `code` parameter (type: `string`) must be set using a [ISO 15924](https://en.wikipedia.org/wiki/ISO_15924) case insensitive script code value, e.g. `Latn`.

The returned value will be an object containing all languages that match the set alphabet.

```js
var diacritics = require("diacritics-transliterator");
var latin = diacritics.getAlphabet("latn");
/* latin =>
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
// test => { "message": "Alphabet 'test' was not found" }
```

#### diacritics.getContinent(code)

Returns the metadata and data for all languages matching the given continent code.

The `code` parameter (type: `string`) must be set using a [ISO-3166](https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_by_continent_%28data_file%29) case insensitive value, e.g. `EU`:

The returned value will be an object containing all languages that match the set continent.

```js
var diacritics = require("diacritics-transliterator");
var antarctica = diacritics.getContinent("an");
/* antarctica =>
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
// test => { "message": "Continent 'test' was not found" }
```

#### diacritics.formatUnicode(string)

Converts the escaped unicode as stored within the database (`\\uHHHH` where H = hex) into actual unicode characters. Using `.replace(/\\\u/g, "\u")` will appear to work, but it does not create an actual unicode character; so we must use `.fromCharCode()` to properly convert the string.

The `string` parameter (type: `string`) can contain regular characters as well as the escaped unicode characters. Diacritics within the string will not be modified.

The returned string will have replaced any escaped unicode with the equivalent unicode value

```js
var diacritics = require("diacritics-transliterator");
var string = diacritics.formatUnicode("T\\u00E9st");
// string => "Tést"
```

### Data processing functions

#### diacritics.getDiacritics(string)

Returns the metadata and data for all matching diacritics within the string.

The `string` parameter (type: `string`) contains one or more diacritics to process.

The returned value will be an object containing all languages that match each diacritic, but the language data will only contain the matching diacritic.

```js
var diacritics = require("diacritics-transliterator");
var data = diacritics.getDiacritics("abcñ-ß123");
/* data =>
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
// test => { "message": "No diacritics found" }
```

#### diacritics.getBase(array)

Returns the base data for the matching base value within the array.

The `array` parameter contains either an `array` of diacritic base string, or a `string` containing a single base (internally converted into an array), of characters to process.

The returned value will be an object containing all languages that match each diacritic base value, but the language data will only contain the matching diacritic.

```js
var diacritics = require("diacritics-transliterator");
var data = diacritics.getBase(["u"]);
/* data =>
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
// test => { "message": "No matching bases found" }
```

#### diacritics.getDecompose(array)

Returns the decompose data for the matching decompose values within the array.

The `array` parameter contains either an `array` of diacritic decompose string, or a `string` containing a single decompose string (internally converted into an array), of characters to process.

The returned value will be an object containing all languages that match each diacritic decompose value, but the language data will only contain the matching diacritic.

```js
var diacritics = require("diacritics-transliterator");
var data = diacritics.getDecompose(["ss"]);
/* data =>
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
// test => { "message": "No matching decomposes found" }
```

### Transliteration functions

#### diacritics.transliterate(string [, type][, variant])

Replaces diacritics within the string with either the base or decomposed value.

- The `string` parameter (type: `string`) will replace any diacritic characters with base or decomposed values. Any non-diacritics characters will not be modified.
- The `type` parameter (type: `string`) is set to either "base" or "decompose". Defaults to "base". If a "base" value is not found, a "decompose" value will be used instead; and vice-versa.
- The `variant` optional parameter (type: `string`) is set using the language variant. If no variant is provided, the first matching language for the diacritic will be used.

The returned value will be a string with all matching diacritics replaced with the set "base" or "decompose" value.

**Note** that if a `variant` parameter is set and the string contains a diacritic not found in that language variant, it will not be processed!

```js
var transliterate = require("diacritics-transliterator").transliterate;
var german = transliterate("¿abcñ-ß123?", "decompose" "de"); // "¿abcñ-ss123?"
var spanish = transliterate("¿abcñ-ß123?", "base", "es"); // "?abcn-ß123?"
// The base of ß is still ß
var generic = transliterate("¿abcñ-ß123?"); // "?abcn-ß123?"
// If no diacritics match the set language variant, the original string is returned
var unchanged = transliterate("¿abcñ-ß123?", "base", "test"); // "¿abcñ-ß123?"
```

If no matching diacritics are found in the string or database, the original string is returned.

#### diacritics.createRegExp(string [, options])

This function creates a regular expression that matches, or ignores, diacritics in the given `string`.

The regular expression can:

- Match all diacritics with or without their equivalents.
- Match only non-diacritics, which ignores the diacritic and allows matching any character(s).
- Match all diacritics in a case-insensitive manner.
- Ignore any joiners (soft hyphens, zero width space, zero width non-joiner and zero width joiners) that may occur within the string.
- Match the original string if no diacritics are found.

The function uses the following parameters:

- The `string` parameter (type: `string`) contains text with or without diacritic characters to be processed into a regular expression that matches this value.
- The `options` parameter (type: `object`) contains the following settings:

  | Option             | Type     | Default | Description                      |
  |--------------------|:--------:|:-------:|----------------------------------|
  | diacritics         | boolean  | true    | When `true`, all diacritics from the `string` parameter are included; if `false`, all diacritics within the regular expression will be replaced with a <code>"\\\\S"</code> (set by the `replaceDiacritic` setting). |
  | replaceDiacritic   | string   | "\\\\S"   | Character used to replace diacritics when the `diacritics` option is `false`. A range `{1,2}` is only added if the diacritic contains multiple characters (e.g. letter + combining diacritic(s)) and the `replaceDiacritic` option is set as <code>"\\\\S"</code> (e.g. `e\u0301` becomes <code>\\\\S{1,2}</code>. Make sure to double escape any regular expression special characters. |
  | nonDiacritics      | boolean  | true    | When `true`, all non-diacritic characters from the `string` parameter are included; if `false`, non-diacritics are excluded so that only diacritics are targeted by the regular expression. |
  | includeEquivalents | boolean  | true    | When `true`, all diacritic equivalents within the regular expression are included - e.g. &#xe9; (`\u00e9`) has an equivalent of `e` plus a combining diacritic (`e\u0301`); if `false`, only the diacritics from the `string` parameter are processed. |
  | caseSensitive      | boolean  | true    | When `true`, case sensitive diacritics are matched; if `false`, both upper and lower case versions of the diacritic are included in the resulting regular expression. |
  | ignoreJoiners      | boolean  | false   | When `true`, word joiners to match soft hyphens, zero width space, zero width non-joiner and zero width joiners are added between each character in the resulting regular expression. |
  | flags              | string   | "gu"    | Flags to include when creating the regular expression. The "u" flag creates a [unicode-aware regular expression](https://mathiasbynens.be/notes/es6-unicode-regex).  |
  | each               | function | null    | This callback function allows modification of the resulting regular expression string for the character currently being processed.<br>`function(character, result, data, index) { return result; }`<br>This callback has four parameters:<ul><li>The `character` parameter (type `string`) contains the current non-normalized character being processed (use `character.normalize("NFKC")` to make the character compatible with the database entry).</li><li>The `result` parameter (type `string`) contains the regular expression string equivalent of the current character (e.g. character `ü` may yield a result of `(\u00FC|u\u0308)`).</li><li>The `data` parameter (type `object`) contains the complete diacritic data object associated with the normalized regular expression `string` parameter (e.g. `{lang: {variant: {diacritic: {metadata: {...}, data: {...}}}}}`</li><li>The `index` parameter (type `number`) contains the current character index. This index matches the character position from the original regular expression `string` parameter.</li></ul>Return a string or a modified string that is to be used in the regular expression. Any falsy values that are returned will not be added to the final regular expression. |
  | finalize           | function | null    | This callback function allows modification of the finalized regular expression string.<br>`function(array, joiner) { return array.join(joiner); }`<br>This callback has two parameters:<ul><li>The `array` parameter contains an array. Each array item is a string which results from the processing of the original `string` parameter after being split into separate characters; each item contains a diacritic (if `diacritics` is `true`), or non-diacritic (if `nonDiacritics` is `true`), but not both. And any special regular expression characters in the original `string` parameter will be escaped with a backslash (e.g. `^` is converted to `\^`).</li><li>The `joiner` parameter is a string which will be used to `.join()` the `array` parameter into its final regular expression string. When the `ignoreJoiners` option is `false`, this string is empty (`""`), and when the `ignoreJoiners` option is `true`, this string value becomes `"[\u00ad|\u200b|\u200c|\u200d]?"`.</li></ul>Return the final regular expression string once it has been created. |

The returned value will be a regular expression that matches the processed string, or the original string if no diacritics are included.

##### Examples &amp; comments:

* Default settings

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        diacritics: true,
        replaceDiacritic: "\\S",
        nonDiacritics: true,
        includeEquivalents: true,
        caseSensitive: true,
        ignoreJoiners: false,
        flags: "gu",
        // these callbacks are set as null by default; the following
        // examples show basic usage
        each: function(character, result, data, index) {
            // modify result as desired
            return result;
        },
        finalize: function(array, joiner) {
            return array.join(joiner);
        }
    });
    // regexp => /T(\u00E9|e\u0301)st/gu
    ```

* Non-diacritics only

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        diacritics: false
    });
    // regexp => /T\\S{1,2}st/gu
    ```

  * When `false`, all diacritics in the original string are replaced with `\\S`. The `\\S` replacement is defined in the `replaceDiacritic` option, and the range `{1,2}` is only added if:
    * The original diacritic, or equivalents (if `includeEquivalents` is `true`) contains multiple characters (e.g. letter + combining diacritic).
    * And the `replaceDiacritic` option is set as `"\\S"`.
  * Make sure to double escape any regular expression special characters (e.g. `\\b`).
  * Do not double escape the unicode escape format (e.g. `\u00A0`, not `\\u00A0`).
  * If both the `nonDiacritics` and `diacritics` options are set to `false`, the resulting regular expression will become `/(?:)/gu` and match everything.

* Diacritics only

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        nonDiacritics: false
    });
    // regexp => /(\u00E9|e\u0301)/gu
    ```

  * When `false`, non-diacritic characters are not even referenced in the resulting regular expression.
  * If both the `nonDiacritics` and `diacritics` options are set to `false`, the resulting regular expression will become `/(?:)/gu` and match everything.

* Do not include equivalents

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        includeEquivalents: false
    });
    // regexp => /T\u00E9st/gu
    ```

  * When `false`, only the original diacritics are included.

* Case insensitive

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Ä Tést", {
        caseSensitive: false
    });
    // regexp => /(\u00C4|A\u0308|\u00E4|a\u0308) T(\u00C9|E\u0301|\u00E9|e\u0301)st/gu
    ```

  * When `false`, the upper and lower case diacritic, and any equivalents (if the `includeEquivalents` option is `true`), are included in the matching regular expression.

* Include joiners

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        ignoreJoiners: true
    });
    // regexp =>
    // /T[\u00ad|\u200b|\u200c|\u200d]?(\u00E9|e\u0301)[\u00ad|\u200b|\u200c|\u200d]?s[\u00ad|\u200b|\u200c|\u200d]?t/gu
    ```

  * When `true`, regular expression matches for soft hyphens (`\u00ad`), zero width space (`\u200b`), zero width non-joiner (`\u200c`) and zero width joiners (`\u200d`) are included between each character.

* Regular expression flags

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("Tést", {
        flags: "giu"
    });
    // regexp => /T(\u00E9|e\u0301)st/giu
    ```

* Each callback

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("a tést", {
        each: function(character, result, data, index) {
            // Replace space with regular expression whitespace
            // make sure to double escape the RegExp special characters "\\s"
            return character === " " ? "\\s+" : result;
        }
    });
    // regexp => /a\s+t(\u00E9|e\u0301)st/gu
    ```

* Finalize callback

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("tést", {
        finalize: function(array, joiner) {
            // match whole words only
            // make sure to double escape the RegExp special characters "\\b"
            return "\\b" + array.join(joiner) + "\\b";
        }
    });
    // regexp => /\bt(\u00E9|e\u0301)st\b/gu
    ```

If no diacritics are found, then the regular expression will include the original text.

##### __Important Notes__

* This method is not meant to be used on HTML, and will escape any regular expression-like characters (e.g. `^(test)$` string is converted into the following string `\^\(test\)\$`).
* If you want to include the start `^` and end `$` anchors, use the `finalize` callback in a manner similar to the example above.
* Any regular expression special characters added within the callback functions must be double escaped (e.g. `\S` becomes `\\S`) because the regular expression is created from a string.
* Adding an escaped unicode character within the callbacks must not be double escaped (e.g. `\u00a0` contains a single backslash). If you have included any double escaped unicode as found in the database, use the [`diacritics.formatUnicode` method](#diacriticsformatunicodestring) to process it.

#### diacritics.replacePlaceholder(string [, options])

Replaces placeholder(s) within the string with the targeted diacritic values:
- The `string` parameter (type: `string`)  contains text and/or HTML with a diacritic placeholder value(s) to be replaced.
  - The query string contains two parts: `type;data`
  - The `type` will match the diacritics.io database queries (e.g. `base=o`)
  - The `data` will target the data to include (e.g. `alphabet`, `native`, `base`, `decompose` or `equivalents.unicode`) - including `metadata` or `data` is not required.
  - Example: `<% diacritics: base=o;equivalents.unicode %>` will be replaced with `\u00FC,u\u0308,\u00FA,u\u0301` - this example is only showing the results from `de` and `es` languages; there will be a lot more once there is more data. The result can be reformatted using the `output` callback function.
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
// string => "'u' is the base for '&#x00FC;, u&#x0308;, &#x00FA;, u&#x0301;'"
```

To convert escaped unicode (e.g. `\\u00FC`) into actual unicode, use the [`diacritics.formatUnicode`](#diacriticsformatUnicodestring) function, or use the `base.raw` data type:

```js
var diacritics = require("diacritics-transliterator");
var string = diacritics.replacePlaceholder("'u' is the base for '<% diacritics: base=u;equivalents.unicode %>'", {
    output: function(placeholder, result) {
        return diacritics.formatUnicode(result.join(", "));
    }
});
// string => "'u' is the base for 'ü, ü, ú, ú'"
```

---

## Related

- [diacritics database](https://github.com/diacritics/database).
- [diacritics API](https://github.com/diacritics/api).

## [License](LICENSE)

MIT © [Julian Motz](https://github.com/julmot) &amp; [Rob Garrison](https://github.com/Mottie)
