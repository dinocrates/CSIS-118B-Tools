(function () {
  'use strict';

  var WIDTH = 8;
  var BitUtils = window.CSIS118B.BitUtils;
  var UiShell = window.CSIS118B.UiShell;

  UiShell.initShell();

  var currentValue = 38;

  var elBitGrid = document.getElementById('bit-grid');
  var elBaseSelect = document.getElementById('base-select');
  var elLoadInput = document.getElementById('load-input');
  var elLoadInputLabel = document.getElementById('load-input-label');
  var elLoadExample = document.getElementById('load-example');
  var elLoadError = document.getElementById('load-error');
  var elLoadBtn = document.getElementById('load-btn');
  var elResetBtn = document.getElementById('reset-btn');
  var elOutBinary = document.getElementById('out-binary');
  var elOutHex = document.getElementById('out-hex');
  var elOutUnsigned = document.getElementById('out-unsigned');
  var elOutSigned = document.getElementById('out-signed');
  var elSignedExplain = document.getElementById('signed-explain');
  var elSumLine = document.getElementById('sum-line');
  var elNegateBtn = document.getElementById('negate-btn');
  var elNegateTrace = document.getElementById('negate-trace');
  var elStatusLine = document.getElementById('status-line');

  var bitButtons = []; // index 0 = bit 7 (MSB) ... index 7 = bit 0 (LSB)

  var BASE_EXAMPLES = {
    dec: { label: 'Decimal value', example: 'Example: 38' },
    bin: { label: 'Binary value (1–8 bits)', example: 'Example: 00100110 or 0b100110' },
    hex: { label: 'Hex value (1–2 digits)', example: 'Example: 26 or 0x26' }
  };

  function buildBitGrid() {
    elBitGrid.innerHTML = '';
    var highNibble = document.createElement('div');
    highNibble.className = 'nibble-group';
    highNibble.setAttribute('aria-label', 'High nibble, bits 7 through 4');
    var lowNibble = document.createElement('div');
    lowNibble.className = 'nibble-group';
    lowNibble.setAttribute('aria-label', 'Low nibble, bits 3 through 0');

    for (var pos = WIDTH - 1; pos >= 0; pos--) {
      var col = document.createElement('div');
      col.className = 'bit-col';

      var weightLabel = document.createElement('span');
      weightLabel.className = 'bit-weight';
      weightLabel.textContent = (pos === WIDTH - 1 ? '±' : '') + Math.pow(2, pos);

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bit-btn';
      btn.dataset.position = String(pos);
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = '0';
      btn.addEventListener('click', onBitToggle);

      var bitLabel = document.createElement('span');
      bitLabel.className = 'bit-label';
      bitLabel.textContent = 'bit ' + pos;

      col.appendChild(weightLabel);
      col.appendChild(btn);
      col.appendChild(bitLabel);

      (pos >= 4 ? highNibble : lowNibble).appendChild(col);
      bitButtons[pos] = btn;
    }

    elBitGrid.appendChild(highNibble);
    elBitGrid.appendChild(lowNibble);
  }

  function onBitToggle(evt) {
    var pos = parseInt(evt.currentTarget.dataset.position, 10);
    var newValue = currentValue ^ (1 << pos);
    setValue(newValue, { clearTrace: true, announce: true });
  }

  function setValue(value, opts) {
    opts = opts || {};
    currentValue = value & BitUtils.unsignedMax(WIDTH);

    for (var pos = 0; pos < WIDTH; pos++) {
      var bit = (currentValue >> pos) & 1;
      var btn = bitButtons[pos];
      btn.textContent = String(bit);
      btn.setAttribute('aria-pressed', bit === 1 ? 'true' : 'false');
    }

    var binStr = BitUtils.toBinaryString(currentValue, WIDTH);
    var hexStr = BitUtils.toHexString(currentValue, WIDTH);
    var signed = BitUtils.signedFromUnsigned(currentValue, WIDTH);

    elOutBinary.textContent = binStr;
    elOutHex.textContent = '0x' + hexStr;
    elOutUnsigned.textContent = String(currentValue);
    elOutSigned.textContent = String(signed);

    var msb = (currentValue >> (WIDTH - 1)) & 1;
    if (msb === 1) {
      elSignedExplain.textContent =
        'Bit 7 is 1, so this pattern is negative in signed form: signed = unsigned − 256 = ' +
        currentValue + ' − 256 = ' + signed + '.';
    } else {
      elSignedExplain.textContent =
        'Bit 7 is 0, so the signed and unsigned readings match: signed = unsigned = ' + signed + '.';
    }

    var bits = BitUtils.placeValueBits(currentValue, WIDTH);
    var setBits = bits.filter(function (b) { return b.bit === 1; });
    if (setBits.length === 0) {
      elSumLine.textContent = '0 (no bits set)';
    } else {
      elSumLine.textContent = setBits.map(function (b) { return b.weight; }).join(' + ') + ' = ' + currentValue;
    }

    if (opts.clearTrace) {
      elNegateTrace.innerHTML = '';
    }

    if (opts.announce) {
      UiShell.announce(elStatusLine, 'Current value: binary ' + binStr + ', hex 0x' + hexStr +
        ', unsigned ' + currentValue + ', signed ' + signed + '.');
    }
  }

  function updateInputLabel() {
    var base = elBaseSelect.value;
    var info = BASE_EXAMPLES[base];
    elLoadInputLabel.textContent = info.label;
    elLoadExample.textContent = info.example;
  }

  function onLoad() {
    var base = elBaseSelect.value;
    var result = BitUtils.parseValue(elLoadInput.value, base, WIDTH);
    if (result.error) {
      elLoadError.textContent = result.error;
      UiShell.announce(elStatusLine, 'Could not load value: ' + result.error);
      return;
    }
    elLoadError.textContent = '';
    setValue(result.value, { clearTrace: true, announce: true });
  }

  function onReset() {
    elLoadInput.value = '';
    elLoadError.textContent = '';
    setValue(38, { clearTrace: true, announce: true });
  }

  function onPreset(evt) {
    var value = parseInt(evt.currentTarget.dataset.preset, 10);
    elLoadError.textContent = '';
    setValue(value, { clearTrace: true, announce: true });
  }

  function renderStageRow(labelText, value) {
    var wrap = document.createElement('div');
    wrap.style.marginBottom = '0.5rem';

    var label = document.createElement('div');
    label.className = 'tool-sub';
    label.style.margin = '0 0 0.2rem';
    label.textContent = labelText;

    var row = document.createElement('div');
    row.style.display = 'flex';
    row.style.gap = '0.3rem';
    row.style.flexWrap = 'wrap';

    var binStr = BitUtils.toBinaryString(value, WIDTH);
    for (var i = 0; i < binStr.length; i++) {
      var cell = document.createElement('span');
      cell.className = 'bit-static';
      cell.textContent = binStr[i];
      row.appendChild(cell);
    }

    wrap.appendChild(label);
    wrap.appendChild(row);
    return wrap;
  }

  function onNegate() {
    var neg = BitUtils.twosComplementNegate(currentValue, WIDTH);

    elNegateTrace.innerHTML = '';
    elNegateTrace.appendChild(renderStageRow(
      'Original: unsigned ' + neg.original + ' = ' + BitUtils.toBinaryString(neg.original, WIDTH), neg.original));
    elNegateTrace.appendChild(renderStageRow(
      'Step 1 — invert all bits:', neg.inverted));
    elNegateTrace.appendChild(renderStageRow(
      'Step 2 — add one (result, still ' + WIDTH + ' bits):', neg.result));

    var explain = document.createElement('div');
    explain.className = 'explain-box';
    var resultSigned = BitUtils.signedFromUnsigned(neg.result, WIDTH);
    var originalSigned = BitUtils.signedFromUnsigned(neg.original, WIDTH);

    if (neg.doesNotFit) {
      explain.textContent =
        'Original signed value is ' + originalSigned + ' (the most negative 8-bit value). Its true negation, +' +
        (-originalSigned) + ', cannot fit in 8 bits, so the invert-and-add-one pattern wraps back around to ' +
        BitUtils.toBinaryString(neg.result, WIDTH) + ' — the same bit pattern, still read as ' + resultSigned + '. This is the one case where negate does not change the value.';
    } else if (neg.original === 0) {
      explain.textContent =
        'Negating 0 inverts to 11111111 (255), then adding one wraps back to 00000000. Zero negated is zero.';
    } else {
      explain.textContent =
        'Original signed value ' + originalSigned + ' negates to signed ' + resultSigned +
        ' (bit pattern ' + BitUtils.toBinaryString(neg.result, WIDTH) + ', hex 0x' + BitUtils.toHexString(neg.result, WIDTH) + ').';
    }
    elNegateTrace.appendChild(explain);

    setValue(neg.result, { clearTrace: false, announce: false });
    UiShell.announce(elStatusLine, 'Negated: new current value is binary ' + BitUtils.toBinaryString(neg.result, WIDTH) +
      ', signed ' + resultSigned + '.');
  }

  buildBitGrid();
  elBaseSelect.addEventListener('change', updateInputLabel);
  elLoadBtn.addEventListener('click', onLoad);
  elLoadInput.addEventListener('keydown', function (evt) {
    if (evt.key === 'Enter') { evt.preventDefault(); onLoad(); }
  });
  elResetBtn.addEventListener('click', onReset);
  elNegateBtn.addEventListener('click', onNegate);
  Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (btn) {
    btn.addEventListener('click', onPreset);
  });

  updateInputLabel();
  setValue(currentValue, { clearTrace: true, announce: false });
})();
