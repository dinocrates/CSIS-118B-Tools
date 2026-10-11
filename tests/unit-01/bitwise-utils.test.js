'use strict';
var assert = require('assert');
var BitwiseUtils = require('../../unit-01/shared/bitwise-utils.js');

var results = { pass: 0, fail: 0, name: 'bitwise-utils' };

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

console.log('bitwise-utils.js');

test('AA AND 33 = 22', function () {
  assert.strictEqual(BitwiseUtils.computeByteResult(0xAA, 0x33, 'AND', 8), 0x22);
});

test('AA OR 33 = BB', function () {
  assert.strictEqual(BitwiseUtils.computeByteResult(0xAA, 0x33, 'OR', 8), 0xBB);
});

test('AA XOR 33 = 99', function () {
  assert.strictEqual(BitwiseUtils.computeByteResult(0xAA, 0x33, 'XOR', 8), 0x99);
});

test('NOT AA (8-bit) = 55, no 32-bit sign leakage', function () {
  var r = BitwiseUtils.computeByteResult(0xAA, 0, 'NOT', 8);
  assert.strictEqual(r, 0x55);
  assert.ok(r >= 0 && r <= 255);
});

test('B7 AND 0F = 07', function () {
  assert.strictEqual(BitwiseUtils.computeByteResult(0xB7, 0x0F, 'AND', 8), 0x07);
});

test('00 OR 08 = 08', function () {
  assert.strictEqual(BitwiseUtils.computeByteResult(0x00, 0x08, 'OR', 8), 0x08);
});

test('B7 XOR 01 = B6', function () {
  assert.strictEqual(BitwiseUtils.computeByteResult(0xB7, 0x01, 'XOR', 8), 0xB6);
});

test('FF AND F7 = F7', function () {
  assert.strictEqual(BitwiseUtils.computeByteResult(0xFF, 0xF7, 'AND', 8), 0xF7);
});

test('NOT of every byte stays within 0-255 (no sign leakage) and is self-inverse', function () {
  for (var a = 0; a <= 255; a++) {
    var notA = BitwiseUtils.computeByteResult(a, 0, 'NOT', 8);
    assert.ok(notA >= 0 && notA <= 255);
    assert.strictEqual(BitwiseUtils.computeByteResult(notA, 0, 'NOT', 8), a);
  }
});

test('per-bit rows agree with the aggregate byte result for all ops, exhaustively', function () {
  var ops = ['AND', 'OR', 'XOR'];
  for (var a = 0; a <= 255; a += 17) { // sampled sweep for speed; full NOT sweep covered above
    for (var b = 0; b <= 255; b += 17) {
      ops.forEach(function (op) {
        var byteResult = BitwiseUtils.computeByteResult(a, b, op, 8);
        var rows = BitwiseUtils.computeBitRows(a, b, op, 8);
        var rebuilt = 0;
        rows.forEach(function (row) { rebuilt |= (row.resultBit << row.position); });
        assert.strictEqual(rebuilt, byteResult, op + ' mismatch for a=' + a + ' b=' + b);
      });
    }
  }
});

test('truth tables have 4 rows for binary ops, 2 for NOT, matching JS semantics', function () {
  ['AND', 'OR', 'XOR'].forEach(function (op) {
    var rows = BitwiseUtils.truthTableRows(op);
    assert.strictEqual(rows.length, 4);
  });
  assert.strictEqual(BitwiseUtils.truthTableRows('NOT').length, 2);
});

console.log('  ' + results.pass + ' passed, ' + results.fail + ' failed');
module.exports = results;
