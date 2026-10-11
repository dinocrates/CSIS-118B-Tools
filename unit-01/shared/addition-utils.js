/*
 * addition-utils.js — pure arithmetic for the column-by-column
 * binary addition trace (carries, fixed-width wraparound, signed
 * overflow). Depends on bit-utils.js for signed interpretation.
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
    root.CSIS118B.AdditionUtils = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (BitUtils) {
  'use strict';

  /** Build the LSB-to-MSB column trace: operand bits, carry in/out, column total, written bit. */
  function buildColumnTrace(a, b, width) {
    var columns = [];
    var carry = 0;
    for (var i = 0; i < width; i++) {
      var aBit = (a >> i) & 1;
      var bBit = (b >> i) & 1;
      var total = aBit + bBit + carry;
      var resultBit = total % 2;
      var carryOut = total >= 2 ? 1 : 0;
      columns.push({
        index: i,
        aBit: aBit,
        bBit: bBit,
        carryIn: carry,
        total: total,
        resultBit: resultBit,
        carryOut: carryOut
      });
      carry = carryOut;
    }
    return columns;
  }

  /**
   * Full evaluation of a + b at a fixed width: unrestricted exact
   * sum, the fixed-width stored result, the carry out of the MSB,
   * signed interpretations of both operands and the result, and
   * whether the *signed* interpretation overflowed. Carry-out and
   * signed overflow are independent flags.
   */
  function evaluateAddition(a, b, width) {
    var modulus = Math.pow(2, width);
    var exactSum = a + b;
    var stored = exactSum % modulus;
    var carryOut = exactSum >= modulus ? 1 : 0;

    var signedA = BitUtils.signedFromUnsigned(a, width);
    var signedB = BitUtils.signedFromUnsigned(b, width);
    var signedResult = BitUtils.signedFromUnsigned(stored, width);

    var signedExactSum = signedA + signedB;
    var halfRange = Math.pow(2, width - 1);
    var signedOverflow = signedExactSum < -halfRange || signedExactSum > halfRange - 1;

    return {
      a: a,
      b: b,
      width: width,
      exactSum: exactSum,
      stored: stored,
      carryOut: carryOut,
      signedA: signedA,
      signedB: signedB,
      signedResult: signedResult,
      signedExactSum: signedExactSum,
      signedOverflow: signedOverflow,
      columns: buildColumnTrace(a, b, width)
    };
  }

  return {
    buildColumnTrace: buildColumnTrace,
    evaluateAddition: evaluateAddition
  };
});
