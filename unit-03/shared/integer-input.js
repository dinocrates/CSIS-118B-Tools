/*
 * integer-input.js — pure, DOM-free parsing of decimal and 0x/0b/0o
 * integer literals into BigInt, shared by every Unit 3 tool. Accepts
 * an optional leading "-" sign in front of any base (BigInt() itself
 * rejects a signed hex/binary/octal literal, so the sign is split
 * off and applied after parsing the unsigned body). Rejects empty
 * tokens, fractions, trailing junk, and missing digits after a
 * prefix. Loaded as a plain script in the browser (attaches to
 * window.CSIS118B.IntegerInput) and via require() in Node for the
 * test suite (module.exports).
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
   * Exactly one of the two is non-null. Supports decimal, 0x hex,
   * 0b binary, and 0o octal, each with an optional leading "-".
   */
  function parseBigInt(raw, label) {
    label = label || 'value';
    var s = (raw === null || raw === undefined) ? '' : String(raw).trim();

    if (s.length === 0) {
      return { value: null, error: 'Enter a value for ' + label + '.' };
    }

    var neg = false;
    var body = s;
    if (body[0] === '-') {
      neg = true;
      body = body.slice(1);
    } else if (body[0] === '+') {
      body = body.slice(1);
    }

    if (body.length === 0) {
      return { value: null, error: label + ' is missing digits after the sign.' };
    }

    var value;
    if (/^0[xX]/.test(body)) {
      if (!/^0[xX][0-9a-fA-F]+$/.test(body)) {
        return { value: null, error: label + ' has an invalid 0x (hexadecimal) literal; use digits 0-9 and A-F only, with no fraction or trailing characters.' };
      }
      value = BigInt(body);
    } else if (/^0[bB]/.test(body)) {
      if (!/^0[bB][01]+$/.test(body)) {
        return { value: null, error: label + ' has an invalid 0b (binary) literal; use digits 0 and 1 only.' };
      }
      value = BigInt(body);
    } else if (/^0[oO]/.test(body)) {
      if (!/^0[oO][0-7]+$/.test(body)) {
        return { value: null, error: label + ' has an invalid 0o (octal) literal; use digits 0-7 only.' };
      }
      value = BigInt(body);
    } else {
      if (!/^[0-9]+$/.test(body)) {
        return { value: null, error: label + ' must be a decimal integer, or use a 0x, 0b, or 0o prefix. Fractions and other characters are not accepted.' };
      }
      value = BigInt(body);
    }

    return { value: neg ? -value : value, error: null };
  }

  /** Parse a raw string into a plain (bounded) integer index/count via Number, rejecting non-integers. */
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
