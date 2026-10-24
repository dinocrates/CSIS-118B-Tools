(function () {
  'use strict';
  const W = window.CSIS118B.WidthOps, M = window.CSIS118B.BranchModel;
  const $ = id => document.getElementById(id);
  if (new URLSearchParams(location.search).get('embed') === '1') document.body.classList.add('embed-mode');
  function state() { return M.evaluate($('operation').value, Number($('width').value), $('operand-a').value, $('operand-b').value, $('jump').value); }
  function status(text, error) { $('status').textContent = text; $('status').classList.toggle('error', !!error); }
  function describe(s) {
    const regA = W.registerName(s.width,'A').toLowerCase(), regB = W.registerName(s.width,'B').toLowerCase();
    $('operands').innerHTML = '<table><caption>Operands before and after the instruction</caption><thead><tr><th scope="col">Operand</th><th scope="col">Hex bits</th><th scope="col">Unsigned</th><th scope="col">Signed</th><th scope="col">After</th></tr></thead><tbody>' + [['A',s.a],['B',s.b]].map(([label,bits]) => '<tr><th scope="row">'+label+'</th><td>'+W.toHex(bits,s.width)+'</td><td>'+bits+'</td><td>'+W.signed(bits,s.width)+'</td><td>Unchanged</td></tr>').join('') + '</tbody></table>';
    // All interpolated strings are validated enums or generated register names, never raw input.
    $('snippet').innerHTML = '<span class="instruction">'+s.op.toLowerCase()+'</span> <span class="register">'+regA+', '+regB+'</span>\n<span class="instruction">'+s.jump.toLowerCase()+'</span> <span class="label">.taken</span>\n<span class="label">.fall_through:</span>\n    <span class="comment">; fall-through work</span>\n    <span class="instruction">jmp</span> <span class="label">.done</span>\n<span class="label">.taken:</span>\n    <span class="comment">; taken-path work</span>\n<span class="label">.done:</span>';
    $('condition').textContent = s.jump+' reads: '+s.condition+'. '+(s.op === 'TEST' ? 'These are flags from A AND B, not from A minus B.' : 'These are flags from A minus B.');
  }
  function prepare(message) {
    $('answer').hidden = true;
    const range = W.unionRange(Number($('width').value));
    $('range').textContent = 'Accepted range at this width: '+range.min+' through '+range.max+'. Negative values are interpreted as two’s-complement bit patterns.';
    try { describe(state()); status(message || 'Inputs changed. Make a fresh prediction and reveal.'); }
    catch(e) { $('operands').textContent = 'Operand interpretation unavailable until inputs are valid.'; $('snippet').textContent = ''; $('condition').textContent = 'Correct the input before predicting.'; status(e.message,true); }
  }
  ['width','operation','operand-a','operand-b','jump'].forEach(id => $(id).addEventListener('input', () => { $('prediction').value = ''; prepare(); }));
  $('prediction').addEventListener('change', () => { $('answer').hidden = true; status('Prediction selected. Reveal to check it.'); });
  $('controls').addEventListener('submit', event => {
    event.preventDefault();
    try {
      const s = state();
      if (!$('prediction').value) { status('Choose taken or not taken before revealing.',true); $('prediction').focus(); return; }
      describe(s);
      $('temporary').textContent = 'Temporary '+(s.op === 'CMP' ? 'A − B (wrapped to '+s.width+' bits)' : 'A AND B')+': '+W.toHex(s.result,s.width)+'; unsigned '+s.result+', signed '+W.signed(s.result,s.width)+'. Discarded; A and B stay unchanged.';
      const notes = {cf:s.op === 'TEST'?'Cleared by TEST':'Unsigned borrow',of:s.op === 'TEST'?'Cleared by TEST':'Signed overflow',zf:'Temporary result is zero',sf:'Temporary high bit',pf:'Even parity in low byte',af:s.op === 'TEST'?'Undefined by TEST':'Borrow from bit 4'};
      $('flags').innerHTML = Object.entries(s.flags).map(([name,value]) => '<div class="flag"><strong>'+name.toUpperCase()+': '+(value === null?'undefined':value)+'</strong>'+notes[name]+'</div>').join('');
      const correct = ($('prediction').value === 'taken') === s.taken;
      $('decision').textContent = (correct?'Prediction correct. ':'Prediction differs. ')+s.jump+' is '+(s.taken?'TAKEN':'NOT TAKEN')+' because '+s.condition+' is '+s.taken+'.';
      [['fall-path',!s.taken,'.fall_through → jmp .done'],['taken-path',s.taken,'.taken → .done']].forEach(([id,active,text]) => { $(id).classList.toggle('active',active); $(id).textContent = (active?'EXECUTED: ':'SKIPPED: ')+text; });
      $('answer').hidden = false;
      status($('decision').textContent+' Results are in section 3.');
    } catch(e) { $('answer').hidden = true; status(e.message,true); }
  });
  const presets = {signed:[8,'CMP','255','1','JL'],equal:[8,'CMP','42','42','JE'],overflow:[8,'CMP','-128','1','JL'],mask:[8,'TEST','10','5','JE'],zero:[8,'TEST','0','0','JE'],wide:[64,'CMP','18446744073709551615','9223372036854775807','JB']};
  function load(values) { ['width','operation','operand-a','operand-b','jump'].forEach((id,i) => {$(id).value = String(values[i]);}); $('prediction').value = ''; prepare('Example ready. Make a prediction, then reveal.'); }
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => load(presets[button.dataset.preset])));
  $('reset').addEventListener('click', () => load(presets.signed));
  prepare('Choose a prediction, then reveal the decision.');
})();
