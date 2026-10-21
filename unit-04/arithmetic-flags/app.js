(function () {
  'use strict';

  var WidthOps = window.CSIS118B.WidthOps;
  var IntegerInput = window.CSIS118B.IntegerInput;
  var ArithmeticModel = window.CSIS118B.ArithmeticModel;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elWidth = document.getElementById('width-select');
  var elOp = document.getElementById('op-select');
  var elA = document.getElementById('a-input');
  var elB = document.getElementById('b-input');
  var elBField = document.getElementById('b-field');
  var elCf = document.getElementById('cf-select');
  var elCfField = document.getElementById('cf-field');
  var elReveal = document.getElementById('reveal-btn');
  var elReset = document.getElementById('reset-btn');
  var elError = document.getElementById('input-error');
  var elPresetRow = document.getElementById('preset-row');
  var elCode = document.getElementById('code-block');
  var elBitStrip = document.getElementById('bit-strip');
  var elOutHex = document.getElementById('out-hex');
  var elOutUnsigned = document.getElementById('out-unsigned');
  var elOutSigned = document.getElementById('out-signed');
  var elFlagsGrid = document.getElementById('flags-grid');
  var elSecondaryFlagsGrid = document.getElementById('secondary-flags-grid');
  var elFlagsExplain = document.getElementById('flags-explain');
  var elStatus = document.getElementById('status-line');

  var DEFAULTS = { width: '8', op: 'ADD', a: '127', b: '1', cf: '0' };

  var PRESETS = [
    { label: '255+1 (CF/AF/PF)', width: '8', op: 'ADD', a: '255', b: '1', cf: '0' },
    { label: '127+1 (OF/SF)', width: '8', op: 'ADD', a: '127', b: '1', cf: '0' },
    { label: '0-1 (CF/SF)', width: '8', op: 'SUB', a: '0', b: '1', cf: '0' },
    { label: '-128-1 (OF)', width: '8', op: 'SUB', a: '-128', b: '1', cf: '0' },
    { label: 'INC 10, CF=1', width: '8', op: 'INC', a: '10', b: '0', cf: '1' },
    { label: 'INC 255, CF=0', width: '8', op: 'INC', a: '255', b: '0', cf: '0' },
    { label: 'DEC 0, CF=1', width: '8', op: 'DEC', a: '0', b: '0', cf: '1' },
    { label: 'NEG 0', width: '8', op: 'NEG', a: '0', b: '0', cf: '0' },
    { label: 'NEG -128', width: '8', op: 'NEG', a: '-128', b: '0', cf: '0' },
    { label: 'AF: 15+1', width: '8', op: 'ADD', a: '15', b: '1', cf: '0' },
    { label: 'AF: 16-1', width: '8', op: 'SUB', a: '16', b: '1', cf: '0' },
    { label: 'PF: 16-bit 0xFF+1', width: '16', op: 'ADD', a: '0xFF', b: '1', cf: '0' },
    { label: '64-bit exact sub', width: '64', op: 'SUB', a: '9007199254740995', b: '1', cf: '0' },
    { label: '64-bit wrap add', width: '64', op: 'ADD', a: '0xFFFFFFFFFFFFFFFF', b: '1', cf: '0' }
  ];

  var dirty = false;
  var lastResult = null;

  function widthNum() { return Number(elWidth.value); }
  function opName() { return elOp.value; }

  function updateFieldVisibility() {
    var op = opName();
    var needsB = ArithmeticModel.needsB(op);
    elBField.style.display = needsB ? '' : 'none';
    elB.disabled = !needsB;
    var needsCf = op === 'INC' || op === 'DEC';
    elCfField.style.display = needsCf ? '' : 'none';
    elCf.disabled = !needsCf;
  }

  function buildPresets() {
    elPresetRow.innerHTML = PRESETS.map(function (p, i) {
      return '<button type="button" class="btn" data-preset="' + i + '">' + p.label + '</button>';
    }).join('');
  }

  function formatBitStrip(bits, w) {
    var full = WidthOps.toBinary(bits, w);
    var groups = [];
    for (var i = 0; i < full.length; i += 4) {
      groups.push(full.slice(i, i + 4));
    }
    var out = [];
    for (var g = 0; g < groups.length; g++) {
      out.push(groups[g]);
      if ((g + 1) % 2 === 0 && g !== groups.length - 1) out.push(' ');
    }
    return out.join(' ').replace(/ {2,}/g, '  ');
  }

  function markDirty() {
    if (dirty) return;
    dirty = true;
    elOutHex.textContent = '—';
    elOutUnsigned.textContent = '—';
    elOutSigned.textContent = '—';
    elBitStrip.textContent = '(input changed — press Reveal result)';
    elFlagsGrid.innerHTML = '';
    elSecondaryFlagsGrid.innerHTML = '';
    elFlagsExplain.textContent = 'Input changed. The previous result is no longer shown — press Reveal result to recompute.';
    UiShell.announce(elStatus, 'Input changed. Press Reveal result to recompute.');
  }

  function flagTile(label, value, kind) {
    var cls = 'readout';
    var valCls = 'readout-value';
    if (kind === 'preserved') { valCls += ' flag-preserved'; }
    else if (value === 1n) { cls += ' flag-set'; valCls += ' flag-on'; }
    return '<div class="' + cls + '"><span class="readout-label">' + label + '</span><output class="' + valCls + '">' + value.toString() + '</output></div>';
  }

  function explainFor(r, w) {
    var parts = [];
    parts.push('CF: unsigned ' + (r.operation === 'SUB' || r.operation === 'NEG' ? 'borrow' : 'carry') + (r.cfPreserved ? ' (preserved from the incoming value, not recomputed by ' + r.operation + ')' : ' from this ' + r.operation + '.'));
    parts.push('OF: the signed result ' + (r.of === 1n ? 'fell outside' : 'stayed inside') + ' the ' + w + '-bit signed range.');
    parts.push('ZF: the stored result is ' + (r.zf === 1n ? 'zero.' : 'nonzero.'));
    parts.push('SF: the result’s high bit is ' + (r.sf === 1n ? 'set (negative as signed).' : 'clear (nonnegative as signed).'));
    return parts.join(' ');
  }

  function compute() {
    var w = widthNum();
    var op = opName();

    var aParsed = IntegerInput.parseBigInt(elA.value, 'A');
    if (aParsed.error) { fail(aParsed.error); return; }
    var aRangeError = WidthOps.validateOperand(aParsed.value, w, 'A');
    if (aRangeError) { fail(aRangeError); return; }
    var a = WidthOps.bits(aParsed.value, w);

    var b = 0n;
    if (ArithmeticModel.needsB(op)) {
      var bParsed = IntegerInput.parseBigInt(elB.value, 'B');
      if (bParsed.error) { fail(bParsed.error); return; }
      var bRangeError = WidthOps.validateOperand(bParsed.value, w, 'B');
      if (bRangeError) { fail(bRangeError); return; }
      b = WidthOps.bits(bParsed.value, w);
    }

    var incomingCf = (op === 'INC' || op === 'DEC') ? BigInt(elCf.value) : 0n;

    elError.textContent = '';
    var r = ArithmeticModel.evaluate(op, a, b, w, incomingCf);
    lastResult = r;
    dirty = false;

    elCode.textContent = ArithmeticModel.snippetFor(op, w) + '  ; width ' + w + '-bit, ' + WidthOps.registerName(w, 'A');
    elBitStrip.textContent = formatBitStrip(r.result, w);
    elOutHex.textContent = WidthOps.toHex(r.result, w);
    elOutUnsigned.textContent = r.result.toString();
    elOutSigned.textContent = WidthOps.signed(r.result, w).toString();

    elFlagsGrid.innerHTML =
      flagTile('CF', r.cf, r.cfPreserved ? 'preserved' : 'computed') +
      flagTile('OF', r.of) +
      flagTile('ZF', r.zf) +
      flagTile('SF', r.sf);
    elSecondaryFlagsGrid.innerHTML = flagTile('AF', r.af) + flagTile('PF', r.pf);

    elFlagsExplain.textContent = explainFor(r, w);
    UiShell.announce(elStatus, op + ' at width ' + w + ': result ' + WidthOps.toHex(r.result, w) + ', CF=' + r.cf + ', OF=' + r.of + ', ZF=' + r.zf + ', SF=' + r.sf + '.');
  }

  function fail(message) {
    elError.textContent = message;
    elOutHex.textContent = '—';
    elOutUnsigned.textContent = '—';
    elOutSigned.textContent = '—';
    elBitStrip.textContent = '(invalid input)';
    elFlagsGrid.innerHTML = '';
    elSecondaryFlagsGrid.innerHTML = '';
    elFlagsExplain.textContent = 'Correct the input above and press Reveal result again.';
    dirty = true;
    UiShell.announce(elStatus, 'Invalid input: ' + message);
  }

  function applyPreset(p) {
    elWidth.value = p.width;
    elOp.value = p.op;
    elA.value = p.a;
    elB.value = p.b;
    elCf.value = p.cf;
    updateFieldVisibility();
    compute();
  }

  function onReset() {
    applyPreset(DEFAULTS);
    UiShell.announce(elStatus, 'Reset to the default: 8-bit ADD, A=127, B=1, incoming CF=0.');
  }

  elWidth.addEventListener('change', function () { updateFieldVisibility(); markDirty(); });
  elOp.addEventListener('change', function () { updateFieldVisibility(); markDirty(); });
  elA.addEventListener('input', markDirty);
  elB.addEventListener('input', markDirty);
  elCf.addEventListener('change', markDirty);
  elReveal.addEventListener('click', compute);
  elReset.addEventListener('click', onReset);
  elA.addEventListener('keydown', function (evt) { if (evt.key === 'Enter') { evt.preventDefault(); compute(); } });
  elB.addEventListener('keydown', function (evt) { if (evt.key === 'Enter') { evt.preventDefault(); compute(); } });

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
