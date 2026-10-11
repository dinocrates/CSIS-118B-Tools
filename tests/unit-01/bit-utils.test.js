'use strict';
var assert = require('assert');
var BitUtils = require('../../unit-01/shared/bit-utils.js');

var results = { pass: 0, fail: 0, name: 'bit-utils' };

function test(desc, fn) {
  try {
    fn();
    results.pass++;
  } catch (e) {
    results.fail++;
    console.error('  FAIL: ' + desc);
    console.error('    ' + e.message);
  }
}

console.log('bit-utils.js');

// --- Required acceptance cases ---
test('38 -> 00100110 / 0x26 / signed 38', function () {
  assert.strictEqual(BitUtils.toBinaryString(38, 8), '00100110');
  assert.strictEqual(BitUtils.toHexString(38, 8), '26');
  assert.strictEqual(BitUtils.signedFromUnsigned(38, 8), 38);
});

test('183 -> 10110111 / 0xB7 / signed -73', function () {
  assert.strictEqual(BitUtils.toBinaryString(183, 8), '10110111');
  assert.strictEqual(BitUtils.toHexString(183, 8), 'B7');
  assert.strictEqual(BitUtils.signedFromUnsigned(183, 8), -73);
});

test('245 -> 11110101 / 0xF5 / signed -11', function () {
  assert.strictEqual(BitUtils.toBinaryString(245, 8), '11110101');
  assert.strictEqual(BitUtils.toHexString(245, 8), 'F5');
  assert.strictEqual(BitUtils.signedFromUnsigned(245, 8), -11);
});

test('128 -> 10000000 / signed -128; negate overflows', function () {
  assert.strictEqual(BitUtils.toBinaryString(128, 8), '10000000');
  assert.strictEqual(BitUtils.signedFromUnsigned(128, 8), -128);
  var neg = BitUtils.twosComplementNegate(128, 8);
  assert.strictEqual(neg.inverted, 127);
  assert.strictEqual(neg.result, 128);
  assert.strictEqual(neg.doesNotFit, true);
});

test('255 -> 11111111 / signed -1', function () {
  assert.strictEqual(BitUtils.toBinaryString(255, 8), '11111111');
  assert.strictEqual(BitUtils.signedFromUnsigned(255, 8), -1);
});

test('negate 0 returns 0', function () {
  var neg = BitUtils.twosComplementNegate(0, 8);
  assert.strictEqual(neg.inverted, 255);
  assert.strictEqual(neg.result, 0);
  assert.strictEqual(neg.doesNotFit, false);
});

test('negate 11: 00001011 -> 11110100 -> 11110101', function () {
  var neg = BitUtils.twosComplementNegate(11, 8);
  assert.strictEqual(BitUtils.toBinaryString(neg.original, 8), '00001011');
  assert.strictEqual(BitUtils.toBinaryString(neg.inverted, 8), '11110100');
  assert.strictEqual(BitUtils.toBinaryString(neg.result, 8), '11110101');
});

// --- Parsing: valid inputs ---
test('parse decimal 38', function () {
  var r = BitUtils.parseValue('38', 'dec', 8);
  assert.strictEqual(r.value, 38);
  assert.strictEqual(r.error, null);
});

test('parse binary with and without 0b prefix', function () {
  assert.strictEqual(BitUtils.parseValue('00100110', 'bin', 8).value, 38);
  assert.strictEqual(BitUtils.parseValue('0b100110', 'bin', 8).value, 38);
  assert.strictEqual(BitUtils.parseValue('110', 'bin', 8).value, 6);
});

test('parse hex with and without 0x prefix', function () {
  assert.strictEqual(BitUtils.parseValue('26', 'hex', 8).value, 38);
  assert.strictEqual(BitUtils.parseValue('0x26', 'hex', 8).value, 38);
  assert.strictEqual(BitUtils.parseValue('FF', 'hex', 8).value, 255);
  assert.strictEqual(BitUtils.parseValue('ff', 'hex', 8).value, 255);
});

// --- Parsing: rejected inputs ---
test('reject empty input', function () {
  assert.ok(BitUtils.parseValue('', 'dec', 8).error);
  assert.ok(BitUtils.parseValue('   ', 'hex', 8).error);
});

test('reject out-of-range decimal', function () {
  assert.ok(BitUtils.parseValue('256', 'dec', 8).error);
  assert.ok(BitUtils.parseValue('999', 'dec', 8).error);
});

test('reject mismatched prefixes', function () {
  assert.ok(BitUtils.parseValue('0x1A', 'dec', 8).error, 'hex prefix rejected under decimal');
  assert.ok(BitUtils.parseValue('0b101', 'dec', 8).error, 'bin prefix rejected under decimal');
  assert.ok(BitUtils.parseValue('0x1A', 'bin', 8).error, 'hex prefix rejected under binary');
  assert.ok(BitUtils.parseValue('0b101', 'hex', 8).error, 'bin prefix rejected under hex');
});

test('reject invalid digits for the selected base', function () {
  assert.ok(BitUtils.parseValue('12A', 'dec', 8).error);
  assert.ok(BitUtils.parseValue('012', 'bin', 8).error, '2 is not a valid binary digit');
  assert.ok(BitUtils.parseValue('G7', 'hex', 8).error);
});

test('reject fractional and partial input', function () {
  assert.ok(BitUtils.parseValue('3.5', 'dec', 8).error);
  assert.ok(BitUtils.parseValue('0x', 'hex', 8).error);
  assert.ok(BitUtils.parseValue('0b', 'bin', 8).error);
});

test('reject binary input longer than the width', function () {
  assert.ok(BitUtils.parseValue('111111111', 'bin', 8).error);
});

console.log('  ' + results.pass + ' passed, ' + results.fail + ' failed');
module.exports = results;
