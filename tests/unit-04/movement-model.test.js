'use strict';

const MovementModel = require('../../unit-04/shared/movement-model.js');

const suite = { pass: 0, fail: 0 };
function check(name, condition) {
  if (condition) { suite.pass += 1; return; }
  suite.fail += 1;
  console.log('FAIL:', name);
}

function run(scenarioId, steps) {
  var state = MovementModel.createInitialState(scenarioId);
  for (var i = 0; i < steps; i++) state = MovementModel.advance(state);
  return state;
}

// A. Copy one DWORD memory value through EAX.
(function () {
  var s0 = MovementModel.createInitialState('copy-dword');
  check('copy-dword initial: rax=0, source=42, copy=0', s0.rax === 0n && s0.memory.source === 42n && s0.memory.copy === 0n);
  var s1 = MovementModel.advance(s0);
  check('copy-dword after load: rax=42, source unchanged, copy still 0', s1.rax === 42n && s1.memory.source === 42n && s1.memory.copy === 0n);
  var s2 = MovementModel.advance(s1);
  check('copy-dword after store: rax=42, source=42, copy=42', s2.rax === 42n && s2.memory.source === 42n && s2.memory.copy === 42n);
  check('copy-dword is done after 2 steps', s2.done === true);
  var s3 = MovementModel.advance(s2);
  check('advancing past completion is a no-op', s3.stepIndex === s2.stepIndex);
})();

// B. XCHG two registers — both originals preserved as a pair at every step.
(function () {
  var s0 = MovementModel.createInitialState('xchg-registers');
  check('xchg-registers initial: rax=10, rcx=20', s0.rax === 10n && s0.rcx === 20n);
  var s1 = MovementModel.advance(s0);
  check('xchg-registers final: rax=20, rcx=10 (both preserved, just swapped)', s1.rax === 20n && s1.rcx === 10n);
})();

// B (contrast). Failed two-MOV swap: both end at 20, original 10 lost.
(function () {
  var s = run('failed-mov-swap', 2);
  check('failed-mov-swap: rax=20, rcx=20 (not swapped)', s.rax === 20n && s.rcx === 20n);
})();

// C. Exchange two DWORD memory objects through a register.
(function () {
  var s0 = MovementModel.createInitialState('xchg-memory');
  check('xchg-memory initial: rax=0, left=100, right=200', s0.rax === 0n && s0.memory.left === 100n && s0.memory.right === 200n);
  var s1 = MovementModel.advance(s0);
  check('xchg-memory after load: rax=100, left=100, right=200', s1.rax === 100n && s1.memory.left === 100n && s1.memory.right === 200n);
  var s2 = MovementModel.advance(s1);
  check('xchg-memory after exchange: rax=200, left=100, right=100', s2.rax === 200n && s2.memory.left === 100n && s2.memory.right === 100n);
  var s3 = MovementModel.advance(s2);
  check('xchg-memory after store: rax=200, left=200, right=100', s3.rax === 200n && s3.memory.left === 200n && s3.memory.right === 100n);
})();

// D-F. Independent partial-register writes from a fixed starting RAX.
(function () {
  var sAl = run('partial-al', 1);
  check('mov al, 0xAA -> RAX=0x11223344556677AA', sAl.rax === 0x11223344556677AAn);

  var sAx = run('partial-ax', 1);
  check('mov ax, 0xBEEF -> RAX=0x112233445566BEEF', sAx.rax === 0x112233445566BEEFn);

  var sEax = run('partial-eax', 1);
  check('mov eax, 5 -> RAX=0x0000000000000005 (upper half cleared)', sEax.rax === 5n);

  // Independence: each scenario starts fresh from the same base value, not chained.
  check('partial scenarios all share the same starting RAX', MovementModel.createInitialState('partial-al').rax === 0x1122334455667788n &&
    MovementModel.createInitialState('partial-ax').rax === 0x1122334455667788n &&
    MovementModel.createInitialState('partial-eax').rax === 0x1122334455667788n);
})();

// Unchanged flags: CF=1, OF=0, ZF=0, SF=0, preserved by MOV/XCHG in every scenario.
(function () {
  MovementModel.listScenarios().forEach(function (s) {
    var state = run(s.id, 1);
    check('flags unchanged after a step in ' + s.id,
      state.flags.cf === 1n && state.flags.of === 0n && state.flags.zf === 0n && state.flags.sf === 0n);
  });
})();

// Curated MOV-form legality bank.
(function () {
  var forms = MovementModel.MOV_FORMS;
  function classOf(instr) {
    var f = forms.find(function (x) { return x.instruction === instr; });
    return f ? f.classification : null;
  }
  check('mov eax, 10 is valid', classOf('mov eax, 10') === 'valid');
  check('mov eax, ecx is valid', classOf('mov eax, ecx') === 'valid');
  check('mov eax, dword [rel source] is valid', classOf('mov eax, dword [rel source]') === 'valid');
  check('mov dword [rel copy], eax is valid', classOf('mov dword [rel copy], eax') === 'valid');
  check('mov dword [rel copy], 7 is valid', classOf('mov dword [rel copy], 7') === 'valid');
  check('mov [rel copy], [rel source] is invalid (two memory operands)', classOf('mov [rel copy], [rel source]') === 'invalid');
  check('mov eax, ax is invalid (width mismatch)', classOf('mov eax, ax') === 'invalid');
  check('mov 7, eax is invalid (immediate destination)', classOf('mov 7, eax') === 'invalid');
  check('mov [rel copy], 7 is ambiguous size', classOf('mov [rel copy], 7') === 'ambiguous');
  check('mov eax, [rel word_object] assembles but overreads', classOf('mov eax, [rel word_object]') === 'overread');
  check('all 10 curated forms are present', forms.length === 10);
})();

module.exports = suite;
