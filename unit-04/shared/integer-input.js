/*
 * integer-input.js — pure, DOM-free parsing of decimal and 0x/0b
 * integer literals into BigInt, shared by every Unit 4 tool. Accepts
 * an optional leading "-" sign only in front of a decimal literal
 * (per the Unit 4 spec's lexical contract: -?\d+, 0[xX][0-9a-fA-F]+,
 * or 0[bB][01]+ — a signed hex/binary literal such as -0x10 is
 * rejected, not silently accepted). Rejects empty tokens, fractions,
 * exponential notation, arithmetic expressions, and invalid
 * sign/radix combinations. Loaded as a plain script in the browser
 * (attaches to window.CSIS118B.IntegerInput) and via require() in
 * Node for the test suite (module.exports). Identical in spirit to
 * unit-03/shared/integer-input.js; kept as Unit 4's own copy.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.IntegerInput = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  /**
   * Parse a raw string into a BigInt. Returns { value, error }.
   * Exactly one of the two is non-null.
   *   -?\d+              decimal, optional leading "-"
   *   0[xX][0-9a-fA-F]+  hexadecimal, NO leading "-"
   *   0[bB][01]+         binary, NO leading "-"
   * The whole (trimmed) string must match exactly one of these.
   */
  function parseBigInt(raw, label) {
    label = label || 'value';
    var s = (raw === null || raw === undefined) ? '' : String(raw).trim();

    if (s.length === 0) {
      return { value: null, error: 'Enter a value for ' + label + '.' };
    }

    if (/^-?\d+$/.test(s)) {
      return { value: BigInt(s), error: null };
    }
    if (/^0[xX][0-9a-fA-F]+$/.test(s)) {
      return { value: BigInt(s), error: null };
    }
    if (/^0[bB][01]+$/.test(s)) {
      return { value: BigInt(s), error: null };
    }

    if (/^-0[xXbB]/.test(s)) {
      return { value: null, error: label + ': a negative sign cannot be combined with a 0x or 0b literal. Use the equivalent unsigned bit pattern instead (e.g. 0xFF, not -0xFF).' };
    }
    if (/^0[xX]/.test(s)) {
      return { value: null, error: label + ' has an invalid 0x (hexadecimal) literal; use digits 0-9 and A-F only, with no fraction or trailing characters.' };
    }
    if (/^0[bB]/.test(s)) {
      return { value: null, error: label + ' has an invalid 0b (binary) literal; use digits 0 and 1 only.' };
    }
    return { value: null, error: label + ' must be a decimal integer (optionally negative), or use a 0x or 0b prefix (unsigned only). Fractions, exponents, and arithmetic expressions are not accepted.' };
  }

  /** Parse a raw string into a plain (bounded) nonnegative integer index/count via Number. */
  function parseIndex(raw, label) {
    var result = parseBigInt(raw, label);
    if (result.error) return { value: null, error: result.error };
    if (result.value < 0n) {
      return { value: null, error: label + ' cannot be negative.' };
    }
    if (result.value > 9007199254740991n) {
      return { value: null, error: label + ' is too large.' };
    }
    return { value: Number(result.value), error: null };
  }

  function formatHex(value, digits) {
    var text = value.toString(16).toUpperCase();
    return '0x' + text.padStart(digits, '0');
  }

  return {
    parseBigInt: parseBigInt,
    parseIndex: parseIndex,
    formatHex: formatHex
  };
});
