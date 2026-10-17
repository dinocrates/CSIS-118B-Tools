/*
 * assembler-phases.js — fixed-example data for the assembler phase
 * workbench (Unit 3, Tool 5): five NASM fragments and their
 * preprocessing / assembly / runtime phase results. This tool
 * intentionally does not evaluate arbitrary source, so the module
 * is plain data (no parsing, no expression evaluator) rather than a
 * calculation engine. Loaded as a plain script
 * (window.CSIS118B.AssemblerPhases) and via require() in Node for
 * tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.AssemblerPhases = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  var CASES = [
    {
      key: 'equ',
      title: 'Numeric EQU',
      source: 'LIMIT equ 3 + 2\nmov edi, LIMIT * 4',
      steps: [
        {
          phase: 'Preprocessing',
          result: 'LIMIT equ 3 + 2\nmov edi, LIMIT * 4',
          explain: 'EQU is not a text macro, so no substitution happens here. The line passes through unchanged for the assembler to evaluate.'
        },
        {
          phase: 'Assembly',
          result: 'LIMIT = 5\nmov edi, 20',
          explain: 'The assembler evaluates EQU once, giving LIMIT the fixed numeric value 5 (3 + 2). The immediate becomes 5 × 4 = 20. EQU allocates no memory, and a symbol defined with EQU cannot be redefined later in the same assembly.'
        },
        {
          phase: 'Runtime',
          result: 'RDI = 20',
          explain: 'The CPU executes a MOV with the immediate value 20 that assembly already computed. It never evaluates "3 + 2 * 4" at runtime.'
        }
      ]
    },
    {
      key: 'define',
      title: 'Ungrouped text substitution',
      source: '%define LIMIT 3 + 2\nmov edi, LIMIT * 4',
      steps: [
        {
          phase: 'Preprocessing',
          result: 'mov edi, 3 + 2 * 4',
          explain: '%define is a text macro: LIMIT is replaced token-for-token with "3 + 2", not with an already-evaluated 5. The expanded line is exactly what the assembler will see.'
        },
        {
          phase: 'Assembly',
          result: 'mov edi, 11',
          explain: 'The assembler now evaluates the expanded expression using normal operator precedence: multiplication before addition, so 3 + (2 × 4) = 11.'
        },
        {
          phase: 'Runtime',
          result: 'RDI = 11',
          explain: 'The CPU executes the single MOV instruction that assembly emitted, with immediate 11.'
        }
      ]
    },
    {
      key: 'grouped',
      title: 'Grouped use of a text substitution',
      source: '%define LIMIT 3 + 2\nmov edi, (LIMIT) * 4',
      steps: [
        {
          phase: 'Preprocessing',
          result: 'mov edi, (3 + 2) * 4',
          explain: 'The parentheses live at the use site, around the substituted tokens. Grouping could instead be placed inside the macro definition itself (%define LIMIT (3 + 2)) with the same effect.'
        },
        {
          phase: 'Assembly',
          result: 'mov edi, 20',
          explain: 'Parentheses force the addition first: (3 + 2) × 4 = 20.'
        },
        {
          phase: 'Runtime',
          result: 'RDI = 20',
          explain: 'The immediate 20 was already decided during assembly; the CPU just loads it.'
        }
      ]
    },
    {
      key: 'assign',
      title: 'Numeric preprocessor reassignment',
      source: '%assign N 3\nfirst: dd N\n%assign N N + 1\nsecond: dd N',
      steps: [
        {
          phase: 'Preprocessing',
          result: 'first: dd 3\nsecond: dd 4',
          explain: '%assign gives N a new numeric value each time it runs. The first "dd N" expands using N’s value AT THAT POINT (3); the later %assign does not retroactively change it. By the second "dd N", N is 4.'
        },
        {
          phase: 'Assembly',
          result: 'first bytes: 03 00 00 00\nsecond bytes: 04 00 00 00',
          explain: 'The assembler emits two initialized DWORDs with their little-endian byte patterns. No instruction exists yet — this is just initialized data.'
        },
        {
          phase: 'Runtime',
          result: 'first = 3; second = 4\n(no instruction updates either value)',
          explain: 'These are starting values baked into the executable’s data section. The preprocessor ran at build time, not on the CPU, so there is no runtime step that changes first or second.'
        }
      ]
    },
    {
      key: 'runtime',
      title: 'Runtime arithmetic',
      source: 'mov eax, 3\nadd eax, 1',
      steps: [
        {
          phase: 'Preprocessing',
          result: 'mov eax, 3\nadd eax, 1',
          explain: 'These are ordinary instructions with no macros involved, so they pass through preprocessing unchanged.'
        },
        {
          phase: 'Assembly',
          result: 'Instruction 1: MOV EAX, immediate 3\nInstruction 2: ADD EAX, immediate 1',
          explain: 'The assembler emits two separate executable instructions. Unlike the build-time examples above, it does not fold "3 + 1" into a single immediate — ADD is a runtime operation on a register.'
        },
        {
          phase: 'Runtime',
          result: 'After MOV: EAX = 3\nAfter ADD: EAX = 4',
          explain: 'EAX changes twice as the CPU executes each instruction in turn: first set to 3, then incremented to 4. This is the only one of the five examples where the CPU itself performs the arithmetic.'
        }
      ]
    }
  ];

  function getCase(key) {
    for (var i = 0; i < CASES.length; i++) {
      if (CASES[i].key === key) return CASES[i];
    }
    return null;
  }

  return {
    CASES: CASES,
    getCase: getCase
  };
});
