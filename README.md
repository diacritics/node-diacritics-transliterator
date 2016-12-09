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
// de -> {"de":{...}}
```

## API

### Initializing

Each API method requires the `diacritics-transliterator` module.

```js
var diacritics = require("diacritics-transliterator");
```

### Basic functions

#### `diacritics.setVersion(version)`

Upon initialization, this module is set to the latest major release version of the diacritics API. To change the version, use this function to set the API to the desired _major_ release.

The version parameter will accept the following values:

* `v#`, where `v` is the abbreviation for "version" and `1` is the major release value.
* `1`, where `1` is a numeric value or string.
* Parsed values must be greater than zero and less than the current major release version.

```js
var diacritics = require("diacritics-transliterator");
diacritics.setVersion("v1"); // "v1" returned
```

Invalid values will be ignored and the version will remain unchanged.

The returned value will be a string with a leading "v" (for version) followed by the currently set version number.

#### `diacritics.getVersion()`

Upon initialization, this function will always return the current major release version of the diacritics API.

```js
var diacritics = require("diacritics-transliterator");
diacritics.getVersion(); // "v1" returned
```

The returned value will be a string with a leading "v" (for version) followed by the currently set version number.

#### `diacritics.getLanguage(code)`

Returns the variant(s) metadata and data for the selected language code.

The `code` parameter will accept any of the following case insensitive values:

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

#### `diacritics.getVariant(code)`

Returns the metadata and data for the selected language variant code.

The `code` parameter will accept any of the following case insensitive values:

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

#### `diacritics.getAlphabet(code)`

Returns the metadata and data for all languages matching the given alphabet code.

The `code` parameter must be set using a [ISO 15924](https://en.wikipedia.org/wiki/ISO_15924) case insensitive script code value, e.g. `Latn`.

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

#### `diacritics.getContinent(code)`

Returns the metadata and data for all languages matching the given continent code.

The `code` parameter must be set using a [ISO-3166](https://en.wikipedia.org/wiki/List_of_sovereign_states_and_dependent_territories_by_continent_%28data_file%29) case insensitive value, e.g. `EU`:

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

### Data processing functions

#### `diacritics.getDiacritics(string)`

Returns the metadata and data for all matching diacritics within the string.

The `string` parameter contains one or more diacritics to process.

```js
var diacritics = require("diacritics-transliterator");
var data = diacritics.getDiacritics("abcñ-ß123");
/*
{
    "es": {
        "metadata": {...},
        "data": {
            "ñ": {...}
        }
    },
    "de": {
        "metadata": {...},
        "data: {
            "ß": {...}
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

#### `diacritics.getBase(string)`

Returns the base data for all matching diacritics within the string.

WIP...

#### `diacritics.getDecomposed(string)`

Returns the decomposed data for all matching diacritics within the string.

WIP...

#### `diacritics.getEquivalents(string)`

Returns the equivalents data for all matching diacritics within the string.

WIP...

### Transliteration functions

#### `diacritics.transliterate(string, type, [, variant])`

Replaces diacritics within the string with either the base or decomposed value. If the `variant` parameter is not defined, the first matching language for the diacritic will be used.

WIP...

#### `diacritics.createRegex(string, options)`

Creates a regular expression to match the entire string. Set the `options` to only target only diacritics or non-diacritics.

WIP...

---

## [License](LICENSE)
