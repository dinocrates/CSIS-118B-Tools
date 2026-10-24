/* Pure fixed-width CMP/TEST model. Reuses reviewed Unit 4 input/width helpers. */
(function (root, factory) {
  var node = typeof module !== 'undefined' && module.exports;
  var api = factory(node ? require('../../unit-04/shared/width-ops.js') : root.CSIS118B.WidthOps,
    node ? require('../../unit-04/shared/integer-input.js') : root.CSIS118B.IntegerInput);
  if (node) module.exports = api;
  else root.CSIS118B.BranchModel = api;
})(typeof window !== 'undefined' ? window : globalThis, function (W, I) {
  'use strict';
  var conditions = {
    JE: ['ZF = 1', f => f.zf === 1], JNE: ['ZF = 0', f => f.zf === 0],
    JL: ['SF != OF', f => f.sf !== f.of], JGE: ['SF = OF', f => f.sf === f.of],
    JLE: ['ZF = 1 or SF != OF', f => f.zf === 1 || f.sf !== f.of],
    JG: ['ZF = 0 and SF = OF', f => f.zf === 0 && f.sf === f.of],
    JB: ['CF = 1', f => f.cf === 1], JAE: ['CF = 0', f => f.cf === 0],
    JBE: ['CF = 1 or ZF = 1', f => f.cf === 1 || f.zf === 1],
    JA: ['CF = 0 and ZF = 0', f => f.cf === 0 && f.zf === 0],
    JS: ['SF = 1', f => f.sf === 1], JNS: ['SF = 0', f => f.sf === 0],
    JO: ['OF = 1', f => f.of === 1], JNO: ['OF = 0', f => f.of === 0],
    JP: ['PF = 1', f => f.pf === 1], JNP: ['PF = 0', f => f.pf === 0]
  };
  function evaluate(op, width, rawA, rawB, jump) {
    if (!W.WIDTHS.includes(width)) throw new Error('Choose width 8, 16, 32 or 64.');
    if (!['CMP', 'TEST'].includes(op)) throw new Error('Choose CMP or TEST.');
    if (!Object.prototype.hasOwnProperty.call(conditions, jump)) throw new Error('Choose a supported jump.');
    function operand(raw, label) {
      if (String(raw).length > 80) throw new Error(label + ': use at most 80 characters.');
      var p = I.parseBigInt(raw, label);
      var error = p.error || W.validateOperand(p.value, width, label);
      if (error) throw new Error(error);
      return W.bits(p.value, width);
    }
    var a = operand(rawA, 'A'), b = operand(rawB, 'B');
    var result = op === 'CMP' ? W.bits(a - b, width) : a & b;
    var signedDifference = W.signed(a, width) - W.signed(b, width);
    var flags = {
      cf: op === 'CMP' && a < b ? 1 : 0,
      of: op === 'CMP' && (signedDifference < -W.signBit(width) || signedDifference >= W.signBit(width)) ? 1 : 0,
      zf: result === 0n ? 1 : 0,
      sf: result >= W.signBit(width) ? 1 : 0,
      pf: W.lowBytePopcountEven(result) ? 1 : 0,
      af: op === 'TEST' ? null : ((a & 15n) < (b & 15n) ? 1 : 0)
    };
    return {op, width, a, b, afterA:a, afterB:b, result, flags, jump,
      condition:conditions[jump][0], taken:conditions[jump][1](flags)};
  }
  return {evaluate, conditions};
});
