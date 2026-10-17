/*
 * storage-layout.js — pure calculations for the storage-layout
 * explorer (Unit 3, Tool 2): accepted initializer ranges per width,
 * two's-complement byte encoding, little-endian byte layout, and
 * offset arithmetic. No DOM; loaded as a plain script
 * (window.CSIS118B.StorageLayout) and via require() in Node for
 * tests. Depends only on integer-input.js (also dependency-free).
 */
(function (root, factory) {
  var IntegerInput = (typeof module !== 'undefined' && module.exports)
    ? require('./integer-input.js')
    : (root && root.CSIS118B ? root.CSIS118B.IntegerInput : null);

  var api = factory(IntegerInput);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.StorageLayout = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (IntegerInput) {
  'use strict';

  var WIDTH_NAMES = { 1: 'db', 2: 'dw', 4: 'dd', 8: 'dq' };

  function rangeForWidth(widthBytes) {
    var bits = BigInt(widthBytes) * 8n;
    var mod = 1n << bits;
    return { min: -(mod / 2n), max: mod - 1n, mod: mod };
  }

  /** Split "10, 20, 30" into 1-8 validated BigInt initializers for the given byte width. */
  function parseInitializers(raw, widthBytes) {
    var tokens = (raw === null || raw === undefined ? '' : String(raw)).split(',');
    if (tokens.length === 1 && tokens[0].trim() === '') {
      return { values: null, error: 'Enter 1-8 integer initializers.' };
    }
    if (tokens.length > 8) {
      return { values: null, error: 'Enter at most 8 initializers; found ' + tokens.length + '.' };
    }

    var range = rangeForWidth(widthBytes);
    var values = [];
    for (var i = 0; i < tokens.length; i++) {
      var raw_i = tokens[i].trim();
      if (raw_i.length === 0) {
        return { values: null, error: 'Initializer ' + (i + 1) + ' is empty. Remove the extra comma or supply a value.' };
      }
      var parsed = IntegerInput.parseBigInt(raw_i, 'initializer ' + (i + 1));
      if (parsed.error) {
        return { values: null, error: parsed.error };
      }
      if (parsed.value < range.min || parsed.value > range.max) {
        return {
          values: null,
          error: 'Initializer ' + (i + 1) + ' (' + raw_i + ') does not fit a ' + (widthBytes * 8) +
            '-bit value. Accepted range is ' + range.min.toString() + ' through ' + range.max.toString() + '.'
        };
      }
      values.push(parsed.value);
    }

    return { values: values, error: null };
  }

  /** Validate a zero-based element index string against the parsed initializer list. */
  function parseElementIndex(raw, length) {
    var result = IntegerInput.parseIndex(raw, 'element index');
    if (result.error) return { index: null, error: result.error };
    if (!Number.isInteger(result.value) || result.value < 0 || result.value >= length) {
      return { index: null, error: 'Choose an existing zero-based element index from 0 through ' + (length - 1) + '.' };
    }
    return { index: result.value, error: null };
  }

  /** Two's-complement unsigned bit pattern for a validated signed/unsigned initializer. */
  function twosComplementPattern(value, widthBytes) {
    var range = rangeForWidth(widthBytes);
    return ((value % range.mod) + range.mod) % range.mod;
  }

  function byteAt(pattern, byteIndex) {
    var shift = BigInt(byteIndex * 8);
    return (pattern >> shift) & 0xFFn;
  }

  /**
   * Full layout for a validated initializer list: total bytes, each
   * element's starting offset, and every emitted byte in increasing
   * address order (little-endian within each element).
   */
  function computeLayout(values, widthBytes) {
    var totalBytes = values.length * widthBytes;
    var elements = values.map(function (value, index) {
      return { index: index, value: value, offset: index * widthBytes, pattern: twosComplementPattern(value, widthBytes) };
    });

    var rows = [];
    elements.forEach(function (el) {
      for (var b = 0; b < widthBytes; b++) {
        rows.push({
          elementIndex: el.index,
          offset: el.offset + b,
          byte: byteAt(el.pattern, b),
          isElementStart: b === 0
        });
      }
    });

    return { totalBytes: totalBytes, elements: elements, rows: rows };
  }

  return {
    WIDTH_NAMES: WIDTH_NAMES,
    rangeForWidth: rangeForWidth,
    parseInitializers: parseInitializers,
    parseElementIndex: parseElementIndex,
    twosComplementPattern: twosComplementPattern,
    byteAt: byteAt,
    computeLayout: computeLayout
  };
});
