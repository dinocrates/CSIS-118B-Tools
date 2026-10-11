(function () {
  'use strict';

  var WIDTH = 8;
  var BitUtils = window.CSIS118B.BitUtils;
  var BitwiseUtils = window.CSIS118B.BitwiseUtils;
  var UiShell = window.CSIS118B.UiShell;

  UiShell.initShell();

  var currentA = 0xAA;
  var currentB = 0x33;
  var currentOp = 'AND';
  var lastExplainedPos = null;

  var elBaseSelect = document.getElementById('base-select');
  var elInputA = document.getElementById('input-a');
  var elInputB = document.getElementById('input-b');
  var elLoadBtn = document.getElementById('load-btn');
  var elResetBtn = document.getElementById('reset-btn');
  var elLoadError = document.getElementById('load-error');
  var elOpSelect = document.getElementById('op-select');
  var elOpExplain = document.getElementById('op-explain');
  var elAGrid = document.getElementById('a-grid');
  var elBGrid = document.getElementById('b-grid');
  var elBLabel = document.getElementById('b-label');
  var elBDisabledNote = document.getElementById('b-disabled-note');
  var elResultGrid = document.getElementById('result-grid');
  var elBitExplain = document.getElementById('bit-explain');
  var elOutHex = document.getElementById('out-hex');
  var elOutUnsigned = document.getElementById('out-unsigned');
  var elOutSigned = document.getElementById('out-signed');
  var elResultExplain = document.getElementById('result-explain');
  var elTruthHead = document.getElementById('truth-head');
  var elTruthBody = document.getElementById('truth-body');

  var aButtons = [], bButtons = [], resultButtons = [];

  function buildRow(container, buttonsArray, interactive, onToggle) {
    for (var pos = WIDTH - 1; pos >= 0; pos--) {
      var col = document.createElement('div');
      col.className = 'bit-col';

      var weight = document.createElement('span');
      weight.className = 'bit-weight';
      weight.textContent = String(Math.pow(2, pos));

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bit-btn';
      btn.dataset.position = String(pos);
      btn.textContent = '0';
      if (interactive) {
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', function (evt) { onToggle(parseInt(evt.currentTarget.dataset.position, 10)); });
      } else {
        btn.addEventListener('click', function (evt) { onExplainResultBit(parseInt(evt.currentTarget.dataset.position, 10)); });
      }

      var label = document.createElement('span');
      label.className = 'bit-label';
      label.textContent = 'bit ' + pos;

      col.appendChild(weight);
      col.appendChild(btn);
      col.appendChild(label);
      container.appendChild(col);
      buttonsArray[pos] = btn;
    }
  }

  function clearExplanation() {
    lastExplainedPos = null;
    elBitExplain.textContent = 'Click any result bit above to see how it was computed.';
    resultButtons.forEach(function (b) { b.classList.remove('result-explained'); });
    Array.prototype.forEach.call(elTruthBody.querySelectorAll('tr'), function (tr) {
      tr.classList.remove('truth-highlight');
    });
  }

  function renderAll() {
    var isNot = currentOp === 'NOT';

    for (var pos = 0; pos < WIDTH; pos++) {
      var aBit = (currentA >> pos) & 1;
      aButtons[pos].textContent = String(aBit);
      aButtons[pos].setAttribute('aria-pressed', aBit === 1 ? 'true' : 'false');

      var bBit = (currentB >> pos) & 1;
      bButtons[pos].textContent = String(bBit);
      bButtons[pos].setAttribute('aria-pressed', bBit === 1 ? 'true' : 'false');
      bButtons[pos].disabled = isNot;
    }
    elBLabel.textContent = isNot ? 'B (mask) — not used by NOT' : 'B (mask)';
    elBDisabledNote.textContent = isNot ?
      'NOT only inverts A. B is disabled because this operation does not use a second value.' : '';

    var result = BitwiseUtils.computeByteResult(currentA, currentB, currentOp, WIDTH);
    var rows = BitwiseUtils.computeBitRows(currentA, currentB, currentOp, WIDTH);
    rows.forEach(function (row) {
      var btn = resultButtons[row.position];
      btn.textContent = String(row.resultBit);
      btn.classList.toggle('result-on', row.resultBit === 1);
    });

    var hexStr = BitUtils.toHexString(result, WIDTH);
    var signed = BitUtils.signedFromUnsigned(result, WIDTH);
    elOutHex.textContent = '0x' + hexStr;
    elOutUnsigned.textContent = String(result);
    elOutSigned.textContent = String(signed);

    var opDescriptions = {
      AND: 'AND: a mask bit of 0 clears that position to 0; a mask bit of 1 preserves the original bit.',
      OR: 'OR: a mask bit of 1 sets that position to 1; a mask bit of 0 preserves the original bit.',
      XOR: 'XOR: a mask bit of 1 toggles that position; a mask bit of 0 preserves the original bit.',
      NOT: 'NOT: every bit in A is flipped within the 8-bit width — no mask is used.'
    };
    elOpExplain.textContent = opDescriptions[currentOp];

    var opSymbol = { AND: 'AND', OR: 'OR', XOR: 'XOR', NOT: 'NOT' }[currentOp];
    if (isNot) {
      elResultExplain.textContent = 'NOT ' + BitUtils.toBinaryString(currentA, WIDTH) + ' = ' +
        BitUtils.toBinaryString(result, WIDTH) + ' (0x' + hexStr + ', unsigned ' + result + ', signed ' + signed + ').';
    } else {
      elResultExplain.textContent = BitUtils.toBinaryString(currentA, WIDTH) + ' ' + opSymbol + ' ' +
        BitUtils.toBinaryString(currentB, WIDTH) + ' = ' + BitUtils.toBinaryString(result, WIDTH) +
        ' (0x' + hexStr + ', unsigned ' + result + ', signed ' + signed + ').';
    }

    rebuildTruthTable();
    clearExplanation();
  }

  function rebuildTruthTable() {
    var isNot = currentOp === 'NOT';
    elTruthHead.innerHTML = isNot ?
      '<th scope="col">A</th><th scope="col">Result</th>' :
      '<th scope="col">A</th><th scope="col">B</th><th scope="col">Result</th>';

    var tableRows = BitwiseUtils.truthTableRows(currentOp);
    elTruthBody.innerHTML = '';
    tableRows.forEach(function (row, idx) {
      var tr = document.createElement('tr');
      tr.dataset.rowIndex = String(idx);
      if (isNot) {
        tr.innerHTML = '<td>' + row.a + '</td><td>' + row.result + '</td>';
      } else {
        tr.innerHTML = '<td>' + row.a + '</td><td>' + row.b + '</td><td>' + row.result + '</td>';
      }
      elTruthBody.appendChild(tr);
    });
  }

  function onExplainResultBit(pos) {
    lastExplainedPos = pos;
    var aBit = (currentA >> pos) & 1;
    var bBit = (currentB >> pos) & 1;
    var resultBit = resultButtons[pos].classList.contains('result-on') ? 1 : 0;

    resultButtons.forEach(function (b, i) { b.classList.toggle('result-explained', i === pos); });

    var text = BitwiseUtils.explainBit(currentOp, aBit, bBit, resultBit);
    elBitExplain.textContent = 'Bit ' + pos + ' (weight ' + Math.pow(2, pos) + '): ' + text;

    var isNot = currentOp === 'NOT';
    var matchIndex = isNot ? aBit : (aBit * 2 + bBit); // truthTableRows order is a=0,b=0 / a=0,b=1 / a=1,b=0 / a=1,b=1
    Array.prototype.forEach.call(elTruthBody.querySelectorAll('tr'), function (tr) {
      tr.classList.toggle('truth-highlight', parseInt(tr.dataset.rowIndex, 10) === matchIndex);
    });
  }

  function onToggleA(pos) {
    currentA ^= (1 << pos);
    renderAll();
  }

  function onToggleB(pos) {
    if (currentOp === 'NOT') return;
    currentB ^= (1 << pos);
    renderAll();
  }

  function onLoad() {
    var base = elBaseSelect.value;
    var resultA = BitUtils.parseValue(elInputA.value, base, WIDTH);
    var resultB = BitUtils.parseValue(elInputB.value, base, WIDTH);
    if (resultA.error || resultB.error) {
      var msg = [];
      if (resultA.error) msg.push('Value A: ' + resultA.error);
      if (resultB.error) msg.push('Value B: ' + resultB.error);
      elLoadError.textContent = msg.join(' ');
      return;
    }
    elLoadError.textContent = '';
    currentA = resultA.value;
    currentB = resultB.value;
    renderAll();
  }

  function onReset() {
    currentA = 0xAA;
    currentB = 0x33;
    currentOp = 'AND';
    elOpSelect.value = 'AND';
    elInputA.value = 'AA';
    elInputB.value = '33';
    elBaseSelect.value = 'hex';
    elLoadError.textContent = '';
    renderAll();
  }

  function onPreset(evt) {
    var btn = evt.currentTarget;
    currentOp = btn.dataset.op;
    currentA = parseInt(btn.dataset.a, 16);
    currentB = parseInt(btn.dataset.b, 16);
    elOpSelect.value = currentOp;
    elLoadError.textContent = '';
    renderAll();
  }

  buildRow(elAGrid, aButtons, true, onToggleA);
  buildRow(elBGrid, bButtons, true, onToggleB);
  buildRow(elResultGrid, resultButtons, false, null);

  elLoadBtn.addEventListener('click', onLoad);
  [elInputA, elInputB].forEach(function (input) {
    input.addEventListener('keydown', function (evt) {
      if (evt.key === 'Enter') { evt.preventDefault(); onLoad(); }
    });
  });
  elResetBtn.addEventListener('click', onReset);
  elOpSelect.addEventListener('change', function () {
    currentOp = elOpSelect.value;
    renderAll();
  });
  Array.prototype.forEach.call(document.querySelectorAll('.preset-row [data-op]'), function (btn) {
    btn.addEventListener('click', onPreset);
  });

  renderAll();
})();
