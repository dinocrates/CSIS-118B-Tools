(function () {
  'use strict';

  var FractionUtils = window.CSIS118B.FractionUtils;
  var UiShell = window.CSIS118B.UiShell;
  var MAX_STEPS = 24;

  UiShell.initShell();

  var elInput = document.getElementById('frac-input');
  var elConvertBtn = document.getElementById('convert-btn');
  var elResetBtn = document.getElementById('reset-btn');
  var elInputError = document.getElementById('input-error');
  var elExactFraction = document.getElementById('exact-fraction');
  var elNextDigitBtn = document.getElementById('next-digit-btn');
  var elRunAllBtn = document.getElementById('run-all-btn');
  var elStepsTbody = document.getElementById('steps-tbody');
  var elStatusLine = document.getElementById('status-line');
  var elBitsLine = document.getElementById('bits-line');
  var elBitsStatus = document.getElementById('bits-status');
  var elTruncLine = document.getElementById('trunc-line');

  var numerator = null, denominator = null;
  var expansion = null; // { steps, terminated, repeatStartIndex, hitLimit, finalRemainder }
  var revealedCount = 0;

  function fracStr(num, den) {
    if (num === 0n) return '0';
    return num.toString() + '/' + den.toString();
  }

  function clearDownstream(message) {
    elExactFraction.textContent = '';
    elStepsTbody.innerHTML = '';
    elBitsLine.textContent = '';
    elBitsStatus.textContent = '';
    elTruncLine.textContent = '';
    elStatusLine.textContent = message || '';
  }

  function loadFraction(raw) {
    var parsed = FractionUtils.parseDecimalFraction(raw);
    if (parsed.error) {
      elInputError.textContent = parsed.error;
      clearDownstream('Fix the error above before converting.');
      return false;
    }
    elInputError.textContent = '';
    numerator = parsed.numerator;
    denominator = parsed.denominator;
    expansion = FractionUtils.expandBinaryFraction(numerator, denominator, MAX_STEPS);
    revealedCount = 0;
    render();
    return true;
  }

  function render() {
    elExactFraction.textContent = (numerator === 0n ? '0' : fracStr(numerator, denominator)) +
      ' = ' + fracStr(numerator, denominator) + ' (lowest terms)';

    elStepsTbody.innerHTML = '';
    for (var i = 0; i < revealedCount; i++) {
      var st = expansion.steps[i];
      var tr = document.createElement('tr');
      if (i === revealedCount - 1) tr.classList.add('current-row');
      tr.innerHTML =
        '<td>' + st.step + '</td>' +
        '<td>1/' + (2n ** BigInt(st.step)).toString() + '</td>' +
        '<td>' + fracStr(st.remainderBefore, denominator) + '</td>' +
        '<td>' + fracStr(st.doubled, denominator) + '</td>' +
        '<td>' + st.bit + '</td>' +
        '<td>' + fracStr(st.remainderAfter, denominator) + '</td>';
      elStepsTbody.appendChild(tr);
    }

    renderBits();
    renderTruncation();

    var totalSteps = expansion.steps.length;
    if (revealedCount < totalSteps) {
      elStatusLine.textContent = 'Revealed ' + revealedCount + ' of ' + totalSteps + ' digit(s) so far.';
    } else if (revealedCount === 0) {
      elStatusLine.textContent = 'Value is exactly 0 — no conversion steps needed.';
    } else if (expansion.terminated) {
      elStatusLine.textContent = 'All digits revealed. The expansion terminates exactly after ' + totalSteps + ' digit(s).';
    } else if (expansion.repeatStartIndex !== null) {
      elStatusLine.textContent = 'All digits revealed. The remainder repeated, so the expansion repeats forever.';
    } else if (expansion.hitLimit) {
      elStatusLine.textContent = 'Reached the ' + MAX_STEPS + '-digit display limit without an exact termination or a detected repeat. The expansion may continue beyond what is shown.';
    }
  }

  function renderBits() {
    var bits = expansion.steps.slice(0, revealedCount).map(function (s) { return s.bit; });
    var totalSteps = expansion.steps.length;

    if (revealedCount === 0) {
      elBitsLine.textContent = '0.0';
      elBitsStatus.textContent = numerator === 0n ? 'Zero terminates immediately — there is nothing to double.' : '';
      return;
    }

    var fullyRevealed = revealedCount === totalSteps;

    if (fullyRevealed && expansion.repeatStartIndex !== null) {
      var nonRepeating = bits.slice(0, expansion.repeatStartIndex).join('');
      var repeating = bits.slice(expansion.repeatStartIndex).join('');
      elBitsLine.textContent = '0.' + nonRepeating + '[' + repeating + ']…';
      elBitsStatus.textContent = 'The bracketed group [' + repeating + '] repeats forever. Brackets mark the repeating group — they are not binary digits themselves.';
    } else {
      elBitsLine.textContent = '0.' + bits.join('') + (fullyRevealed && !expansion.terminated ? '…' : '');
      if (fullyRevealed && expansion.terminated) {
        elBitsStatus.textContent = 'This is the complete, exact expansion.';
      } else if (fullyRevealed && expansion.hitLimit) {
        elBitsStatus.textContent = 'Display limit reached — this prefix is not declared finite or exact.';
      } else {
        elBitsStatus.textContent = '';
      }
    }
  }

  function renderTruncation() {
    if (revealedCount === 0 && numerator === 0n) {
      elTruncLine.textContent = 'Displayed value 0 equals the exact value 0. No truncation.';
      return;
    }
    var info = FractionUtils.truncationInfo(numerator, denominator, expansion.steps, revealedCount);
    var prefixDesc = revealedCount === 0 ? '0 (no digits shown yet)' :
      '0.' + info.prefixBits + '₂ = ' + info.prefixInteger.toString() + '/' + (2n ** BigInt(revealedCount)).toString();

    if (info.errorNumerator === 0n) {
      elTruncLine.textContent = 'Displayed prefix ' + prefixDesc + ' equals the exact value ' + fracStr(numerator, denominator) +
        ' exactly — no truncation error.';
    } else {
      elTruncLine.textContent = 'Displayed prefix ' + prefixDesc + ' differs from the exact value ' +
        fracStr(numerator, denominator) + ' by exactly ' + fracStr(info.errorNumerator, info.errorDenominator) +
        ' (a truncation error, not a rounding error).';
    }
  }

  function onConvert() {
    loadFraction(elInput.value);
  }

  function onReset() {
    elInput.value = '0.625';
    elInputError.textContent = '';
    loadFraction('0.625');
  }

  function onNextDigit() {
    if (!expansion || revealedCount >= expansion.steps.length) return;
    revealedCount++;
    render();
    var st = expansion.steps[revealedCount - 1];
    UiShell.announce(elStatusLine, 'Step ' + st.step + ': remainder ' + fracStr(st.remainderBefore, denominator) +
      ' doubled is ' + fracStr(st.doubled, denominator) + ', so the digit is ' + st.bit + '.');
  }

  function onRunAll() {
    if (!expansion) return;
    revealedCount = expansion.steps.length;
    render();
  }

  function onPreset(evt) {
    var value = evt.currentTarget.dataset.preset;
    elInput.value = value;
    loadFraction(value);
  }

  elConvertBtn.addEventListener('click', onConvert);
  elInput.addEventListener('keydown', function (evt) {
    if (evt.key === 'Enter') { evt.preventDefault(); onConvert(); }
  });
  elResetBtn.addEventListener('click', onReset);
  elNextDigitBtn.addEventListener('click', onNextDigit);
  elRunAllBtn.addEventListener('click', onRunAll);
  Array.prototype.forEach.call(document.querySelectorAll('[data-preset]'), function (btn) {
    btn.addEventListener('click', onPreset);
  });

  loadFraction(elInput.value);
})();
