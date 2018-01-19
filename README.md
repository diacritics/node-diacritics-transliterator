# node-diacritics-transliterator

[![Build Status](https://img.shields.io/travis/diacritics/node-diacritics-transliterator/master.svg)](https://travis-ci.org/diacritics/node-diacritics-transliterator)
[![Greenkeeper](https://badges.greenkeeper.io/diacritics/node-diacritics-transliterator.svg)](https://github.com/diacritics/node-diacritics-transliterator/)

> Diacritic transliteration tool using the diacritics.io API

# Installation

```bash
$ npm install diacritics-transliterator
```

# Module

The module exports an object with the following functions:

## replace()

This function replaces a placeholder inside a string with an array of equivalent diacritics and their mappings. You can use it e.g. to create a regular expression.

**Parameters**:

_input_

Type: `string`

A string of JavaScript code.

_options_

Type: `object`  
Optional: `true`

An object of options:

| Name | Type | Default | Description |
|-------------|--------|-----------------------|---------------------------------------------------------------------------------------------------|
| placeholder | string | '// <% diacritics %>' | The placeholder that will be replaced with  an array of equivalent diacritics and their mappings |
| type | string | 'const' | The variable type |
| name | string | 'diacritics' | The variable name |
