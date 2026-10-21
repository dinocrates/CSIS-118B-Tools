(function () {
  'use strict';

  var WidthOps = window.CSIS118B.WidthOps;
  var MovementModel = window.CSIS118B.MovementModel;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elScenario = document.getElementById('scenario-select');
  var elScenarioNote = document.getElementById('scenario-note');
  var elReset = document.getElementById('reset-btn');
  var elStep = document.getElementById('step-btn');
  var elCode = document.getElementById('code-block');
  var elCompletion = document.getElementById('completion-note');
  var elStateGrid = document.getElementById('state-grid');
  var elExplain = document.getElementById('step-explain');
  var elFlagsGrid = document.getElementById('flags-grid');
  var elTraceHeadRow = document.getElementById('trace-head-row');
  var elTraceBody = document.getElementById('trace-body');
  var elFormSelect = document.getElementById('form-select');
  var elRevealForm = document.getElementById('reveal-form-btn');
  var elFormExplain = document.getElementById('form-explain');
  var elStatus = document.getElementById('status-line');

  var SCENARIOS = MovementModel.listScenarios();
  var state = null;

  function fullScenario(id) { return MovementModel.findScenario(id); }

  function buildScenarioSelect() {
    elScenario.innerHTML = SCENARIOS.map(function (s) {
      return '<option value="' + s.id + '">' + s.title + '</option>';
    }).join('');
  }

  function renderCode() {
    var scenario = fullScenario(state.scenarioId);
    var lines = MovementModel.instructionLines(state.scenarioId);
    if (lines.length === 0) {
      elCode.textContent = '(no instructions in this scenario)';
      return;
    }
    elCode.textContent = lines.map(function (line, i) {
      var marker = i === state.stepIndex ? 'NEXT  > ' : (i < state.stepIndex ? 'DONE    ' : '        ');
      return marker + line;
    }).join('\n');
  }

  function memoryLabel(name) {
    return name;
  }

  function renderStateGrid() {
    var tiles = [];
    var raxChanged = state.changedThisStep.indexOf('rax') !== -1;
    tiles.push(
      '<div class="readout' + (raxChanged ? ' flag-set' : '') + '">' +
      '<span class="readout-label">RAX (full 64-bit)</span>' +
      '<output class="readout-value">' + WidthOps.toHex(state.rax, 64) + '<br><span style="font-weight:400;font-size:0.85rem;color:var(--slate);">= ' + state.rax.toString() + ' unsigned</span></output>' +
      '</div>'
    );
    if (state.rcx !== null) {
      var rcxChanged = state.changedThisStep.indexOf('rcx') !== -1;
      tiles.push(
        '<div class="readout' + (rcxChanged ? ' flag-set' : '') + '">' +
        '<span class="readout-label">RCX (full 64-bit)</span>' +
        '<output class="readout-value">' + WidthOps.toHex(state.rcx, 64) + '<br><span style="font-weight:400;font-size:0.85rem;color:var(--slate);">= ' + state.rcx.toString() + ' unsigned</span></output>' +
        '</div>'
      );
    }
    Object.keys(state.memory).forEach(function (name) {
      var changed = state.changedThisStep.indexOf('memory.' + name) !== -1;
      var value = state.memory[name];
      tiles.push(
        '<div class="readout' + (changed ? ' flag-set' : '') + '">' +
        '<span class="readout-label">' + memoryLabel(name) + ' (DWORD memory)</span>' +
        '<output class="readout-value">' + WidthOps.toHex(value, 32) + '<br><span style="font-weight:400;font-size:0.85rem;color:var(--slate);">= ' + value.toString() + '</span></output>' +
        '</div>'
      );
    });
    elStateGrid.innerHTML = tiles.join('');
  }

  function renderFlagsGrid() {
    var f = state.flags;
    function tile(label, value) {
      return '<div class="readout"><span class="readout-label">' + label + '</span>' +
        '<output class="readout-value">' + value.toString() + '</output></div>';
    }
    elFlagsGrid.innerHTML = tile('CF', f.cf) + tile('OF', f.of) + tile('ZF', f.zf) + tile('SF', f.sf);
  }

  function registerColumns() {
    var cols = ['After', 'RAX'];
    var scenario = fullScenario(state.scenarioId);
    if (scenario.registers.some(function (r) { return r.name === 'rcx'; })) cols.push('RCX');
    scenario.memory.forEach(function (m) { cols.push(m.name); });
    return cols;
  }

  function renderTrace() {
    var cols = registerColumns();
    elTraceHeadRow.innerHTML = cols.map(function (c) { return '<th scope="col">' + c + '</th>'; }).join('');

    elTraceBody.innerHTML = state.history.map(function (row, i) {
      var isLast = i === state.history.length - 1;
      var cells = ['<td>' + row.label + '</td>', '<td>' + (row.rax === null ? 'unspecified' : WidthOps.toHex(row.rax, 64)) + '</td>'];
      if (cols.indexOf('RCX') !== -1) {
        cells.push('<td>' + (row.rcx === null ? 'unspecified' : WidthOps.toHex(row.rcx, 64)) + '</td>');
      }
      cols.slice(cols.indexOf('RCX') !== -1 ? 3 : 2).forEach(function (name) {
        cells.push('<td>' + (row.memory[name] === undefined ? '—' : row.memory[name].toString()) + '</td>');
      });
      return '<tr' + (isLast ? ' class="current-row"' : '') + '>' + cells.join('') + '</tr>';
    }).join('');
  }

  function render() {
    renderCode();
    renderStateGrid();
    renderFlagsGrid();
    renderTrace();
    elStep.disabled = !state || state.done;
    elCompletion.textContent = state.done ? 'Scenario complete — all instructions executed. Reset to run it again.' : (state.stepIndex + 1) + ' of ' + fullScenario(state.scenarioId).instructions.length + ' instructions remaining.';
  }

  function loadScenario(id, announce) {
    state = MovementModel.createInitialState(id);
    var scenario = fullScenario(id);
    elScenarioNote.textContent = scenario.note;
    elExplain.textContent = 'Predict what the first instruction changes, then step.';
    render();
    if (announce) {
      UiShell.announce(elStatus, 'Scenario reset: ' + scenario.title + '. Predict before stepping.');
    }
  }

  function onStep() {
    if (!state || state.done) return;
    state = MovementModel.advance(state);
    render();
    elExplain.textContent = state.lastExplanation;
    UiShell.announce(elStatus, state.history[state.history.length - 1].label + ': ' + state.lastExplanation);
  }

  function onReset() {
    loadScenario(elScenario.value, true);
  }

  function onScenarioChange() {
    loadScenario(elScenario.value, true);
  }

  /* ── MOV-form legality bank ──────────────────────────────────────── */

  function buildFormSelect() {
    var forms = MovementModel.listMovForms();
    elFormSelect.innerHTML = forms.map(function (f) {
      return '<option value="' + f.index + '">' + f.instruction + '</option>';
    }).join('');
  }

  function onRevealForm() {
    var index = Number(elFormSelect.value);
    var form = MovementModel.getMovForm(index);
    if (!form) return;
    elFormExplain.innerHTML = '<strong>' + form.classificationLabel + '</strong> &mdash; ' + form.explanation;
    UiShell.announce(elStatus, form.instruction + ': ' + form.classificationLabel + '. ' + form.explanation);
  }

  buildScenarioSelect();
  buildFormSelect();
  elScenario.addEventListener('change', onScenarioChange);
  elReset.addEventListener('click', onReset);
  elStep.addEventListener('click', onStep);
  elRevealForm.addEventListener('click', onRevealForm);

  loadScenario(SCENARIOS[0].id, false);
})();
