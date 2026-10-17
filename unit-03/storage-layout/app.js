(function () {
  'use strict';

  var StorageLayout = window.CSIS118B.StorageLayout;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elWidth = document.getElementById('width-select');
  var elValues = document.getElementById('values-input');
  var elIndex = document.getElementById('index-input');
  var elReveal = document.getElementById('reveal-btn');
  var elReset = document.getElementById('reset-btn');
  var elPreset = document.getElementById('preset-btn');
  var elRangeNote = document.getElementById('range-note');
  var elError = document.getElementById('input-error');
  var elCode = document.getElementById('code-block');
  var elSummary = document.getElementById('summary-box');
  var elByteBody = document.getElementById('byte-table-body');
  var elStatus = document.getElementById('status-line');

  var DEFAULTS = { width: '4', values: '10, 20, 30, 40', index: '3' };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function updateRangeNote() {
    var widthBytes = Number(elWidth.value);
    var range = StorageLayout.rangeForWidth(widthBytes);
    elRangeNote.textContent = 'Accepted initializer range for ' + (widthBytes * 8) + ' bits: ' +
      range.min.toString() + ' through ' + range.max.toString() + ' (two’s complement encodes negative values).';
  }

  function clearOutput() {
    elCode.textContent = 'Correct the input above to reveal a layout.';
    elSummary.textContent = 'Correct the input to reveal a new layout.';
    elByteBody.innerHTML = '';
  }

  function reveal() {
    var widthBytes = Number(elWidth.value);
    var widthName = StorageLayout.WIDTH_NAMES[widthBytes];

    var parsed = StorageLayout.parseInitializers(elValues.value, widthBytes);
    if (parsed.error) {
      elError.textContent = parsed.error;
      clearOutput();
      UiShell.announce(elStatus, 'Invalid input: ' + parsed.error);
      return;
    }

    var indexResult = StorageLayout.parseElementIndex(elIndex.value, parsed.values.length);
    if (indexResult.error) {
      elError.textContent = indexResult.error;
      clearOutput();
      UiShell.announce(elStatus, 'Invalid input: ' + indexResult.error);
      return;
    }

    elError.textContent = '';
    var layout = StorageLayout.computeLayout(parsed.values, widthBytes);
    var selected = layout.elements[indexResult.index];

    elCode.textContent = 'values: ' + widthName + ' ' + elValues.value.trim() + '\n; Byte offset = index × ' + widthBytes;

    elSummary.textContent = parsed.values.length + ' element' + (parsed.values.length === 1 ? '' : 's') + ' × ' +
      widthBytes + ' byte' + (widthBytes === 1 ? '' : 's') + ' = ' + layout.totalBytes + ' total bytes. Index ' +
      indexResult.index + ' starts at byte offset ' + selected.offset + ' (0x' + selected.offset.toString(16).toUpperCase() +
      ') and has value ' + selected.value.toString() + '.';

    elByteBody.innerHTML = layout.rows.map(function (row) {
      var isSelected = row.elementIndex === indexResult.index;
      return '<tr' + (isSelected ? ' class="current-row"' : '') + '>' +
        '<td>' + row.elementIndex + '</td>' +
        '<td>' + row.offset + ' (0x' + row.offset.toString(16).toUpperCase().padStart(2, '0') + ')</td>' +
        '<td>0x' + row.byte.toString(16).toUpperCase().padStart(2, '0') + '</td>' +
        '<td>' + (row.isElementStart ? 'Element starts here' : 'Within element') + '</td>' +
        '</tr>';
    }).join('');

    UiShell.announce(elStatus, 'Layout revealed: ' + layout.totalBytes + ' total bytes. Element ' + indexResult.index +
      ' starts at offset ' + selected.offset + '.');
  }

  function resetTo(width, values, index, announceText) {
    elWidth.value = width;
    elValues.value = values;
    elIndex.value = index;
    elError.textContent = '';
    updateRangeNote();
    reveal();
    if (announceText) UiShell.announce(elStatus, announceText);
  }

  elWidth.addEventListener('change', updateRangeNote);
  elReveal.addEventListener('click', reveal);
  elReset.addEventListener('click', function () {
    resetTo(DEFAULTS.width, DEFAULTS.values, DEFAULTS.index, 'Reset to the default example.');
  });
  elPreset.addEventListener('click', function () {
    resetTo('4', '0x12345678', '0', '0x12345678 preset applied: one DWORD, index 0.');
  });
  [elValues, elIndex].forEach(function (el) {
    el.addEventListener('keydown', function (evt) { if (evt.key === 'Enter') { evt.preventDefault(); reveal(); } });
  });

  updateRangeNote();
  reveal();
})();
