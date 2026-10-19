/*
 * division-model.js — pure DIV/IDIV preparation and evaluation:
 * narrow-value zero/sign-extension (CBW/CWD/CDQ/CQO) or manual
 * high:low construction of a 2w-bit dividend, exact BigInt integer
 * division/remainder truncating toward zero, and divide-error
 * detection (zero divisor or an out-of-range quotient, including
 * signed-minimum / -1 overflow). No DOM; loaded as a plain script
 * (window.CSIS118B.DivisionModel) and via require() in Node for
 * tests. Depends only on width-ops.js.
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
    root.CSIS118B.DivisionModel = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (WidthOps) {
  'use strict';

  var REGISTER_CONTRACTS = {
    8: { dividend: 'AX', quotient: 'AL', remainder: 'AH', narrowSource: 'AL', narrowOp: 'CBW' },
    16: { dividend: 'DX:AX', quotient: 'AX', remainder: 'DX', narrowSource: 'AX', narrowOp: 'CWD' },
    32: { dividend: 'EDX:EAX', quotient: 'EAX', remainder: 'EDX', narrowSource: 'EAX', narrowOp: 'CDQ' },
    64: { dividend: 'RDX:RAX', quotient: 'RAX', remainder: 'RDX', narrowSource: 'RAX', narrowOp: 'CQO' }
  };

  function registerContract(w) {
    WidthOps.assertWidth(w);
    return REGISTER_CONTRACTS[w];
  }

  /** Narrow-value prep, DIV (unsigned): zero-extend a w-bit pattern into 2w bits. */
  function zeroExtendNarrow(value, w) {
    return WidthOps.bits(value, w);
  }

  /** Narrow-value prep, IDIV (signed): sign-extend a w-bit pattern into 2w bits (as an unsigned 2w-bit pattern). */
  function signExtendNarrow(value, w) {
    var signedValue = WidthOps.signed(WidthOps.bits(value, w), w);
    return WidthOps.bits(signedValue, 2 * w);
  }

  /** Manual high:low construction: both are unsigned w-bit patterns; dividendBits = (high << w) | low, as an unsigned 2w-bit value, regardless of DIV/IDIV. */
  function combineManual(high, low, w) {
    return (WidthOps.bits(high, w) << BigInt(w)) | WidthOps.bits(low, w);
  }

  /** DIV reads the prepared 2w-bit pattern as unsigned. */
  function dividendUnsigned(dividendBits2w) {
    return dividendBits2w;
  }

  /** IDIV reads the prepared 2w-bit pattern as signed AT 2w BITS, not at w bits. */
  function dividendSigned(dividendBits2w, w) {
    return WidthOps.signed(dividendBits2w, 2 * w);
  }

  function divisorUnsigned(pattern, w) {
    return WidthOps.bits(pattern, w);
  }

  function divisorSigned(pattern, w) {
    return WidthOps.signed(WidthOps.bits(pattern, w), w);
  }

  /**
   * Core division: dividendValue/divisorValue are plain BigInt
   * mathematical values already interpreted as signed or unsigned
   * (not bit patterns). Returns { error } OR { quotient, remainder }.
   * Truncates toward zero (native BigInt division semantics).
   * Range-checks the quotient against its w-bit destination.
   */
  function divide(dividendValue, divisorValue, w, signed) {
    WidthOps.assertWidth(w);
    if (divisorValue === 0n) {
      return { error: 'Divide error: the divisor is zero.' };
    }
    var quotient = dividendValue / divisorValue;
    var remainder = dividendValue - quotient * divisorValue;

    var min, max;
    if (signed) {
      min = -WidthOps.signBit(w);
      max = WidthOps.signBit(w) - 1n;
    } else {
      min = 0n;
      max = WidthOps.mask(w);
    }
    if (quotient < min || quotient > max) {
      return {
        error: 'Divide error: the quotient ' + quotient.toString() + ' cannot fit in the ' + w + '-bit ' +
          (signed ? 'signed' : 'unsigned') + ' destination (' + min.toString() + ' through ' + max.toString() + ').'
      };
    }

    return { quotient: quotient, remainder: remainder };
  }

  /**
   * Full pipeline for one UI evaluation.
   * opts: {
   *   width, signed (true=IDIV, false=DIV),
   *   prepMode: 'narrow' | 'manual',
   *   narrowValue (BigInt, only for 'narrow'),
   *   highHalf, lowHalf (BigInt, only for 'manual'),
   *   divisorPattern (BigInt, already validated/normalized to w bits)
   * }
   * Returns { error } OR a full result object with dividendBits2w,
   * dividendValue (signed or unsigned per mode), divisorValue,
   * quotient, remainder.
   */
  function evaluateDivision(opts) {
    var w = opts.width;
    WidthOps.assertWidth(w);
    var signed = !!opts.signed;

    var dividendBits2w;
    if (opts.prepMode === 'narrow') {
      dividendBits2w = signed ? signExtendNarrow(opts.narrowValue, w) : zeroExtendNarrow(opts.narrowValue, w);
    } else if (opts.prepMode === 'manual') {
      dividendBits2w = combineManual(opts.highHalf, opts.lowHalf, w);
    } else {
      throw new Error('Unsupported prepMode ' + opts.prepMode + '; use "narrow" or "manual".');
    }

    var dividendValue = signed ? dividendSigned(dividendBits2w, w) : dividendUnsigned(dividendBits2w);
    var divisorValue = signed ? divisorSigned(opts.divisorPattern, w) : divisorUnsigned(opts.divisorPattern, w);

    var outcome = divide(dividendValue, divisorValue, w, signed);
    if (outcome.error) {
      return {
        error: outcome.error,
        width: w, signed: signed,
        dividendBits2w: dividendBits2w, dividendValue: dividendValue, divisorValue: divisorValue
      };
    }

    return {
      error: null,
      width: w, signed: signed,
      dividendBits2w: dividendBits2w, dividendValue: dividendValue, divisorValue: divisorValue,
      quotient: outcome.quotient, remainder: outcome.remainder
    };
  }

  return {
    REGISTER_CONTRACTS: REGISTER_CONTRACTS,
    registerContract: registerContract,
    zeroExtendNarrow: zeroExtendNarrow,
    signExtendNarrow: signExtendNarrow,
    combineManual: combineManual,
    dividendUnsigned: dividendUnsigned,
    dividendSigned: dividendSigned,
    divisorUnsigned: divisorUnsigned,
    divisorSigned: divisorSigned,
    divide: divide,
    evaluateDivision: evaluateDivision
  };
});
