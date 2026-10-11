'use strict';

const { buildProgram, executeProgram } = require('../../unit-02/shared/instruction-model.js');

const suite = { pass: 0, fail: 0 };

function check(name, condition) {
  if (condition) {
    suite.pass += 1;
    return;
  }
  suite.fail += 1;
  console.log('FAIL:', name);
}

const program = buildProgram();
const result = executeProgram(program);

check('program has four instructions', program.length === 4);
check('first mov initializes EAX to 5', result.steps[0].after.eax === 5n);
check('second mov initializes EBX to 3', result.steps[1].after.ebx === 3n);
check('add stores EAX as 8', result.steps[2].after.eax === 8n);
check('sub stores EAX as 0', result.steps[3].after.eax === 0n);
check('final EBX remains 3', result.finalState.ebx === 3n);

const trace = result.steps.map((s) => [s.after.eax, s.after.ebx]);
const expectedTrace = [[5n, 0n], [5n, 3n], [8n, 3n], [0n, 3n]];
check('full (EAX, EBX) trace matches spec', JSON.stringify(trace.map(([a, b]) => [a.toString(), b.toString()])) === JSON.stringify(expectedTrace.map(([a, b]) => [a.toString(), b.toString()])));
check('ADD flags are zeroed', result.steps[2].after.flags.cf === 0n && result.steps[2].after.flags.zf === 0n && result.steps[2].after.flags.sf === 0n && result.steps[2].after.flags.of === 0n);
check('SUB flags match required pattern', result.steps[3].after.flags.cf === 0n && result.steps[3].after.flags.zf === 1n && result.steps[3].after.flags.sf === 0n && result.steps[3].after.flags.of === 0n);

module.exports = suite;
