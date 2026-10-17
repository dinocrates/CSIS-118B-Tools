/*
 * memory-model.js — pure state machine for the load-compute-store
 * tracer (Unit 3, Tool 1). Models:
 *   lea rbx, [rel count]
 *   mov eax, dword [rel count]
 *   add eax, <addend>
 *   mov dword [rel result], eax
 * against initialized data count: dd <count> and result: dd 0.
 * No DOM; loaded as a plain script (window.CSIS118B.MemoryModel) and
 * via require() in Node for tests.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.MemoryModel = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  var MASK32 = (1n << 32n) - 1n;
  var MAX_COUNT = MASK32;
  var MAX_ADDEND = 100000n;
  var ILLUSTRATIVE_ADDRESS = '0x1000';

  var INSTRUCTION_LABELS = ['LEA address', 'Load count', 'ADD to EAX', 'Store result'];

  function validateCount(count) {
    if (typeof count !== 'bigint') return 'count must be an integer.';
    if (count < 0n || count > MAX_COUNT) {
      return 'count must be between 0 and ' + MAX_COUNT.toString() + ' (an unsigned 32-bit DWORD).';
    }
    return null;
  }

  function validateAddend(addend) {
    if (typeof addend !== 'bigint') return 'addend must be an integer.';
    if (addend < 0n || addend > MAX_ADDEND) {
      return 'addend must be between 0 and ' + MAX_ADDEND.toString() + '.';
    }
    return null;
  }

  function instructionLines(addend) {
    return [
      'lea rbx, [rel count]',
      'mov eax, dword [rel count]',
      'add eax, ' + addend.toString(),
      'mov dword [rel result], eax'
    ];
  }

  /** Build the initial (pre-execution) state for a given count/addend. Both must already be validated BigInts. */
  function createInitialState(count, addend) {
    return {
      count: count,
      addend: addend,
      eax: null,
      rbx: null,
      result: 0n,
      stepIndex: 0,
      done: false,
      history: [{ label: 'Initial', eax: null, count: count, result: 0n, rbx: null }]
    };
  }

  /** Apply the next instruction (stepIndex 0..3) and return a NEW state object. Does not mutate the input. */
  function advance(state) {
    if (state.stepIndex >= 4) {
      return state;
    }
    var next = {
      count: state.count,
      addend: state.addend,
      eax: state.eax,
      rbx: state.rbx,
      result: state.result,
      stepIndex: state.stepIndex,
      done: state.done,
      history: state.history.slice()
    };

    if (state.stepIndex === 0) {
      next.rbx = ILLUSTRATIVE_ADDRESS;
    } else if (state.stepIndex === 1) {
      next.eax = state.count;
    } else if (state.stepIndex === 2) {
      next.eax = (state.eax + state.addend) & MASK32;
    } else if (state.stepIndex === 3) {
      next.result = state.eax;
    }

    next.stepIndex = state.stepIndex + 1;
    next.done = next.stepIndex >= 4;
    next.history.push({
      label: INSTRUCTION_LABELS[state.stepIndex],
      eax: next.eax,
      count: next.count,
      result: next.result,
      rbx: next.rbx
    });

    return next;
  }

  return {
    MASK32: MASK32,
    MAX_COUNT: MAX_COUNT,
    MAX_ADDEND: MAX_ADDEND,
    ILLUSTRATIVE_ADDRESS: ILLUSTRATIVE_ADDRESS,
    INSTRUCTION_LABELS: INSTRUCTION_LABELS,
    validateCount: validateCount,
    validateAddend: validateAddend,
    instructionLines: instructionLines,
    createInitialState: createInitialState,
    advance: advance
  };
});
