/*!***************************************************
 * node-diacritics-transliterator
 * http://diacritics.io/
 * Copyright (c) 2018 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
'use strict';
const fetch = require('./fetch.js'),
  outputGenerator = require('./output-generator');

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
        outputGenerator().then(json => {
          this.data = json;
          resolve(input.replace(this.options.placeholder, this.createString()));
        }, msg => eject(msg));
      } else {
        eject('Invalid parameters');
      }
    });
  }

  createString() {
    const json = JSON.stringify(this.data);
    return `${this.options.type} ${this.options.name} = ${json};`;
  }
}

const singleton = new Replace();
module.exports = function() {
  return singleton.init(...arguments);
};