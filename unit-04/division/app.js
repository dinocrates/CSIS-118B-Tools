(function () {
  'use strict';

  var WidthOps = window.CSIS118B.WidthOps;
  var IntegerInput = window.CSIS118B.IntegerInput;
  var DivisionModel = window.CSIS118B.DivisionModel;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elWidth = document.getElementById('width-select');
  var elOp = document.getElementById('op-select');
  var elPrep = document.getElementById('prep-select');
  var elNarrowField = document.getElementById('narrow-field');
  var elNarrow = document.getElementById('narrow-input');
  var elHighField = document.getElementById('high-field');
  var elHigh = document.getElementById('high-input');
  var elLowField = document.getElementById('low-field');
  var elLow = document.getElementById('low-input');
  var elDivisor = document.getElementById('divisor-input');
  var elReveal = document.getElementById('reveal-btn');
  var elReset = document.getElementById('reset-btn');
  var elError = document.getElementById('input-error');
  var elPresetRow = document.getElementById('preset-row');
  var elCode = document.getElementById('code-block');
  var elPrepGrid = document.getElementById('prep-grid');
  var elResultGrid = document.getElementById('result-grid');
  var elResultExplain = document.getElementById('result-explain');
  var elFlagsGrid = document.getElementById('flags-grid');
  var elStatus = document.getElementById('status-line');

  var DEFAULTS = { width: '32', op: 'unsigned', prep: 'narrow', narrow: '25', high: '0', low: '25', divisor: '12' };

  var PRESETS = [
    { label: 'Unsigned 25/12', width: '32', op: 'unsigned', prep: 'narrow', narrow: '25', high: '0', low: '25', divisor: '12' },
    { label: 'Signed -48/5', width: '32', op: 'signed', prep: 'narrow', narrow: '-48', high: '0', low: '0', divisor: '5' },
    { label: 'Zero divisor', width: '32', op: 'unsigned', prep: 'narrow', narrow: '10', high: '0', low: '10', divisor: '0' },
    { label: 'Quotient overflow (byte)', width: '8', op: 'unsigned', prep: 'manual', narrow: '0', high: '1', low: '0', divisor: '1' },
    { label: 'Valid nonzero high half', width: '32', op: 'unsigned', prep: 'manual', narrow: '0', high: '1', low: '0', divisor: '2' }
  ];

  function w() { return Number(elWidth.value); }
  function signed() { return elOp.value === 'signed'; }
  function prepMode() { return elPrep.value; }

  function updateFieldVisibility() {
    var manual = prepMode() === 'manual';
    elNarrowField.style.display = manual ? 'none' : '';
    elNarrow.disabled = manual;
    elHighField.style.display = manual ? '' : 'none';
    elLowField.style.display = manual ? '' : 'none';
    elHigh.disabled = !manual;
    elLow.disabled = !manual;
  }

  function buildPresets() {
    elPresetRow.innerHTML = PRESETS.map(function (p, i) {
      return '<button type="button" class="btn" data-preset="' + i + '">' + p.label + '</button>';
    }).join('');
  }

  function readoutTile(label, value) {
    return '<div class="readout"><span class="readout-label">' + label + '</span><output class="readout-value">' + value + '</output></div>';
  }

  function clearResults(message) {
    elResultGrid.innerHTML = '';
    elFlagsGrid.innerHTML = '';
    elResultExplain.textContent = message || '';
  }

  function fail(message) {
    elError.textContent = message;
    elCode.textContent = '';
    elPrepGrid.innerHTML = '';
    clearResults('Correct the input above and press Prepare and divide again.');
    UiShell.announce(elStatus, 'Invalid input: ' + message);
  }

  function compute() {
    var width = w();
    var isSigned = signed();
    var mode = prepMode();
    var contract = DivisionModel.registerContract(width);

    var opts = { width: width, signed: isSigned, prepMode: mode };

    var divisorParsed = IntegerInput.parseBigInt(elDivisor.value, 'Divisor');
    if (divisorParsed.error) { fail(divisorParsed.error); return; }
    var divisorRangeError = WidthOps.validateOperand(divisorParsed.value, width, 'Divisor');
    if (divisorRangeError) { fail(divisorRangeError); return; }
    opts.divisorPattern = WidthOps.bits(divisorParsed.value, width);

    if (mode === 'narrow') {
      var narrowParsed = IntegerInput.parseBigInt(elNarrow.value, 'Narrow dividend');
      if (narrowParsed.error) { fail(narrowParsed.error); return; }
      var narrowRangeError = WidthOps.validateOperand(narrowParsed.value, width, 'Narrow dividend');
      if (narrowRangeError) { fail(narrowRangeError); return; }
      opts.narrowValue = WidthOps.bits(narrowParsed.value, width);
    } else {
      var highParsed = IntegerInput.parseBigInt(elHigh.value, 'High half');
      if (highParsed.error) { fail(highParsed.error); return; }
      var highRangeError = WidthOps.validateUnsignedField(highParsed.value, width, 'High half');
      if (highRangeError) { fail(highRangeError); return; }
      var lowParsed = IntegerInput.parseBigInt(elLow.value, 'Low half');
      if (lowParsed.error) { fail(lowParsed.error); return; }
      var lowRangeError = WidthOps.validateUnsignedField(lowParsed.value, width, 'Low half');
      if (lowRangeError) { fail(lowRangeError); return; }
      opts.highHalf = highParsed.value;
      opts.lowHalf = lowParsed.value;
    }

    elError.textContent = '';
    var r = DivisionModel.evaluateDivision(opts);

    var prepLine = '';
    if (mode === 'narrow') {
      prepLine = isSigned
        ? contract.narrowOp + '                ; sign-extend ' + contract.narrowSource + ' into ' + contract.dividend + '\n'
        : 'mov ' + contract.remainder.toLowerCase() + ', 0' + '            ; zero-extend into ' + contract.dividend + '\n';
    }
    elCode.textContent = prepLine +
      (isSigned ? 'idiv' : 'div') + ' <divisor-register>  ; ' + contract.dividend + ' / divisor -> ' + contract.quotient + ' quotient, ' + contract.remainder + ' remainder';

    var high2w = (r.dividendBits2w >> BigInt(width)) & WidthOps.mask(width);
    var low2w = r.dividendBits2w & WidthOps.mask(width);
    elPrepGrid.innerHTML =
      readoutTile('Dividend register pair', contract.dividend) +
      readoutTile('High half', WidthOps.toHex(high2w, width)) +
      readoutTile('Low half', WidthOps.toHex(low2w, width)) +
      readoutTile('Full interpreted dividend (' + (isSigned ? 'signed' : 'unsigned') + ')', r.dividendValue.toString()) +
      readoutTile('Interpreted divisor (' + (isSigned ? 'signed' : 'unsigned') + ')', r.divisorValue.toString());

    if (r.error) {
      clearResults(r.error + ' No quotient or remainder is produced by this modeled operation — real hardware behavior for the destination registers is not simulated here.');
      UiShell.announce(elStatus, r.error);
      return;
    }

    elResultGrid.innerHTML =
      readoutTile(contract.quotient + ' (quotient)', WidthOps.toHex(WidthOps.bits(r.quotient, width), width) + ' = ' + r.quotient.toString()) +
      readoutTile(contract.remainder + ' (remainder)', WidthOps.toHex(WidthOps.bits(r.remainder, width), width) + ' = ' + r.remainder.toString());
    elResultExplain.textContent = 'Identity: ' + r.dividendValue.toString() + ' = ' + r.quotient.toString() + ' × ' + r.divisorValue.toString() +
      ' + ' + r.remainder.toString() + '. ' + (isSigned
        ? 'A nonzero remainder takes the dividend’s sign and its magnitude is smaller than the divisor’s.'
        : 'The remainder is nonnegative and smaller than the divisor.');
    elFlagsGrid.innerHTML = ['CF', 'OF', 'SF', 'ZF', 'AF', 'PF'].map(function (f) {
      return '<div class="readout flag-undefined"><span class="readout-label">' + f + '</span><output class="readout-value">Undefined</output></div>';
    }).join('');

    UiShell.announce(elStatus, (isSigned ? 'IDIV' : 'DIV') + ': quotient ' + r.quotient.toString() + ', remainder ' + r.remainder.toString() + '.');
  }

  function applyPreset(p) {
    elWidth.value = p.width;
    elOp.value = p.op;
    elPrep.value = p.prep;
    elNarrow.value = p.narrow;
    elHigh.value = p.high;
    elLow.value = p.low;
    elDivisor.value = p.divisor;
    updateFieldVisibility();
    compute();
  }

  function onReset() {
    applyPreset(DEFAULTS);
    UiShell.announce(elStatus, 'Reset to the default: DWORD DIV, narrow mode, dividend=25, divisor=12.');
  }

  function clearPending() {
    elPrepGrid.innerHTML = '';
    clearResults('Input changed — press Prepare and divide to recompute.');
    UiShell.announce(elStatus, 'Input changed. Press Prepare and divide to recompute.');
  }

  elWidth.addEventListener('change', function () { updateFieldVisibility(); compute(); });
  elOp.addEventListener('change', compute);
  elPrep.addEventListener('change', function () { updateFieldVisibility(); compute(); });
  elNarrow.addEventListener('input', clearPending);
  elHigh.addEventListener('input', clearPending);
  elLow.addEventListener('input', clearPending);
  elDivisor.addEventListener('input', clearPending);
  elReveal.addEventListener('click', compute);
  elReset.addEventListener('click', onReset);

  buildPresets();
  elPresetRow.addEventListener('click', function (evt) {
    var btn = evt.target.closest('[data-preset]');
    if (!btn) return;
    var p = PRESETS[Number(btn.dataset.preset)];
    applyPreset(p);
    UiShell.announce(elStatus, 'Loaded preset: ' + p.label + '.');
  });

  updateFieldVisibility();
  compute();
})();
