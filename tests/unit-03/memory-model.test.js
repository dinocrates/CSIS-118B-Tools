'use strict';

const MemoryModel = require('../../unit-03/shared/memory-model.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

check('validateCount accepts 0', MemoryModel.validateCount(0n) === null);
check('validateCount accepts max', MemoryModel.validateCount(4294967295n) === null);
check('validateCount rejects over max', MemoryModel.validateCount(4294967296n) !== null);
check('validateCount rejects negative', MemoryModel.validateCount(-1n) !== null);

check('validateAddend accepts 0', MemoryModel.validateAddend(0n) === null);
check('validateAddend accepts 100000', MemoryModel.validateAddend(100000n) === null);
check('validateAddend rejects over max', MemoryModel.validateAddend(100001n) !== null);
check('validateAddend rejects negative', MemoryModel.validateAddend(-1n) !== null);

// Required-states table from the spec, default example (count=100, addend=20).
let s = MemoryModel.createInitialState(100n, 20n);
check('initial: eax unspecified', s.eax === null);
check('initial: count 100', s.count === 100n);
check('initial: result 0', s.result === 0n);
check('initial: rbx unspecified', s.rbx === null);

s = MemoryModel.advance(s); // LEA
check('after LEA: eax still unspecified', s.eax === null);
check('after LEA: rbx is the illustrative address', s.rbx === '0x1000');
check('after LEA: count unchanged', s.count === 100n);
check('after LEA: result unchanged', s.result === 0n);

s = MemoryModel.advance(s); // Load
check('after Load: eax copies count', s.eax === 100n);
check('after Load: count unchanged', s.count === 100n);
check('after Load: result unchanged', s.result === 0n);

s = MemoryModel.advance(s); // ADD
check('after ADD: eax is count+addend', s.eax === 120n);
check('after ADD: count unchanged (memory untouched)', s.count === 100n);
check('after ADD: result not yet stored', s.result === 0n);

s = MemoryModel.advance(s); // Store
check('after Store: result receives eax', s.result === 120n);
check('after Store: count still unchanged', s.count === 100n);
check('after Store: done', s.done === true);
check('after Store: stepIndex is 4', s.stepIndex === 4);

const sAfterDone = MemoryModel.advance(s);
check('advance() past the end is a no-op', sAfterDone.stepIndex === 4 && sAfterDone.result === 120n);

// Acceptance: count = max uint32, addend = 1 -> wraps to 0, count unchanged.
let wrap = MemoryModel.createInitialState(4294967295n, 1n);
wrap = MemoryModel.advance(wrap); // LEA
wrap = MemoryModel.advance(wrap); // Load
wrap = MemoryModel.advance(wrap); // ADD
check('ADD wraps modulo 2^32', wrap.eax === 0n);
wrap = MemoryModel.advance(wrap); // Store
check('wrap: result is 0', wrap.result === 0n);
check('wrap: count remains 4294967295', wrap.count === 4294967295n);

// Acceptance: zero addend leaves the computed value unchanged.
let zero = MemoryModel.createInitialState(55n, 0n);
zero = MemoryModel.advance(zero);
zero = MemoryModel.advance(zero);
zero = MemoryModel.advance(zero);
check('zero addend leaves EAX unchanged', zero.eax === 55n);

check('instructionLines substitutes the addend', MemoryModel.instructionLines(20n)[2] === 'add eax, 20');

module.exports = suite;
