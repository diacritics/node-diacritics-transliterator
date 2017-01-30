/*!***************************************************
 * node-diacritics-transliterator cli help text
 * Diacritic transliteration tools using diacritics.io
 * API from http://diacritics.io/
 * Copyright (c) 2016–2017 The Diacritics Authors
 * Released under the MIT license https://git.io/v1EBe
 *****************************************************/
module.exports = {
    /**
     * Overall help text
     */
    overall: `
  Usage
    $ diacritics <string> [--<function> [args]]

  Functions
    -fu, --formatUnicode       Format unicode
    -tr, --transliterate       Transliterate
    -cr, --createRegExp        Create Regular Expression
    -rp, --replacePlaceholder  Replace placeholder

  Options
    --h  Get help for a specific function

  Examples
    $ diacritics "\\\\u00e9\\\\u00c9A\\\\u0301" --fu
    éÉÁ
    $ diacritics --tr -h
    $ diacritics --rp -h`,

    /**
     * formatUnicode help
     */
    fu: `
  formatUnicode usage
    $ diacritics <string> --fu

  Examples
    $ diacritics "T\\\\u00e9st" --fu
    Tést
    $ diacritics \\\\u00e9\\\\u00c9A\\\\u0301 --fu
    éÉÁ`,

    /**
     * transliterate help
     */
    tr: `
  transliterate usage
    $ diacritics <string> --tr [...]

  Options
    -t, --type     Type of transliteration [base|decompose] (Default: base)
    -v, --variant  Language variant

  Example
    $ diacritics "¿Te gustan los diacríticos?" --tr -v=es -t=base
    ?Te gustan los diacriticos?`,

    /**
     * createRegExp help
     */
    cr: `
  createRegExp usage
    $ diacritics <string> --cr [...]

  Options (add "no-" prefix to set the option to false)
      caseSensitive (default = true)
          --c, --caseSensitive, --no-c, --no-caseSensitive
      diacritics (default = true)
          --d, --diacritics, --no-d, --no-diacritics
      flags (default = "gu")
          --f="gu", --flags="gu"
      ignoreJoiners (default = false)
          --j, --ignoreJoiners, --no-j, --no-ignoreJoiners
      includeEquivalents (default = true)
          --e, --includeEquivalents, --no-e, --no-includeEquivalents
      nonDiacritics to false (default = true)
          --n, --nonDiacritics, --no-n, --no-nonDiacritics
      replaceDiacritic (default = "\\\\S")
          --r="\\\\S", --replaceDiacritic="\\\\S"

  Example
    $ diacritics "T\u00E9st" --cr --no-c
    /T(\\u00E9|e\\u0301|\\u00C9|E\\u0301)st/gu`,

    /**
     * replacePlaceholder help
     */
    rp: `
  replacePlaceholder usage
    $ diacritics <string> --rp --p="<% diacritics:{query} %>" --e="xx,yy"

  options
      placeholder (default = "<% diacritics:{query} %>")
          --p="<% diacritics:{query} %>"
          --placeholder="<% diacritics:{query} %>"
      exclude (default = ""; use comma separated values)
          --e="xx,yy"
          --exclude="xx,yy"
      joiner (default = ", ")
          --j=", "
          --joiner=", "

  Example
    $ diacritics "u='<% diacritics:base=u;equivalents.raw %>'" --rp
    u='ü, ü, ú, ú'
    $ diacritics "u='<% diacritics:base=u;equivalents.raw %>'" --rp --j="+"
    u='ü+ü+ú+ú'`
};
