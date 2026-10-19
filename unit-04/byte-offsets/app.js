(function () {
  'use strict';

  var IntegerInput = window.CSIS118B.IntegerInput;
  var StorageLayout = window.CSIS118B.StorageLayout;
  var StorageAccessModel = window.CSIS118B.StorageAccessModel;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elWidth = document.getElementById('width-select');
  var elValues = document.getElementById('values-input');
  var elApply = document.getElementById('apply-btn');
  var elReset = document.getElementById('reset-btn');
  var elPresetRow = document.getElementById('preset-row');
  var elError = document.getElementById('input-error');
  var elOffset = document.getElementById('offset-input');
  var elAccessWidth = document.getElementById('access-width-select');
  var elRead = document.getElementById('read-btn');
  var elAccessExplain = document.getElementById('access-explain');
  var elStoreIndex = document.getElementById('store-index-input');
  var elStoreValue = document.getElementById('store-value-input');
  var elStoreBtn = document.getElementById('store-btn');
  var elStoreExplain = document.getElementById('store-explain');
  var elByteBody = document.getElementById('byte-table-body');
  var elStatus = document.getElementById('status-line');

  var DEFAULT = { width: '4', values: '100, 200, 300, 400' };
  var PRESETS = [
    { label: 'words: dw 10,20,30,40', width: '2', values: '10, 20, 30, 40', offset: '4', accessWidth: '2' },
    { label: 'values: dd 100,200,300,400', width: '4', values: '100, 200, 300, 400', offset: '8', accessWidth: '4' },
    { label: 'misaligned DWORD read at +2', width: '4', values: '100, 200, 300, 400', offset: '2', accessWidth: '4' }
  ];

  var currentValues = null;
  var currentWidth = 4;
  var lastAccessRange = null;

  function buildPresets() {
    elPresetRow.innerHTML = PRESETS.map(function (p, i) {
      return '<button type="button" class="btn" data-preset="' + i + '">' + p.label + '</button>';
    }).join('');
  }

  function renderTable() {
    if (!currentValues) { elByteBody.innerHTML = ''; return; }
    var layout = StorageLayout.computeLayout(currentValues, currentWidth);
    elByteBody.innerHTML = layout.rows.map(function (row) {
      var inRange = lastAccessRange && row.offset >= lastAccessRange.start && row.offset < lastAccessRange.end;
      return '<tr' + (inRange ? ' class="changed-row"' : '') + '>' +
        '<td>' + row.elementIndex + '</td>' +
        '<td>' + row.offset + '</td>' +
        '<td>0x' + row.byte.toString(16).toUpperCase().padStart(2, '0') + '</td>' +
        '<td>' + (row.isElementStart ? 'starts element ' + row.elementIndex : '') + '</td>' +
        '</tr>';
    }).join('');
  }

  function applyInitializers(widthStr, valuesRaw, announce) {
    var width = Number(widthStr);
    var parsed = StorageLayout.parseInitializers(valuesRaw, width);
    if (parsed.error) {
      elError.textContent = parsed.error;
      currentValues = null;
      renderTable();
      UiShell.announce(elStatus, 'Invalid input: ' + parsed.error);
      return;
    }
    elError.textContent = '';
    currentValues = parsed.values;
    currentWidth = width;
    lastAccessRange = null;
    elAccessExplain.textContent = 'Initializers applied. Choose a byte offset and access width, then Read access.';
    elStoreExplain.textContent = '';
    renderTable();
    if (announce) UiShell.announce(elStatus, 'Initializers applied: ' + currentValues.length + ' elements, ' + (currentValues.length * width) + ' total bytes.');
  }

  function onApply() {
    applyInitializers(elWidth.value, elValues.value, true);
  }

  function onReset() {
    elWidth.value = DEFAULT.width;
    elValues.value = DEFAULT.values;
    applyInitializers(DEFAULT.width, DEFAULT.values, true);
  }

  function onRead() {
    if (!currentValues) { UiShell.announce(elStatus, 'Apply valid initializers first.'); return; }
    var offsetParsed = IntegerInput.parseIndex(elOffset.value, 'byte offset');
    if (offsetParsed.error) {
      elAccessExplain.textContent = offsetParsed.error;
      UiShell.announce(elStatus, 'Invalid input: ' + offsetParsed.error);
      return;
    }
    var accessWidth = Number(elAccessWidth.value);
    var result = StorageAccessModel.accessAt(currentValues, currentWidth, offsetParsed.value, accessWidth);
    if (result.error) {
      elAccessExplain.textContent = result.error;
      lastAccessRange = null;
      renderTable();
      UiShell.announce(elStatus, result.error);
      return;
    }
    lastAccessRange = { start: result.byteOffset, end: result.byteOffset + result.accessWidthBytes };
    renderTable();
    var boundaryNote = result.startsAtElementBoundary
      ? ('starts exactly at element index ' + result.owningElementIndex + '.')
      : ('does NOT start at an element boundary — it begins inside element index ' + result.owningElementIndex + '. A byte offset is not an element number.');
    elAccessExplain.textContent = 'Value at offset ' + result.byteOffset + ', width ' + accessWidth + ': ' + result.value.toString() +
      ' (0x' + result.value.toString(16).toUpperCase() + '). This access ' + boundaryNote;
    UiShell.announce(elStatus, 'Read ' + result.value.toString() + ' at offset ' + result.byteOffset + '.');
  }

  function onStore() {
    if (!currentValues) { UiShell.announce(elStatus, 'Apply valid initializers first.'); return; }
    var indexParsed = IntegerInput.parseIndex(elStoreIndex.value, 'element index');
    if (indexParsed.error) {
      elStoreExplain.textContent = indexParsed.error;
      UiShell.announce(elStatus, 'Invalid input: ' + indexParsed.error);
      return;
    }
    var valueParsed = IntegerInput.parseBigInt(elStoreValue.value, 'new value');
    if (valueParsed.error) {
      elStoreExplain.textContent = valueParsed.error;
      UiShell.announce(elStatus, 'Invalid input: ' + valueParsed.error);
      return;
    }
    var result = StorageAccessModel.storeElement(currentValues, currentWidth, indexParsed.value, valueParsed.value);
    if (result.error) {
      elStoreExplain.textContent = result.error;
      UiShell.announce(elStatus, result.error);
      return;
    }
    currentValues = result.values;
    lastAccessRange = { start: indexParsed.value * currentWidth, end: (indexParsed.value + 1) * currentWidth };
    renderTable();
    elStoreExplain.textContent = 'Element ' + indexParsed.value + ' is now ' + valueParsed.value.toString() + '. Final elements: ' + currentValues.map(String).join(', ') + '.';
    UiShell.announce(elStatus, 'Stored ' + valueParsed.value.toString() + ' into element ' + indexParsed.value + '.');
  }

  elApply.addEventListener('click', onApply);
  elReset.addEventListener('click', onReset);
  elRead.addEventListener('click', onRead);
  elStoreBtn.addEventListener('click', onStore);

  buildPresets();
  elPresetRow.addEventListener('click', function (evt) {
    var btn = evt.target.closest('[data-preset]');
    if (!btn) return;
    var p = PRESETS[Number(btn.dataset.preset)];
    elWidth.value = p.width;
    elValues.value = p.values;
    elOffset.value = p.offset;
    elAccessWidth.value = p.accessWidth;
    applyInitializers(p.width, p.values, false);
    onRead();
    UiShell.announce(elStatus, 'Loaded preset: ' + p.label + '.');
  });

  onReset();
})();
