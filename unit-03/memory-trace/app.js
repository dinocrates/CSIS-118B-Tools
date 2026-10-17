(function () {
  'use strict';

  var IntegerInput = window.CSIS118B.IntegerInput;
  var MemoryModel = window.CSIS118B.MemoryModel;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elCount = document.getElementById('count-input');
  var elAddend = document.getElementById('addend-input');
  var elApply = document.getElementById('apply-btn');
  var elStep = document.getElementById('step-btn');
  var elError = document.getElementById('input-error');
  var elCode = document.getElementById('code-block');
  var elEax = document.getElementById('out-eax');
  var elRbx = document.getElementById('out-rbx');
  var elCountOut = document.getElementById('out-count');
  var elResultOut = document.getElementById('out-result');
  var elExplain = document.getElementById('step-explain');
  var elTraceBody = document.getElementById('trace-body');
  var elStatus = document.getElementById('status-line');

  var state = null;
  var pending = false;

  function renderCode() {
    if (!state) {
      elCode.textContent = 'Apply valid inputs to see the instruction sequence.';
      return;
    }
    var lines = MemoryModel.instructionLines(state.addend);
    elCode.textContent = lines.map(function (line, i) {
      var marker = i === state.stepIndex ? 'NEXT  > ' : (i < state.stepIndex ? 'DONE    ' : '        ');
      return marker + line;
    }).join('\n');
  }

  function fmt(value) {
    return value === null ? 'unspecified' : value.toString();
  }

  function renderState() {
    if (!state) {
      elEax.textContent = 'unspecified';
      elRbx.textContent = 'unspecified';
      elCountOut.textContent = '—';
      elResultOut.textContent = '—';
      elTraceBody.innerHTML = '';
      return;
    }
    elEax.textContent = fmt(state.eax);
    elRbx.textContent = state.rbx === null ? 'unspecified' : state.rbx + ' (illustrative address)';
    elCountOut.textContent = state.count.toString();
    elResultOut.textContent = state.result.toString();

    elTraceBody.innerHTML = state.history.map(function (row, i) {
      var isLast = i === state.history.length - 1;
      return '<tr' + (isLast ? ' class="current-row"' : '') + '>' +
        '<td>' + row.label + '</td>' +
        '<td>' + fmt(row.eax) + '</td>' +
        '<td>' + row.count.toString() + '</td>' +
        '<td>' + row.result.toString() + '</td>' +
        '<td>' + (row.rbx === null ? 'unspecified' : row.rbx) + '</td>' +
        '</tr>';
    }).join('');
  }

  function explainFor(prevStepIndex) {
    if (!state) return '';
    if (prevStepIndex === 0) {
      return 'LEA wrote the illustrative address ' + state.rbx + ' into RBX. No memory was read — LEA only computes an address.';
    }
    if (prevStepIndex === 1) {
      return 'EAX now copies count (' + state.eax + '). Both count and result in memory are unchanged.';
    }
    if (prevStepIndex === 2) {
      return 'Only EAX changed, wrapping modulo 2^32 if the sum exceeded 4294967295. result has not been stored yet — it is still ' + state.result + '.';
    }
    if (prevStepIndex === 3) {
      return 'result now receives EAX (' + state.result + '). count is still ' + state.count + ' — nothing in this sequence ever changes count.';
    }
    return '';
  }

  function setPending(isPending) {
    pending = isPending;
    elStep.disabled = pending || !state || state.done;
    if (pending) {
      UiShell.announce(elStatus, 'Input changed. Press Apply / Reset to start a new trace before stepping.');
    }
  }

  function render() {
    renderCode();
    renderState();
    elStep.disabled = pending || !state || state.done;
  }

  function onApply() {
    var countResult = IntegerInput.parseBigInt(elCount.value, 'count');
    if (countResult.error) {
      fail(countResult.error);
      return;
    }
    var countError = MemoryModel.validateCount(countResult.value);
    if (countError) {
      fail(countError);
      return;
    }
    var addendResult = IntegerInput.parseBigInt(elAddend.value, 'addend');
    if (addendResult.error) {
      fail(addendResult.error);
      return;
    }
    var addendError = MemoryModel.validateAddend(addendResult.value);
    if (addendError) {
      fail(addendError);
      return;
    }

    elError.textContent = '';
    state = MemoryModel.createInitialState(countResult.value, addendResult.value);
    pending = false;
    elExplain.textContent = 'Trace started. Predict what LEA changes before stepping.';
    render();
    UiShell.announce(elStatus, 'Trace reset with count = ' + state.count + ', addend = ' + state.addend + '. Predict before stepping.');
  }

  function fail(message) {
    elError.textContent = message;
    state = null;
    elExplain.textContent = 'Correct the input above to start a trace.';
    render();
    UiShell.announce(elStatus, 'Invalid input: ' + message);
  }

  function onStep() {
    if (!state || state.done || pending) return;
    var prevStepIndex = state.stepIndex;
    state = MemoryModel.advance(state);
    render();
    var explanation = explainFor(prevStepIndex);
    elExplain.textContent = explanation;
    UiShell.announce(elStatus, state.history[state.history.length - 1].label + ': ' + explanation);
  }

  elApply.addEventListener('click', onApply);
  elStep.addEventListener('click', onStep);
  elCount.addEventListener('input', function () { setPending(true); });
  elAddend.addEventListener('input', function () { setPending(true); });
  elCount.addEventListener('keydown', function (evt) { if (evt.key === 'Enter') { evt.preventDefault(); onApply(); } });
  elAddend.addEventListener('keydown', function (evt) { if (evt.key === 'Enter') { evt.preventDefault(); onApply(); } });

  onApply();
})();
