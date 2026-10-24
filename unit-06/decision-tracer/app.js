(function(){
 'use strict';const M=window.CSIS118B.DecisionModel,$=id=>document.getElementById(id);let progress=0,current=null;
 if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embed-mode');
 const descriptions={parity:'Is x even? TEST selects bit 0; the even and odd paths rejoin at show.',ladder:'Check A/a, then B/b, C/c, D/d and F/f. Stop at the first match.',and:'Inside means x ≥ 1 AND x ≤ 10. Stop on the first failed requirement.',or:'Outside means x < 1 OR x > 10. Stop on the first successful alternative.'};
 const defaults={parity:'-3',ladder:'c',and:'0',or:'0'};
 const presets={parity:['0','-3','-4','9223372036854775807','-9223372036854775808'],ladder:['A','a','c','F','?'],and:['-1','0','1','5','10','11','-9223372036854775808','9223372036854775807'],or:['-1','0','1','5','10','11','-9223372036854775808','9223372036854775807']};
 const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 function status(s,error){$('status').textContent=s;$('status').classList.toggle('error',!!error);}
 function render(){
  if(!current)return;
  const done=progress>=current.executed;let seen=0,last=null;
  $('trace').innerHTML='<table><caption>Comparisons in source order</caption><thead><tr><th scope="col">Question</th><th scope="col">NASM fragment</th><th scope="col">Execution and branch</th></tr></thead><tbody>'+current.rows.map(r=>{
   const visible=r.executed&&seen++<progress;
   if(visible)last=r;
   const state=visible?'EXECUTED':done?'SKIPPED':'PENDING';
   const detail=visible?'Question: '+r.truth+'. Jump '+(r.taken?'TAKEN':'NOT TAKEN')+'.':done?'Not evaluated; an earlier comparison decided the path.':'Make a prediction, then step or reveal.';
   return '<tr class="'+state.toLowerCase()+'"><th scope="row">'+esc(r.question)+'</th><td><code class="trace-code">'+esc(r.instruction)+'\n'+esc(r.jump)+'</code></td><td class="state">'+state+'<small>'+esc(detail)+'</small></td></tr>';
  }).join('')+'</tbody></table>';
  $('flags').textContent=last?'Flags from the last executed comparison: '+Object.entries(last.flags).map(([k,v])=>k.toUpperCase()+'='+(v===null?'undefined':v)).join(', ')+'. They belong to this comparison only.':'No comparison has executed yet.';
  $('result').hidden=!done;
  if(done){const correct=$('prediction').value===current.outcome;$('feedback').textContent=(correct?'Prediction correct. ':'Prediction differs. ')+current.executed+' comparison'+(current.executed===1?'':'s')+' executed; '+(current.rows.length-current.executed)+' skipped.';$('path').textContent='EXECUTED PATH: '+current.path;$('output').textContent=current.outcome;}
 }
 function reset(message){progress=0;$('result').hidden=true;$('prediction').value='';$('value').removeAttribute('aria-invalid');try{current=M.trace($('mode').value,$('value').value);render();status(message||'Trace reset. Predict a message before stepping.');}catch(e){current=null;$('trace').textContent='Correct the input to build a trace.';$('flags').textContent='No comparisons executed.';$('value').setAttribute('aria-invalid','true');status(e.message,true);}}
 function setup(){const mode=$('mode').value;$('value').value=defaults[mode];$('value-label').textContent=mode==='ladder'?'Character (one printable ASCII)':'Signed integer x';$('input-help').textContent=mode==='ladder'?'Enter one printable ASCII character, preserving case. Use ? to explore the default outcome.':'Enter a decimal integer from -9223372036854775808 through 9223372036854775807. This simulation validates its input; it does not simulate malformed-input behavior of read_int.';$('question').textContent=descriptions[mode];$('prediction').replaceChildren(new Option('Choose a prediction',''),...M.choices[mode].map(s=>new Option(s,s)));$('presets').replaceChildren(...presets[mode].map(v=>{const b=document.createElement('button');b.type='button';b.textContent=v;b.addEventListener('click',()=>{$('value').value=v;reset('Example ready. Predict the selected message.');});return b;}));reset();}
 function advance(all){if(!current){status('Correct the input before tracing.',true);return;}if(!$('prediction').value){status('Choose a predicted message first.',true);$('prediction').focus();return;}if(progress>=current.executed){status('Trace complete. Reset or edit an input for another prediction.');return;}progress=all?current.executed:progress+1;render();const last=current.rows.filter(r=>r.executed)[progress-1];status(progress===current.executed?'Trace complete. '+$('feedback').textContent+' Selected message: '+current.outcome:'Step '+progress+': '+last.question+' '+last.truth+'. Jump '+(last.taken?'taken':'not taken')+'. Continue to the next comparison.');}
 $('mode').addEventListener('change',setup);$('value').addEventListener('input',()=>reset('Input changed. Make a fresh prediction.'));$('prediction').addEventListener('change',()=>{progress=0;$('result').hidden=true;render();status('Prediction selected. Step or reveal the path.');});$('step').addEventListener('click',()=>advance(false));$('reveal').addEventListener('click',()=>advance(true));$('reset').addEventListener('click',()=>reset());setup();
})();
