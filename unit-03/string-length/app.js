(function () {
  'use strict';

  var StringLayout = window.CSIS118B.StringLayout;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elText = document.getElementById('text-input');
  var elLf = document.getElementById('lf-check');
  var elNul = document.getElementById('nul-check');
  var elReveal = document.getElementById('reveal-btn');
  var elReset = document.getElementById('reset-btn');
  var elError = document.getElementById('input-error');
  var elCode = document.getElementById('code-block');
  var elSummary = document.getElementById('summary-box');
  var elByteBody = document.getElementById('byte-table-body');
  var elBehavior = document.getElementById('behavior-box');
  var elStatus = document.getElementById('status-line');

  var GENERAL_NOTE = ' print_string adds no newline of its own; print_line adds one. A stored line feed (10) plus ' +
    'print_line produces two line breaks total. This course library’s read_string does not append NUL on input ' +
    '— reading input is outside this tool’s simulation scope, which only models the output of a given byte sequence.';

  function clearOutput() {
    elCode.textContent = 'Correct the input above to reveal the byte layout.';
    elSummary.textContent = 'Correct the input to reveal a new layout.';
    elByteBody.innerHTML = '';
    elBehavior.textContent = '';
  }

  function reveal() {
    var text = elText.value;
    var error = StringLayout.validateText(text);
    if (error) {
      elError.textContent = error;
      clearOutput();
      UiShell.announce(elStatus, 'Invalid input: ' + error);
      return;
    }
    elError.textContent = '';

    var includeLf = elLf.checked;
    var includeNul = elNul.checked;
    var rows = StringLayout.byteRows(text, includeLf, includeNul);
    var storageBytes = StringLayout.storageByteCount(text, includeLf, includeNul);

    elCode.textContent = StringLayout.buildSource(text, includeLf, includeNul);

    elSummary.textContent = 'Visible ASCII characters: ' + text.length + '. Storage bytes: ' + storageBytes +
      '. MESSAGE_BYTES = ' + storageBytes + '.';

    elByteBody.innerHTML = rows.map(function (row) {
      return '<tr><td>' + row.offset + '</td><td>' + escapeHtml(row.meaning) + '</td><td>' + row.decimal + '</td><td>' + row.hex + '</td></tr>';
    }).join('');

    var behaviorText;
    if (includeNul) {
      behaviorText = 'The routine prints the character bytes' + (includeLf ? ' and the stored line feed' : '') +
        ', then stops at NUL. The terminator itself is not visible in the printed output.' + GENERAL_NOTE;
    } else {
      behaviorText = 'There is no NUL terminator. This model reports that contract violation; it does not simulate ' +
        'an out-of-bounds read. Add NUL before calling print_string.' + GENERAL_NOTE;
    }
    elBehavior.textContent = behaviorText;

    UiShell.announce(elStatus, 'Byte span revealed: ' + storageBytes + ' storage bytes for ' + text.length + ' visible ASCII characters.');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function resetDefault() {
    elText.value = 'Hi';
    elLf.checked = true;
    elNul.checked = true;
    elError.textContent = '';
    reveal();
    UiShell.announce(elStatus, 'Reset to Hi + line feed + NUL.');
  }

  elReveal.addEventListener('click', reveal);
  elReset.addEventListener('click', resetDefault);
  elText.addEventListener('keydown', function (evt) { if (evt.key === 'Enter') { evt.preventDefault(); reveal(); } });

  reveal();
})();
