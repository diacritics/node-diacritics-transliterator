# Contributing

## Development

_Requirements: Latest [Node.js][node-js] (includes npm)_

To install the modules needed for developing, you should clone or download this repository then run:

```bash
$ npm install
```

If you want to add a new function, please open an issue for discussion first. And after we have discussed and approved the modification, please add appropriate tests before submitting a pull request.

After you have contributed something check your code by using:

```bash
$ npm run linting | npm test
```

## Debugging

Included in the modules is some basic debugging logs. You can set each of these individually to target the log of interest:

```js
var diacritics = require("diacritics-transliterator");
diacritics.debug = {
    server: true, // show server & cache interactions
    regexp: true, // show resulting regular expressions
    placeholder: true // show string breakdown and results
};
diacritics.getVariant("de");
// logged as: "http://api.diacritics.io/v1/?language=de; response: loaded"
diacritics.getVariant("de");
// logged as: "http://api.diacritics.io/v1/?language=de; {loaded from cache}"
```

All debugging messages are disabled by default.

Debug messages can be enabled for `npm test` by modifying these settings within the `test/setting.json` file.

### server

When `diacritics.debug.server` is `true`:

- The url used to access diacritics.io will be logged as well as a message stating if the data was "loaded" from the server, or "loaded from cache" referring to previously loaded data stored in an internal cache.
- A response `statusCode` will be displayed for any server errors (e.g. `404`).

### regexp

- When `diacritics.debug.regexp` is `true`, the resulting Regular Expression for the given string will be logged along with the set options.

### placeholder

When `diacritics.debug.placeholder` is `true`:

- Any database message returned from diacritics.io will be logged along with the associated placeholder
- Once a placeholder has been processed an object with the following data will be logged:
  - `type` – Extracted database filter (e.g. `language`)
  - `code` – Extracted database filter query (e.g. `de`)
  - `filter` – Array of result filters to apply to the resulting data; applied immediately before the `done` callback.
  - `valid` – Boolean value indicating if the diacritic data settings are valid, or not.
  - `placeholder` – Regular expression matching the specific placeholder.
  - `path` – Array of tree nodes starting with `variant` and ending with the set target.
  - `xref` – Object used to cross-reference the `path` nodes with data extracted from the placeholder. Values are set as an array if the placeholder includes a filter for a node, otherwise a string matching the node name is set as the key if no special handling is required.

[node-js]: https://nodejs.org/en/
