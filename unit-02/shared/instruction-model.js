(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.CSIS118B = root.CSIS118B || {};
    root.CSIS118B.InstructionModel = api;
  }
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : null), function () {
  'use strict';

  function toBigInt(value) {
    if (typeof value === 'bigint') return value;
    if (value === null || value === undefined) return 0n;
    return BigInt(String(value).trim());
  }

  function formatHex(value, width) {
    var digits = Math.max(1, Math.ceil(width / 4));
    var str = value.toString(16).toUpperCase();
    return '0x' + str.padStart(digits, '0');
  }

  function makeInitialState() {
    return {
      eax: 0n,
      ebx: 0n,
      flags: { cf: 0n, zf: 0n, sf: 0n, of: 0n }
    };
  }

  function buildProgram() {
    return [
      { text: 'mov eax, 5', op: 'mov', dest: 'eax', source: 5n },
      { text: 'mov ebx, 3', op: 'mov', dest: 'ebx', source: 3n },
      { text: 'add eax, ebx', op: 'add', dest: 'eax', source: 'ebx' },
      { text: 'sub eax, 8', op: 'sub', dest: 'eax', source: 8n }
    ];
  }

  function evalFlagsAdd(a, b, result) {
    var signBit = 1n << 31n;
    var mask = 0xFFFFFFFFn;
    var exact = a + b;
    return {
      cf: exact > mask ? 1n : 0n,
      zf: result === 0n ? 1n : 0n,
      sf: (result & signBit) !== 0n ? 1n : 0n,
      of: (((~(a ^ b)) & (a ^ result) & signBit) !== 0n) ? 1n : 0n
    };
  }

  function evalFlagsSub(a, b, result) {
    var signBit = 1n << 31n;
    return {
      cf: a < b ? 1n : 0n,
      zf: result === 0n ? 1n : 0n,
      sf: (result & signBit) !== 0n ? 1n : 0n,
      of: (((a ^ b) & (a ^ result) & signBit) !== 0n) ? 1n : 0n
    };
  }

  function executeInstruction(state, instruction) {
    var next = {
      eax: state.eax,
      ebx: state.ebx,
      flags: {
        cf: state.flags.cf,
        zf: state.flags.zf,
        sf: state.flags.sf,
        of: state.flags.of
      }
    };

    if (instruction.op === 'mov') {
      var moved = toBigInt(instruction.source);
      if (instruction.dest === 'eax') {
        next.eax = moved & 0xFFFFFFFFn;
      } else if (instruction.dest === 'ebx') {
        next.ebx = moved & 0xFFFFFFFFn;
      }
      return {
        eax: next.eax,
        ebx: next.ebx,
        flags: {
          cf: next.flags.cf,
          zf: next.flags.zf,
          sf: next.flags.sf,
          of: next.flags.of
        }
      };
    }

    var base = instruction.dest === 'eax' ? next.eax : next.ebx;
    var srcValue = typeof instruction.source === 'string' ? next[instruction.source] : toBigInt(instruction.source);
    var resultValue = instruction.op === 'add' ? (base + srcValue) & 0xFFFFFFFFn : (base - srcValue) & 0xFFFFFFFFn;

    if (instruction.dest === 'eax') {
      next.eax = resultValue;
    } else {
      next.ebx = resultValue;
    }

    next.flags = instruction.op === 'add' ? evalFlagsAdd(base, srcValue, resultValue) : evalFlagsSub(base, srcValue, resultValue);

    return {
      eax: next.eax,
      ebx: next.ebx,
      flags: next.flags
    };
  }

  function executeProgram(program, initialState) {
    var instructions = program || buildProgram();
    var state = initialState ? {
      eax: toBigInt(initialState.eax),
      ebx: toBigInt(initialState.ebx),
      flags: {
        cf: toBigInt(initialState.flags && initialState.flags.cf),
        zf: toBigInt(initialState.flags && initialState.flags.zf),
        sf: toBigInt(initialState.flags && initialState.flags.sf),
        of: toBigInt(initialState.flags && initialState.flags.of)
      }
    } : makeInitialState();

    var steps = [];
    instructions.forEach(function (instruction, index) {
      var before = {
        eax: state.eax,
        ebx: state.ebx,
        flags: {
          cf: state.flags.cf,
          zf: state.flags.zf,
          sf: state.flags.sf,
          of: state.flags.of
        }
      };

      var after = executeInstruction(state, instruction);
      steps.push({
        index: index,
        text: instruction.text,
        before: before,
        after: {
          eax: after.eax,
          ebx: after.ebx,
          flags: after.flags
        }
      });

      state = {
        eax: after.eax,
        ebx: after.ebx,
        flags: after.flags
      };
    });

    return {
      initialState: initialState || makeInitialState(),
      steps: steps,
      finalState: {
        eax: state.eax,
        ebx: state.ebx,
        flags: state.flags
      }
    };
  }

  return {
    makeInitialState: makeInitialState,
    buildProgram: buildProgram,
    executeInstruction: executeInstruction,
    executeProgram: executeProgram,
    formatHex: formatHex
  };
});
