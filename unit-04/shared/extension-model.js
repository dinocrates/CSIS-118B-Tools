/*
 * extension-model.js — pure generalized zero/sign-extension model
 * for the Unit 4 "widening a stored value across widths" activity.
 * This generalizes unit-03/shared/byte-extension.js (which is
 * hard-locked to an 8-bit source and two fixed destinations, EDI
 * and RDI) to any source width extending into any wider destination
 * width, following the real x86-64 rule that writing a 32-bit
 * destination register also zero-extends/clears the parent
 * register's upper 32 bits (the MOVSX-to-EDI "trap"), while writing
 * a 64-bit destination is a plain full-width write. No DOM; loaded
 * as a plain script (window.CSIS118B.ExtensionModel) and via
 * require() in Node for tests. Depends only on width-ops.js.
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
    root.CSIS118B.ExtensionModel = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (WidthOps) {
  'use strict';

  /**
   * Extend a source bit pattern (already normalized to sourceWidth)
   * into destWidth, either with zeros (MOVZX-style) or by sign
   * (MOVSX/MOVSXD-style). destWidth must be >= sourceWidth. Also
   * reports the full 64-bit parent register after this write,
   * applying the real partial-write rule (a 32-bit destination
   * write clears the parent's upper half; a 64-bit destination
   * write IS the full parent).
   */
  function computeExtension(sourceValue, sourceWidth, destWidth, signed) {
    WidthOps.assertWidth(sourceWidth);
    WidthOps.assertWidth(destWidth);
    if (destWidth < sourceWidth) {
      throw new Error('Destination width (' + destWidth + ') must be greater than or equal to source width (' + sourceWidth + ').');
    }
    var srcBits = WidthOps.bits(sourceValue, sourceWidth);
    var destValue = signed
      ? WidthOps.bits(WidthOps.signed(srcBits, sourceWidth), destWidth)
      : WidthOps.bits(srcBits, destWidth);
    var parent64 = WidthOps.writeSubRegister(0n, destValue, destWidth);

    return {
      sourceWidth: sourceWidth,
      destWidth: destWidth,
      signed: !!signed,
      srcBits: srcBits,
      destValue: destValue,
      destSignedInterpretation: WidthOps.signed(destValue, destWidth),
      destUnsignedInterpretation: destValue,
      parent64: parent64,
      parentSignedInterpretation: WidthOps.signed(parent64, 64),
      parentUnsignedInterpretation: parent64
    };
  }

  /* ── the four required worked operations (fixed register names) ── */

  /** movzx eax, byte [rel sample] — zero-extend an 8-bit source into EAX (32-bit; clears RAX's upper half). */
  function movzxEax(byteSource) {
    return computeExtension(byteSource, 8, 32, false);
  }

  /** movsx rax, byte [rel sample] — sign-extend an 8-bit source directly into RAX (64-bit). */
  function movsxRax(byteSource) {
    return computeExtension(byteSource, 8, 64, true);
  }

  /** movsx eax, byte [rel sample] — the "trap": sign-extends to 32 bits, then that 32-bit write clears RAX's upper half. */
  function movsxEax(byteSource) {
    return computeExtension(byteSource, 8, 32, true);
  }

  /** movsxd rdi, eax — sign-extend a 32-bit value (e.g. the EAX from the row above) directly into RDI (64-bit). */
  function movsxdRdi(eaxValue) {
    return computeExtension(eaxValue, 32, 64, true);
  }

  return {
    computeExtension: computeExtension,
    movzxEax: movzxEax,
    movsxRax: movsxRax,
    movsxEax: movsxEax,
    movsxdRdi: movsxdRdi
  };
});
