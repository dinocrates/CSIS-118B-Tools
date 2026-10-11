/*
 * bitwise-utils.js — pure logic for the AND/OR/XOR/NOT workbench:
 * per-bit application, aggregate byte result, and truth tables.
 * NOT is masked to the given width so JavaScript's 32-bit bitwise
 * semantics never leak into the display.
 */
(function (root, factory) {
  var dep = (typeof module !== 'undefined' && module.exports)
    ? require('./bit-utils.js')
    : (root && root.CSIS118B && root.CSIS118B.BitUtils);
  var api = factory(dep);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.BitwiseUtils = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (BitUtils) {
  'use strict';

  var OPS = ['AND', 'OR', 'XOR', 'NOT'];

  function computeByteResult(a, b, op, width) {
    var mask = BitUtils.unsignedMax(width);
    switch (op) {
      case 'AND': return (a & b) & mask;
      case 'OR': return (a | b) & mask;
      case 'XOR': return (a ^ b) & mask;
      case 'NOT': return (~a) & mask;
      default: throw new Error('Unknown bitwise operation "' + op + '".');
    }
  }

  /** Per-bit rows (MSB to LSB) showing each input bit and the resulting bit. */
  function computeBitRows(a, b, op, width) {
    var rows = [];
    for (var pos = width - 1; pos >= 0; pos--) {
      var aBit = (a >> pos) & 1;
      var bBit = (b >> pos) & 1;
      var resultBit;
      switch (op) {
        case 'AND': resultBit = aBit & bBit; break;
        case 'OR': resultBit = aBit | bBit; break;
        case 'XOR': resultBit = aBit ^ bBit; break;
        case 'NOT': resultBit = aBit ^ 1; break;
        default: throw new Error('Unknown bitwise operation "' + op + '".');
      }
      rows.push({ position: pos, weight: Math.pow(2, pos), aBit: aBit, bBit: bBit, resultBit: resultBit });
    }
    return rows;
  }

  function truthTableRows(op) {
    if (op === 'NOT') {
      return [
        { a: 0, result: 1 },
        { a: 1, result: 0 }
      ];
    }
    var rows = [];
    [0, 1].forEach(function (a) {
      [0, 1].forEach(function (b) {
        var result;
        if (op === 'AND') result = a & b;
        else if (op === 'OR') result = a | b;
        else if (op === 'XOR') result = a ^ b;
        else throw new Error('Unknown bitwise operation "' + op + '".');
        rows.push({ a: a, b: b, result: result });
      });
    });
    return rows;
  }

  /** Short, deterministic explanation text for a single bit position. */
  function explainBit(op, aBit, bBit, resultBit) {
    if (op === 'NOT') {
      return 'NOT ' + aBit + ' = ' + resultBit + '. NOT flips every bit.';
    }
    if (op === 'AND') {
      return aBit + ' AND ' + bBit + ' = ' + resultBit + '. ' +
        (bBit === 0 ? 'Mask bit 0 clears this position to 0.' : 'Mask bit 1 preserves the original bit.');
    }
    if (op === 'OR') {
      return aBit + ' OR ' + bBit + ' = ' + resultBit + '. ' +
        (bBit === 1 ? 'Mask bit 1 sets this position to 1.' : 'Mask bit 0 preserves the original bit.');
    }
    if (op === 'XOR') {
      return aBit + ' XOR ' + bBit + ' = ' + resultBit + '. ' +
        (bBit === 1 ? 'Mask bit 1 toggles this position.' : 'Mask bit 0 preserves the original bit.');
    }
    throw new Error('Unknown bitwise operation "' + op + '".');
  }

  return {
    OPS: OPS,
    computeByteResult: computeByteResult,
    computeBitRows: computeBitRows,
    truthTableRows: truthTableRows,
    explainBit: explainBit
  };
});
