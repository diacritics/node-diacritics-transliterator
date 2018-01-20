/*!***************************************************
 * node-diacritics-transliterator
 * http://diacritics.io/
 * Copyright (c) 2018 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
'use strict';
const Diacritic = require('./../src/main.js'),
  assert = require('assert');

describe('Replace', () => {

  it('should return a string without crashing', done => {
    const testString = `
var x = "Hello";
// <% diacritics %>
`;

    Diacritic.replace(testString).then(response => {
      assert.ok(typeof response === 'string');
      assert.ok(response.length > 0);
      done();
    }, msg => {
      throw new Error(`Failed: ${msg}`);
    });
  });
});

