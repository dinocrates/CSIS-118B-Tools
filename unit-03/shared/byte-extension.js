/*
 * byte-extension.js — pure calculations for the byte interpretation
 * and extension tool (Unit 3, Tool 3): unsigned/signed readings of
 * one stored byte, and the three MOVZX/MOVSX extension operations
 * into RDI/EDI. No DOM; loaded as a plain script
 * (window.CSIS118B.ByteExtension) and via require() in Node for
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
    root.CSIS118B.ByteExtension = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (IntegerInput) {
  'use strict';

  /** A byte pattern is a stored bit pattern, not a signed quantity: reject negative input explicitly. */
  function parseBytePattern(raw) {
    var result = IntegerInput.parseBigInt(raw, 'byte pattern');
    if (result.error) return { value: null, error: result.error };
    if (result.value < 0n) {
      return { value: null, error: 'Enter an unsigned byte pattern (0 through 255); a byte pattern is not a signed value.' };
    }
    if (result.value > 255n) {
      return { value: null, error: 'Enter an unsigned byte pattern from 0 through 255.' };
    }
    return { value: result.value, error: null };
  }

  function toggleBit(pattern, bitIndex) {
    return pattern ^ (1n << BigInt(bitIndex));
  }

  function unsignedValue(pattern) {
    return pattern & 0xFFn;
  }

  function signedValue(pattern) {
    var u = unsignedValue(pattern);
    return u >= 128n ? u - 256n : u;
  }

  function toBinaryString(pattern) {
    return unsignedValue(pattern).toString(2).padStart(8, '0');
  }

  function toHexString(pattern) {
    return '0x' + unsignedValue(pattern).toString(16).toUpperCase().padStart(2, '0');
  }

  function formatRdiHex(unsigned64) {
    return '0x' + BigInt.asUintN(64, unsigned64).toString(16).toUpperCase().padStart(16, '0');
  }

  /** MOVZX EDI/RDI, byte [...]: zero-extends the byte to all 64 bits. */
  function movzxEdi(pattern) {
    var u = unsignedValue(pattern);
    return { rdiHex: formatRdiHex(u), displayed: u.toString(), numeric: u };
  }

  /** MOVSX RDI, byte [...]: sign-extends the byte directly to 64 bits. */
  function movsxRdi(pattern) {
    var s = signedValue(pattern);
    var full = BigInt.asUintN(64, s);
    return { rdiHex: formatRdiHex(full), displayed: s.toString(), numeric: s };
  }

  /**
   * MOVSX EDI, byte [...]: sign-extends the byte to 32 bits, but the
   * 32-bit register write then zero-extends the UPPER half of RDI.
   * The visible 64-bit value is therefore the unsigned 32-bit
   * reading of the sign-extended value, not a negative 64-bit one.
   */
  function movsxEdiThenZeroExtend(pattern) {
    var s = signedValue(pattern);
    var u32 = BigInt.asUintN(32, s);
    var full = BigInt.asUintN(64, u32);
    return { rdiHex: formatRdiHex(full), displayed: u32.toString(), numeric: u32 };
  }

  return {
    parseBytePattern: parseBytePattern,
    toggleBit: toggleBit,
    unsignedValue: unsignedValue,
    signedValue: signedValue,
    toBinaryString: toBinaryString,
    toHexString: toHexString,
    movzxEdi: movzxEdi,
    movsxRdi: movsxRdi,
    movsxEdiThenZeroExtend: movsxEdiThenZeroExtend
  };
});
