(function () {
  'use strict';

  var WidthOps = window.CSIS118B.WidthOps;
  var IntegerInput = window.CSIS118B.IntegerInput;
  var MultiplicationModel = window.CSIS118B.MultiplicationModel;
  var UiShell = window.CSIS118B.UiShell;
  UiShell.initShell();

  var elWidth = document.getElementById('width-select');
  var elForm = document.getElementById('form-select');
  var elModeField = document.getElementById('mode-field');
  var elMode = document.getElementById('mode-select');
  var elAField = document.getElementById('a-field');
  var elALabel = document.getElementById('a-label');
  var elA = document.getElementById('a-input');
  var elBField = document.getElementById('b-field');
  var elBLabel = document.getElementById('b-label');
  var elB = document.getElementById('b-input');
  var elImmField = document.getElementById('imm-field');
  var elImm = document.getElementById('imm-input');
  var elReveal = document.getElementById('reveal-btn');
  var elReset = document.getElementById('reset-btn');
  var elError = document.getElementById('input-error');
  var elCode = document.getElementById('code-block');
  var elResultGrid = document.getElementById('result-grid');
  var elResultExplain = document.getElementById('result-explain');
  var elFlagsGrid = document.getElementById('flags-grid');
  var elStatus = document.getElementById('status-line');

  var DEFAULTS = { width: '8', form: 'one', mode: 'unsigned', a: '48', b: '4', imm: '10' };

  function w() { return Number(elWidth.value); }
  function form() { return elForm.value; }
  function signed() { return elMode.value === 'signed'; }

  function updateFieldVisibility() {
    var f = form();
    if (f === 'one') {
      elModeField.style.display = '';
      elMode.disabled = false;
      elAField.style.display = '';
      elALabel.textContent = 'A (accumulator value)';
      elBField.style.display = '';
      elBLabel.textContent = 'B (explicit source)';
      elImmField.style.display = 'none';
    } else if (f === 'two') {
      elModeField.style.display = '';
      elMode.value = 'signed';
      elMode.disabled = true;
      elAField.style.display = '';
      elALabel.textContent = 'Destination (original value)';
      elBField.style.display = '';
      elBLabel.textContent = 'Source (original value)';
      elImmField.style.display = 'none';
    } else {
      elModeField.style.display = '';
      elMode.value = 'signed';
      elMode.disabled = true;
      elAField.style.display = 'none';
      elBField.style.display = '';
      elBLabel.textContent = 'Source (original value)';
      elImmField.style.display = '';
    }
  }

  function flagTile(label, value) {
    if (value === undefined) {
      return '<div class="readout flag-undefined"><span class="readout-label">' + label + '</span><output class="readout-value">Undefined</output></div>';
    }
    var cls = value === 1n ? 'readout flag-set' : 'readout';
    var valCls = value === 1n ? 'readout-value flag-on' : 'readout-value';
    return '<div class="' + cls + '"><span class="readout-label">' + label + '</span><output class="' + valCls + '">' + value.toString() + '</output></div>';
  }

  function readoutTile(label, value) {
    return '<div class="readout"><span class="readout-label">' + label + '</span><output class="readout-value">' + value + '</output></div>';
  }

  function clearOutputs(message) {
    elCode.textContent = '';
    elResultGrid.innerHTML = '';
    elFlagsGrid.innerHTML = '';
    elResultExplain.textContent = message || '';
  }

  function fail(message) {
    elError.textContent = message;
    clearOutputs('Correct the input above and press Reveal product again.');
    UiShell.announce(elStatus, 'Invalid input: ' + message);
  }

  function parseOperand(raw, label, width) {
    var parsed = IntegerInput.parseBigInt(raw, label);
    if (parsed.error) return { error: parsed.error };
    var rangeError = WidthOps.validateOperand(parsed.value, width, label);
    if (rangeError) return { error: rangeError };
    return { value: WidthOps.bits(parsed.value, width) };
  }

  function compute() {
    var width = w();
    var f = form();

    if (f !== 'one' && !MultiplicationModel.twoOperandAllowed(width)) {
      fail('Two-operand and three-operand IMUL are not offered at 8-bit width in this teaching model — there is no destination-width two-operand byte IMUL form. Choose 16, 32, or 64 bits, or switch to the one-operand form.');
      return;
    }

    var isSigned = f === 'one' ? signed() : true;

    if (f === 'one') {
      var aP = parseOperand(elA.value, 'A', width);
      if (aP.error) { fail(aP.error); return; }
      var bP = parseOperand(elB.value, 'B', width);
      if (bP.error) { fail(bP.error); return; }
      elError.textContent = '';

      var contract = MultiplicationModel.registerContract(width);
      var srcReg = WidthOps.registerName(width, 'C').toLowerCase();
      var r = isSigned ? MultiplicationModel.imulOneOperand(aP.value, bP.value, width) : MultiplicationModel.mulOneOperand(aP.value, bP.value, width);

      elCode.textContent = (isSigned ? 'imul ' : 'mul ') + srcReg + '  ; implicit ' + contract.accumulator + ' * ' + srcReg + ' -> ' + contract.fullProduct;

      var tiles = [];
      if (isSigned) {
        tiles.push(readoutTile('Exact signed product', r.fullSignedProduct.toString()));
      } else {
        tiles.push(readoutTile('Full unsigned product', r.fullProduct.toString()));
      }
      tiles.push(readoutTile(contract.highHalf + ' (high half)', WidthOps.toHex(r.high, width) + ' = ' + r.high.toString()));
      tiles.push(readoutTile(contract.lowHalf + ' (low half)', WidthOps.toHex(r.low, width) + ' = ' + r.low.toString()));
      tiles.push(readoutTile(contract.fullProduct + ' (full, same bits)', WidthOps.toHex(r.high, width) + ' : ' + WidthOps.toHex(r.low, width)));
      if (isSigned) {
        var lowSigned = WidthOps.signed(r.low, width);
        tiles.push(readoutTile(contract.lowHalf + ' read as signed', lowSigned.toString() + (lowSigned !== r.fullSignedProduct ? ' ≠ full product' : ' = full product')));
      }
      elResultGrid.innerHTML = tiles.join('');
      elFlagsGrid.innerHTML = flagTile('CF', r.cf) + flagTile('OF', r.of) + flagTile('SF', r.sf) + flagTile('ZF', r.zf) + flagTile('AF', r.af) + flagTile('PF', r.pf);
      elResultExplain.textContent = (r.cf === 1n)
        ? 'CF/OF = 1: the high half is nonzero (unsigned) or the low half alone cannot represent the exact signed product (signed). This does NOT mean the full ' + contract.fullProduct + ' product above is wrong.'
        : 'CF/OF = 0: the high half is entirely the expected extension of the low half — the result fits in ' + contract.lowHalf + ' alone.';

      UiShell.announce(elStatus, (isSigned ? 'IMUL' : 'MUL') + ' ' + srcReg + ': ' + contract.fullProduct + ' = ' + WidthOps.toHex(r.high, width) + ':' + WidthOps.toHex(r.low, width) + ', CF/OF=' + r.cf + '.');
    } else if (f === 'two') {
      var dstP = parseOperand(elA.value, 'Destination', width);
      if (dstP.error) { fail(dstP.error); return; }
      var srcP = parseOperand(elB.value, 'Source', width);
      if (srcP.error) { fail(srcP.error); return; }
      elError.textContent = '';

      var dstReg = WidthOps.registerName(width, 'A').toLowerCase();
      var srcReg2 = WidthOps.registerName(width, 'C').toLowerCase();
      var r2 = MultiplicationModel.imulTwoOperand(dstP.value, srcP.value, width);

      elCode.textContent = 'imul ' + dstReg + ', ' + srcReg2;
      elResultGrid.innerHTML =
        readoutTile('Exact signed product', r2.fullSignedProduct.toString()) +
        readoutTile(dstReg.toUpperCase() + ' (destination, truncated)', WidthOps.toHex(r2.destBits, width) + ' = ' + WidthOps.signed(r2.destBits, width).toString()) +
        readoutTile('Full-product reference bits (not an output register)', WidthOps.toHex(r2.referenceHigh, width) + ' : ' + WidthOps.toHex(r2.referenceLow, width));
      elFlagsGrid.innerHTML = flagTile('CF', r2.cf) + flagTile('OF', r2.of) + flagTile('SF', r2.sf) + flagTile('ZF', r2.zf) + flagTile('AF', r2.af) + flagTile('PF', r2.pf);
      elResultExplain.textContent = 'Two-operand IMUL writes only ' + dstReg.toUpperCase() + ' — it never writes an EDX/RDX-style high half. CF/OF=1 means the truncated destination cannot hold the exact signed product shown above.';
      UiShell.announce(elStatus, 'IMUL ' + dstReg + ', ' + srcReg2 + ': destination = ' + WidthOps.toHex(r2.destBits, width) + ', CF/OF=' + r2.cf + '.');
    } else {
      var srcP3 = parseOperand(elB.value, 'Source', width);
      if (srcP3.error) { fail(srcP3.error); return; }
      var immParsed = IntegerInput.parseBigInt(elImm.value, 'Immediate');
      if (immParsed.error) { fail(immParsed.error); return; }
      elError.textContent = '';

      var dstReg3 = WidthOps.registerName(width, 'A').toLowerCase();
      var srcReg3 = WidthOps.registerName(width, 'C').toLowerCase();
      var r3 = MultiplicationModel.imulThreeOperand(srcP3.value, immParsed.value, width);

      elCode.textContent = 'imul ' + dstReg3 + ', ' + srcReg3 + ', ' + immParsed.value.toString();
      elResultGrid.innerHTML =
        readoutTile('Exact signed product', r3.fullSignedProduct.toString()) +
        readoutTile(dstReg3.toUpperCase() + ' (destination, truncated)', WidthOps.toHex(r3.destBits, width) + ' = ' + WidthOps.signed(r3.destBits, width).toString());
      elFlagsGrid.innerHTML = flagTile('CF', r3.cf) + flagTile('OF', r3.of) + flagTile('SF', r3.sf) + flagTile('ZF', r3.zf) + flagTile('AF', r3.af) + flagTile('PF', r3.pf);
      elResultExplain.textContent = 'Three-operand IMUL is a reference form here: ' + srcReg3.toUpperCase() + ' is read, multiplied by the immediate, and only the destination-width (truncated) result is kept in ' + dstReg3.toUpperCase() + '.';
      UiShell.announce(elStatus, 'IMUL ' + dstReg3 + ', ' + srcReg3 + ', ' + immParsed.value.toString() + ': destination = ' + WidthOps.toHex(r3.destBits, width) + '.');
    }
  }

  function applyDefaults(d) {
    elWidth.value = d.width;
    elForm.value = d.form;
    elMode.value = d.mode;
    elA.value = d.a;
    elB.value = d.b;
    elImm.value = d.imm;
    updateFieldVisibility();
    compute();
  }

  function onReset() {
    applyDefaults(DEFAULTS);
    UiShell.announce(elStatus, 'Reset to the default: unsigned byte MUL, full-product form, A=48, B=4.');
  }

  elWidth.addEventListener('change', function () { updateFieldVisibility(); compute(); });
  elForm.addEventListener('change', function () { updateFieldVisibility(); compute(); });
  elMode.addEventListener('change', compute);
  elA.addEventListener('input', clearPending);
  elB.addEventListener('input', clearPending);
  elImm.addEventListener('input', clearPending);
  elReveal.addEventListener('click', compute);
  elReset.addEventListener('click', onReset);

  function clearPending() {
    clearOutputs('Input changed — press Reveal product to recompute.');
    UiShell.announce(elStatus, 'Input changed. Press Reveal product to recompute.');
  }

  updateFieldVisibility();
  compute();
})();
