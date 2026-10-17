'use strict';

const { parseBigInt, parseIndex } = require('../../unit-03/shared/integer-input.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

check('decimal', parseBigInt('100').value === 100n);
check('negative decimal', parseBigInt('-100').value === -100n);
check('hex', parseBigInt('0x1F').value === 31n);
check('negative hex (manual sign split, not BigInt("-0x1F"))', parseBigInt('-0x1F').value === -31n);
check('binary', parseBigInt('0b101').value === 5n);
check('negative binary', parseBigInt('-0b101').value === -5n);
check('octal', parseBigInt('0o17').value === 15n);
check('negative octal', parseBigInt('-0o17').value === -15n);
check('leading +', parseBigInt('+5').value === 5n);
check('trims whitespace', parseBigInt(' 42 ').value === 42n);

check('rejects empty', parseBigInt('').error !== null);
check('rejects whitespace-only', parseBigInt('   ').error !== null);
check('rejects fraction', parseBigInt('12.5').error !== null);
check('rejects trailing junk (decimal)', parseBigInt('12abc').error !== null);
check('rejects trailing junk (hex)', parseBigInt('0x1Fz').error !== null);
check('rejects missing digits after 0x', parseBigInt('0x').error !== null);
check('rejects missing digits after 0b', parseBigInt('0b').error !== null);
check('rejects bare sign', parseBigInt('-').error !== null);
check('rejects bad binary digit', parseBigInt('0b102').error !== null);
check('rejects bad octal digit', parseBigInt('0o18').error !== null);
check('rejects null/undefined', parseBigInt(null).error !== null && parseBigInt(undefined).error !== null);

check('parseIndex accepts 5', parseIndex('5').value === 5);
check('parseIndex rejects negative', parseIndex('-1').error !== null);
check('parseIndex rejects fraction', parseIndex('1.5').error !== null);
check('parseIndex rejects empty', parseIndex('').error !== null);

module.exports = suite;
