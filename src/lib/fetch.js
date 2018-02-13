/*!***************************************************
 * node-diacritics-transliterator
 * http://diacritics.io/
 * Copyright (c) 2018 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
'use strict';
const nodeFetch = require('node-fetch');

const fetch = params => {
  const query = !params ? '' : Object.keys(params).map((k, idx) => {
    let prefix = '';
    if (idx === 0) {
      prefix = '?';
    }
    return prefix + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  const url = `https://api.diacritics.io/v1/${query}`;
  return new Promise((resolve, eject) => {
    nodeFetch(url).then(res => res.json(), err => {
      return eject(err.message);
    }).then(json => {
      if (json) {
        resolve(json);
      } else {
        eject('Invalid response format');
      }
    });
  });
};

module.exports = fetch;