'use strict';

const MultiplicationModel = require('../../unit-04/shared/multiplication-model.js');
const WidthOps = require('../../unit-04/shared/width-ops.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

// DWORD unsigned 20 x 10 -> full 200; EDX=0, EAX=200; CF/OF 0/0.
(function () {
  var r = MultiplicationModel.mulOneOperand(20n, 10n, 32);
  check('DWORD unsigned 20x10: full product', r.fullProduct === 200n);
  check('DWORD unsigned 20x10: EAX/EDX halves', r.low === 200n && r.high === 0n);
  check('DWORD unsigned 20x10: CF/OF', r.cf === 0n && r.of === 0n);
})();

// DWORD unsigned 0xFFFFFFFF x 2 -> full 8589934590; EDX=1, EAX=0xFFFFFFFE; CF/OF 1/1.
(function () {
  var r = MultiplicationModel.mulOneOperand(0xFFFFFFFFn, 2n, 32);
  check('DWORD unsigned 0xFFFFFFFF x 2: full product', r.fullProduct === 8589934590n);
  check('DWORD unsigned 0xFFFFFFFF x 2: EAX/EDX halves', r.low === 0xFFFFFFFEn && r.high === 1n);
  check('DWORD unsigned 0xFFFFFFFF x 2: CF/OF', r.cf === 1n && r.of === 1n);
})();

// DWORD signed -20 x 10 -> full -200; high 0xFFFFFFFF, low 0xFFFFFF38; CF/OF 0/0.
(function () {
  var a = WidthOps.bits(-20n, 32);
  var r = MultiplicationModel.imulOneOperand(a, 10n, 32);
  check('DWORD signed -20x10: exact signed product', r.fullSignedProduct === -200n);
  check('DWORD signed -20x10: high/low halves', r.high === 0xFFFFFFFFn && r.low === 0xFFFFFF38n);
  check('DWORD signed -20x10: CF/OF (fits, no overflow)', r.cf === 0n && r.of === 0n);
})();

// Byte unsigned 48 x 4 -> AX=0x00C0; AH=0, AL=0xC0; CF/OF 0/0.
(function () {
  var r = MultiplicationModel.mulOneOperand(48n, 4n, 8);
  check('Byte unsigned 48x4: AH/AL', r.high === 0n && r.low === 0xC0n);
  check('Byte unsigned 48x4: CF/OF', r.cf === 0n && r.of === 0n);
})();

// Byte signed 48 x 4 -> same full AX=0x00C0; low signed AL=-64 cannot hold 192; CF/OF 1/1.
(function () {
  var r = MultiplicationModel.imulOneOperand(48n, 4n, 8);
  check('Byte signed 48x4: same bit pattern as unsigned (AH=0,AL=0xC0)', r.high === 0n && r.low === 0xC0n);
  check('Byte signed 48x4: exact signed product is 192', r.fullSignedProduct === 192n);
  check('Byte signed 48x4: low AL read as signed is -64, which != 192', WidthOps.signed(r.low, 8) === -64n);
  check('Byte signed 48x4: CF/OF (does not fit)', r.cf === 1n && r.of === 1n);
})();

// Two-operand WORD IMUL 200 x 200 -> AX=0x9C40, signed -25536; CF/OF 1/1.
(function () {
  var r = MultiplicationModel.imulTwoOperand(200n, 200n, 16);
  check('Two-operand WORD IMUL 200x200: destBits', r.destBits === 0x9C40n);
  check('Two-operand WORD IMUL 200x200: signed interpretation', WidthOps.signed(r.destBits, 16) === -25536n);
  check('Two-operand WORD IMUL 200x200: CF/OF', r.cf === 1n && r.of === 1n);
})();

// Unsigned QWORD (2^64-1) x (2^64-1) -> exact 128-bit product, not a Number approximation.
(function () {
  var maxQ = WidthOps.mask(64);
  var r = MultiplicationModel.mulOneOperand(maxQ, maxQ, 64);
  check('QWORD unsigned max x max: exact full product', r.fullProduct === 340282366920938463426481119284349108225n);
  check('QWORD unsigned max x max: high half', r.high === 18446744073709551614n);
  check('QWORD unsigned max x max: low half', r.low === 1n);
  check('QWORD unsigned max x max: CF/OF', r.cf === 1n && r.of === 1n);
})();

// Register contracts.
(function () {
  check('byte contract', JSON.stringify(MultiplicationModel.registerContract(8)) === JSON.stringify({ accumulator: 'AL', fullProduct: 'AX', highHalf: 'AH', lowHalf: 'AL' }));
  check('word contract', JSON.stringify(MultiplicationModel.registerContract(16)) === JSON.stringify({ accumulator: 'AX', fullProduct: 'DX:AX', highHalf: 'DX', lowHalf: 'AX' }));
  check('dword contract', JSON.stringify(MultiplicationModel.registerContract(32)) === JSON.stringify({ accumulator: 'EAX', fullProduct: 'EDX:EAX', highHalf: 'EDX', lowHalf: 'EAX' }));
  check('qword contract', JSON.stringify(MultiplicationModel.registerContract(64)) === JSON.stringify({ accumulator: 'RAX', fullProduct: 'RDX:RAX', highHalf: 'RDX', lowHalf: 'RAX' }));
})();

// Rejection of 8-bit two-operand IMUL.
check('two-operand IMUL is not allowed at 8-bit width', MultiplicationModel.twoOperandAllowed(8) === false);
check('two-operand IMUL is allowed at 16/32/64-bit widths', MultiplicationModel.twoOperandAllowed(16) && MultiplicationModel.twoOperandAllowed(32) && MultiplicationModel.twoOperandAllowed(64));
(function () {
  var threw = false;
  try { MultiplicationModel.imulTwoOperand(1n, 1n, 8); } catch (e) { threw = true; }
  check('calling imulTwoOperand at width 8 throws', threw);
})();

// Three-operand IMUL reference form: imul eax, ecx, 10.
(function () {
  var ecx = WidthOps.bits(-20n, 32); // signed -20
  var r = MultiplicationModel.imulThreeOperand(ecx, 10n, 32);
  check('three-operand IMUL ecx(-20) * 10: exact product', r.fullSignedProduct === -200n);
  check('three-operand IMUL ecx(-20) * 10: destBits fits, no overflow', r.cf === 0n && r.of === 0n);
})();

// One-operand IMUL clear-flags case: high half equals sign extension of low half, even though high is nonzero.
(function () {
  var a = WidthOps.bits(-5n, 8); // signed -5
  var b = WidthOps.bits(-3n, 8); // signed -3
  var r = MultiplicationModel.imulOneOperand(a, b, 8); // -5 * -3 = 15, fits in signed byte
  check('IMUL -5 * -3 = 15 fits in one byte: CF/OF clear', r.fullSignedProduct === 15n && r.cf === 0n && r.of === 0n);
})();
(function () {
  var a = WidthOps.bits(-1n, 16); // signed -1
  var r = MultiplicationModel.imulOneOperand(a, 1n, 16); // -1 * 1 = -1, high half is all-ones (sign extension), fits
  check('IMUL -1 * 1 = -1: high is nonzero but correct (sign extension), CF/OF clear', r.fullSignedProduct === -1n && r.cf === 0n && r.of === 0n && r.high === 0xFFFFn);
})();

module.exports = suite;
