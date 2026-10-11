/*
 * bit-utils.js — pure, DOM-free helpers for parsing and formatting
 * fixed-width binary values. Shared by the Byte Explorer and the
 * Bitwise Workbench. Loaded as a plain script in the browser
 * (attaches to window.CSIS118B.BitUtils) and via require() in Node
 * for the test suite (module.exports).
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.BitUtils = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  function unsignedMax(width) {
    return Math.pow(2, width) - 1;
  }

  /**
   * Parse a raw string into an unsigned integer of the given width,
   * under a specific input base. Returns { value, error }. Exactly
   * one of the two is non-null.
   */
  function parseValue(raw, base, width) {
    var s = (raw == null ? '' : String(raw)).trim();

    if (s.length === 0) {
      return { value: null, error: 'Enter a value before loading it.' };
    }

    if (base === 'dec') {
      if (/^0[xXbB]/.test(s)) {
        return { value: null, error: 'Decimal input should not include a 0x or 0b prefix.' };
      }
      if (!/^[0-9]+$/.test(s)) {
        return { value: null, error: 'Decimal input must contain only digits 0-9, with no sign and no decimal point.' };
      }
      var decVal = parseInt(s, 10);
      var max = unsignedMax(width);
      if (decVal > max) {
        return { value: null, error: 'Decimal value must be between 0 and ' + max + ' for a ' + width + '-bit value.' };
      }
      return { value: decVal, error: null };
    }

    if (base === 'bin') {
      if (/^0[xX]/.test(s)) {
        return { value: null, error: 'Binary input cannot use a 0x (hex) prefix.' };
      }
      var binBody = /^0[bB]/.test(s) ? s.slice(2) : s;
      if (binBody.length === 0) {
        return { value: null, error: 'Enter at least one binary digit after the 0b prefix.' };
      }
      if (!/^[01]+$/.test(binBody)) {
        return { value: null, error: 'Binary input may contain only the digits 0 and 1.' };
      }
      if (binBody.length > width) {
        return { value: null, error: 'Binary input has more than ' + width + ' bits. Use at most ' + width + ' digits.' };
      }
      return { value: parseInt(binBody, 2), error: null };
    }

    if (base === 'hex') {
      if (/^0[bB]/.test(s)) {
        return { value: null, error: 'Hex input cannot use a 0b (binary) prefix.' };
      }
      var hexBody = /^0[xX]/.test(s) ? s.slice(2) : s;
      if (hexBody.length === 0) {
        return { value: null, error: 'Enter at least one hex digit after the 0x prefix.' };
      }
      if (!/^[0-9a-fA-F]+$/.test(hexBody)) {
        return { value: null, error: 'Hex input may contain only digits 0-9 and letters A-F.' };
      }
      var maxHexDigits = Math.ceil(width / 4);
      if (hexBody.length > maxHexDigits) {
        return { value: null, error: 'Hex input has more than ' + maxHexDigits + ' digit(s) for a ' + width + '-bit value.' };
      }
      var hexVal = parseInt(hexBody, 16);
      if (hexVal > unsignedMax(width)) {
        return { value: null, error: 'Hex value is out of range for a ' + width + '-bit value.' };
      }
      return { value: hexVal, error: null };
    }

    return { value: null, error: 'Unknown number base "' + base + '".' };
  }

  function toBinaryString(value, width) {
    return value.toString(2).padStart(width, '0');
  }

  function toHexString(value, width) {
    var digits = Math.ceil(width / 4);
    return value.toString(16).toUpperCase().padStart(digits, '0');
  }

  /** Two's-complement signed interpretation of an unsigned value at a given width. */
  function signedFromUnsigned(value, width) {
    var half = Math.pow(2, width - 1);
    return value >= half ? value - Math.pow(2, width) : value;
  }

  /** Per-bit breakdown from MSB to LSB, with place-value weights. */
  function placeValueBits(value, width) {
    var bits = [];
    for (var pos = width - 1; pos >= 0; pos--) {
      var bit = (value >> pos) & 1;
      bits.push({ position: pos, weight: Math.pow(2, pos), bit: bit });
    }
    return bits;
  }

  /**
   * Two's-complement negate: invert all bits, then add one, keeping
   * the result within `width` bits. Flags the one case (the most
   * negative value) where the mathematically correct result does
   * not fit back into the same width.
   */
  function twosComplementNegate(value, width) {
    var mask = unsignedMax(width);
    var inverted = (~value) & mask;
    var result = (inverted + 1) & mask;
    var mostNegative = Math.pow(2, width - 1);
    return {
      original: value,
      inverted: inverted,
      result: result,
      doesNotFit: value === mostNegative
    };
  }

  return {
    unsignedMax: unsignedMax,
    parseValue: parseValue,
    toBinaryString: toBinaryString,
    toHexString: toHexString,
    signedFromUnsigned: signedFromUnsigned,
    placeValueBits: placeValueBits,
    twosComplementNegate: twosComplementNegate
  };
});
