/*
 * fraction-utils.js — exact rational arithmetic (BigInt) for
 * converting a decimal fraction in [0, 1) to its binary expansion
 * by repeated doubling. Detects exact termination and exact
 * remainder-repeat cycles; never relies on floating-point
 * approximation of the decimal input.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.FractionUtils = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  function gcdBig(a, b) {
    a = a < 0n ? -a : a;
    b = b < 0n ? -b : b;
    while (b) {
      var t = b;
      b = a % b;
      a = t;
    }
    return a === 0n ? 1n : a;
  }

  function reduceFraction(numerator, denominator) {
    if (numerator === 0n) {
      return { numerator: 0n, denominator: 1n };
    }
    var g = gcdBig(numerator, denominator);
    return { numerator: numerator / g, denominator: denominator / g };
  }

  /**
   * Parse a decimal fraction string in [0, 1) with up to six decimal
   * places (e.g. "0.125", ".625", "0"). Returns exact BigInt
   * numerator/denominator in lowest terms, or an error message.
   */
  function parseDecimalFraction(raw) {
    var s = (raw == null ? '' : String(raw)).trim();

    if (s.length === 0) {
      return { error: 'Enter a decimal fraction before converting.' };
    }

    if (s === '0' || s === '0.' || /^0\.0{1,6}$/.test(s)) {
      return { numerator: 0n, denominator: 1n, normalizedText: s };
    }

    var m = /^(0)?\.([0-9]{1,6})$/.exec(s);
    if (!m) {
      return {
        error: 'Enter a decimal from 0 up to (but not including) 1, with at most six decimal places, ' +
          'such as 0.125 or .625. Negative values, values of 1 or more, and more than six decimal places are not supported.'
      };
    }

    var digits = m[2];
    var denominator = 10n ** BigInt(digits.length);
    var numerator = BigInt(digits);
    var reduced = reduceFraction(numerator, denominator);
    return { numerator: reduced.numerator, denominator: reduced.denominator, normalizedText: s };
  }

  /**
   * Expand numerator/denominator (0 <= numerator < denominator) into
   * its binary fraction by repeated doubling, up to maxSteps bits.
   * Stops early on an exact zero remainder (terminates) or on a
   * remainder value that has occurred before (repeats). Every step
   * records the exact values needed to verify
   * numerator * 2^k = prefixInteger * denominator + remainder_k.
   */
  function expandBinaryFraction(numerator, denominator, maxSteps) {
    maxSteps = maxSteps || 24;

    if (numerator === 0n) {
      return { steps: [], terminated: true, repeatStartIndex: null, hitLimit: false, finalRemainder: 0n };
    }

    var remainder = numerator;
    var seen = new Map();
    var steps = [];
    var terminated = false;
    var repeatStartIndex = null;

    for (var i = 0; i < maxSteps; i++) {
      var key = remainder.toString();
      if (seen.has(key)) {
        repeatStartIndex = seen.get(key);
        break;
      }
      seen.set(key, i);

      var doubled = remainder * 2n;
      var bit = doubled >= denominator ? 1 : 0;
      var nextRemainder = doubled >= denominator ? doubled - denominator : doubled;

      steps.push({
        step: i + 1,
        remainderBefore: remainder,
        doubled: doubled,
        bit: bit,
        remainderAfter: nextRemainder
      });

      remainder = nextRemainder;
      if (remainder === 0n) {
        terminated = true;
        break;
      }
    }

    var hitLimit = !terminated && repeatStartIndex === null && steps.length >= maxSteps;

    return {
      steps: steps,
      terminated: terminated,
      repeatStartIndex: repeatStartIndex,
      hitLimit: hitLimit,
      finalRemainder: remainder
    };
  }

  /**
   * Exact truncation error for the first k displayed bits: the
   * prefix's integer value, and the exact remaining fraction
   * (original value minus the prefix's value), reduced to lowest
   * terms. k may be less than steps.length to inspect a partial run.
   */
  function truncationInfo(numerator, denominator, steps, k) {
    k = typeof k === 'number' ? k : steps.length;
    if (k === 0) {
      var whole = reduceFraction(numerator, denominator);
      return { prefixInteger: 0n, prefixBits: '', errorNumerator: whole.numerator, errorDenominator: whole.denominator };
    }
    var used = steps.slice(0, k);
    var prefixBits = used.map(function (st) { return st.bit; }).join('');
    var prefixInteger = BigInt('0b' + prefixBits);
    var remainderK = used[used.length - 1].remainderAfter;
    var errorDenominator = denominator * (2n ** BigInt(k));

    // Sanity-checkable identity: numerator * 2^k === prefixInteger * denominator + remainderK
    var reducedError = reduceFraction(remainderK, errorDenominator);

    return {
      prefixInteger: prefixInteger,
      prefixBits: prefixBits,
      errorNumerator: reducedError.numerator,
      errorDenominator: reducedError.denominator
    };
  }

  function isPowerOfTwo(n) {
    if (n <= 0n) return false;
    return (n & (n - 1n)) === 0n;
  }

  /** A reduced fraction terminates in base two iff its denominator is a power of two. */
  function terminatesInBinary(reducedDenominator) {
    return isPowerOfTwo(reducedDenominator);
  }

  return {
    gcdBig: gcdBig,
    reduceFraction: reduceFraction,
    parseDecimalFraction: parseDecimalFraction,
    expandBinaryFraction: expandBinaryFraction,
    truncationInfo: truncationInfo,
    isPowerOfTwo: isPowerOfTwo,
    terminatesInBinary: terminatesInBinary
  };
});
