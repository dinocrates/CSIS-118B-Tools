/*
 * movement-model.js — pure state machine for the Unit 4 movement
 * instruction lab (Tool 1): a finite bank of MOV/XCHG trace
 * scenarios (memory copy, register exchange, a failed two-MOV
 * "swap", memory exchange through a register, and three independent
 * partial-register writes), plus the curated MOV-form legality bank
 * (valid / invalid / ambiguous / "assembles but overreads" NASM
 * examples). No DOM; loaded as a plain script
 * (window.CSIS118B.MovementModel) and via require() in Node for
 * tests. Depends only on width-ops.js.
 *
 * Every scenario here uses FIXED values (the trace scenarios in the
 * Unit 4 spec are closed, curated examples, not open numeric input),
 * so there is no user-facing parsing in this model.
 */
(function (root, factory) {
  var WidthOps = (typeof module !== 'undefined' && module.exports)
    ? require('./width-ops.js')
    : (root && root.CSIS118B ? root.CSIS118B.WidthOps : null);

  var api = factory(WidthOps);
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.MovementModel = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function (WidthOps) {
  'use strict';

  var UNCHANGED_FLAGS = { cf: 1n, of: 0n, zf: 0n, sf: 0n };

  /* ── scenario definitions ──────────────────────────────────────── */

  function reg(name, value) { return { name: name, value: value }; }
  function mem(name, widthBytes, value) { return { name: name, widthBytes: widthBytes, value: value }; }

  var SCENARIOS = [
    {
      id: 'copy-dword',
      title: 'A. Copy one DWORD memory value through EAX',
      note: 'MOV copies; it does not erase the source. At the load step only the register changes. At the store step only the destination memory object changes.',
      registers: [reg('rax', 0n)],
      memory: [mem('source', 4, 42n), mem('copy', 4, 0n)],
      instructions: [
        {
          text: 'mov eax, dword [rel source]',
          affects: ['rax'],
          apply: function (st) {
            st.rax = WidthOps.writeSubRegister(st.rax, st.memory.source, 32);
          },
          explain: function (st) {
            return 'EAX now holds the value read from source (' + st.memory.source.toString() + '). source is unchanged — MOV reads memory without erasing it.';
          }
        },
        {
          text: 'mov dword [rel copy], eax',
          affects: ['memory.copy'],
          apply: function (st) {
            st.memory.copy = WidthOps.bits(st.rax, 32);
          },
          explain: function (st) {
            return 'copy now receives the low 32 bits of RAX (' + st.memory.copy.toString() + '). RAX itself is unchanged by a store.';
          }
        }
      ]
    },
    {
      id: 'xchg-registers',
      title: 'B. Exchange two registers',
      note: 'XCHG swaps both operands in one instruction; both original values are visible as a pair at every step.',
      registers: [reg('rax', 10n), reg('rcx', 20n)],
      memory: [],
      instructions: [
        {
          text: 'xchg eax, ecx',
          affects: ['rax', 'rcx'],
          apply: function (st) {
            var oldRax = WidthOps.bits(st.rax, 32);
            var oldRcx = WidthOps.bits(st.rcx, 32);
            st.rax = WidthOps.writeSubRegister(st.rax, oldRcx, 32);
            st.rcx = WidthOps.writeSubRegister(st.rcx, oldRax, 32);
          },
          explain: function (st) {
            return 'XCHG swapped both registers in one step: RAX is now ' + st.rax.toString() + ', RCX is now ' + st.rcx.toString() + '. Neither original value was lost.';
          }
        }
      ]
    },
    {
      id: 'failed-mov-swap',
      title: 'B (contrast). A two-MOV sequence is NOT a swap',
      note: 'This is a separate reset scene from the XCHG scenario above — do not confuse the two. Two ordinary MOVs cannot swap two registers: the first MOV overwrites its destination before the second MOV can read the original value.',
      registers: [reg('rax', 10n), reg('rcx', 20n)],
      memory: [],
      instructions: [
        {
          text: 'mov eax, ecx',
          affects: ['rax'],
          apply: function (st) {
            st.rax = WidthOps.writeSubRegister(st.rax, WidthOps.bits(st.rcx, 32), 32);
          },
          explain: function (st) {
            return 'RAX now holds a copy of RCX (' + st.rax.toString() + '). RAX’s original value (10) is gone — MOV does not save it anywhere.';
          }
        },
        {
          text: 'mov ecx, eax',
          affects: ['rcx'],
          apply: function (st) {
            st.rcx = WidthOps.writeSubRegister(st.rcx, WidthOps.bits(st.rax, 32), 32);
          },
          explain: function (st) {
            return 'RCX now also holds ' + st.rcx.toString() + ' — the value that was already copied from RCX into RAX in step 1. Both registers end at 20; the original RAX value of 10 was overwritten and never recovered. This is why a real swap needs XCHG (or a temporary register).';
          }
        }
      ]
    },
    {
      id: 'xchg-memory',
      title: 'C. Exchange two DWORD memory objects through a register',
      note: 'At least one XCHG operand must be a register in these forms — there is no memory-to-memory instruction here. Memory XCHG has synchronization semantics, but concurrency is outside this tool’s scope.',
      registers: [reg('rax', 0n)],
      memory: [mem('left', 4, 100n), mem('right', 4, 200n)],
      instructions: [
        {
          text: 'mov eax, dword [rel left]',
          affects: ['rax'],
          apply: function (st) {
            st.rax = WidthOps.writeSubRegister(st.rax, st.memory.left, 32);
          },
          explain: function (st) {
            return 'EAX now holds left (' + st.rax.toString() + '). Nothing in memory has changed yet.';
          }
        },
        {
          text: 'xchg eax, dword [rel right]',
          affects: ['rax', 'memory.right'],
          apply: function (st) {
            var oldRax32 = WidthOps.bits(st.rax, 32);
            var oldRight = st.memory.right;
            st.rax = WidthOps.writeSubRegister(st.rax, oldRight, 32);
            st.memory.right = oldRax32;
          },
          explain: function (st) {
            return 'XCHG swapped EAX and right in one step: RAX is now ' + st.rax.toString() + ', right is now ' + st.memory.right.toString() + '. left is untouched by this instruction.';
          }
        },
        {
          text: 'mov dword [rel left], eax',
          affects: ['memory.left'],
          apply: function (st) {
            st.memory.left = WidthOps.bits(st.rax, 32);
          },
          explain: function (st) {
            return 'left now receives RAX (' + st.memory.left.toString() + '). The net effect of all three instructions: left and right have swapped their original values (100 and 200).';
          }
        }
      ]
    },
    {
      id: 'partial-al',
      title: 'D. Partial-register write: AL',
      note: 'AL, AX, and EAX are overlapping views of RAX, not separate registers. Carry is irrelevant to MOV.',
      registers: [reg('rax', 0x1122334455667788n)],
      memory: [],
      instructions: [
        {
          text: 'mov al, 0xAA',
          affects: ['rax'],
          apply: function (st) {
            st.rax = WidthOps.writeSubRegister(st.rax, 0xAAn, 8);
          },
          explain: function (st) {
            return 'Only bits 7–0 changed. Full RAX is now ' + WidthOps.toHex(st.rax, 64) + ' — every other byte (including the rest of what was 0x...6677) is untouched.';
          }
        }
      ]
    },
    {
      id: 'partial-ax',
      title: 'E. Partial-register write: AX',
      note: 'A 16-bit write replaces bits 15–0 only and preserves bits 63–16, exactly like the 8-bit case.',
      registers: [reg('rax', 0x1122334455667788n)],
      memory: [],
      instructions: [
        {
          text: 'mov ax, 0xBEEF',
          affects: ['rax'],
          apply: function (st) {
            st.rax = WidthOps.writeSubRegister(st.rax, 0xBEEFn, 16);
          },
          explain: function (st) {
            return 'Only bits 15–0 changed. Full RAX is now ' + WidthOps.toHex(st.rax, 64) + ' — bits 63–16 (0x11223344 5566) are untouched.';
          }
        }
      ]
    },
    {
      id: 'partial-eax',
      title: 'F. Partial-register write: EAX',
      note: 'Unlike AL/AX, a 32-bit register destination also clears the upper half of the 64-bit register. This is the one case that is NOT "preserve everything else."',
      registers: [reg('rax', 0x1122334455667788n)],
      memory: [],
      instructions: [
        {
          text: 'mov eax, 5',
          affects: ['rax'],
          apply: function (st) {
            st.rax = WidthOps.writeSubRegister(st.rax, 5n, 32);
          },
          explain: function (st) {
            return 'Bits 31–0 became 5, and bits 63–32 were CLEARED to zero (not preserved). Full RAX is now ' + WidthOps.toHex(st.rax, 64) + '.';
          }
        }
      ]
    }
  ];

  function findScenario(id) {
    for (var i = 0; i < SCENARIOS.length; i++) {
      if (SCENARIOS[i].id === id) return SCENARIOS[i];
    }
    return null;
  }

  function listScenarios() {
    return SCENARIOS.map(function (s) { return { id: s.id, title: s.title }; });
  }

  /** Build the initial (pre-execution) state for a scenario id. */
  function createInitialState(scenarioId) {
    var scenario = findScenario(scenarioId);
    if (!scenario) throw new Error('Unknown movement scenario: ' + scenarioId);

    var registers = {};
    scenario.registers.forEach(function (r) { registers[r.name] = r.value; });
    var memory = {};
    scenario.memory.forEach(function (m) { memory[m.name] = m.value; });

    return {
      scenarioId: scenarioId,
      rax: registers.rax !== undefined ? registers.rax : null,
      rcx: registers.rcx !== undefined ? registers.rcx : null,
      memory: memory,
      flags: { cf: UNCHANGED_FLAGS.cf, of: UNCHANGED_FLAGS.of, zf: UNCHANGED_FLAGS.zf, sf: UNCHANGED_FLAGS.sf },
      stepIndex: 0,
      done: scenario.instructions.length === 0,
      changedThisStep: [],
      lastExplanation: '',
      history: [{ label: 'Initial', rax: registers.rax !== undefined ? registers.rax : null, rcx: registers.rcx !== undefined ? registers.rcx : null, memory: Object.assign({}, memory), changed: [] }]
    };
  }

  /** Apply the next instruction and return a NEW state object (does not mutate the input). */
  function advance(state) {
    var scenario = findScenario(state.scenarioId);
    if (!scenario || state.stepIndex >= scenario.instructions.length) {
      return state;
    }

    var instr = scenario.instructions[state.stepIndex];
    var next = {
      scenarioId: state.scenarioId,
      rax: state.rax,
      rcx: state.rcx,
      memory: Object.assign({}, state.memory),
      flags: state.flags,
      stepIndex: state.stepIndex,
      done: state.done,
      changedThisStep: [],
      lastExplanation: '',
      history: state.history.slice()
    };

    instr.apply(next);
    next.stepIndex = state.stepIndex + 1;
    next.done = next.stepIndex >= scenario.instructions.length;
    next.changedThisStep = instr.affects;
    next.lastExplanation = instr.explain(next);
    next.history.push({
      label: instr.text,
      rax: next.rax,
      rcx: next.rcx,
      memory: Object.assign({}, next.memory),
      changed: instr.affects
    });

    return next;
  }

  function instructionLines(scenarioId) {
    var scenario = findScenario(scenarioId);
    if (!scenario) return [];
    return scenario.instructions.map(function (i) { return i.text; });
  }

  /* ── curated MOV-form legality bank ────────────────────────────── */

  var MOV_FORMS = [
    {
      instruction: 'mov eax, 10',
      classification: 'valid',
      classificationLabel: 'Valid — register ← immediate',
      explanation: '10 is part of the instruction.'
    },
    {
      instruction: 'mov eax, ecx',
      classification: 'valid',
      classificationLabel: 'Valid — register ← register',
      explanation: 'Both register operands select 32 bits.'
    },
    {
      instruction: 'mov eax, dword [rel source]',
      classification: 'valid',
      classificationLabel: 'Valid — register ← memory',
      explanation: 'Read four stored bytes into EAX.'
    },
    {
      instruction: 'mov dword [rel copy], eax',
      classification: 'valid',
      classificationLabel: 'Valid — memory ← register',
      explanation: 'Store four bytes without erasing EAX.'
    },
    {
      instruction: 'mov dword [rel copy], 7',
      classification: 'valid',
      classificationLabel: 'Valid — memory ← immediate',
      explanation: 'An explicit width defines the store.'
    },
    {
      instruction: 'mov [rel copy], [rel source]',
      classification: 'invalid',
      classificationLabel: 'Invalid',
      explanation: 'Ordinary MOV cannot use two memory operands.'
    },
    {
      instruction: 'mov eax, ax',
      classification: 'invalid',
      classificationLabel: 'Invalid',
      explanation: 'Source and destination register widths differ.'
    },
    {
      instruction: 'mov 7, eax',
      classification: 'invalid',
      classificationLabel: 'Invalid',
      explanation: 'An immediate cannot receive a stored result.'
    },
    {
      instruction: 'mov [rel copy], 7',
      classification: 'ambiguous',
      classificationLabel: 'Ambiguous size / rejected',
      explanation: 'NASM cannot infer this memory access width.'
    },
    {
      instruction: 'mov eax, [rel word_object]',
      classification: 'overread',
      classificationLabel: 'Assembles; storage overread',
      explanation: 'EAX implies a four-byte load. A DW-declared label does not enforce a two-byte access in NASM. The load also reads following bytes. DD declares initialized storage during assembly; DWORD names an instruction access width — NASM symbols do not enforce a permanent access type, so syntactically valid code can still access the wrong bytes.'
    }
  ];

  function listMovForms() {
    return MOV_FORMS.map(function (f, i) { return { index: i, instruction: f.instruction, classificationLabel: f.classificationLabel }; });
  }

  function getMovForm(index) {
    if (index < 0 || index >= MOV_FORMS.length) return null;
    return MOV_FORMS[index];
  }

  return {
    UNCHANGED_FLAGS: UNCHANGED_FLAGS,
    listScenarios: listScenarios,
    findScenario: findScenario,
    createInitialState: createInitialState,
    advance: advance,
    instructionLines: instructionLines,
    listMovForms: listMovForms,
    getMovForm: getMovForm,
    MOV_FORMS: MOV_FORMS
  };
});
