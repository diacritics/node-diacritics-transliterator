/*!***************************************************
 * node-diacritics-transliterator
 * http://diacritics.io/
 * Copyright (c) 2018 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
'use strict';
const nodeFetch = require('node-fetch');

const fetch = () => {
  const url = 'https://api.diacritics.io/v1/';
  return new Promise((resolve, eject) => {
    nodeFetch(url).then(res => res.json(), err => {
      return eject(err.message);
    }).then(json => {
      if (json) {
        resolve(json);
      } else {
        eject();
      }
    });
  });
};

module.exports = fetch;