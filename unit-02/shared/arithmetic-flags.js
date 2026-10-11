(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.ArithmeticFlags = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  var WIDTHS = [8, 16, 32, 64];

  function asBigInt(value) {
    if (typeof value === 'bigint') return value;
    if (value === null || value === undefined) return 0n;
    if (typeof value === 'string') {
      return value.trim().startsWith('0x') || value.trim().startsWith('0X') ? BigInt(value.trim()) : BigInt(value.trim());
    }
    return BigInt(Number(value));
  }

  function signedFromUnsigned(value, width) {
    var signBit = 1n << BigInt(width - 1);
    var modulus = 1n << BigInt(width);
    return value >= signBit ? value - modulus : value;
  }

  function parityLowByte(value) {
    var bits = value & 0xFFn;
    var count = 0n;
    while (bits !== 0n) {
      count += bits & 1n;
      bits >>= 1n;
    }
    return (count % 2n) === 0n;
  }

  function evaluateArithmetic(a, b, width, operation) {
    if (WIDTHS.indexOf(Number(width)) === -1) {
      throw new Error('Unsupported width ' + width + '; use 8, 16, 32, or 64.');
    }

    var op = String(operation || 'ADD').toUpperCase();
    var aBig = asBigInt(a);
    var bBig = asBigInt(b);
    var mask = (1n << BigInt(width)) - 1n;
    var signBit = 1n << BigInt(width - 1);

    var result;
    var exact;
    var cf;
    var zf;
    var sf;
    var of;
    var af;
    var pf;

    if (op === 'ADD') {
      exact = aBig + bBig;
      result = exact & mask;
      cf = exact > mask ? 1n : 0n;
      zf = result === 0n ? 1n : 0n;
      sf = (result & signBit) !== 0n ? 1n : 0n;
      of = (((~(aBig ^ bBig)) & (aBig ^ result) & signBit) !== 0n) ? 1n : 0n;
      af = (((aBig ^ bBig ^ result) & 0x10n) !== 0n) ? 1n : 0n;
      pf = parityLowByte(result) ? 1n : 0n;
    } else if (op === 'SUB') {
      exact = aBig - bBig;
      result = exact & mask;
      cf = aBig < bBig ? 1n : 0n;
      zf = result === 0n ? 1n : 0n;
      sf = (result & signBit) !== 0n ? 1n : 0n;
      of = (((aBig ^ bBig) & (aBig ^ result) & signBit) !== 0n) ? 1n : 0n;
      af = (((aBig ^ bBig ^ result) & 0x10n) !== 0n) ? 1n : 0n;
      pf = parityLowByte(result) ? 1n : 0n;
    } else {
      throw new Error('Unsupported operation ' + operation + '; use ADD or SUB.');
    }

    return {
      a: aBig,
      b: bBig,
      width: width,
      operation: op,
      exact: exact,
      result: result,
      cf: cf,
      zf: zf,
      sf: sf,
      of: of,
      af: af,
      pf: pf,
      signedA: signedFromUnsigned(aBig & mask, width),
      signedB: signedFromUnsigned(bBig & mask, width),
      signedResult: signedFromUnsigned(result, width)
    };
  }

  return {
    WIDTHS: WIDTHS,
    signedFromUnsigned: signedFromUnsigned,
    parityLowByte: parityLowByte,
    evaluateArithmetic: evaluateArithmetic
  };
});
