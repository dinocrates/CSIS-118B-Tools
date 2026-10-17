'use strict';

const ByteExtension = require('../../unit-03/shared/byte-extension.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

// Acceptance table.
check('0x00 unsigned/signed', ByteExtension.unsignedValue(0n) === 0n && ByteExtension.signedValue(0n) === 0n);
check('0x7F unsigned/signed', ByteExtension.unsignedValue(0x7Fn) === 127n && ByteExtension.signedValue(0x7Fn) === 127n);
check('0x80 unsigned/signed', ByteExtension.unsignedValue(0x80n) === 128n && ByteExtension.signedValue(0x80n) === -128n);
check('0xFF unsigned/signed', ByteExtension.unsignedValue(0xFFn) === 255n && ByteExtension.signedValue(0xFFn) === -1n);

// Spec's worked example for 0xFF.
let movzx = ByteExtension.movzxEdi(0xFFn);
check('MOVZX EDI 0xFF rdi hex', movzx.rdiHex === '0x00000000000000FF');
check('MOVZX EDI 0xFF displayed', movzx.displayed === '255');
let movsxRdi = ByteExtension.movsxRdi(0xFFn);
check('MOVSX RDI 0xFF rdi hex', movsxRdi.rdiHex === '0xFFFFFFFFFFFFFFFF');
check('MOVSX RDI 0xFF displayed', movsxRdi.displayed === '-1');
let movsxEdi = ByteExtension.movsxEdiThenZeroExtend(0xFFn);
check('MOVSX EDI 0xFF rdi hex', movsxEdi.rdiHex === '0x00000000FFFFFFFF');
check('MOVSX EDI 0xFF displayed', movsxEdi.displayed === '4294967295');

// Exhaustive sweep of all 256 byte patterns against independently computed formulas.
let sweepFail = 0;
for (let byte = 0; byte <= 255; byte++) {
  const pattern = BigInt(byte);
  const expectedSigned = byte >= 128 ? BigInt(byte - 256) : BigInt(byte);
  const expectedUnsigned = BigInt(byte);
  const expectedMovzxFull = expectedUnsigned;
  const expectedMovsxRdiFull = BigInt.asUintN(64, expectedSigned);
  const expectedU32 = BigInt.asUintN(32, expectedSigned);
  const expectedMovsxEdiFull = BigInt.asUintN(64, expectedU32);

  if (ByteExtension.unsignedValue(pattern) !== expectedUnsigned) sweepFail++;
  if (ByteExtension.signedValue(pattern) !== expectedSigned) sweepFail++;

  const mz = ByteExtension.movzxEdi(pattern);
  if (mz.numeric !== expectedMovzxFull || mz.displayed !== expectedMovzxFull.toString()) sweepFail++;

  const msr = ByteExtension.movsxRdi(pattern);
  if (msr.numeric !== expectedSigned || msr.displayed !== expectedSigned.toString()) sweepFail++;
  if (BigInt('0x' + msr.rdiHex.slice(2)) !== expectedMovsxRdiFull) sweepFail++;

  const mse = ByteExtension.movsxEdiThenZeroExtend(pattern);
  if (mse.numeric !== expectedU32 || mse.displayed !== expectedU32.toString()) sweepFail++;
  if (BigInt('0x' + mse.rdiHex.slice(2)) !== expectedMovsxEdiFull) sweepFail++;
}
check('exhaustive 256-pattern sweep (signedness + all 3 extensions)', sweepFail === 0);

// Input validation.
check('rejects -1', ByteExtension.parseBytePattern('-1').error !== null);
check('rejects 256', ByteExtension.parseBytePattern('256').error !== null);
check('rejects malformed', ByteExtension.parseBytePattern('abc').error !== null);
check('accepts 0x80', ByteExtension.parseBytePattern('0x80').value === 128n);

// Bit toggles.
check('toggleBit clears bit 0 of 0xFF', ByteExtension.toggleBit(0xFFn, 0) === 0xFEn);
check('toggleBit sets bit 7 of 0x00', ByteExtension.toggleBit(0x00n, 7) === 0x80n);

module.exports = suite;
