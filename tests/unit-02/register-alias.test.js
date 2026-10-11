'use strict';

const { parseUnsignedBigInt, applyAliasWrite, getRaxByteGroups } = require('../../unit-02/shared/register-alias.js');

const suite = { pass: 0, fail: 0 };

function check(name, condition) {
  if (condition) {
    suite.pass += 1;
    return;
  }
  suite.fail += 1;
  console.log('FAIL:', name);
}

const start = 0x1122334455667788n;
check('AL write example', applyAliasWrite(start, 'AL', 0xAAn).rax === 0x11223344556677AAn);
check('AH write example', applyAliasWrite(start, 'AH', 0xAAn).rax === 0x112233445566AA88n);
check('AX write example', applyAliasWrite(start, 'AX', 0xBEEFn).rax === 0x112233445566BEEFn);
check('EAX write example', applyAliasWrite(start, 'EAX', 0x12345678n).rax === 0x0000000012345678n);
check('RAX write example', applyAliasWrite(start, 'RAX', 0xFFFFFFFFFFFFFFFFn).rax === 0xFFFFFFFFFFFFFFFFn);
check('all ones then EAX zero clears bits 63-32', applyAliasWrite(0xFFFFFFFFFFFFFFFFn, 'EAX', 0n).rax === 0n);
check('all ones then AX zero leaves high bits intact', applyAliasWrite(0xFFFFFFFFFFFFFFFFn, 'AX', 0n).rax === 0xFFFFFFFFFFFF0000n);
check('EAX write zero-extends even for a nonzero value', applyAliasWrite(start, 'EAX', 0x99n).rax === 0x0000000000000099n);
check('AL rejects 256', parseUnsignedBigInt('256', { width: 8, alias: 'AL' }).error !== null);
check('EAX rejects 0x100000000', parseUnsignedBigInt('0x100000000', { width: 32, alias: 'EAX' }).error !== null);
check('RAX accepts full 64-bit range', parseUnsignedBigInt('0xFFFFFFFFFFFFFFFF', { width: 64, alias: 'RAX' }).value === 0xFFFFFFFFFFFFFFFFn);
check('byte groups show preserved/written labels', getRaxByteGroups(start, 'AL').some((group) => group.status === 'written'));

module.exports = suite;
