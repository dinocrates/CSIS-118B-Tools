(function () {
  'use strict';

  var WidthOps = window.CSIS118B.WidthOps;
  var IntegerInput = window.CSIS118B.IntegerInput;
  var ExtensionModel = window.CSIS118B.ExtensionModel;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elSrcWidth = document.getElementById('src-width-select');
  var elSrcValue = document.getElementById('src-value-input');
  var elDestWidth = document.getElementById('dest-width-select');
  var elMode = document.getElementById('mode-select');
  var elReveal = document.getElementById('reveal-btn');
  var elReset = document.getElementById('reset-btn');
  var elPresetRow = document.getElementById('preset-row');
  var elError = document.getElementById('input-error');
  var elCode = document.getElementById('code-block');
  var elResultGrid = document.getElementById('result-grid');
  var elResultExplain = document.getElementById('result-explain');
  var elRequiredBody = document.getElementById('required-table-body');
  var elStatus = document.getElementById('status-line');

  var ALL_WIDTHS = [8, 16, 32, 64];
  var DEFAULTS = { srcWidth: '8', srcValue: '0xF0', destWidth: '32', mode: 'zero' };
  var PRESETS = ['0x00', '0x7F', '0x80', '0xFF', '0xF0'];

  function updateDestWidthOptions() {
    var srcWidth = Number(elSrcWidth.value);
    var allowed = ALL_WIDTHS.filter(function (w) { return w > srcWidth; });
    var current = elDestWidth.value;
    elDestWidth.innerHTML = allowed.map(function (w) {
      return '<option value="' + w + '">' + w + '-bit</option>';
    }).join('');
    if (allowed.indexOf(Number(current)) !== -1) {
      elDestWidth.value = current;
    } else {
      elDestWidth.value = String(allowed[allowed.length - 1]);
    }
  }

  function buildPresets() {
    elPresetRow.innerHTML = PRESETS.map(function (p) {
      return '<button type="button" class="btn" data-preset="' + p + '">' + p + '</button>';
    }).join('');
  }

  function readoutTile(label, value) {
    return '<div class="readout"><span class="readout-label">' + label + '</span><output class="readout-value">' + value + '</output></div>';
  }

  function fail(message) {
    elError.textContent = message;
    elCode.textContent = '';
    elResultGrid.innerHTML = '';
    elResultExplain.textContent = 'Correct the input above and press Reveal again.';
    UiShell.announce(elStatus, 'Invalid input: ' + message);
  }

  function instructionMnemonic(srcWidth, destWidth, signed) {
    if (!signed) return 'movzx';
    if (srcWidth === 32 && destWidth === 64) return 'movsxd';
    return 'movsx';
  }

  function compute() {
    var srcWidth = Number(elSrcWidth.value);
    var destWidth = Number(elDestWidth.value);
    var signed = elMode.value === 'sign';

    var parsed = IntegerInput.parseBigInt(elSrcValue.value, 'source value');
    if (parsed.error) { fail(parsed.error); return; }
    var rangeError = WidthOps.validateOperand(parsed.value, srcWidth, 'source value');
    if (rangeError) { fail(rangeError); return; }
    elError.textContent = '';

    var srcReg = WidthOps.registerName(srcWidth, 'C').toLowerCase();
    var destReg = WidthOps.registerName(destWidth, 'A').toLowerCase();
    var mnemonic = instructionMnemonic(srcWidth, destWidth, signed);

    var r = ExtensionModel.computeExtension(parsed.value, srcWidth, destWidth, signed);

    elCode.textContent = mnemonic + ' ' + destReg + ', ' + (destWidth === srcWidth ? srcReg : (srcWidth === 8 ? 'byte ' : srcWidth === 16 ? 'word ' : 'dword ') + '[rel sample]');

    elResultGrid.innerHTML =
      readoutTile('Source bits (width ' + srcWidth + ')', WidthOps.toHex(r.srcBits, srcWidth) + ' = ' + WidthOps.bits(r.srcBits, srcWidth).toString() + ' unsigned, ' + WidthOps.signed(r.srcBits, srcWidth).toString() + ' signed') +
      readoutTile(destReg.toUpperCase() + ' (destination, width ' + destWidth + ')', WidthOps.toHex(r.destValue, destWidth)) +
      readoutTile(destReg.toUpperCase() + ' interpreted', r.destUnsignedInterpretation.toString() + ' unsigned, ' + r.destSignedInterpretation.toString() + ' signed') +
      readoutTile('Full 64-bit parent register', WidthOps.toHex(r.parent64, 64)) +
      readoutTile('Parent interpreted', r.parentUnsignedInterpretation.toString() + ' unsigned, ' + r.parentSignedInterpretation.toString() + ' signed');

    elResultExplain.textContent = destWidth === 32
      ? 'Writing a 32-bit destination (' + destReg.toUpperCase() + ') clears the parent 64-bit register’s upper half — that is why the parent above is the plain zero-extended reading of ' + destReg.toUpperCase() + ', even when the extension itself was signed.'
      : (destWidth === 64
        ? 'A 64-bit destination write IS the full parent register — nothing else to clear.'
        : '');

    UiShell.announce(elStatus, mnemonic + ' ' + destReg + ': ' + WidthOps.toHex(r.destValue, destWidth) + ', parent RAX ' + WidthOps.toHex(r.parent64, 64) + '.');
  }

  function renderRequiredTable() {
    var src = 0xF0n;
    var movzx = ExtensionModel.movzxEax(src);
    var movsxRax = ExtensionModel.movsxRax(src);
    var movsxEax = ExtensionModel.movsxEax(src);
    var movsxdRdi = ExtensionModel.movsxdRdi(movsxEax.destValue);

    function row(op, parentHex, interp) {
      return '<tr><td>' + op + '</td><td>' + parentHex + '</td><td>' + interp + '</td></tr>';
    }

    elRequiredBody.innerHTML =
      row('movzx eax, byte [rel sample]', 'RAX=' + WidthOps.toHex(movzx.parent64, 64), 'Unsigned ' + movzx.destUnsignedInterpretation.toString()) +
      row('movsx rax, byte [rel sample]', 'RAX=' + WidthOps.toHex(movsxRax.parent64, 64), 'Signed 64-bit ' + movsxRax.destSignedInterpretation.toString()) +
      row('movsx eax, byte [rel sample]', 'RAX=' + WidthOps.toHex(movsxEax.parent64, 64), 'Signed EAX=' + movsxEax.destSignedInterpretation.toString() + '; full signed RAX=' + movsxEax.parentSignedInterpretation.toString()) +
      row('movsxd rdi, eax (prior row)', 'RDI=' + WidthOps.toHex(movsxdRdi.parent64, 64), 'Signed 64-bit ' + movsxdRdi.destSignedInterpretation.toString());
  }

  function applyDefaults(d) {
    elSrcWidth.value = d.srcWidth;
    updateDestWidthOptions();
    elDestWidth.value = d.destWidth;
    elMode.value = d.mode;
    elSrcValue.value = d.srcValue;
    compute();
  }

  function onReset() {
    applyDefaults(DEFAULTS);
    UiShell.announce(elStatus, 'Reset to the default.');
  }

  elSrcWidth.addEventListener('change', function () { updateDestWidthOptions(); compute(); });
  elDestWidth.addEventListener('change', compute);
  elMode.addEventListener('change', compute);
  elSrcValue.addEventListener('input', function () {
    elCode.textContent = '';
    elResultGrid.innerHTML = '';
    elResultExplain.textContent = 'Input changed — press Reveal to recompute.';
    UiShell.announce(elStatus, 'Input changed. Press Reveal to recompute.');
  });
  elReveal.addEventListener('click', compute);
  elReset.addEventListener('click', onReset);

  buildPresets();
  elPresetRow.addEventListener('click', function (evt) {
    var btn = evt.target.closest('[data-preset]');
    if (!btn) return;
    elSrcValue.value = btn.dataset.preset;
    compute();
    UiShell.announce(elStatus, 'Loaded preset source ' + btn.dataset.preset + '.');
  });

  updateDestWidthOptions();
  elDestWidth.value = DEFAULTS.destWidth;
  renderRequiredTable();
  compute();
})();
