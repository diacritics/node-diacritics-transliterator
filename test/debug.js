/*!***************************************************
 * node-diacritics-transliterator
 * http://diacritics.io/
 * Copyright (c) 2018 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
'use strict';
const Diacritic = require('./../src/main.js');

const testString = `
var x = "Hello";
// <% diacritics %>
`;

Diacritic.replace(testString).then(response => {
  console.log(response);
}, msg => {
  throw new Error(`Failed: ${msg}`);
});
