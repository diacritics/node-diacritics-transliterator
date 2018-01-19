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
    const arr = `['${this.collectEquivalents().join('\',\'')}']`;
    return `${this.options.type} ${this.options.name} = ${arr};`;
  }

  collectEquivalents() {
    const concat = []; // arr of strings (equivalent characters)
    this.joinDiacriticsAndMapping().forEach(equivalents => {
      const joined = equivalents.join(''),
        found = equivalents.some(char => {
          const idx = concat.indexOf(char);
          if (idx > -1) {
            concat[idx] = concat[idx] + joined;
            return true;
          }
          return false;
        });
      if (!found) {
        concat.push(joined);
      }
    });
    return concat;
  }

  joinDiacriticsAndMapping() {
    const equivalentsCollection = [];
    this.extractDiacritics().forEach(obj => {
      const {key, value} = obj,
        equivalents = [key];
      if (value.mapping.base) {
        equivalents.push(value.mapping.base);
      }
      /* Decompose makes no sense in the current array of single characters
      if (value.mapping.decompose) {
        for (let decomposeProp of Object.keys(value.mapping.decompose)) {
          if (value.mapping.decompose[decomposeProp]) {
            equivalents.push(value.mapping.decompose[decomposeProp]);
          }
        }
      }
      */
      equivalentsCollection.push(equivalents);
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
}

const singleton = new Replace();
module.exports = function() {
  return singleton.init(...arguments);
};