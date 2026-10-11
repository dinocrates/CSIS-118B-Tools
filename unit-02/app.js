(function () {
  'use strict';

  var IM = window.CSIS118B.InstructionModel;
  var RA = window.CSIS118B.RegisterAlias;
  var AF = window.CSIS118B.ArithmeticFlags;
  var UiShell = window.CSIS118B.UiShell;

  UiShell.initShell();

  function $(id) { return document.getElementById(id); }

  // ───────────────────────── tabs ─────────────────────────
  function showTab(index, focusTarget) {
    [1, 2, 3].forEach(function (n) {
      var panel = $('demo' + n);
      var tab = $('tab' + n);
      var active = n === index;
      panel.hidden = !active;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    history.replaceState(null, '', '#demo' + index);
    if (focusTarget) {
      $('tab' + index).focus();
    }
  }

  [1, 2, 3].forEach(function (n) {
    $('tab' + n).addEventListener('click', function () {
      showTab(n, false);
    });
    $('tab' + n).addEventListener('keydown', function (event) {
      var next = n;
      if (event.key === 'ArrowRight') next = n % 3 + 1;
      else if (event.key === 'ArrowLeft') next = (n + 1) % 3 + 1;
      else if (event.key === 'Home') next = 1;
      else if (event.key === 'End') next = 3;
      else return;
      event.preventDefault();
      showTab(next, true);
    });
  });

  // ─────────────────── Demo 1: instruction cycle ───────────────────
  var program = IM.buildProgram();
  var state;
  var pc;
  var stage;

  function drawCycle() {
    $('program').innerHTML = program.map(function (instruction, index) {
      var current = index === pc ? ' class="current"' : '';
      return '<tr' + current + '><td>' + (index + 1) + (index === pc ? ' · current' : '') + '</td><td><code>' + instruction.text + '</code></td></tr>';
    }).join('');

    $('registers').textContent = [
      'EAX = ' + state.eax + '  (' + IM.formatHex(state.eax, 32) + ')',
      'EBX = ' + state.ebx + '  (' + IM.formatHex(state.ebx, 32) + ')',
      '',
      'CF=' + state.flags.cf + '   ZF=' + state.flags.zf + '   SF=' + state.flags.sf + '   OF=' + state.flags.of
    ].join('\n');

    Array.prototype.forEach.call($('stages').children, function (el, idx) {
      el.classList.toggle('active', idx === stage);
    });

    $('step').disabled = pc >= program.length;
  }

  function resetCycle() {
    state = IM.makeInitialState();
    pc = 0;
    stage = -1;
    $('cycle-status').textContent = 'Ready. Predict EAX after the first instruction, then step.';
    drawCycle();
  }

  $('step').addEventListener('click', function () {
    if (pc >= program.length) {
      return;
    }
    if (stage === 2) {
      pc += 1;
      stage = -1;
    }
    if (pc >= program.length) {
      $('cycle-status').textContent = 'Complete. EAX is ' + state.eax + ', EBX is ' + state.ebx + ', and ZF is ' + state.flags.zf + '. Reset to try again.';
      drawCycle();
      return;
    }
    stage += 1;

    var instruction = program[pc];
    var message;
    if (stage === 0) {
      message = 'Fetch instruction ' + (pc + 1) + ': ' + instruction.text + '. No register result changes yet.';
    } else if (stage === 1) {
      message = 'Decode ' + instruction.text + '. Identify the operation and operands; registers remain unchanged.';
    } else {
      state = IM.executeInstruction(state, instruction);
      message = 'Execute ' + instruction.text + '. EAX is ' + state.eax + '; EBX is ' + state.ebx + '. ' +
        (instruction.op === 'mov' ? 'MOV preserves flags.' : 'ZF is ' + state.flags.zf + '.');
    }
    $('cycle-status').textContent = message;
    drawCycle();
  });

  $('reset-cycle').addEventListener('click', resetCycle);

  // ─────────────────── Demo 2: register aliases ───────────────────
  var WIDTH_BY_ALIAS = { AL: 8, AH: 8, AX: 16, EAX: 32, RAX: 64 };
  var rax = 0x1122334455667788n;

  function renderByteGroups(alias) {
    var groups = RA.getRaxByteGroups(rax, alias);
    $('bytes').innerHTML = groups.map(function (group) {
      return '<span class="byte ' + group.status + '"><small>' + group.name + '</small>' +
        group.value.toString(16).toUpperCase().padStart(2, '0') +
        '<small>' + group.status + '</small></span>';
    }).join('');
  }

  function renderAliases() {
    var rows = [
      ['RAX', RA.formatHex(rax, 64)],
      ['EAX', RA.formatHex(rax & 0xFFFFFFFFn, 32)],
      ['AX', RA.formatHex(rax & 0xFFFFn, 16)],
      ['AH', RA.formatHex((rax >> 8n) & 0xFFn, 8)],
      ['AL', RA.formatHex(rax & 0xFFn, 8)]
    ];
    $('aliases').innerHTML = rows.map(function (row) {
      return '<tr><td>' + row[0] + '</td><td class="mono">' + row[1] + '</td></tr>';
    }).join('');
    $('rax').textContent = RA.formatHex(rax, 64);
  }

  function resetRegisterModel() {
    var parsed = RA.parseUnsignedBigInt($('seed').value, { width: 64, alias: 'Starting RAX' });
    if (parsed.error) {
      $('reg-error').textContent = parsed.error;
      return;
    }
    rax = parsed.value;
    renderByteGroups($('alias').value);
    renderAliases();
    $('reg-error').textContent = '';
    $('reg-status').textContent = 'Starting value loaded. Choose an alias and predict the result.';
  }

  $('reset-reg').addEventListener('click', resetRegisterModel);
  $('restore-reg').addEventListener('click', function () {
    $('seed').value = '0x1122334455667788';
    $('alias').value = 'AL';
    $('write-value').value = '0xAA';
    resetRegisterModel();
  });

  $('write-reg').addEventListener('click', function () {
    var alias = $('alias').value;
    var width = WIDTH_BY_ALIAS[alias];
    var parsed = RA.parseUnsignedBigInt($('write-value').value, { width: width, alias: alias });
    if (parsed.error) {
      $('reg-error').textContent = parsed.error;
      return;
    }
    var applied = RA.applyAliasWrite(rax, alias, parsed.value);
    rax = applied.rax;
    renderByteGroups(alias);
    renderAliases();
    $('reg-error').textContent = '';

    var note = alias === 'EAX'
      ? 'Upper 32 bits cleared to zero (a 32-bit write zero-extends).'
      : alias === 'RAX'
        ? 'All 64 bits replaced.'
        : 'Bits outside the selected alias were preserved.';
    $('reg-status').textContent = 'MOV ' + alias + ', ' + RA.formatHex(parsed.value, width) + ' → RAX = ' + RA.formatHex(rax, 64) + '. ' + note + ' Arithmetic flags are unchanged.';
  });

  $('seed').addEventListener('change', resetRegisterModel);
  $('alias').addEventListener('change', function () {
    renderByteGroups($('alias').value);
  });

  // ─────────────────── Demo 3: arithmetic flags ───────────────────
  function calculateArithmetic() {
    var width = Number($('width').value);
    var op = $('op').value;

    var parsedA = RA.parseUnsignedBigInt($('a').value, { width: width, alias: 'Destination value (A)' });
    if (parsedA.error) {
      $('flag-error').textContent = parsedA.error;
      return;
    }
    var parsedB = RA.parseUnsignedBigInt($('b').value, { width: width, alias: 'Source value (B)' });
    if (parsedB.error) {
      $('flag-error').textContent = parsedB.error;
      return;
    }

    var result = AF.evaluateArithmetic(parsedA.value, parsedB.value, width, op);
    var regA = { 8: 'al', 16: 'ax', 32: 'eax', 64: 'rax' }[width];
    var regB = { 8: 'bl', 16: 'bx', 32: 'ebx', 64: 'rbx' }[width];
    var opSign = op === 'ADD' ? '+' : '−';
    var mathResult = op === 'ADD' ? result.signedA + result.signedB : result.signedA - result.signedB;

    $('flag-instruction').textContent = op.toLowerCase() + ' ' + regA + ', ' + regB + '   (' + regA + ' = A, ' + regB + ' = B)';
    $('flag-result').textContent = RA.formatHex(result.result, width);
    $('interpretation').textContent = [
      'Unsigned inputs: ' + result.a + ' ' + opSign + ' ' + result.b,
      'Unbounded unsigned result: ' + result.exact,
      'Stored unsigned result: ' + result.result,
      'Signed inputs: ' + result.signedA + ' ' + opSign + ' ' + result.signedB,
      'Mathematical signed result: ' + mathResult,
      'Stored signed result: ' + result.signedResult,
      'Result bits: ' + result.result.toString(2).padStart(width, '0')
    ].join('\n');

    $('flags').innerHTML = ['cf', 'zf', 'sf', 'of', 'af', 'pf'].map(function (name) {
      return '<div class="flag">' + name.toUpperCase() + '<strong>' + result[name] + '</strong></div>';
    }).join('');

    var carryWord = op === 'ADD' ? 'carry' : 'borrow';
    $('flag-status').textContent = 'Result ' + RA.formatHex(result.result, width) + '. CF=' + result.cf + ': ' +
      (result.cf ? 'unsigned ' + carryWord + ' occurred' : 'no unsigned ' + carryWord + ' occurred') +
      '. OF=' + result.of + ': signed result ' + (result.of ? 'does not fit' : 'fits') + ' in ' + width + ' bits. ' +
      'ZF=' + result.zf + '; SF=' + result.sf + '; AF=' + result.af + '; PF=' + result.pf + '.';
    $('flag-error').textContent = '';
  }

  function markStale() {
    $('flag-status').textContent = 'Inputs changed. Press Execute arithmetic to update the displayed result and flags.';
  }

  $('calculate').addEventListener('click', calculateArithmetic);
  ['width', 'op', 'a', 'b'].forEach(function (id) {
    $(id).addEventListener('input', markStale);
    $(id).addEventListener('change', markStale);
  });

  document.querySelectorAll('[data-preset]').forEach(function (button) {
    button.addEventListener('click', function () {
      var parts = button.dataset.preset.split(',');
      $('width').value = '8';
      $('a').value = parts[0];
      $('b').value = parts[1];
      $('op').value = parts[2];
      calculateArithmetic();
    });
  });

  // ─────────────────── initial render ───────────────────
  resetCycle();
  resetRegisterModel();
  calculateArithmetic();

  var hashMatch = /^#demo([123])$/.exec(location.hash);
  showTab(hashMatch ? Number(hashMatch[1]) : 1, false);
})();
