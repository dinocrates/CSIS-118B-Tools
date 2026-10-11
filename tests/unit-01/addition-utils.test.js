'use strict';
var assert = require('assert');
var AdditionUtils = require('../../unit-01/shared/addition-utils.js');

var results = { pass: 0, fail: 0, name: 'addition-utils' };

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

console.log('addition-utils.js');

test('8-bit 11+12: stored 23, carry 0, no signed overflow', function () {
  var r = AdditionUtils.evaluateAddition(11, 12, 8);
  assert.strictEqual(r.exactSum, 23);
  assert.strictEqual(r.stored, 23);
  assert.strictEqual(r.carryOut, 0);
  assert.strictEqual(r.signedOverflow, false);
});

test('4-bit 11+12: exact 23, stored 7, carry 1, signed overflow true', function () {
  var r = AdditionUtils.evaluateAddition(11, 12, 4);
  assert.strictEqual(r.exactSum, 23);
  assert.strictEqual(r.stored, 7);
  assert.strictEqual(r.carryOut, 1);
  assert.strictEqual(r.signedA, -5);
  assert.strictEqual(r.signedB, -4);
  assert.strictEqual(r.signedOverflow, true);
});

test('8-bit 255+1: exact 256, stored 0, carry 1, no signed overflow', function () {
  var r = AdditionUtils.evaluateAddition(255, 1, 8);
  assert.strictEqual(r.exactSum, 256);
  assert.strictEqual(r.stored, 0);
  assert.strictEqual(r.carryOut, 1);
  assert.strictEqual(r.signedA, -1);
  assert.strictEqual(r.signedB, 1);
  assert.strictEqual(r.signedResult, 0);
  assert.strictEqual(r.signedOverflow, false);
});

test('8-bit 127+1: exact 128, stored 128/0x80, carry 0, signed overflow true', function () {
  var r = AdditionUtils.evaluateAddition(127, 1, 8);
  assert.strictEqual(r.exactSum, 128);
  assert.strictEqual(r.stored, 128);
  assert.strictEqual(r.carryOut, 0);
  assert.strictEqual(r.signedOverflow, true);
});

test('8-bit 128+128: exact 256, stored 0, carry 1, signed overflow true', function () {
  var r = AdditionUtils.evaluateAddition(128, 128, 8);
  assert.strictEqual(r.exactSum, 256);
  assert.strictEqual(r.stored, 0);
  assert.strictEqual(r.carryOut, 1);
  assert.strictEqual(r.signedOverflow, true);
});

test('8-bit 0+0: stored 0, no carry, no overflow', function () {
  var r = AdditionUtils.evaluateAddition(0, 0, 8);
  assert.strictEqual(r.stored, 0);
  assert.strictEqual(r.carryOut, 0);
  assert.strictEqual(r.signedOverflow, false);
});

test('column trace for 11+12 (8-bit) sums to the stored result', function () {
  var r = AdditionUtils.evaluateAddition(11, 12, 8);
  var fromColumns = 0;
  r.columns.forEach(function (col) {
    fromColumns |= (col.resultBit << col.index);
  });
  assert.strictEqual(fromColumns, r.stored);
  assert.strictEqual(r.columns[r.columns.length - 1].carryOut, r.carryOut);
});

test('column total of 3 writes 1 and carries 1', function () {
  // 3+3 (0011 + 0011): column 0 is 1+1+0=2 (writes 0, carries 1);
  // column 1 is 1+1+1(carry-in)=3 (writes 1, carries 1).
  var columns = AdditionUtils.buildColumnTrace(0b11, 0b11, 4);
  assert.strictEqual(columns[0].total, 2);
  assert.strictEqual(columns[0].resultBit, 0);
  assert.strictEqual(columns[0].carryOut, 1);
  assert.strictEqual(columns[1].total, 3);
  assert.strictEqual(columns[1].resultBit, 1);
  assert.strictEqual(columns[1].carryOut, 1);
});

// --- Exhaustive sweep: every operand pair at 4-bit and 8-bit widths ---
test('exhaustive 4-bit sweep (16x16 pairs): carry/overflow/trace consistency', function () {
  var width = 4, modulus = 16, half = 8;
  var count = 0;
  for (var a = 0; a < modulus; a++) {
    for (var b = 0; b < modulus; b++) {
      var r = AdditionUtils.evaluateAddition(a, b, width);
      var exact = a + b;
      assert.strictEqual(r.exactSum, exact);
      assert.strictEqual(r.stored, exact % modulus);
      assert.strictEqual(r.carryOut, exact >= modulus ? 1 : 0);
      var signedExact = r.signedA + r.signedB;
      var expectedOverflow = signedExact < -half || signedExact > half - 1;
      assert.strictEqual(r.signedOverflow, expectedOverflow);
      var fromColumns = 0;
      r.columns.forEach(function (col) { fromColumns |= (col.resultBit << col.index); });
      assert.strictEqual(fromColumns, r.stored);
      assert.strictEqual(r.columns[width - 1].carryOut, r.carryOut);
      count++;
    }
  }
  assert.strictEqual(count, 256);
});

test('exhaustive 8-bit sweep (256x256 pairs): carry/overflow/trace consistency', function () {
  var width = 8, modulus = 256, half = 128;
  var count = 0;
  for (var a = 0; a < modulus; a++) {
    for (var b = 0; b < modulus; b++) {
      var r = AdditionUtils.evaluateAddition(a, b, width);
      var exact = a + b;
      assert.strictEqual(r.exactSum, exact);
      assert.strictEqual(r.stored, exact % modulus);
      assert.strictEqual(r.carryOut, exact >= modulus ? 1 : 0);
      var signedExact = r.signedA + r.signedB;
      var expectedOverflow = signedExact < -half || signedExact > half - 1;
      assert.strictEqual(r.signedOverflow, expectedOverflow);
      var fromColumns = 0;
      r.columns.forEach(function (col) { fromColumns |= (col.resultBit << col.index); });
      assert.strictEqual(fromColumns, r.stored);
      assert.strictEqual(r.columns[width - 1].carryOut, r.carryOut);
      count++;
    }
  }
  assert.strictEqual(count, 65536);
});

console.log('  ' + results.pass + ' passed, ' + results.fail + ' failed');
module.exports = results;
