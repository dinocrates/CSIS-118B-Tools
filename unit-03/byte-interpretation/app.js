(function () {
  'use strict';

  var IntegerInput = window.CSIS118B.IntegerInput;
  var ByteExtension = window.CSIS118B.ByteExtension;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elValue = document.getElementById('value-input');
  var elApply = document.getElementById('apply-btn');
  var elReset = document.getElementById('reset-btn');
  var elError = document.getElementById('input-error');
  var elBitGrid = document.getElementById('bit-grid');
  var elBinary = document.getElementById('out-binary');
  var elHex = document.getElementById('out-hex');
  var elUnsigned = document.getElementById('out-unsigned');
  var elSigned = document.getElementById('out-signed');
  var elExtBody = document.getElementById('ext-table-body');
  var elTrapExplain = document.getElementById('trap-explain');
  var elStatus = document.getElementById('status-line');

  var pattern = 0xFFn;
  var bitButtons = [];

  function buildBitGrid() {
    elBitGrid.innerHTML = '';
    for (var pos = 7; pos >= 0; pos--) {
      var col = document.createElement('div');
      col.className = 'bit-col';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bit-btn';
      btn.dataset.bit = String(pos);
      btn.setAttribute('aria-pressed', 'false');
      btn.textContent = '0';
      btn.addEventListener('click', onBitToggle);

      var label = document.createElement('span');
      label.className = 'bit-label';
      label.textContent = 'bit ' + pos;

      col.appendChild(btn);
      col.appendChild(label);
      elBitGrid.appendChild(col);
      bitButtons[pos] = btn;
    }
  }

  function onBitToggle(evt) {
    var pos = Number(evt.currentTarget.dataset.bit);
    setPattern(ByteExtension.toggleBit(pattern, pos), true);
  }

  function setPattern(newPattern, announce) {
    pattern = ByteExtension.unsignedValue(newPattern);
    elValue.value = ByteExtension.toHexString(pattern);
    elError.textContent = '';

    for (var pos = 0; pos < 8; pos++) {
      var bit = (pattern >> BigInt(pos)) & 1n;
      var btn = bitButtons[pos];
      btn.textContent = bit.toString();
      btn.setAttribute('aria-pressed', bit === 1n ? 'true' : 'false');
      btn.setAttribute('aria-label', 'Bit ' + pos + ', value ' + bit.toString());
    }

    var unsigned = ByteExtension.unsignedValue(pattern);
    var signed = ByteExtension.signedValue(pattern);
    elBinary.textContent = ByteExtension.toBinaryString(pattern);
    elHex.textContent = ByteExtension.toHexString(pattern);
    elUnsigned.textContent = unsigned.toString();
    elSigned.textContent = signed.toString();

    var movzx = ByteExtension.movzxEdi(pattern);
    var movsxRdi = ByteExtension.movsxRdi(pattern);
    var movsxEdi = ByteExtension.movsxEdiThenZeroExtend(pattern);

    elExtBody.innerHTML =
      '<tr><td>MOVZX EDI, byte [...]</td><td>' + movzx.rdiHex + '</td><td>' + movzx.displayed + '</td></tr>' +
      '<tr><td>MOVSX RDI, byte [...]</td><td>' + movsxRdi.rdiHex + '</td><td>' + movsxRdi.displayed + '</td></tr>' +
      '<tr><td>MOVSX EDI, byte [...]</td><td>' + movsxEdi.rdiHex + '</td><td>' + movsxEdi.displayed + '</td></tr>';

    elTrapExplain.textContent = 'The trap: MOVSX to EDI sign-extends only to 32 bits, and that 32-bit register write then ' +
      'zero-extends the upper half of RDI. The result (' + movsxEdi.displayed + ') is an unsigned 32-bit reading, not a ' +
      'negative 64-bit argument. To pass a negative value to print_int, sign-extend directly to RDI (MOVSX RDI, ...), ' +
      'as the middle row does.';

    if (announce) {
      UiShell.announce(elStatus, 'Updated pattern: binary ' + ByteExtension.toBinaryString(pattern) + ', unsigned ' +
        unsigned + ', signed ' + signed + '.');
    }
  }

  function onApply() {
    var result = ByteExtension.parseBytePattern(elValue.value);
    if (result.error) {
      elError.textContent = result.error;
      UiShell.announce(elStatus, 'Invalid input: ' + result.error);
      return;
    }
    setPattern(result.value, true);
  }

  function onReset() {
    setPattern(0xFFn, true);
  }

  function onPreset(evt) {
    var result = ByteExtension.parseBytePattern(evt.currentTarget.dataset.preset);
    setPattern(result.value, true);
  }

  buildBitGrid();
  elApply.addEventListener('click', onApply);
  elReset.addEventListener('click', onReset);
  elValue.addEventListener('keydown', function (evt) { if (evt.key === 'Enter') { evt.preventDefault(); onApply(); } });
  Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (btn) {
    btn.addEventListener('click', onPreset);
  });

  setPattern(pattern, false);
  elStatus.textContent = 'Toggle a bit, apply a byte value, or use a preset. All three widening operations update together.';
})();
