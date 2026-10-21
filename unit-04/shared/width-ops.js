/*
 * width-ops.js — shared BigInt width arithmetic for every Unit 4
 * model (movement, arithmetic-flags, multiplication, division,
 * extension, storage-access). All math here is BigInt; a width w is
 * always a plain Number drawn from {8, 16, 32, 64}. No DOM; loaded
 * as a plain script (window.CSIS118B.WidthOps) and via require() in
 * Node for tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.WidthOps = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  var WIDTHS = [8, 16, 32, 64];

  function assertWidth(w) {
    if (WIDTHS.indexOf(Number(w)) === -1) {
      throw new Error('Unsupported width ' + w + '; use 8, 16, 32, or 64.');
    }
  }

  /** modulus = 2^w, as a BigInt. */
  function modulus(w) {
    assertWidth(w);
    return 1n << BigInt(w);
  }

  /** mask = 2^w - 1, as a BigInt. */
  function mask(w) {
    return modulus(w) - 1n;
  }

  /** The sign bit of a w-bit value, i.e. 1 << (w-1). */
  function signBit(w) {
    return 1n << BigInt(w - 1);
  }

  /** Normalize any BigInt x into [0, 2^w - 1] (reduce modulo 2^w, nonnegative). */
  function bits(x, w) {
    var mod = modulus(w);
    var r = x % mod;
    if (r < 0n) r += mod;
    return r;
  }

  /** Interpret an already-normalized w-bit unsigned pattern as a two's-complement signed value. */
  function signed(patternBits, w) {
    return patternBits < signBit(w) ? patternBits : patternBits - modulus(w);
  }

  /** The union range of accepted "value or bit pattern" input for width w: [-2^(w-1), 2^w - 1]. */
  function unionRange(w) {
    return { min: -signBit(w), max: mask(w) };
  }

  /** Lowercase/width-aware hex string: 0x followed by exactly w/4 digits, uppercase hex digits. */
  function toHex(patternBits, w) {
    var digits = w / 4;
    return '0x' + bits(patternBits, w).toString(16).toUpperCase().padStart(digits, '0');
  }

  function toBinary(patternBits, w) {
    return bits(patternBits, w).toString(2).padStart(w, '0');
  }

  /** Count of set bits in the low 8 bits only (used by PF across widths). */
  function lowBytePopcountEven(patternBits) {
    var low = patternBits & 0xFFn;
    var count = 0n;
    while (low !== 0n) {
      count += low & 1n;
      low >>= 1n;
    }
    return (count % 2n) === 0n;
  }

  /** The register name to show for a given width, following the AL/AX/EAX/RAX family. */
  function registerName(w, family) {
    family = family || 'A';
    var table = {
      A: { 8: 'AL', 16: 'AX', 32: 'EAX', 64: 'RAX' },
      B: { 8: 'BL', 16: 'BX', 32: 'EBX', 64: 'RBX' },
      C: { 8: 'CL', 16: 'CX', 32: 'ECX', 64: 'RCX' },
      D: { 8: 'DL', 16: 'DX', 32: 'EDX', 64: 'RDX' }
    };
    return (table[family] || table.A)[w];
  }

  /**
   * Validate an already-parsed BigInt against an ordinary operand
   * field's union range [-2^(w-1), 2^w - 1] (either a signed decimal
   * spelling or an unsigned bit pattern). Returns an error string or
   * null. Does not normalize; call bits(value, w) after validating.
   */
  function validateOperand(value, w, label) {
    label = label || 'value';
    var range = unionRange(w);
    if (value < range.min || value > range.max) {
      return label + ' must fit in ' + w + ' bits: from ' + range.min.toString() +
        ' (most negative signed) through ' + range.max.toString() + ' (all bits set, unsigned). Got ' + value.toString() + '.';
    }
    return null;
  }

  /**
   * Validate an already-parsed BigInt against a manual high/low half
   * field: an UNSIGNED w-bit bit pattern only, [0, 2^w - 1]. A
   * negative value is rejected outright (there is no sign on a raw
   * half of a dividend).
   */
  function validateUnsignedField(value, w, label) {
    label = label || 'value';
    if (value < 0n) {
      return label + ' is an unsigned bit pattern and cannot be negative. Got ' + value.toString() + '.';
    }
    if (value > mask(w)) {
      return label + ' does not fit in ' + w + ' unsigned bits (0 through ' + mask(w).toString() + '). Got ' + value.toString() + '.';
    }
    return null;
  }

  /**
   * Write a w-bit value into the low bits of a full 64-bit register,
   * following real x86-64 partial-register-write rules: writing an
   * 8- or 16-bit destination (AL/AX) replaces only those low bits
   * and preserves every higher bit; writing a 32-bit destination
   * (EAX) replaces the low 32 bits AND clears bits 63-32 (it does
   * NOT preserve the upper half, unlike the 8/16-bit case).
   */
  function writeSubRegister(full64, newValueBits, w) {
    assertWidth(w);
    var v = bits(newValueBits, w);
    if (w === 32 || w === 64) {
      return bits(v, 64);
    }
    var clearMask = mask(64) ^ mask(w);
    return (bits(full64, 64) & clearMask) | v;
  }

  return {
    WIDTHS: WIDTHS,
    assertWidth: assertWidth,
    modulus: modulus,
    mask: mask,
    signBit: signBit,
    bits: bits,
    signed: signed,
    unionRange: unionRange,
    toHex: toHex,
    toBinary: toBinary,
    lowBytePopcountEven: lowBytePopcountEven,
    registerName: registerName,
    validateOperand: validateOperand,
    validateUnsignedField: validateUnsignedField,
    writeSubRegister: writeSubRegister
  };
});
