/*
 * arithmetic-model.js — pure ADD/SUB/INC/DEC/NEG evaluation with
 * exact CF/OF/ZF/SF/AF/PF flags at width 8/16/32/64, using BigInt
 * throughout (never Number) so results above 2^53 stay exact. No
 * DOM; loaded as a plain script (window.CSIS118B.ArithmeticModel)
 * and via require() in Node for tests. Depends only on
 * width-ops.js.
 */
(function (root, factory) {
  var WidthOps = (typeof module !== 'undefined' && module.exports)
    ? require('./width-ops.js')
    : (root && root.CSIS118B ? root.CSIS118B.WidthOps : null);

  var api = factory(WidthOps);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.ArithmeticModel = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (WidthOps) {
  'use strict';

  var OPERATIONS = ['ADD', 'SUB', 'INC', 'DEC', 'NEG'];

  function inRange(value, w) {
    var minV = -WidthOps.signBit(w);
    var maxV = WidthOps.signBit(w) - 1n;
    return value >= minV && value <= maxV;
  }

  function lowNibble(x) { return x & 0xFn; }

  function flagsFromResult(resultBits) {
    return {
      zf: resultBits === 0n ? 1n : 0n,
      pf: WidthOps.lowBytePopcountEven(resultBits) ? 1n : 0n
    };
  }

  function sfFrom(resultBits, w) {
    return (resultBits & WidthOps.signBit(w)) !== 0n ? 1n : 0n;
  }

  /** a and b are already-normalized unsigned w-bit BigInt patterns. */
  function evaluateAdd(a, b, w) {
    WidthOps.assertWidth(w);
    var mask = WidthOps.mask(w);
    var exact = a + b;
    var result = exact & mask;
    var cf = exact > mask ? 1n : 0n;
    var sa = WidthOps.signed(a, w);
    var sb = WidthOps.signed(b, w);
    var sum = sa + sb;
    var of = inRange(sum, w) ? 0n : 1n;
    var af = (lowNibble(a) + lowNibble(b)) > 15n ? 1n : 0n;
    var zp = flagsFromResult(result);
    return {
      operation: 'ADD', a: a, b: b, width: w, exact: exact, result: result,
      cf: cf, of: of, zf: zp.zf, sf: sfFrom(result, w), af: af, pf: zp.pf,
      cfPreserved: false
    };
  }

  function evaluateSub(a, b, w) {
    WidthOps.assertWidth(w);
    var mask = WidthOps.mask(w);
    var exact = a - b;
    var result = WidthOps.bits(exact, w);
    var cf = a < b ? 1n : 0n;
    var sa = WidthOps.signed(a, w);
    var sb = WidthOps.signed(b, w);
    var diff = sa - sb;
    var of = inRange(diff, w) ? 0n : 1n;
    var af = lowNibble(a) < lowNibble(b) ? 1n : 0n;
    var zp = flagsFromResult(result);
    return {
      operation: 'SUB', a: a, b: b, width: w, exact: exact, result: result,
      cf: cf, of: of, zf: zp.zf, sf: sfFrom(result, w), af: af, pf: zp.pf,
      cfPreserved: false
    };
  }

  /** incomingCf is 0n or 1n and is preserved (not computed) for INC/DEC. */
  function evaluateInc(a, w, incomingCf) {
    WidthOps.assertWidth(w);
    var result = WidthOps.bits(a + 1n, w);
    var sa = WidthOps.signed(a, w);
    var sum = sa + 1n;
    var of = inRange(sum, w) ? 0n : 1n;
    var af = (lowNibble(a) + 1n) > 15n ? 1n : 0n;
    var zp = flagsFromResult(result);
    return {
      operation: 'INC', a: a, b: 1n, width: w, result: result,
      cf: incomingCf, of: of, zf: zp.zf, sf: sfFrom(result, w), af: af, pf: zp.pf,
      cfPreserved: true
    };
  }

  function evaluateDec(a, w, incomingCf) {
    WidthOps.assertWidth(w);
    var result = WidthOps.bits(a - 1n, w);
    var sa = WidthOps.signed(a, w);
    var diff = sa - 1n;
    var of = inRange(diff, w) ? 0n : 1n;
    var af = lowNibble(a) < 1n ? 1n : 0n;
    var zp = flagsFromResult(result);
    return {
      operation: 'DEC', a: a, b: 1n, width: w, result: result,
      cf: incomingCf, of: of, zf: zp.zf, sf: sfFrom(result, w), af: af, pf: zp.pf,
      cfPreserved: true
    };
  }

  function evaluateNeg(a, w) {
    WidthOps.assertWidth(w);
    var result = WidthOps.bits(-a, w);
    var cf = a === 0n ? 0n : 1n;
    var of = a === WidthOps.signBit(w) ? 1n : 0n;
    var af = lowNibble(a) !== 0n ? 1n : 0n;
    var zp = flagsFromResult(result);
    return {
      operation: 'NEG', a: a, b: null, width: w, result: result,
      cf: cf, of: of, zf: zp.zf, sf: sfFrom(result, w), af: af, pf: zp.pf,
      cfPreserved: false
    };
  }

  /**
   * Dispatch by operation name. a/b must already be normalized
   * w-bit unsigned BigInt patterns; incomingCf (0n/1n) is used only
   * by INC/DEC.
   */
  function evaluate(operation, a, b, w, incomingCf) {
    var op = String(operation || '').toUpperCase();
    if (op === 'ADD') return evaluateAdd(a, b, w);
    if (op === 'SUB') return evaluateSub(a, b, w);
    if (op === 'INC') return evaluateInc(a, w, incomingCf);
    if (op === 'DEC') return evaluateDec(a, w, incomingCf);
    if (op === 'NEG') return evaluateNeg(a, w);
    throw new Error('Unsupported operation ' + operation + '; use ADD, SUB, INC, DEC, or NEG.');
  }

  function needsB(operation) {
    var op = String(operation || '').toUpperCase();
    return op === 'ADD' || op === 'SUB';
  }

  function snippetFor(operation, w) {
    var regA = WidthOps.registerName(w, 'A').toLowerCase();
    var regB = WidthOps.registerName(w, 'B').toLowerCase();
    var op = String(operation || '').toUpperCase();
    if (op === 'ADD') return 'add ' + regA + ', ' + regB;
    if (op === 'SUB') return 'sub ' + regA + ', ' + regB;
    if (op === 'INC') return 'inc ' + regA;
    if (op === 'DEC') return 'dec ' + regA;
    if (op === 'NEG') return 'neg ' + regA;
    return '';
  }

  return {
    OPERATIONS: OPERATIONS,
    evaluateAdd: evaluateAdd,
    evaluateSub: evaluateSub,
    evaluateInc: evaluateInc,
    evaluateDec: evaluateDec,
    evaluateNeg: evaluateNeg,
    evaluate: evaluate,
    needsB: needsB,
    snippetFor: snippetFor
  };
});
