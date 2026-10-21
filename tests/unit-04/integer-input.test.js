'use strict';

const IntegerInput = require('../../unit-04/shared/integer-input.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

check('decimal', IntegerInput.parseBigInt('42', 'x').value === 42n);
check('negative decimal', IntegerInput.parseBigInt('-42', 'x').value === -42n);
check('hex', IntegerInput.parseBigInt('0xFF', 'x').value === 255n);
check('hex lowercase', IntegerInput.parseBigInt('0xff', 'x').value === 255n);
check('binary', IntegerInput.parseBigInt('0b1010', 'x').value === 10n);
check('whitespace is trimmed', IntegerInput.parseBigInt('  7  ', 'x').value === 7n);

check('empty string is rejected', IntegerInput.parseBigInt('', 'x').error !== null);
check('fraction is rejected', IntegerInput.parseBigInt('1.5', 'x').error !== null);
check('exponential notation is rejected', IntegerInput.parseBigInt('1e10', 'x').error !== null);
check('arithmetic expression is rejected', IntegerInput.parseBigInt('1+1', 'x').error !== null);
check('invalid hex digit is rejected', IntegerInput.parseBigInt('0xGG', 'x').error !== null);
check('invalid binary digit is rejected', IntegerInput.parseBigInt('0b12', 'x').error !== null);
check('negative hex is rejected (-0x10)', IntegerInput.parseBigInt('-0x10', 'x').error !== null);
check('negative binary is rejected', IntegerInput.parseBigInt('-0b10', 'x').error !== null);
check('bare "0x" with no digits is rejected', IntegerInput.parseBigInt('0x', 'x').error !== null);
check('bare sign with no digits is rejected', IntegerInput.parseBigInt('-', 'x').error !== null);

module.exports = suite;
