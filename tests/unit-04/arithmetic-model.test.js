'use strict';

const ArithmeticModel = require('../../unit-04/shared/arithmetic-model.js');
const WidthOps = require('../../unit-04/shared/width-ops.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

function flags(r) { return [r.result, r.cf, r.of, r.zf, r.sf, r.af, r.pf]; }
function eq(a, b) { return a.length === b.length && a.every(function (v, i) { return v === b[i]; }); }

// Independent oracle table, hand-computed from the Unit 4 spec (not derived from the function under test).
check('Byte 255 + 1', eq(flags(ArithmeticModel.evaluateAdd(255n, 1n, 8)), [0n, 1n, 0n, 1n, 0n, 1n, 1n]));
check('Byte 127 + 1', eq(flags(ArithmeticModel.evaluateAdd(127n, 1n, 8)), [128n, 0n, 1n, 0n, 1n, 1n, 0n]));
check('Byte 0 - 1', eq(flags(ArithmeticModel.evaluateSub(0n, 1n, 8)), [255n, 1n, 0n, 0n, 1n, 1n, 1n]));
check('Byte 128 - 1 (signed -128 - 1)', eq(flags(ArithmeticModel.evaluateSub(128n, 1n, 8)), [127n, 0n, 1n, 0n, 0n, 1n, 0n]));

(function () {
  var r = ArithmeticModel.evaluateInc(10n, 8, 1n);
  check('INC byte 10, incoming CF=1', r.result === 0x0Bn && r.cf === 1n && r.cfPreserved === true &&
    r.of === 0n && r.zf === 0n && r.sf === 0n && r.af === 0n && r.pf === 0n);
})();
(function () {
  var r = ArithmeticModel.evaluateInc(255n, 8, 0n);
  check('INC byte 255, incoming CF=0', r.result === 0x00n && r.cf === 0n && r.cfPreserved === true &&
    r.of === 0n && r.zf === 1n && r.sf === 0n && r.af === 1n && r.pf === 1n);
})();
(function () {
  var r = ArithmeticModel.evaluateDec(0n, 8, 1n);
  check('DEC byte 0, incoming CF=1', r.result === 0xFFn && r.cf === 1n && r.cfPreserved === true &&
    r.of === 0n && r.zf === 0n && r.sf === 1n && r.af === 1n && r.pf === 1n);
})();
(function () {
  var r = ArithmeticModel.evaluateNeg(0n, 8);
  check('NEG byte 0', r.result === 0n && r.cf === 0n && r.of === 0n && r.zf === 1n && r.sf === 0n && r.af === 0n && r.pf === 1n);
})();
(function () {
  var r = ArithmeticModel.evaluateNeg(128n, 8); // byte pattern of signed -128
  check('NEG byte -128', r.result === 128n && r.cf === 1n && r.of === 1n && r.zf === 0n && r.sf === 1n && r.af === 0n && r.pf === 0n);
})();

// Both incoming CF values for INC/DEC, and wraparound.
check('INC preserves incoming CF=0', ArithmeticModel.evaluateInc(0n, 8, 0n).cf === 0n);
check('INC preserves incoming CF=1', ArithmeticModel.evaluateInc(0n, 8, 1n).cf === 1n);
check('DEC preserves incoming CF=0', ArithmeticModel.evaluateDec(0n, 8, 0n).cf === 0n);
check('DEC preserves incoming CF=1', ArithmeticModel.evaluateDec(0n, 8, 1n).cf === 1n);
check('INC wraps byte 255 -> 0', ArithmeticModel.evaluateInc(255n, 8, 0n).result === 0n);
check('DEC wraps byte 0 -> 255', ArithmeticModel.evaluateDec(0n, 8, 0n).result === 255n);

// AF boundary: 15+1 and 16-1.
check('AF: byte 15 + 1 sets AF', ArithmeticModel.evaluateAdd(15n, 1n, 8).af === 1n);
check('AF: byte 14 + 1 does not set AF', ArithmeticModel.evaluateAdd(14n, 1n, 8).af === 0n);
check('AF: byte 16 - 1 sets AF', ArithmeticModel.evaluateSub(16n, 1n, 8).af === 1n);
check('AF: byte 17 - 1 does not set AF', ArithmeticModel.evaluateSub(17n, 1n, 8).af === 0n);

// PF at 16-bit result 0x0100: low byte is zero (even parity) despite one set bit overall.
check('PF only looks at the low byte, even at 16-bit width', ArithmeticModel.evaluateAdd(0xFFn, 1n, 16).result === 0x0100n &&
  ArithmeticModel.evaluateAdd(0xFFn, 1n, 16).pf === 1n);

// Exact arithmetic above Number precision.
check('64-bit 9007199254740995 - 1 = 9007199254740994 exactly',
  ArithmeticModel.evaluateSub(9007199254740995n, 1n, 64).result === 9007199254740994n);
(function () {
  var r = ArithmeticModel.evaluateAdd(WidthOps.mask(64), 1n, 64);
  check('64-bit 0xFFFFFFFFFFFFFFFF + 1 stores zero with CF=1', r.result === 0n && r.cf === 1n);
})();

// Section 07 worked sequence: base=100, fee=25, credit=10 -> EAX 100 -> 125 -> 115.
(function () {
  var afterFee = ArithmeticModel.evaluateAdd(100n, 25n, 32);
  check('section 07: base + fee = 125', afterFee.result === 125n);
  var afterCredit = ArithmeticModel.evaluateSub(afterFee.result, 10n, 32);
  check('section 07: 125 - credit = 115', afterCredit.result === 115n);
})();

// Width normalization: inputs are always treated as already-normalized w-bit patterns.
check('width 16 ADD normalizes a 16-bit wraparound', ArithmeticModel.evaluateAdd(0xFFFFn, 1n, 16).result === 0n);
check('width 32 ADD normalizes a 32-bit wraparound', ArithmeticModel.evaluateAdd(0xFFFFFFFFn, 1n, 32).result === 0n);

module.exports = suite;
