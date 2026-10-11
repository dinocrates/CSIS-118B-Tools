'use strict';

const { evaluateArithmetic } = require('../../unit-02/shared/arithmetic-flags.js');

const suite = { pass: 0, fail: 0 };

function check(name, condition) {
  if (condition) {
    suite.pass += 1;
    return;
  }
  suite.fail += 1;
  console.log('FAIL:', name);
}

const presets = [
  { a: 255n, op: 'ADD', b: 1n, width: 8, expected: { result: 0n, cf: 1n, zf: 1n, sf: 0n, of: 0n, af: 1n, pf: 1n } },
  { a: 127n, op: 'ADD', b: 1n, width: 8, expected: { result: 0x80n, cf: 0n, zf: 0n, sf: 1n, of: 1n, af: 1n, pf: 0n } },
  { a: 0n, op: 'SUB', b: 1n, width: 8, expected: { result: 0xFFn, cf: 1n, zf: 0n, sf: 1n, of: 0n, af: 1n, pf: 1n } },
  { a: 128n, op: 'SUB', b: 1n, width: 8, expected: { result: 0x7Fn, cf: 0n, zf: 0n, sf: 0n, of: 1n, af: 1n, pf: 0n } },
  { a: 5n, op: 'SUB', b: 5n, width: 8, expected: { result: 0n, cf: 0n, zf: 1n, sf: 0n, of: 0n, af: 0n, pf: 1n } },
  { a: 255n, op: 'ADD', b: 255n, width: 8, expected: { result: 0xFEn, cf: 1n, zf: 0n, sf: 1n, of: 0n, af: 1n, pf: 0n } },
];

presets.forEach((preset, index) => {
  const actual = evaluateArithmetic(preset.a, preset.b, preset.width, preset.op);
  const label = 'preset ' + String(index + 1);
  check(label + ' result', actual.result === preset.expected.result);
  check(label + ' CF', actual.cf === preset.expected.cf);
  check(label + ' ZF', actual.zf === preset.expected.zf);
  check(label + ' SF', actual.sf === preset.expected.sf);
  check(label + ' OF', actual.of === preset.expected.of);
  check(label + ' AF', actual.af === preset.expected.af);
  check(label + ' PF', actual.pf === preset.expected.pf);
});

check('16-bit max plus one carry boundary', evaluateArithmetic(65535n, 1n, 16, 'ADD').cf === 1n && evaluateArithmetic(65535n, 1n, 16, 'ADD').result === 0n);
check('32-bit max signed plus one overflow', evaluateArithmetic(2147483647n, 1n, 32, 'ADD').of === 1n && evaluateArithmetic(2147483647n, 1n, 32, 'ADD').result === 0x80000000n);
check('64-bit minimum signed minus one overflow', evaluateArithmetic(0x8000000000000000n, 1n, 64, 'SUB').of === 1n && evaluateArithmetic(0x8000000000000000n, 1n, 64, 'SUB').result === 0x7FFFFFFFFFFFFFFFn);
check('64-bit zero minus one borrow boundary', evaluateArithmetic(0n, 1n, 64, 'SUB').cf === 1n && evaluateArithmetic(0n, 1n, 64, 'SUB').result === 0xFFFFFFFFFFFFFFFFn);
check('64-bit width handles exact values', evaluateArithmetic(0xFFFFFFFFFFFFFFFFn, 1n, 64, 'ADD').result === 0n && evaluateArithmetic(0xFFFFFFFFFFFFFFFFn, 1n, 64, 'ADD').cf === 1n);

module.exports = suite;
