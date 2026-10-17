(function () {
  'use strict';

  var AssemblerPhases = window.CSIS118B.AssemblerPhases;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elCaseSelect = document.getElementById('case-select');
  var elStep = document.getElementById('step-btn');
  var elReset = document.getElementById('reset-btn');
  var elSource = document.getElementById('source-block');
  var elPhaseLabel = document.getElementById('phase-label');
  var elResult = document.getElementById('result-block');
  var elExplain = document.getElementById('explain-box');
  var elStatus = document.getElementById('status-line');

  var phaseIndex = -1; // -1 = predict before reveal

  function currentCase() {
    return AssemblerPhases.getCase(elCaseSelect.value);
  }

  function render() {
    var c = currentCase();
    elSource.textContent = c.source;

    if (phaseIndex < 0) {
      elPhaseLabel.textContent = 'Predict before revealing';
      elResult.textContent = 'Which phase evaluates or changes this value?';
      elExplain.textContent = 'Choose Next phase to reveal preprocessing, then assembly, then runtime.';
    } else {
      var step = c.steps[phaseIndex];
      elPhaseLabel.textContent = step.phase;
      elResult.textContent = step.result;
      elExplain.textContent = step.explain;
    }

    elStep.disabled = phaseIndex === 2;
  }

  function onStep() {
    if (phaseIndex === 2) return;
    phaseIndex++;
    render();
    var step = currentCase().steps[phaseIndex];
    UiShell.announce(elStatus, step.phase + ': ' + step.explain);
  }

  function onReset() {
    phaseIndex = -1;
    render();
    UiShell.announce(elStatus, 'Example reset. Predict its result before revealing a phase.');
  }

  elCaseSelect.addEventListener('change', onReset);
  elStep.addEventListener('click', onStep);
  elReset.addEventListener('click', onReset);

  onReset();
})();
