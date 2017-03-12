# node-diacritics-transliterator

> Diacritic transliteration tools using diacritics.io API

# Installation

```bash
$ npm install diacritics-transliterator
```

# Usage

```js
const diacritics = require("diacritics-transliterator");
const de = diacritics.getData({
    language: "German"
});
/* de => {"de":{...}} */
```

# API

## Contents

- [Initializing](#initializing)
- [Basic functions](#basic-functions)
  - [getVersion](#getversion)
  - [setVersion](#setversion)
  - [getData](#getdata)
  - [getDiacritics](#getdiacritics)
  - [formatUnicode](#formatunicode)
- [Transliteration functions](#transliteration-functions)
  - [transliterate](#transliterate)
  - [createRegExp](#createregexp)
  - [replacePlaceholder](#replaceplaceholder)
- [Command Line Interface](#command-line-interface)

## Initializing

Each API method requires the `diacritics-transliterator` module.

**Syntax**

```js
const diacritics = require("diacritics-transliterator");
```

**Return Value**

The diacritics module.

**Parameters**

<dl>
  <dt><code>version</code> (optional)</dt>
  <dd>The version of the database API to use. Defaults to the current version.</dd>
</dl>

## Basic functions

### getVersion

Use this function to get the currently set API version.

**Syntax**

```js
diacritics.getVersion();
```

**Return Value**

The database API major release version formatted as a string with a "v" prefix.

**Parameters**

None

**Example**

```js
const diacritics = require("diacritics-transliterator");
const version = diacritics.version;
/* version => "v1" */
```

### setVersion

Upon initialization, this module is set to the latest major release version of the diacritics API. To change the version, set the version of the API to the desired major release.

**Syntax**

```js
diacritics.version = version;
```

**Return Value**

If valid, the set database API version formatted as a string with a "v" prefix.

If invalid, the current database API major release version is returned.

**Parameters**

<dl>
  <dt><code>version</code></dt>
  <dd>The version to set. Formatted as a string <code>"v1"</code> or number <code>1</code>.</dd>
</dl>

**Example**

```js
const diacritics = require("diacritics-transliterator");
diacritics.version = "v1";
/* => "v1" */
```

### getData

Function to return specificially filtered data from the diacritics database. Include one or more filters to narrow the query. Invalid filters are ignored.

The API _does not_ currently support setting filters as arrays; but internally, if and only if __one__ filter, is set as an array, the metadata and data for all elements within that array will be returned.

**Syntax**

```js
diacritics.getData({
    "alphabet": "",
    "base": "",
    "continent": "",
    "country": "",
    "decompose": "",
    "diacritic": "",
    "language": "",
    "variant": ""
});

// or any single filter will support array values
diacritics.getData({
    "base": []
});
```

**Return value**

An object containing the matching variants with associated metadata and any diacritic specific data as shown in the [database specification](https://github.com/diacritics/database/tree/master/spec#31-diacriticsjson) is returned.

An error will be thrown if the filters are empty, or all invalid.

If a single filter is used and set as an array, the returned object will contain a combination of all resulting metadata &amp; data.

An error will be thrown if the single filter array contains any invalid or non-existent values.

**Parameters**

All parameters are optional, but at least one must be set.

<dl>
  <dt><code>alphabet</code></dt>
  <dd>The language alphabet code (per <a href="https://en.wikipedia.org/wiki/ISO_15924">ISO 15924</a>).</dd>

  <dt><code>base</code></dt>
  <dd>The diacritic base value.</dd>

  <dt><code>continent</code></dt>
  <dd>The continent code (per <a href="https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_by_continent_%28data_file%29#Format">ISO 3166</a>).</dd>

  <dt><code>country</code></dt>
  <dd>The country code (per <a href="https://www.w3.org/International/articles/language-tags/">IETF BCP 47</a>).</dd>

  <dt><code>decompose</code></dt>
  <dd>The diacritic decomposed value.</dd>

  <dt><code>diacritic</code></dt>
  <dd>A specific diacritic.</dd>

  <dt><code>language</code></dt>
  <dd>The associated language written in English.</dd>

  <dt><code>variant</code></dt>
  <dd>The language variant (per <a href="https://www.w3.org/International/articles/language-tags/">IETF BCP 47</a>) with the root language stripped away, or the full name of the country for the variant.</dd>
</dl>

**Examples**

```js
const diacritics = require("diacritics-transliterator");
/* showing all filters (currently only one setting per filter allowed) */
const data = diacritics.getData({
    "alphabet": "Latn",
    "language": "de"
});
/* data =>
{
    "de": {
        "metadata": { ... }
        "data": { ... }
    }
}
*/

const multiple = diacritics.getData({
    "language": ["de", "es"]
});
/* multiple =>
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

const invalid = diacritics.getData({
    "foo": "bar"
});
/* thrown error => "Unable to access the API with empty or invalid filters" */
```

### getDiacritics

Pass this function a string with, or without diacritics, and an object containing the language variants that match the diacritics, with associated metadata and data will be returned.

If no diacritics are found in the string, an object with a "message" key will be returned stating "No diacritics found".

**Syntax**

```js
diacritics.getDiacritics(string);
```

**Return Value**

An object will be returned containing metadata and data for every matching language variant for the associated diacritic. The language `data` will only contain the matching diacritic.

Invalid inputs will throw an error.

**Parameters**

<dl>
  <dt><code>string</code></dt>
  <dd>A string containing one or more diacritics characters.</dd>
</dl>

**Examples**

```js
const diacritics = require("diacritics-transliterator");
const data = diacritics.getDiacritics("abcñ-ß123");
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

### formatUnicode

Converts the escaped unicode as stored within the database (e.g. `\\uHHHH`, where H = hex) into actual unicode characters. Using a simple replace function will appear to work, but it does not create an actual unicode character; use this function to properly convert the string.

Alternatively, instead of using the "unicode" data, get the "raw" data from the database.

**Syntax**

```js
diacritics.formatUnicode(string);
```

**Return Value**

A string will be returned with any escaped unicode replaced with the equivalent unicode value. Regular characters and any diacritics within the string will not be modified.

Invalid inputs will throw an error.

**Parameters**

<dl>
  <dt><code>string</code></dt>
  <dd>A string containing one or more escaped unicode characters.</dd>
</dl>

**Examples**

```js
const string = require("diacritics-transliterator").formatUnicode("T\\u00E9st");
/* string => "Tést" */

const invalid = require("diacritics-transliterator").formatUnicode(1234);
/* thrown error => "Error: Invalid input string" */
```

## Transliteration functions

### transliterate

Replaces diacritics within the string with either the base or decomposed value. Any non-diacritics characters will not be modified.

If no matching diacritics are found in the string or database, the original string is returned.

**Syntax**

```js
diacritics.transliterate(string [, type][, variant]);
```

**Return Value**

The returned value will be a string with all matching diacritics replaced with the set type ("base" or "decompose") value.

Note:
- An invalid `string` parameter will throw an error.
- An invalid `type` parameter will throw an error.
- An invalid `variant` parameter or a set variant that does not include one or more diacritics in the string, will not process that diacritic. The original string may be returned in some cases.

**Parameters**

<dl>
  <dt><code>string</code></dt>
  <dd>A string containing one or more diacritic characters.</dd>

  <dt><code>type</code></dt>
  <dd>An optional string value set to either "base" or "decompose".
      <ul>
          <li>It defaults to "base".</li>
          <li>If a "base" value is set and is not found, the "decompose" value will be used instead.</li>
          <li>If a "decompose" value is set and is not found, it will fallback to the "base" value.</li>
      </ul>
  </dd>

  <dt><code>variant</code></dt>
  <dd>A string set to the language variant. If no variant is provided, the first matching language for the diacritic will be used.</dd>
</dl>


**Examples**

```js
const transliterate = require("diacritics-transliterator").transliterate;

const german = transliterate("¿abcñ-ß123?", "decompose" "de");
/* german => "¿abcñ-ss123?"; only the German s-sharp is replaced */

const spanish = transliterate("¿abcñ-ß123?", "base", "es");
/* spanish => "?abcn-ß123?"; only the Spanish ñ is modified */

const generic = transliterate("¿abcñ-ß123?");
/* generic => "?abcn-ß123?"; the base of ß is still ß */

const unchanged = transliterate("¿abcñ-ß123?", "base", "test");
/* unchanged => "¿abcñ-ß123?"; if no diacritics match the set language variant,
  the original string is returned */

const invalidString = transliterate(1234, "decompose", "de");
/* thrown error => "Error: Invalid input string" */

const invalidType = transliterate("?abcn-ß123?", "test", "de");
/* thrown error => "Transliterate Error: Invalid 'type' value" */
```

### createRegExp

This function creates a regular expression that matches, or ignores, diacritics in the given `string`.

The regular expression can:

- Match all diacritics with or without their equivalents.
- Match only non-diacritics, which ignores the diacritic and allows matching any character(s).
- Match all diacritics in a case-insensitive manner.
- Ignore any joiners (soft hyphens, zero width space, zero width non-joiner and zero width joiners) that may occur within the string.
- Match the original string if no diacritics are found.

**Syntax**

```js
diacritics.createRegExp(string [, options])
```

**Return Value**

The returned value will be always return a regular expression.

The regular expression will match the processed string, or the original string if no diacritics are included.

Invalid inputs will throw an error.

**Parameters**

The function uses the following parameters:

<dl>
  <dt><code>string</code></dt>
  <dd>A string containing text with or without diacritic characters to be processed into a regular expression that matches this value.</dd>

  <dt><code>options</code></dt>
  <dd>A object containing any set options:
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
          <td>When <code>true</code>, all diacritics from the<code>string</code>
            parameter are included; if <code>false</code>, all diacritics within
            the regular expression will be replaced with a <code>"\\S"</code>
            (set by the <code>replaceDiacritic<code> setting).
          </td>
        </tr>
        <tr>
          <td>replaceDiacritic</td>
          <td>string</td>
          <td>"\\S"</td>
          <td>Character used to replace diacritics when the
            <code>diacritics</code> option is <code>false</code>. A range
            <code>{1,2}</code> is only added if the diacritic contains multiple
            characters (e.g. letter + combining diacritic(s)) and the
            <code>replaceDiacritic</code> option is set as <code>"\\S"</code>
            (e.g. <code>e\u0301</code> becomes <code>\\S{1,2}</code>. Make sure
            to double escape any regular expression special characters.
          </td>
        </tr>
        <tr>
          <td>nonDiacritics</td>
          <td>boolean</td>
          <td>true</td>
          <td>When <code>true</code>, all non-diacritic characters from the
            <code>string</code> parameter are included; if <code>false</code>,
            non-diacritics are excluded so that only diacritics are targeted by
            the regular expression.
          </td>
        </tr>
        <tr>
          <td>includeEquivalents</td>
          <td>boolean</td>
          <td>true</td>
          <td>When <code>true</code>, all diacritic equivalents within the
            regular expression are included – e.g. &#xe9; (<code>\u00e9</code>)
            has an equivalent of <code>e</code> plus a combining diacritic
            (<code>e\u0301</code>); if <code>false</code>, only the diacritics
            from the <code>string</code> parameter are processed.
          </td>
        </tr>
        <tr>
          <td>caseSensitive</td>
          <td>boolean</td>
          <td>true</td>
          <td>When <code>true</code>, case sensitive diacritics are matched; if
            <code>false</code>, both upper and lower case versions of the
            diacritic are included in the resulting regular expression.
          </td>
        </tr>
        <tr>
          <td>ignoreJoiners</td>
          <td>boolean</td>
          <td>false</td>
          <td>When <code>true</code>, word joiners to match soft hyphens, zero
            width space, zero width non-joiner and zero width joiners are added
            between each character in the resulting regular expression.
          </td>
        </tr>
        <tr>
          <td>flags</td>
          <td>string</td>
          <td>"gu"</td>
          <td>Flags to include when creating the regular expression. The "u"
            flag creates a
            <a href="https://mathiasbynens.be/notes/es6-unicode-regex">
              unicode-aware regular expression
            </a>.
          </td>
        </tr>
        <tr>
          <td>each</td>
          <td>function</td>
          <td>null</td>
          <td>This callback function allows modification of the resulting
            regular expression string for the character currently being
            processed.
            <pre>function(character, result, data, index) {
    return result;
}</pre>
            This callback has four parameters:
            <ul>
              <li>
                <code>character</code> parameter (type <code>string</code>)
                contains the current non-normalized character being processed
                (use <code>character.normalize("NFKC")</code> to make the
                character compatible with the database entry).
              </li>
              <li>
                <code>result</code> parameter (type <code>string</code>)
                contains the regular expression string equivalent of the current
                character (e.g. character <code>&#xFC;</code> may yield a result
                of <code>(\u00FC|u\u0308)</code>).
              </li>
              <li>
                <code>data</code> parameter (type <code>object</code>) contains
                the complete diacritic data object associated with the
                normalized regular expression <code>string</code> parameter, for
                example
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
                <code>index</code> parameter (type <code>number</code>) contains
                the current character index. This index matches the character
                position from the original regular expression
                <code>string</code> parameter.
              </li>
            </ul>
            Return a string or a modified string that is to be used in the
            regular expression. Any falsy values that are returned will not be
            added to the final regular expression.
          </td>
        </tr>
        <tr>
          <td>done</td>
          <td>function</td>
          <td>null</td>
          <td>This callback function allows modification of the finalized
            regular expression string.
            <pre>function(array, joiner) {
   return array.join(joiner);
}</pre>
            This callback has two parameters:
            <ul>
              <li>
                <code>array</code> parameter contains an array. Each array item
                is a string which results from the processing of the original
                <code>string</code> parameter after being split into separate
                characters; each item contains a diacritic (if
                <code>diacritics</code> is <code>true</code>), or non-diacritic
                (if <code>nonDiacritics</code> is <code>true</code>), but not
                both. And any special regular expression characters in the
                original <code>string</code> parameter will be escaped with a
                backslash (e.g. <code>^</code> is converted to <code>\^</code>).
              </li>
              <li>
                <code>joiner</code> parameter is a string which will be used to
                <code>.join()</code> the <code>array</code> parameter into its
                final regular expression string. When the
                <code>ignoreJoiners</code> option is <code>false</code>, this
                string is empty (<code>""</code>), and when the
                <code>ignoreJoiners</code> option is <code>true</code>, this
                string value becomes
                <code>"[\u00ad|\u200b|\u200c|\u200d]?"</code>.
              </li>
            </ul>
            Return the final regular expression string once it has been created.
          </td>
        </tr>
      </tbody>
    </table>
  </dd>
</dl>

**Examples**

* Default settings

    ```js
    const diacritics = require("diacritics-transliterator");

    const regexp = diacritics.createRegExp("Tést", {
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
    /* regexp => /T(\u00E9|e\u0301)st/gu */
    ```

* Non-diacritics only

    ```js
    const diacritics = require("diacritics-transliterator");

    const regexp = diacritics.createRegExp("Tést", {
        diacritics: false
    });
    /* regexp => /T\\S{1,2}st/gu */
    ```

  * When `false`, all diacritics in the original string are replaced with `\\S`. The `\\S` replacement is defined in the `replaceDiacritic` option, and the range `{1,2}` is only added if:
    * The original diacritic, or equivalents (if `includeEquivalents` is `true`) contains multiple characters (e.g. letter + combining diacritic).
    * And the `replaceDiacritic` option is set as `"\\S"`.
  * Make sure to double escape any regular expression special characters (e.g. `\\b`).
  * Do not double escape the unicode escape format (e.g. `\u00A0`, not `\\u00A0`).
  * If both the `nonDiacritics` and `diacritics` options are set to `false`, the resulting regular expression will become `/(?:)/gu` and match everything.

* Diacritics only

    ```js
    const diacritics = require("diacritics-transliterator");

    const regexp = diacritics.createRegExp("Tést", {
        nonDiacritics: false
    });
    /* regexp => /(\u00E9|e\u0301)/gu */
    ```

  * When `false`, non-diacritic characters are not even referenced in the resulting regular expression.
  * If both the `nonDiacritics` and `diacritics` options are set to `false`, the resulting regular expression will become `/(?:)/gu` and match everything.

* Do not include equivalents

    ```js
    const diacritics = require("diacritics-transliterator");

    const regexp = diacritics.createRegExp("Tést", {
        includeEquivalents: false
    });
    /* regexp => /T\u00E9st/gu */
    ```

  * When `false`, only the original diacritics are included.

* Case insensitive

    ```js
    const diacritics = require("diacritics-transliterator");

    const regexp = diacritics.createRegExp("Ä Tést", {
        caseSensitive: false
    });
    /* regexp => /(\u00C4|A\u0308|\u00E4|a\u0308) T(\u00C9|E\u0301|\u00E9|e\u0301)st/gu */
    ```

  * When `false`, the upper and lower case diacritic, and any equivalents (if the `includeEquivalents` option is `true`), are included in the matching regular expression.

* Include joiners

    ```js
    const diacritics = require("diacritics-transliterator");

    const regexp = diacritics.createRegExp("Tést", {
        ignoreJoiners: true
    });
    /* regexp =>
     /T[\u00ad|\u200b|\u200c|\u200d]?(\u00E9|e\u0301)[\u00ad|\u200b|\u200c|\u200d]?s[\u00ad|\u200b|\u200c|\u200d]?t/gu
    */
    ```

  * When `true`, regular expression matches for soft hyphens (`\u00ad`), zero width space (`\u200b`), zero width non-joiner (`\u200c`) and zero width joiners (`\u200d`) are included between each character.

* Regular expression flags

    ```js
    const diacritics = require("diacritics-transliterator");

    const regexp = diacritics.createRegExp("Tést", {
        flags: "giu"
    });
    /* regexp => /T(\u00E9|e\u0301)st/giu */
    ```

* Each callback

    ```js
    const diacritics = require("diacritics-transliterator");

    const regexp = diacritics.createRegExp("a tést", {
        each: function(character, result, data, index) {
            // Replace space with regular expression whitespace
            // make sure to double escape the RegExp special characters "\\s"
            return character === " " ? "\\s+" : result;
        }
    });
    /* regexp => /a\s+t(\u00E9|e\u0301)st/gu */
    ```

* Done callback

    ```js
    const diacritics = require("diacritics-transliterator");

    const regexp = diacritics.createRegExp("tést", {
        done: function(array, joiner) {
            // match whole words only
            // make sure to double escape the RegExp special characters "\\b"
            return "\\b" + array.join(joiner) + "\\b";
        }
    });
    /* regexp => /\bt(\u00E9|e\u0301)st\b/gu */
    ```

* Invalid input

    ```js
    const diacritics = require("diacritics-transliterator");

    const invalid = diacritics.createRegExp(1234);
    /* thrown error => "Error: Invalid input string" */
    ```


#### __Important Notes__

* This method is not meant to be used on HTML, and will escape any regular expression-like characters (e.g. `^(test)$` string is converted into the following string `\^\(test\)\$`).
* If you want to include the start `^` and end `$` anchors, use the `done` callback in a manner similar to the example above.
* Any regular expression special characters added within the callback functions must be double escaped (e.g. `\S` becomes `\\S`) because the regular expression is created from a string.
* Adding an escaped unicode character within the callbacks must not be double escaped (e.g. `\u00a0` contains a single backslash). If you have included any double escaped unicode as found in the database, use the [`diacritics.formatUnicode` method](#formatunicode) to process it.

### replacePlaceholder

Replaces one or more placeholders within the given string with the targeted diacritic values.

**Syntax**

```js
diacritics.replacePlaceholder(string [, options]);
```

**Return Value**

A string will be returned with one or more placeholderes replaced with the set inline placeholder options

Invalid inputs will throw an error.

**Parameters**

<dl>
  <dt><code>string</code></dt>
  <dd>A string containing text with one or more diacritic placeholders to be replaced.</dd>
</dl>

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

<dl>
  <dt><code>options</code></dt>
  <dd>A object containing any set options:
</dl>

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

**Examples**

```js
const diacritics = require("diacritics-transliterator");

const string = diacritics.replacePlaceholder("'u' is the base for '<!-- diacritics: base=u;equivalents.html_hex -->'", {
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
/* string => "'u' is the base for '&#x00FC;, u&#x0308;, &#x00FA;, u&#x0301;'" */
```

To convert escaped unicode (e.g. `\\u00FC`) into actual unicode, use the [`diacritics.formatUnicode`](#formatunicode) function, or use the `base.raw` data type:

```js
const diacritics = require("diacritics-transliterator");

const string = diacritics.replacePlaceholder("'u' is the base for '<% diacritics: base=u;equivalents.unicode %>'", {
    done: function(placeholder, result) {
        return diacritics.formatUnicode(result.join(", "));
    }
});
/* string => "'u' is the base for 'ü, ü, ú, ú'" */
```

Invalid strings throw an error

```js
const diacritics = require("diacritics-transliterator");

const invalid = diacritics.replacePlaceholder();
/* thrown error => "Error: Invalid input string" */
```

### Command Line Interface

Command line interface (CLI) support is provided for the functions listed below.

#### Install

```bash
$ npm install --global diacritics-transliterator
```

#### Usage

```bash
$ diacritics --help

  Usage
    $ diacritics <string> [--<function> [args]]

  Functions
    --fu, --formatUnicode       Format unicode
    --tr, --transliterate       Transliterate
    --cr, --createRegExp        Create Regular Expression
    --rp, --replacePlaceholder  Replace placeholder

  Options
    --h  Get help for a specific function

  Examples
    $ diacritics "\\\\u00e9\\\\u00c9A\\\\u0301" --fu
    éÉÁ
    $ diacritics --tr -h
    $ diacritics --rp -h
```

**formatUnicode**

```bash
  formatUnicode usage
    $ diacritics <string> --fu

  Examples
    $ diacritics "T\\\\u00e9st" --fu
    Tést
    $ diacritics \\\\u00e9\\\\u00c9A\\\\u0301 --fu
    éÉÁ
```

**transliterate**

```bash
  transliterate usage
    $ diacritics <string> --tr [...]

  Options
    -t, --type     Type of transliteration [base|decompose] (Default: base)
    -v, --variant  Language variant

  Example
    $ diacritics "¿Te gustan los diacríticos?" --tr -v=es -t=base
    ?Te gustan los diacriticos?
```

**createRegExp**

```bash
  createRegExp usage
    $ diacritics <string> --cr [...]

  Options (add "no-" prefix to set the option to false)
      caseSensitive (default = true)
          --c, --caseSensitive, --no-c, --no-caseSensitive
      diacritics (default = true)
          --d, --diacritics, --no-d, --no-diacritics
      flags (default = "gu")
          --f="gu", --flags="gu"
      ignoreJoiners (default = false)
          --j, --ignoreJoiners, --no-j, --no-ignoreJoiners
      includeEquivalents (default = true)
          --e, --includeEquivalents, --no-e, --no-includeEquivalents
      nonDiacritics to false (default = true)
          --n, --nonDiacritics, --no-n, --no-nonDiacritics
      replaceDiacritic (default = "\\\\S")
          --r="\\\\S", --replaceDiacritic="\\\\S"

  Example
    $ diacritics "T\u00E9st" --cr --no-c
    /T(\\u00E9|e\\u0301|\\u00C9|E\\u0301)st/gu
```

**replacePlaceholder**

```bash
  replacePlaceholder usage
    $ diacritics <string> --rp --p="<% diacritics:{query} %>" --e="xx,yy"

  options
      placeholder (default = "<% diacritics:{query} %>")
          --p="<% diacritics:{query} %>"
          --placeholder="<% diacritics:{query} %>"
      exclude (default = ""; use comma separated values)
          --e="xx,yy"
          --exclude="xx,yy"
      joiner (default = ", ")
          --j=", "
          --joiner=", "

  Example
    $ diacritics "u='<% diacritics:base=u;equivalents.raw %>'" --rp
    u='ü, ü, ú, ú'
    $ diacritics "u='<% diacritics:base=u;equivalents.raw %>'" --rp --j="+"
    u='ü+ü+ú+ú'
```

---

# Related

- [diacritics database](https://github.com/diacritics/database) – the database behind node-transliterator.
- [diacritics API](https://github.com/diacritics/api) – the API for the diacritics database.

# Contribution and License Agreement

If you contribute to this project, you are implicitly allowing your code to be distributed under [this license][license]. You are also implicitly verifying that all code is your original work.

[license]: https://git.io/v1EBe
