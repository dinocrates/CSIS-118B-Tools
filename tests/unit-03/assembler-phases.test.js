'use strict';

const AssemblerPhases = require('../../unit-03/shared/assembler-phases.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

check('exactly 5 fixed cases', AssemblerPhases.CASES.length === 5);
AssemblerPhases.CASES.forEach((c) => {
  check(c.key + ': has 3 phases in order', c.steps.length === 3 &&
    c.steps[0].phase === 'Preprocessing' && c.steps[1].phase === 'Assembly' && c.steps[2].phase === 'Runtime');
});

const equCase = AssemblerPhases.getCase('equ');
check('EQU: preprocessing passes through unchanged', equCase.steps[0].result === equCase.source);
check('EQU: assembly evaluates to immediate 20', equCase.steps[1].result.indexOf('LIMIT = 5') !== -1 && equCase.steps[1].result.indexOf('mov edi, 20') !== -1);
check('EQU: runtime moves 20', equCase.steps[2].result.indexOf('20') !== -1);

const defineCase = AssemblerPhases.getCase('define');
check('define: expands to tokens, not a pre-evaluated 5', defineCase.steps[0].result === 'mov edi, 3 + 2 * 4');
check('define: assembly gives 11 (precedence: 3 + 2*4)', defineCase.steps[1].result === 'mov edi, 11');

const groupedCase = AssemblerPhases.getCase('grouped');
check('grouped: expands with parentheses at use site', groupedCase.steps[0].result === 'mov edi, (3 + 2) * 4');
check('grouped: assembly gives 20', groupedCase.steps[1].result === 'mov edi, 20');

const assignCase = AssemblerPhases.getCase('assign');
check('assign: first uses N at definition time (3), second uses later N (4)', assignCase.steps[0].result === 'first: dd 3\nsecond: dd 4');
check('assign: little-endian DWORD bytes for 3 and 4', assignCase.steps[1].result.indexOf('03 00 00 00') !== -1 && assignCase.steps[1].result.indexOf('04 00 00 00') !== -1);
check('assign: no runtime instruction changes the values', assignCase.steps[2].result.indexOf('first = 3') !== -1 && assignCase.steps[2].result.indexOf('second = 4') !== -1);

const runtimeCase = AssemblerPhases.getCase('runtime');
check('runtime: two separate executable instructions at assembly', runtimeCase.steps[1].result.indexOf('Instruction 1') !== -1 && runtimeCase.steps[1].result.indexOf('Instruction 2') !== -1);
check('runtime: EAX goes 3 -> 4 only at runtime', runtimeCase.steps[2].result.indexOf('EAX = 3') !== -1 && runtimeCase.steps[2].result.indexOf('EAX = 4') !== -1);

check('getCase returns null for unknown key', AssemblerPhases.getCase('nope') === null);

module.exports = suite;
