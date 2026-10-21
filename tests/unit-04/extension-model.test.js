'use strict';

const ExtensionModel = require('../../unit-04/shared/extension-model.js');
const WidthOps = require('../../unit-04/shared/width-ops.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

// Required source 0xF0 table.
(function () {
  var movzx = ExtensionModel.movzxEax(0xF0n);
  check('movzx eax, byte: parent RAX', movzx.parent64 === 0x00000000000000F0n);
  check('movzx eax, byte: unsigned 240', movzx.destUnsignedInterpretation === 240n);

  var movsxRax = ExtensionModel.movsxRax(0xF0n);
  check('movsx rax, byte: parent RAX', movsxRax.parent64 === 0xFFFFFFFFFFFFFFF0n);
  check('movsx rax, byte: signed 64-bit -16', movsxRax.destSignedInterpretation === -16n);

  var movsxEax = ExtensionModel.movsxEax(0xF0n);
  check('movsx eax, byte: parent RAX (the trap)', movsxEax.parent64 === 0x00000000FFFFFFF0n);
  check('movsx eax, byte: signed EAX -16', movsxEax.destSignedInterpretation === -16n);
  check('movsx eax, byte: full signed RAX reading is 4294967280', movsxEax.parentSignedInterpretation === 4294967280n);

  var movsxdRdi = ExtensionModel.movsxdRdi(movsxEax.destValue);
  check('movsxd rdi, eax: parent RDI', movsxdRdi.parent64 === 0xFFFFFFFFFFFFFFF0n);
  check('movsxd rdi, eax: signed 64-bit -16', movsxdRdi.destSignedInterpretation === -16n);
})();

// Sweep the required source bytes: 0x00, 0x7F, 0x80, 0xFF, 0xF0.
[0x00n, 0x7Fn, 0x80n, 0xFFn, 0xF0n].forEach(function (src) {
  var zx = ExtensionModel.movzxEax(src);
  check('movzx eax zero-extension matches the source value for 0x' + src.toString(16), zx.destUnsignedInterpretation === src);

  var sx = ExtensionModel.movsxRax(src);
  var expectedSigned = WidthOps.signed(src, 8);
  check('movsx rax sign-extension matches signed(source,8) for 0x' + src.toString(16), sx.destSignedInterpretation === expectedSigned);
});

// Generic extend: destWidth must be >= sourceWidth.
(function () {
  var threw = false;
  try { ExtensionModel.computeExtension(1n, 32, 8, false); } catch (e) { threw = true; }
  check('computeExtension rejects destWidth < sourceWidth', threw);
})();

// Generic extend sanity: zero-extension never changes the numeric value.
check('zero-extension 8->64 of 0x7F is still 127', ExtensionModel.computeExtension(0x7Fn, 8, 64, false).destUnsignedInterpretation === 127n);
// Sign-extension of a positive value (high bit clear) is identical to zero-extension.
check('sign-extension of 0x7F (positive) matches zero-extension', ExtensionModel.computeExtension(0x7Fn, 8, 64, true).destValue === ExtensionModel.computeExtension(0x7Fn, 8, 64, false).destValue);

// 16->32 and 32->64 generic extension, exercising widths beyond the fixed byte scenarios.
(function () {
  var r = ExtensionModel.computeExtension(WidthOps.bits(-1n, 16), 16, 32, true); // signed -1 at 16 bits
  check('16->32 sign-extension of -1 fills with ones', r.destValue === WidthOps.mask(32));
  check('16->32 sign-extension of -1: parent clears upper (32-bit write)', r.parent64 === WidthOps.mask(32));
})();

module.exports = suite;
