/*
 * multiplication-model.js — pure MUL/IMUL evaluation: one-operand
 * full-product forms (AL/AX/EAX/RAX times a register/memory source,
 * destination AX / DX:AX / EDX:EAX / RDX:RAX) and two- and
 * three-operand truncated signed IMUL forms (16/32/64 only). Exact
 * 2w-bit products via BigInt, so a QWORD x QWORD 128-bit product
 * stays exact. No DOM; loaded as a plain script
 * (window.CSIS118B.MultiplicationModel) and via require() in Node
 * for tests. Depends only on width-ops.js.
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
    root.CSIS118B.MultiplicationModel = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (WidthOps) {
  'use strict';

  /** One-operand register contract: implicit accumulator in, full product destination. */
  var REGISTER_CONTRACTS = {
    8: { accumulator: 'AL', fullProduct: 'AX', highHalf: 'AH', lowHalf: 'AL' },
    16: { accumulator: 'AX', fullProduct: 'DX:AX', highHalf: 'DX', lowHalf: 'AX' },
    32: { accumulator: 'EAX', fullProduct: 'EDX:EAX', highHalf: 'EDX', lowHalf: 'EAX' },
    64: { accumulator: 'RAX', fullProduct: 'RDX:RAX', highHalf: 'RDX', lowHalf: 'RAX' }
  };

  function registerContract(w) {
    WidthOps.assertWidth(w);
    return REGISTER_CONTRACTS[w];
  }

  /** Two-operand IMUL (imul dst, src) is not offered at 8-bit width in this teaching model. */
  function twoOperandAllowed(w) {
    return Number(w) !== 8;
  }

  /**
   * One-operand unsigned MUL: a, b are already-normalized unsigned
   * w-bit patterns. Full product is exact and nonnegative, so it is
   * already the correct 2w-bit unsigned representation.
   */
  function mulOneOperand(a, b, w) {
    WidthOps.assertWidth(w);
    var mask = WidthOps.mask(w);
    var product = a * b;
    var low = product & mask;
    var high = (product >> BigInt(w)) & mask;
    var cf = high !== 0n ? 1n : 0n;
    return {
      kind: 'MUL', width: w, a: a, b: b,
      fullProduct: product, low: low, high: high,
      cf: cf, of: cf,
      sf: undefined, zf: undefined, af: undefined, pf: undefined
    };
  }

  /**
   * One-operand signed IMUL: interpret a, b as signed w-bit values,
   * multiply exactly (may be negative), then take the two's
   * complement representation in 2w bits and split it into high/low
   * w-bit halves. CF=OF=1 iff the low half's signed reading differs
   * from the exact signed product (i.e. the low half alone cannot
   * hold it).
   */
  function imulOneOperand(a, b, w) {
    WidthOps.assertWidth(w);
    var sa = WidthOps.signed(a, w);
    var sb = WidthOps.signed(b, w);
    var fullSignedProduct = sa * sb;
    var twoWBits = WidthOps.bits(fullSignedProduct, 2 * w);
    var mask = WidthOps.mask(w);
    var low = twoWBits & mask;
    var high = (twoWBits >> BigInt(w)) & mask;
    var fits = WidthOps.signed(low, w) === fullSignedProduct;
    var cf = fits ? 0n : 1n;
    return {
      kind: 'IMUL', width: w, a: a, b: b,
      signedA: sa, signedB: sb, fullSignedProduct: fullSignedProduct,
      low: low, high: high,
      cf: cf, of: cf,
      sf: undefined, zf: undefined, af: undefined, pf: undefined
    };
  }

  /**
   * Two-operand truncated signed IMUL (imul dst, src): multiplies
   * the original signed dst and src, writes only the destination-
   * width (truncated) result. Not valid at 8-bit width — call
   * twoOperandAllowed(w) first.
   */
  function imulTwoOperand(dst, src, w) {
    WidthOps.assertWidth(w);
    if (!twoOperandAllowed(w)) {
      throw new Error('Two-operand IMUL is not offered at 8-bit width in this teaching model (no destination-width two-operand byte IMUL form).');
    }
    var sDst = WidthOps.signed(dst, w);
    var sSrc = WidthOps.signed(src, w);
    var fullSignedProduct = sDst * sSrc;
    var destBits = WidthOps.bits(fullSignedProduct, w);
    var fits = WidthOps.signed(destBits, w) === fullSignedProduct;
    var cf = fits ? 0n : 1n;

    var mask = WidthOps.mask(w);
    var twoWBits = WidthOps.bits(fullSignedProduct, 2 * w);
    var referenceLow = twoWBits & mask;
    var referenceHigh = (twoWBits >> BigInt(w)) & mask;

    return {
      kind: 'IMUL2', width: w, dst: dst, src: src,
      signedDst: sDst, signedSrc: sSrc, fullSignedProduct: fullSignedProduct,
      destBits: destBits, referenceLow: referenceLow, referenceHigh: referenceHigh,
      cf: cf, of: cf,
      sf: undefined, zf: undefined, af: undefined, pf: undefined
    };
  }

  /**
   * Three-operand IMUL (imul dst, src, imm): signed src times a
   * plain BigInt immediate, truncated to destination width w.
   * Reference-only in the UI; same flag rule as the two-operand
   * form.
   */
  function imulThreeOperand(src, imm, w) {
    WidthOps.assertWidth(w);
    var sSrc = WidthOps.signed(src, w);
    var fullSignedProduct = sSrc * imm;
    var destBits = WidthOps.bits(fullSignedProduct, w);
    var fits = WidthOps.signed(destBits, w) === fullSignedProduct;
    var cf = fits ? 0n : 1n;
    return {
      kind: 'IMUL3', width: w, src: src, imm: imm,
      signedSrc: sSrc, fullSignedProduct: fullSignedProduct,
      destBits: destBits,
      cf: cf, of: cf,
      sf: undefined, zf: undefined, af: undefined, pf: undefined
    };
  }

  return {
    REGISTER_CONTRACTS: REGISTER_CONTRACTS,
    registerContract: registerContract,
    twoOperandAllowed: twoOperandAllowed,
    mulOneOperand: mulOneOperand,
    imulOneOperand: imulOneOperand,
    imulTwoOperand: imulTwoOperand,
    imulThreeOperand: imulThreeOperand
  };
});
