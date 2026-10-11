'use strict';
var assert = require('assert');
var FractionUtils = require('../../unit-01/shared/fraction-utils.js');

var results = { pass: 0, fail: 0, name: 'fraction-utils' };

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

function bitsOf(steps) {
  return steps.map(function (s) { return s.bit; }).join('');
}

console.log('fraction-utils.js');

test('0.125 = 1/8 -> 001, 3 steps, terminates', function () {
  var f = FractionUtils.parseDecimalFraction('0.125');
  assert.strictEqual(f.numerator, 1n);
  assert.strictEqual(f.denominator, 8n);
  var exp = FractionUtils.expandBinaryFraction(f.numerator, f.denominator, 24);
  assert.strictEqual(exp.steps.length, 3);
  assert.strictEqual(bitsOf(exp.steps), '001');
  assert.strictEqual(exp.terminated, true);
  assert.strictEqual(exp.repeatStartIndex, null);
});

test('.125 (no leading 0) parses the same as 0.125', function () {
  var f = FractionUtils.parseDecimalFraction('.125');
  assert.strictEqual(f.numerator, 1n);
  assert.strictEqual(f.denominator, 8n);
});

test('0.625 = 5/8 -> 101, 3 steps, terminates', function () {
  var f = FractionUtils.parseDecimalFraction('0.625');
  assert.strictEqual(f.numerator, 5n);
  assert.strictEqual(f.denominator, 8n);
  var exp = FractionUtils.expandBinaryFraction(f.numerator, f.denominator, 24);
  assert.strictEqual(bitsOf(exp.steps), '101');
  assert.strictEqual(exp.terminated, true);
});

test('0.75 = 3/4 -> 11, 2 steps, terminates', function () {
  var f = FractionUtils.parseDecimalFraction('0.75');
  assert.strictEqual(f.numerator, 3n);
  assert.strictEqual(f.denominator, 4n);
  var exp = FractionUtils.expandBinaryFraction(f.numerator, f.denominator, 24);
  assert.strictEqual(bitsOf(exp.steps), '11');
  assert.strictEqual(exp.terminated, true);
});

test('0.1 = 1/10 -> one nonrepeating 0, then repeating 0011', function () {
  var f = FractionUtils.parseDecimalFraction('0.1');
  assert.strictEqual(f.numerator, 1n);
  assert.strictEqual(f.denominator, 10n);
  var exp = FractionUtils.expandBinaryFraction(f.numerator, f.denominator, 24);
  assert.strictEqual(exp.terminated, false);
  assert.strictEqual(exp.repeatStartIndex, 1);
  var nonRepeating = exp.steps.slice(0, exp.repeatStartIndex);
  var repeating = exp.steps.slice(exp.repeatStartIndex);
  assert.strictEqual(bitsOf(nonRepeating), '0');
  assert.strictEqual(bitsOf(repeating), '0011');
});

test('0.2 = 1/5 -> fully repeating 0011, no nonrepeating prefix', function () {
  var f = FractionUtils.parseDecimalFraction('0.2');
  assert.strictEqual(f.numerator, 1n);
  assert.strictEqual(f.denominator, 5n);
  var exp = FractionUtils.expandBinaryFraction(f.numerator, f.denominator, 24);
  assert.strictEqual(exp.terminated, false);
  assert.strictEqual(exp.repeatStartIndex, 0);
  assert.strictEqual(bitsOf(exp.steps.slice(0, 4)), '0011');
});

test('0 -> 0.0 with no conversion steps', function () {
  var f = FractionUtils.parseDecimalFraction('0');
  assert.strictEqual(f.numerator, 0n);
  var exp = FractionUtils.expandBinaryFraction(f.numerator, f.denominator, 24);
  assert.strictEqual(exp.steps.length, 0);
  assert.strictEqual(exp.terminated, true);
});

test('reject negative, >=1, empty, malformed, and >6-decimal input', function () {
  assert.ok(FractionUtils.parseDecimalFraction('-0.5').error);
  assert.ok(FractionUtils.parseDecimalFraction('1').error);
  assert.ok(FractionUtils.parseDecimalFraction('1.0').error);
  assert.ok(FractionUtils.parseDecimalFraction('').error);
  assert.ok(FractionUtils.parseDecimalFraction('abc').error);
  assert.ok(FractionUtils.parseDecimalFraction('0.12345678').error);
});

test('terminates in binary iff reduced denominator is a power of two', function () {
  var cases = [
    ['0.125', true], // 1/8
    ['0.625', true], // 5/8
    ['0.75', true],  // 3/4
    ['0.1', false],  // 1/10
    ['0.2', false],  // 1/5
    ['0.5', true]    // 1/2
  ];
  cases.forEach(function (c) {
    var f = FractionUtils.parseDecimalFraction(c[0]);
    assert.strictEqual(FractionUtils.terminatesInBinary(f.denominator), c[1], c[0]);
  });
});

test('exact identity holds for every k-digit prefix: numerator*2^k = prefixInteger*denominator + remainder', function () {
  var decimals = ['0.1', '0.2', '0.125', '0.625', '0.75', '0.333333', '0.000001', '0.999999'];
  decimals.forEach(function (dec) {
    var f = FractionUtils.parseDecimalFraction(dec);
    var exp = FractionUtils.expandBinaryFraction(f.numerator, f.denominator, 24);
    for (var k = 1; k <= exp.steps.length; k++) {
      var info = FractionUtils.truncationInfo(f.numerator, f.denominator, exp.steps, k);
      var remainderK = exp.steps[k - 1].remainderAfter;
      var left = f.numerator * (2n ** BigInt(k));
      var right = info.prefixInteger * f.denominator + remainderK;
      assert.strictEqual(left, right, dec + ' at k=' + k);
    }
  });
});

test('reaching the 24-digit limit without termination/repeat is reported, not declared finite', function () {
  // Force a tiny maxSteps to simulate the "limit reached" branch deterministically.
  var f = FractionUtils.parseDecimalFraction('0.1'); // 1/10, repeats after a few digits
  var exp = FractionUtils.expandBinaryFraction(f.numerator, f.denominator, 3);
  assert.strictEqual(exp.terminated, false);
  assert.strictEqual(exp.repeatStartIndex, null);
  assert.strictEqual(exp.hitLimit, true);
  assert.strictEqual(exp.steps.length, 3);
});

console.log('  ' + results.pass + ' passed, ' + results.fail + ' failed');
module.exports = results;
