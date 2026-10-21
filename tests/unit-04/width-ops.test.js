'use strict';

const WidthOps = require('../../unit-04/shared/width-ops.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

check('mask(8) = 255', WidthOps.mask(8) === 255n);
check('mask(64) = 2^64-1', WidthOps.mask(64) === (1n << 64n) - 1n);
check('bits() normalizes negative into unsigned range', WidthOps.bits(-1n, 8) === 255n);
check('bits() normalizes large positive modulo 2^w', WidthOps.bits(256n, 8) === 0n);
check('bits() is a no-op for an in-range value', WidthOps.bits(42n, 16) === 42n);
check('signed() low half stays positive', WidthOps.signed(127n, 8) === 127n);
check('signed() high half becomes negative', WidthOps.signed(128n, 8) === -128n);
check('signed() 0xFFFFFFFFFFFFFFFF at 64 bits is -1', WidthOps.signed(WidthOps.mask(64), 64) === -1n);

check('toHex pads to exactly w/4 digits', WidthOps.toHex(10n, 8) === '0x0A');
check('toHex at 64 bits has 16 digits', WidthOps.toHex(1n, 64) === '0x0000000000000001');
check('toBinary pads to width', WidthOps.toBinary(5n, 8) === '00000101');

check('lowBytePopcountEven: zero is even', WidthOps.lowBytePopcountEven(0n) === true);
check('lowBytePopcountEven: 0xFF (8 bits) is even', WidthOps.lowBytePopcountEven(0xFFn) === true);
check('lowBytePopcountEven: 0x01 is odd', WidthOps.lowBytePopcountEven(0x01n) === false);
check('lowBytePopcountEven only considers the low byte of a 16-bit value', WidthOps.lowBytePopcountEven(0x0100n) === true);

check('validateOperand accepts signed decimal -128 at width 8', WidthOps.validateOperand(-128n, 8) === null);
check('validateOperand accepts unsigned pattern 255 at width 8', WidthOps.validateOperand(255n, 8) === null);
check('validateOperand rejects -129 at width 8', typeof WidthOps.validateOperand(-129n, 8) === 'string');
check('validateOperand rejects 256 at width 8', typeof WidthOps.validateOperand(256n, 8) === 'string');

check('validateUnsignedField rejects a negative value', typeof WidthOps.validateUnsignedField(-1n, 8) === 'string');
check('validateUnsignedField accepts 0', WidthOps.validateUnsignedField(0n, 8) === null);
check('validateUnsignedField accepts mask', WidthOps.validateUnsignedField(255n, 8) === null);
check('validateUnsignedField rejects mask+1', typeof WidthOps.validateUnsignedField(256n, 8) === 'string');

check('registerName family A widths', WidthOps.registerName(8, 'A') === 'AL' && WidthOps.registerName(16, 'A') === 'AX' &&
  WidthOps.registerName(32, 'A') === 'EAX' && WidthOps.registerName(64, 'A') === 'RAX');

check('writeSubRegister: 8-bit write preserves upper bits', WidthOps.writeSubRegister(0x1122334455667788n, 0xAAn, 8) === 0x11223344556677AAn);
check('writeSubRegister: 16-bit write preserves upper bits', WidthOps.writeSubRegister(0x1122334455667788n, 0xBEEFn, 16) === 0x112233445566BEEFn);
check('writeSubRegister: 32-bit write clears the upper half', WidthOps.writeSubRegister(0x1122334455667788n, 5n, 32) === 5n);
check('writeSubRegister: 64-bit write is a full replace', WidthOps.writeSubRegister(0x1122334455667788n, 9n, 64) === 9n);

// Exactness above Number.MAX_SAFE_INTEGER (2^53 - 1 = 9007199254740991).
const BIG = 9007199254740995n;
check('bits() stays exact above Number precision', WidthOps.bits(BIG, 64) === BIG);
check('signed() stays exact above Number precision', WidthOps.signed(BIG, 64) === BIG);

module.exports = suite;
