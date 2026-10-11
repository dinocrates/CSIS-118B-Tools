(function () {
  'use strict';

  var BitUtils = window.CSIS118B.BitUtils;
  var AdditionUtils = window.CSIS118B.AdditionUtils;
  var UiShell = window.CSIS118B.UiShell;

  UiShell.initShell();

  var currentWidth = 8;
  var currentA = 11;
  var currentB = 12;
  var revealedCount = 0;

  var elWidthSelect = document.getElementById('width-select');
  var elOperandA = document.getElementById('operand-a');
  var elOperandB = document.getElementById('operand-b');
  var elApplyBtn = document.getElementById('apply-btn');
  var elRangeHint = document.getElementById('range-hint');
  var elSetupError = document.getElementById('setup-error');

  var elOutAUnsigned = document.getElementById('out-a-unsigned');
  var elOutASigned = document.getElementById('out-a-signed');
  var elOutBUnsigned = document.getElementById('out-b-unsigned');
  var elOutBSigned = document.getElementById('out-b-signed');

  var elNextColBtn = document.getElementById('next-col-btn');
  var elShowAllBtn = document.getElementById('show-all-btn');
  var elStartOverBtn = document.getElementById('start-over-btn');
  var elCurrentColLine = document.getElementById('current-col-line');
  var elTraceTbody = document.getElementById('trace-tbody');
  var elStatusLine = document.getElementById('status-line');

  var elSummaryPanel = document.getElementById('summary-panel');
  var elOutExactSum = document.getElementById('out-exact-sum');
  var elOutStoredBin = document.getElementById('out-stored-bin');
  var elOutStoredHex = document.getElementById('out-stored-hex');
  var elOutStoredUnsigned = document.getElementById('out-stored-unsigned');
  var elOutCarryOut = document.getElementById('out-carry-out');
  var elOutResultSigned = document.getElementById('out-result-signed');
  var elOutSignedOverflow = document.getElementById('out-signed-overflow');
  var elSummaryExplain = document.getElementById('summary-explain');

  function updateRangeHint() {
    var w = parseInt(elWidthSelect.value, 10);
    elRangeHint.textContent = 'Each operand must be a whole number from 0 to ' + BitUtils.unsignedMax(w) +
      ' for a ' + w + '-bit width.';
  }

  function updateOperandReadouts() {
    elOutAUnsigned.textContent = String(currentA);
    elOutASigned.textContent = String(BitUtils.signedFromUnsigned(currentA, currentWidth));
    elOutBUnsigned.textContent = String(currentB);
    elOutBSigned.textContent = String(BitUtils.signedFromUnsigned(currentB, currentWidth));
  }

  function clearStaleResults(message) {
    elTraceTbody.innerHTML = '';
    elCurrentColLine.textContent = '';
    elSummaryPanel.hidden = true;
    elStatusLine.textContent = message || '';
  }

  /** Validate the width select + both operand fields together; apply only if all three are valid. */
  function attemptApply() {
    elSetupError.textContent = '';

    var newWidth = parseInt(elWidthSelect.value, 10);
    var maxVal = BitUtils.unsignedMax(newWidth);

    var resultA = BitUtils.parseValue(elOperandA.value, 'dec', newWidth);
    var resultB = BitUtils.parseValue(elOperandB.value, 'dec', newWidth);

    if (resultA.error || resultB.error) {
      var msg = [];
      if (resultA.error) msg.push('Operand A: ' + resultA.error);
      if (resultB.error) msg.push('Operand B: ' + resultB.error);
      elSetupError.textContent = msg.join(' ');
      elWidthSelect.value = String(currentWidth); // revert to the last valid width
      clearStaleResults('Fix the operand error above before continuing.');
      return false;
    }

    currentWidth = newWidth;
    currentA = resultA.value;
    currentB = resultB.value;
    revealedCount = 0;

    updateOperandReadouts();
    renderTrace();
    elSummaryPanel.hidden = true;
    elStatusLine.textContent = 'Ready. Predict the result, then click Next column.';
    return true;
  }

  function columnCells(pos, columns) {
    var isProcessed = pos < revealedCount;
    var isCurrent = pos === revealedCount && revealedCount < currentWidth;
    var col = columns[pos];

    return {
      weight: Math.pow(2, pos),
      carryIn: isProcessed || isCurrent ? String(col.carryIn) : '?',
      aBit: String(col.aBit),
      bBit: String(col.bBit),
      total: isProcessed ? String(col.total) : '?',
      resultBit: isProcessed ? String(col.resultBit) : '?',
      carryOut: isProcessed ? String(col.carryOut) : '?',
      isCurrent: isCurrent
    };
  }

  function renderTrace() {
    var columns = AdditionUtils.buildColumnTrace(currentA, currentB, currentWidth);
    var positions = [];
    for (var p = currentWidth - 1; p >= 0; p--) positions.push(p);

    var rowDefs = [
      { label: 'Bit weight', key: 'weight', isWeightRow: true },
      { label: 'Carry in', key: 'carryIn' },
      { label: 'Operand A bit', key: 'aBit' },
      { label: 'Operand B bit', key: 'bBit' },
      { label: 'Column total', key: 'total' },
      { label: 'Result bit (written)', key: 'resultBit' },
      { label: 'Carry out', key: 'carryOut' }
    ];

    var cellsByPos = {};
    positions.forEach(function (pos) { cellsByPos[pos] = columnCells(pos, columns); });

    elTraceTbody.innerHTML = '';
    rowDefs.forEach(function (rowDef) {
      var tr = document.createElement('tr');
      var th = document.createElement('th');
      th.scope = 'row';
      th.textContent = rowDef.label;
      th.style.textAlign = 'left';
      tr.appendChild(th);

      positions.forEach(function (pos) {
        var td = document.createElement('td');
        var cell = cellsByPos[pos];
        td.textContent = cell[rowDef.key];
        if (cell.isCurrent) {
          td.classList.add('current-col');
        }
        tr.appendChild(td);
      });
      elTraceTbody.appendChild(tr);
    });

    if (revealedCount < currentWidth) {
      var curPos = revealedCount;
      var curWeight = Math.pow(2, curPos);
      elCurrentColLine.textContent = 'Now on column ' + curPos + ' (bit weight ' + curWeight + '). Carry in is ' +
        columns[curPos].carryIn + '. Predict: ' + columns[curPos].aBit + ' + ' + columns[curPos].bBit + ' + ' +
        columns[curPos].carryIn + ' = ?';
    } else {
      elCurrentColLine.textContent = 'All columns revealed.';
    }
  }

  function showSummary() {
    var r = AdditionUtils.evaluateAddition(currentA, currentB, currentWidth);
    elSummaryPanel.hidden = false;
    elOutExactSum.textContent = String(r.exactSum);
    elOutStoredBin.textContent = BitUtils.toBinaryString(r.stored, currentWidth);
    elOutStoredHex.textContent = '0x' + BitUtils.toHexString(r.stored, currentWidth);
    elOutStoredUnsigned.textContent = String(r.stored);
    elOutCarryOut.textContent = String(r.carryOut);
    elOutResultSigned.textContent = String(r.signedResult);
    elOutSignedOverflow.textContent = r.signedOverflow ? 'Yes' : 'No';
    elOutSignedOverflow.classList.toggle('flag-true', r.signedOverflow);

    elSummaryExplain.textContent =
      'Exact unsigned sum ' + r.exactSum + ' stored in ' + currentWidth + ' bits is ' + r.stored +
      ' (sum mod ' + Math.pow(2, currentWidth) + '). Carry out is ' + r.carryOut + ' because the exact sum ' +
      (r.carryOut ? 'is' : 'is not') + ' at least ' + Math.pow(2, currentWidth) + '. Signed: ' + r.signedA +
      ' + ' + r.signedB + ' = ' + r.signedExactSum + ', which ' + (r.signedOverflow ? 'falls outside' : 'stays inside') +
      ' the representable signed range for ' + currentWidth + ' bits, so signed overflow is ' +
      (r.signedOverflow ? 'true' : 'false') + '. Carry-out and signed overflow are independent flags — one can be true while the other is false.';

    UiShell.announce(elStatusLine, 'All columns revealed. Stored result ' + BitUtils.toBinaryString(r.stored, currentWidth) +
      ' (unsigned ' + r.stored + ', signed ' + r.signedResult + '). Carry out ' + r.carryOut + '. Signed overflow ' +
      (r.signedOverflow ? 'yes' : 'no') + '.');
  }

  function onNextColumn() {
    if (revealedCount >= currentWidth) return;
    var columns = AdditionUtils.buildColumnTrace(currentA, currentB, currentWidth);
    var col = columns[revealedCount];
    revealedCount++;
    renderTrace();

    UiShell.announce(elStatusLine, 'Column ' + col.index + ': ' + col.aBit + ' + ' + col.bBit + ' + carry-in ' +
      col.carryIn + ' = ' + col.total + '. Write ' + col.resultBit + ', carry out ' + col.carryOut + '.');

    if (revealedCount >= currentWidth) {
      showSummary();
    }
  }

  function onShowAll() {
    revealedCount = currentWidth;
    renderTrace();
    showSummary();
  }

  function onStartOver() {
    revealedCount = 0;
    renderTrace();
    elSummaryPanel.hidden = true;
    elStatusLine.textContent = 'Ready. Predict the result, then click Next column.';
  }

  function onPreset(evt) {
    var btn = evt.currentTarget;
    elWidthSelect.value = btn.dataset.presetW;
    elOperandA.value = btn.dataset.presetA;
    elOperandB.value = btn.dataset.presetB;
    updateRangeHint();
    attemptApply();
  }

  elWidthSelect.addEventListener('change', function () {
    updateRangeHint();
    attemptApply();
  });
  elApplyBtn.addEventListener('click', attemptApply);
  [elOperandA, elOperandB].forEach(function (input) {
    input.addEventListener('keydown', function (evt) {
      if (evt.key === 'Enter') { evt.preventDefault(); attemptApply(); }
    });
  });
  elNextColBtn.addEventListener('click', onNextColumn);
  elShowAllBtn.addEventListener('click', onShowAll);
  elStartOverBtn.addEventListener('click', onStartOver);
  Array.prototype.forEach.call(document.querySelectorAll('[data-preset-a]'), function (btn) {
    btn.addEventListener('click', onPreset);
  });

  updateRangeHint();
  updateOperandReadouts();
  renderTrace();
})();
