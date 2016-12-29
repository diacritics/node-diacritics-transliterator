# node-diacritics-transliterator

> Diacritic transliteration tools using diacritics.io API

# Installation

```bash
$ npm install diacritics-transliterator
```

# Usage

```js
var diacritics = require("diacritics-transliterator");
diacritics.setVersion("v1");
var de = diacritics.getLanguage("German");
// {"de":{...}}
```

# API

## Contents

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

## Initializing

Each API method requires the `diacritics-transliterator` module.

```js
var diacritics = require("diacritics-transliterator");
```

## Basic functions

### diacritics.setVersion(version)

Upon initialization, this module is set to the latest major release version of the diacritics API. To change the version, use this function to set the API to the desired _major_ release.

The `version` parameter (`string` or `number`) will accept the following values:

- v#`, where `v` is the abbreviation for "version" and `#` is the database major version release value (e.g. `1`).
- `#` may be set as a numeric value or string.
- Parsed values must be greater than zero and less than or equal to the current major release version.

Invalid values will be ignored and the version will remain unchanged.

The returned value will be a string with a leading "v" (for version) followed by the currently set version number.

### diacritics.getVersion()

Upon initialization, this function will always return the current major release version of the diacritics API.

```js
var diacritics = require("diacritics-transliterator");
diacritics.getVersion(); // "v1" returned
```

The returned value will be a string with a leading "v" (for version) followed by the currently set version number.

### diacritics.getLanguage(code)

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

### diacritics.getVariant(code)

Returns the metadata and data for the selected language variant code.

The `code` parameter (type: `string`) will accept any of the following case insensitive values:

- language variant code (e.g. `de`).
  - This code is based on the [IETF language tag](https://www.w3.org/International/articles/language-tags/) extended language (`extlang`) subtag. So, _if_ you want to target the `de_AT` variant, only include the `AT` subtag. In this case, the `AT` variant does not differ from the root `DE` language, so the variant will not be found in the database.
  - See [this table](http://data.okfn.org/data/core/language-codes#resource-ietf-language-tags) for a quick reference of available IETF language tags.
- The language variant name written in plain English.

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

### diacritics.getAlphabet(code)

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

### diacritics.getContinent(code)

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

### diacritics.formatUnicode(string)

Converts the escaped unicode as stored within the database (`\\uHHHH` where H = hex) into actual unicode characters. Using `.replace(/\\\u/g, "\u")` will appear to work, but it does not create an actual unicode character; so we must use `.fromCharCode()` to properly convert the string.

The `string` parameter (type: `string`) can contain regular characters as well as the escaped unicode characters. Diacritics within the string will not be modified.

The returned string will have replaced any escaped unicode with the equivalent unicode value

```js
var diacritics = require("diacritics-transliterator");
var string = diacritics.formatUnicode("T\\u00E9st");
// string => "Tést"
```

## Data processing functions

### diacritics.getDiacritics(string)

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

### diacritics.getBase(array)

Returns the base data for the matching base value within the array.

The `array` parameter contains either an `array` of diacritic base string, or a `string` containing a single base, of characters to process.

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

### diacritics.getDecompose(array)

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

## Transliteration functions

### diacritics.transliterate(string [, type][, variant])

Replaces diacritics within the string with either the base or decomposed value.

- The `string` parameter (type: `string`) will replace any diacritic characters with base or decomposed values. Any non-diacritics characters will not be modified.
- The `type` parameter (type: `string`) is set to either "base" or "decompose".
  - It defaults to "base".
  - If a "base" value is set and is not found, the "decompose" value will be used instead.
  - If a "decompose" value is set and is not found, it will fallback to the "base" value.
- The `variant` optional parameter (type: `string`) is set using the language variant. If no variant is provided, the first matching language for the diacritic will be used.

The returned value will be a string with all matching diacritics replaced with the set "base" or "decompose" value.

**Note**
- An invalid `type` parameter will throw an error.
- An invalid `variant` parameter or a set variant that does not include one or more diacritics in the string, will not process that diacritic.

```js
var transliterate = require("diacritics-transliterator").transliterate;
// only the German s-sharp is replaced
var german = transliterate("¿abcñ-ß123?", "decompose" "de"); // "¿abcñ-ss123?"
// only the Spanish ñ is modified
var spanish = transliterate("¿abcñ-ß123?", "base", "es"); // "?abcn-ß123?"
// The base of ß is still ß
var generic = transliterate("¿abcñ-ß123?"); // "?abcn-ß123?"
// If no diacritics match the set language variant, the original string is returned
var unchanged = transliterate("¿abcñ-ß123?", "base", "test"); // "¿abcñ-ß123?"
```

If no matching diacritics are found in the string or database, the original string is returned.

### diacritics.createRegExp(string [, options])

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

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Type</th>
      <th>Default</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>diacritics</td>
      <td>boolean</td>
      <td>true</td>
      <td>When <code>true</code>, all diacritics from the <code>string</code>
        parameter are included; if <code>false</code>, all diacritics within the
        regular expression will be replaced with a <code>"\\S"</code>
        (set by the <code>replaceDiacritic<code> setting).
      </td>
    </tr>
    <tr>
      <td>replaceDiacritic</td>
      <td>string</td>
      <td>"\\S"</td>
      <td>Character used to replace diacritics when the <code>diacritics</code>
        option is <code>false</code>. A range <code>{1,2}</code> is only added
        if the diacritic contains multiple characters (e.g. letter + combining
        diacritic(s)) and the <code>replaceDiacritic</code> option is set as
        <code>"\\S"</code> (e.g. <code>e\u0301</code> becomes
        <code>\\S{1,2}</code>. Make sure to double escape any regular
        expression special characters.
      </td>
    </tr>
    <tr>
      <td>nonDiacritics</td>
      <td>boolean</td>
      <td>true</td>
      <td>When <code>true</code>, all non-diacritic characters from the
        <code>string</code> parameter are included; if <code>false</code>,
        non-diacritics are excluded so that only diacritics are targeted by the
        regular expression.
      </td>
    </tr>
    <tr>
      <td>includeEquivalents</td>
      <td>boolean</td>
      <td>true</td>
      <td>When <code>true</code>, all diacritic equivalents within the regular
        expression are included – e.g. &#xe9; (<code>\u00e9</code>) has an
        equivalent of <code>e</code> plus a combining diacritic
        (<code>e\u0301</code>); if <code>false</code>, only the diacritics from
        the <code>string</code> parameter are processed.
      </td>
    </tr>
    <tr>
      <td>caseSensitive</td>
      <td>boolean</td>
      <td>true</td>
      <td>When <code>true</code>, case sensitive diacritics are matched; if
        <code>false</code>, both upper and lower case versions of the diacritic
        are included in the resulting regular expression.
      </td>
    </tr>
    <tr>
      <td>ignoreJoiners</td>
      <td>boolean</td>
      <td>false</td>
      <td>When <code>true</code>, word joiners to match soft hyphens, zero width
        space, zero width non-joiner and zero width joiners are added between
        each character in the resulting regular expression.
      </td>
    </tr>
    <tr>
      <td>flags</td>
      <td>string</td>
      <td>"gu"</td>
      <td>Flags to include when creating the regular expression. The "u" flag
        creates a
        <a href="https://mathiasbynens.be/notes/es6-unicode-regex">
          unicode-aware regular expression
        </a>.
      </td>
    </tr>
    <tr>
      <td>each</td>
      <td>function</td>
      <td>null</td>
      <td>This callback function allows modification of the resulting regular
        expression string for the character currently being processed.
        <pre>function(character, result, data, index) {
    return result;
}</pre>
        This callback has four parameters:
        <ul>
          <li>
            <code>character</code> parameter (type <code>string</code>)
            contains the current non-normalized character being processed
            (use <code>character.normalize("NFKC")</code> to make the character
            compatible with the database entry).
          </li>
          <li>
            <code>result</code> parameter (type <code>string</code>) contains
            the regular expression string equivalent of the current character
            (e.g. character <code>&#xFC;</code> may yield a result of
            <code>(\u00FC|u\u0308)</code>).
          </li>
          <li>
            <code>data</code> parameter (type <code>object</code>) contains the
            complete diacritic data object associated with the normalized
            regular expression <code>string</code> parameter, for example
            <pre>{
    lang: {
        variant: {
            diacritic: {
                metadata: {...},
                data: {...}
            }
        }
    }
}</pre>
          </li>
          <li>
            <code>index</code> parameter (type <code>number</code>) contains the
            current character index. This index matches the character position
            from the original regular expression <code>string</code> parameter.
          </li>
        </ul>
        Return a string or a modified string that is to be used in the regular
        expression. Any falsy values that are returned will not be added to
        the final regular expression.
      </td>
    </tr>
    <tr>
      <td>done</td>
      <td>function</td>
      <td>null</td>
      <td>This callback function allows modification of the finalized regular
        expression string.
        <pre>function(array, joiner) {
   return array.join(joiner);
}</pre>
        This callback has two parameters:
        <ul>
          <li>
            <code>array</code> parameter contains an array. Each array item is
            a string which results from the processing of the original
            <code>string</code> parameter after being split into separate
            characters; each item contains a diacritic (if
            <code>diacritics</code> is <code>true</code>), or non-diacritic
            (if <code>nonDiacritics</code> is <code>true</code>), but not both.
            And any special regular expression characters in the original
            <code>string</code> parameter will be escaped with a backslash (e.g.
            <code>^</code> is converted to <code>\^</code>).
          </li>
          <li>
            <code>joiner</code> parameter is a string which will be used to
            <code>.join()</code> the <code>array</code> parameter into its final
            regular expression string. When the <code>ignoreJoiners</code>
            option is <code>false</code>, this string is empty
            (<code>""</code>), and when the <code>ignoreJoiners</code> option is
            <code>true</code>, this string value becomes
            <code>"[\u00ad|\u200b|\u200c|\u200d]?"</code>.
          </li>
        </ul>
        Return the final regular expression string once it has been created.
      </td>
    </tr>
  </tbody>
</table>

The returned value will be a regular expression that matches the processed string, or the original string if no diacritics are included.

#### Examples &amp; comments:

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
        done: function(array, joiner) {
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

* Done callback

    ```js
    var diacritics = require("diacritics-transliterator");
    var regexp = diacritics.createRegExp("tést", {
        done: function(array, joiner) {
            // match whole words only
            // make sure to double escape the RegExp special characters "\\b"
            return "\\b" + array.join(joiner) + "\\b";
        }
    });
    // regexp => /\bt(\u00E9|e\u0301)st\b/gu
    ```

If no diacritics are found, then the regular expression will include the original text.

#### __Important Notes__

* This method is not meant to be used on HTML, and will escape any regular expression-like characters (e.g. `^(test)$` string is converted into the following string `\^\(test\)\$`).
* If you want to include the start `^` and end `$` anchors, use the `done` callback in a manner similar to the example above.
* Any regular expression special characters added within the callback functions must be double escaped (e.g. `\S` becomes `\\S`) because the regular expression is created from a string.
* Adding an escaped unicode character within the callbacks must not be double escaped (e.g. `\u00a0` contains a single backslash). If you have included any double escaped unicode as found in the database, use the [`diacritics.formatUnicode` method](#diacriticsformatunicodestring) to process it.

### diacritics.replacePlaceholder(string [, options])

Replaces one or more placeholders within the given string with the targeted diacritic values:

#### `string`

The `string` parameter (type: `string`) contains text with one or more diacritic placeholders to be replaced.

The default placeholder is set as `<% diacritics: {data} %>`.

The `{data}` portion of the placeholder contains two parts separated by a semi-colon: `filter;target`

Any spaces within the placeholder, including the `{data}` portion, are ignored.

Given the following placeholder:

```
<% diacritics: base = u; decompose %>
```

The `filter` is set as `base=u` and the `target` is set as `decompose`.

##### `filter`

The `filter` portion will be used as the diacritics.io database filter query (e.g. `base=u`).

The version route and query string indicator (e.g. the `/v1/?` in the full filter parameter `/v1/?base=u`) are not required. If included in the filter, it will be ignored as this method will always use the latest version.

A full list of valid api filters can be found in the [diacritics API specification](https://github.com/diacritics/api/tree/master/spec).

##### `target`

The `target` sets the destination value or values to be used when replacing the placeholder (e.g. `base` or `decompose`).

The data tree structure is as follows:

```
              _ {metadata}[]
             |            |__ "alphabet"
             |            |__ "language"
             |            |__ "native"
             |            |__ [continent][]
             |            |__ [country][]
 {variant}[]_|            |__ [source][]
             |
             |_ {data}__ {diacritic}[]__ {mapping}[]
                                    |             |__ "base"
                                    |             |__ "decompose"
                                    |
                                    |__ [equivalents][{}]
                                                      |__ "encoded_uri"
                                                      |__ "html_decimal"
                                                      |__ "html_entity"
                                                      |__ "html_hex"
                                                      |__ "raw"
                                                      |__ "unicode"
```

The `variant` and `diacritic` node names are _symbolic representations_ of the data contained within their respective nodes; they are not actually named in the data tree structure.

###### Tree item types

In the diagram above, nodes are wrapped with different symbols to indicate their type:

* Curly brackets are objects, e.g. `{variant}`.
* Square brackets are arrays, e.g. `[source]`.
* Quotes are strings, e.g. `"alphabet"`.

Do not include these wrapping symbols in the placeholder data target!

###### Target path

Valid end target nodes:

* Set the data target to a node with a string value.
* In certain cases, the target may be set to an array node, as when targeting the `continent`, `country` or `source` nodes. In these cases, all array items are included and combined using the string set in the `joiner` option.
* When setting a target, only the last node (of either string or array type) is necessary. For example, all of the following target path settings are equivalent:

   ```
   language
   metadata.language
   variant.language
   variant.metadata.language
   variant .  language
   metadata[language]
   ```

* Targeting an object node will result in _no modification_ of the placeholder, unless it has a filter set (e.g. `metadata[language]`).

###### Tree path filters

In the diagram above, node names followed by an array indicator (`[]`) signify a node that will accept a filter. The `equivalents` node has a special indicator (`[{}]`) because it is an array of object items, and can be filtered in a special way; this special case will be discussed below.

Here are a some examples of placeholder data settings with filters:

```
alphabet=latn;variant[de,es].data.diacritic[&#x00FC;, &#x00FA;].equivalents[raw, unicode, html_hex]
language=de;metadata[language, native]
base=u;equivalents.unicode.[0,2]
```

In general:

* Only object and array nodes may be filtered.
* Single or multiple filters may be included, and multiple entries must be separated by a comma.
* Spaces within the filters are ignored.
* Invalid or non-existent filters are ignored.
* If a filter contains all invalid entries, no results will be found and the original string will be returned.
* Multiple results will be joined using the string set in the `joiner` option; this method may be altered by the `done` callback function.

Filters are set depending on the node type and data:

* Symbolic object node filters:
  * The `variant` and `diacritic` nodes are symbolic representations of the data within the node.
  * These filters are set to match database results. If the database does not provide a match, then the filter is ignored.
  * In the example, the variant filter is set with `de,es`. The resulting data will only include the language variants "de" and "es"; but only if they exist in the provided data from the database.
  * The diacritic filter is set with `&#x00FC;, &#x00FA;` and will further narrow the results to these specific diacritics.
* Named object node filters:
  * The `metadata` and `equivalents` node filters will only accept immediate child nodes.
  * For example, `metadata[language, native]` will include both the English named language and the native language name in the results.
  * Setting `equivalents[raw, unicode, html_hex]` will include these named filters _for every equivalent diacritic_ in the result.
* Named array node filters:
  * The `continent`, `country`, `sources` and `equivalents` will only accept a numeric zero-based index.
  * For example, `sources[0,1]` will only include the first two values in the results. If the second doesn't exist, the index is ignored.
  * Nested filters __are not supported__, e.g. `metadata[source[0]]`.
* `equivalents` node special case:
  * The `equivalents` node contains an array of object data.
  * Filters set for this node may be set to include both child nodes and numeric indexes.
  * For example, if set to `equivalents[raw, unicode, html_hex, 0, 1]`, only the first and second (zero-based index) equivalent entries are targeted. Only the `raw`, `unicode` and `html_hex` values from those entries will be included in the result.
* Result filtering:
  * In the final example (`equivalents.unicode.[0,2]`), a result filter may be added to the end of the path.
  * The result filter _must_ be preceeded by a period separating it from the target node.
  * The filter only accepts zero-based index values.
  * These settings are applied to the array of resulting data items, but only after any duplicate entries are removed.
  * The filter is applied immediately before the `done` callback function.
  * For example:
    * A target set with `equivalents.unicode` would have the following result: `"\\u00FC, u\\u0308, \\u00FA, u\\u0301"`.
    * Adding a `.[0,2]` result filter will limit the final result to `\\u00FC, \\u00FA`.

#### `options`

The replacePlaceholder `options` parameter contains the following settings:

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Type</th>
      <th>Default</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>placeholder</td>
      <td>string</td>
      <td>"&lt;% diacritics: {data} %&gt;"</td>
      <td>The placeholder string template setting. The template must match the
        format used in the string that is passed to this function. The matching
        placeholder will be completely replaced by the results from the
        database. The <code>{data}</code> portion must be included. It contains
        the filter for data to obtain from the database, and sets the target
        information to include in the results.
      </td>
    </tr>
    <tr>
      <td>exclude</td>
      <td>array</td>
      <td>[ ]</td>
      <td>An array of specific variants and/or diacritics to be excluded from
        the result.
      </td>
    </tr>
    <tr>
      <td>joiner</td>
      <td>string</td>
      <td>", "</td>
      <td>String used to join the result array (<code>result.join("");</code>);
        It is used if the <code>done</code> callback function is not defined, or
        returns an array. And it is used when the target data is an array (e.g.
        <code>source</code>) that is not modified by the <code>each</code>
        callback function.
      </td>
    </tr>
    <tr>
      <td>each</td>
      <td>function</td>
      <td>null</td>
      <td>This callback function allows the processing of each matching data
        result.
        <pre>function(diacriticData, data, target) {
    return data[target];
}</pre>
        This callback has three parameters:
        <ul>
          <li>
            <code>diacriticData</code> parameter (type <code>object</code>)
            contains the complete diacritic data (both mapping &amp;
            equivalents) for the current diacritic.
          </li>
          <li>
            <code>data</code> parameter (type: <code>object</code> or
            <code>array</code>) contains the parent node of the targeted result.
            Combining this parameter with the <code>target</code> will provide
            the resulting data (i.e. <code>data[target]</code>); The resulting
            data will be either a string or an array. Modify and return the data
            as desired.
            <p>
            For example, this parameter may be the <code>metadata</code> object
            and the <code>target</code> may be set to <code>source</code>
            providing an array to manipulate. Or, this parameter may be an item
            from the <code>equivalents</code> array (an object) with the target
            set to <code>unicode</code> providing a string to manipulate.
          </li>
          <li>
            <code>target</code> parameter (type: <code>string</code>) contains
            the target key (e.g. <code>base</code> or <code>unicode</code>) such
            that you will always be able to use <code>data[target]</code> to get
            the intended result.
          </li>
        </ul>
        Return a modified string or array to be used in the placeholder result.
        Returning a falsy value (e.g. an empty string) will indicate that the
        value should not be included in the result.
      </td>
    </tr>
    <tr>
      <td>done</td>
      <td>function</td>
      <td>null</td>
      <td>Function to allow customization of the output string.
        <pre>function(result) {
    return result.join("");
}</pre>
        The <code>result</code> parameter:
        <ul>
          <li>Will only contain unique values.</li>
          <li>If a result filter has been defined in the query (e.g.
            <code>equivalents.raw.[0,1]</code>), then the <code>result</code>
            array will only contain those specific results, i.e. the filter
            will already be applied to the results.
          </li>
          <li>If the returned value is an array, it will be automatically be
            combined into a <code>string</code> using the <code>joiner</code>
            option. Return a string if you want to combine the array in a
            different manner.
          </li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

#### Example

```js
var diacritics = require("diacritics-transliterator");
var string = diacritics.replacePlaceholder("'u' is the base for '<!-- diacritics: base=u;equivalents.html_hex -->'", {
    placeholder: "<!-- diacritics: {data} -->"
    each: function(data, target) {
        // choose specific data to return
        return data[target];
    },
    // used to .join() the result if the done function is not defined
    joiner: ", ",
    done: function(placeholder, result) {
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
    done: function(placeholder, result) {
        return diacritics.formatUnicode(result.join(", "));
    }
});
// string => "'u' is the base for 'ü, ü, ú, ú'"
```

---

# Related

- [diacritics database](https://github.com/diacritics/database) – the database behind node-transliterator.
- [diacritics API](https://github.com/diacritics/api) – the API for the diacritics database.

# [License](LICENSE)
