/*!***************************************************
 * node-diacritics-transliterator
 * http://diacritics.io/
 * Copyright (c) 2018 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
'use strict';
const fetch = require('./fetch.js');

class Replace {
  constructor() {
    this.input = '';
    this.options = {
      placeholder: '// <% diacritics %>',
      type: 'const',
      name: 'diacritics'
    };
    this.data = {};
  }

  init(input = this.input, options = {}) {
    this.options = Object.assign({}, this.options, options);
    return new Promise((resolve, eject) => {
      if (typeof input === 'string' && input && typeof options === 'object') {
        fetch().then(json => {
          this.data = json;
          resolve(input.replace(this.options.placeholder, this.createString()));
        }, msg => eject(msg));
      } else {
        eject('Invalid parameters');
      }
    });
  }

  createString() {
    const json = JSON.stringify(this.joinDiacriticsAndMapping());
    return `${this.options.type} ${this.options.name} = ${json};`;
  }

  joinDiacriticsAndMapping() {
    const equivalentsCollection = {
      'lower': [],
      'upper': [],
      'none': []
    };
    this.extractDiacritics().forEach(obj => {
      const {key: diacritic, value: data} = obj;
      let chars = [diacritic];
      if (data.mapping.base) {
        chars.push(data.mapping.base);
      }
      if (data.mapping.decompose) {
        if (data.mapping.decompose.value) {
          chars.push(data.mapping.decompose.value);
        }
        if (data.mapping.decompose.titleCase) {
          chars.push(data.mapping.decompose.titleCase);
        }
      }
      if (this.arrIncludes(equivalentsCollection[data.case], chars) < 0) {
        // Only push when all the equivalent characters don't exist. E.g.
        // ü is available in "de" and "es", however only in German it has a
        // decompose value of "ue". Therefore two entries must be available for
        // that (redundant) diacritic. Otherwise only push it once
        equivalentsCollection[data.case].push(chars);
      }
    });
    return equivalentsCollection;
  }

  extractDiacritics() {
    const arr = [];
    for (let lang of Object.keys(this.data)) {
      for (let variant of Object.keys(this.data[lang])) {
        for (let diacritic of Object.keys(this.data[lang][variant].data)) {
          arr.push({
            key: diacritic,
            value: this.data[lang][variant].data[diacritic]
          });
        }
      }
    }
    return arr;
  }

  arrIncludes(haystack, needle) {
    let i, j, current;
    for (i = 0; i < haystack.length; ++i) {
      if (needle.length === haystack[i].length) {
        current = haystack[i];
        for (j = 0; j < needle.length && needle[j] === current[j]; ++j) {
          // already incremented j (comment for linting purposes)
        }
        if (j === needle.length) {
          return i;
        }
      }
    }
    return -1;
  }
}

const singleton = new Replace();
module.exports = function() {
  return singleton.init(...arguments);
};