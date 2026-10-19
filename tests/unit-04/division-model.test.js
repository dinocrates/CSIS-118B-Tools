'use strict';

const DivisionModel = require('../../unit-04/shared/division-model.js');
const WidthOps = require('../../unit-04/shared/width-ops.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

// DWORD DIV 25 / 12, prepared high=0 -> quotient 2, remainder 1.
(function () {
  var r = DivisionModel.evaluateDivision({ width: 32, signed: false, prepMode: 'manual', highHalf: 0n, lowHalf: 25n, divisorPattern: 12n });
  check('DWORD DIV 25/12: no error', r.error === null);
  check('DWORD DIV 25/12: quotient/remainder', r.quotient === 2n && r.remainder === 1n);
  check('DWORD DIV 25/12: identity 25 = 2*12 + 1', r.dividendValue === r.quotient * r.divisorValue + r.remainder);
})();

// DWORD IDIV -48 / 5 -> quotient -9, remainder -3; input high 0xFFFFFFFF, low 0xFFFFFFD0.
(function () {
  var narrow = WidthOps.bits(-48n, 32);
  var r = DivisionModel.evaluateDivision({ width: 32, signed: true, prepMode: 'narrow', narrowValue: narrow, divisorPattern: 5n });
  check('DWORD IDIV -48/5: quotient/remainder', r.quotient === -9n && r.remainder === -3n);
  var high = (r.dividendBits2w >> 32n) & WidthOps.mask(32);
  var low = r.dividendBits2w & WidthOps.mask(32);
  check('DWORD IDIV -48/5: prepared high/low', high === 0xFFFFFFFFn && low === 0xFFFFFFD0n);
})();

// DWORD IDIV 48 / -5 -> quotient -9, remainder 3 (follows positive dividend).
(function () {
  var r = DivisionModel.evaluateDivision({ width: 32, signed: true, prepMode: 'narrow', narrowValue: 48n, divisorPattern: WidthOps.bits(-5n, 32) });
  check('DWORD IDIV 48/-5', r.quotient === -9n && r.remainder === 3n);
})();

// DWORD IDIV -48 / -5 -> quotient 9, remainder -3 (follows negative dividend).
(function () {
  var r = DivisionModel.evaluateDivision({ width: 32, signed: true, prepMode: 'narrow', narrowValue: WidthOps.bits(-48n, 32), divisorPattern: WidthOps.bits(-5n, 32) });
  check('DWORD IDIV -48/-5', r.quotient === 9n && r.remainder === -3n);
})();

// Byte IDIV -48 / 5 -> AL=0xF7 (-9), AH=0xFD (-3).
(function () {
  var r = DivisionModel.evaluateDivision({ width: 8, signed: true, prepMode: 'narrow', narrowValue: WidthOps.bits(-48n, 8), divisorPattern: 5n });
  check('Byte IDIV -48/5: quotient/remainder', r.quotient === -9n && r.remainder === -3n);
  check('Byte IDIV -48/5: AL pattern 0xF7', WidthOps.bits(r.quotient, 8) === 0xF7n);
  check('Byte IDIV -48/5: AH pattern 0xFD', WidthOps.bits(r.remainder, 8) === 0xFDn);
})();

// DWORD DIV manual high=1, low=0, divisor=2 -> quotient 2147483648, remainder 0.
(function () {
  var r = DivisionModel.evaluateDivision({ width: 32, signed: false, prepMode: 'manual', highHalf: 1n, lowHalf: 0n, divisorPattern: 2n });
  check('DWORD DIV manual high=1,low=0,divisor=2: full dividend', r.dividendValue === 4294967296n);
  check('DWORD DIV manual high=1,low=0,divisor=2: quotient/remainder', r.quotient === 2147483648n && r.remainder === 0n);
})();

// QWORD DIV manual high=1, low=0, divisor=2 -> quotient 9223372036854775808, remainder 0; full dividend 18446744073709551616.
(function () {
  var r = DivisionModel.evaluateDivision({ width: 64, signed: false, prepMode: 'manual', highHalf: 1n, lowHalf: 0n, divisorPattern: 2n });
  check('QWORD DIV manual: full dividend is exact 2^64', r.dividendValue === 18446744073709551616n);
  check('QWORD DIV manual: quotient/remainder', r.quotient === 9223372036854775808n && r.remainder === 0n);
})();

// Divisor zero -> divide error, for both DIV and IDIV.
check('DIV by zero is a divide error', DivisionModel.evaluateDivision({ width: 32, signed: false, prepMode: 'narrow', narrowValue: 10n, divisorPattern: 0n }).error !== null);
check('IDIV by zero is a divide error', DivisionModel.evaluateDivision({ width: 32, signed: true, prepMode: 'narrow', narrowValue: 10n, divisorPattern: 0n }).error !== null);

// Byte IDIV -128 / -1 -> divide error (quotient 128 cannot fit signed AL).
(function () {
  var r = DivisionModel.evaluateDivision({ width: 8, signed: true, prepMode: 'narrow', narrowValue: WidthOps.bits(-128n, 8), divisorPattern: WidthOps.bits(-1n, 8) });
  check('Byte IDIV -128/-1 is a divide error', r.error !== null && /128/.test(r.error));
})();

// Byte DIV manual high=1, low=0, divisor=1 -> divide error (quotient 256 cannot fit unsigned AL).
(function () {
  var r = DivisionModel.evaluateDivision({ width: 8, signed: false, prepMode: 'manual', highHalf: 1n, lowHalf: 0n, divisorPattern: 1n });
  check('Byte DIV manual high=1,low=0,divisor=1 is a divide error', r.error !== null && /256/.test(r.error));
})();

// A valid nonzero high-half dividend that is NOT an overflow.
(function () {
  var r = DivisionModel.evaluateDivision({ width: 16, signed: false, prepMode: 'manual', highHalf: 1n, lowHalf: 5000n, divisorPattern: 3n });
  check('WORD DIV manual with nonzero high half succeeds', r.error === null);
  check('WORD DIV manual with nonzero high half: identity holds', r.dividendValue === r.quotient * r.divisorValue + r.remainder);
})();

// Register contracts for narrow preparation (CBW/CWD/CDQ/CQO).
(function () {
  check('byte contract', DivisionModel.registerContract(8).narrowOp === 'CBW' && DivisionModel.registerContract(8).remainder === 'AH');
  check('word contract', DivisionModel.registerContract(16).narrowOp === 'CWD' && DivisionModel.registerContract(16).dividend === 'DX:AX');
  check('dword contract', DivisionModel.registerContract(32).narrowOp === 'CDQ' && DivisionModel.registerContract(32).dividend === 'EDX:EAX');
  check('qword contract', DivisionModel.registerContract(64).narrowOp === 'CQO' && DivisionModel.registerContract(64).dividend === 'RDX:RAX');
})();

// Manual high:low combination is a pure concatenation, independent of DIV/IDIV mode.
check('combineManual concatenates high and low', DivisionModel.combineManual(0xFFn, 0x10n, 8) === 0xFF10n);

// Section 15 worked expression: (20+5)*4 = 100 as EDX:EAX, then / 6 -> EAX=16, EDX=4.
(function () {
  var r = DivisionModel.evaluateDivision({ width: 32, signed: false, prepMode: 'manual', highHalf: 0n, lowHalf: 100n, divisorPattern: 6n });
  check('section 15: 100 / 6 -> quotient 16, remainder 4', r.quotient === 16n && r.remainder === 4n);
})();

module.exports = suite;
