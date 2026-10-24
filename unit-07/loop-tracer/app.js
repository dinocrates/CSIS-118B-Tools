(function(){
 'use strict';const $=id=>document.getElementById(id),M=window.CSIS118B.LoopModel;let model=null,index=-1,timer=null,running=false;
 if(new URLSearchParams(location.search).get('embed')==='1')document.body.classList.add('embed-mode');
 for(let i=0;i<=10;i++)$('prediction').add(new Option(String(i),String(i)));
 function say(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
 function stop(){if(timer!==null)clearTimeout(timer);timer=null;running=false;$('run').setAttribute('aria-pressed','false');}
 function render(){
  const f=model&&model.frames[index],sum=$('mode').value==='sum',done=!!f&&index===model.frames.length-1;
  $('phase').textContent=f?'EXECUTED: '+f.phase:'READY: initialization has not executed.';
  $('counter').textContent=!f?'Counter: not initialized':model.mode==='countdown'?'R12 remaining: '+f.counter:'R13 current: '+f.counter+'; R12 limit: '+model.n;
  $('total').textContent=sum?(f?'R14 accumulator: '+f.total:'Accumulator: not initialized'):'Accumulator: not used in this pattern';
  $('iterations').textContent='Body executions: '+(f?f.iterations:0);
  $('action').textContent=f?f.action:'No instructions executed.';$('next').textContent='Next: '+(f?f.next:'initialization');
  $('output').textContent=done?model.output:f&&f.output?f.output:'No output yet.';
  $('rows').replaceChildren();if(model)model.frames.slice(0,index+1).forEach((row,i)=>{const tr=document.createElement('tr');[String(i+1)+' / '+row.phase,String(row.counter),sum?String(row.total):'Not used',String(row.iterations),row.next].forEach(value=>{const td=document.createElement('td');td.textContent=value;tr.append(td);});$('rows').append(tr);});
  $('result').hidden=!done;
  if(done){const correct=BigInt($('prediction').value)===model.iterations&&(!sum||BigInt($('sum-prediction').value)===model.total);$('feedback').textContent=(correct?'Prediction correct. ':'Prediction differs. ')+model.iterations+' body executions'+(sum?'; final sum '+model.total:'')+'. '+(model.variant==='exclusive'?'The JGE what-if excludes N.':'The original lesson bound is preserved.');}
 }
 function reset(message){stop();index=-1;$('prediction').value='';$('sum-prediction').value='';$('count').removeAttribute('aria-invalid');$('sum-prediction').removeAttribute('aria-invalid');try{model=M.trace($('mode').value,$('count').value,$('bound').value);say(message||'Trace reset. Make a prediction.');}catch(e){model=null;$('count').setAttribute('aria-invalid','true');say(e.message,true);}render();}
 function ready(){if(!model){say('Correct the count before tracing.',true);$('count').focus();return false;}if(!$('prediction').value){say('Predict the number of body executions first.',true);$('prediction').focus();return false;}if(model.mode==='sum'&&(!/^\d{1,2}$/.test($('sum-prediction').value)||BigInt($('sum-prediction').value)>55n)){say('Predict a final sum from 0 through 55.',true);$('sum-prediction').setAttribute('aria-invalid','true');$('sum-prediction').focus();return false;}$('sum-prediction').removeAttribute('aria-invalid');return true;}
 function advance(){if(index>=model.frames.length-1){stop();say('Trace complete. Reset or change an input.');return;}index++;render();const f=model.frames[index];if(index===model.frames.length-1){stop();say('Trace complete. '+$('feedback').textContent);}else say('Step '+(index+1)+'. '+f.phase+'. '+f.action+'. Next: '+f.next+'.');}
 function tick(){if(!running)return;advance();if(running)timer=setTimeout(tick,800);}
 $('step').addEventListener('click',()=>{stop();if(ready())advance();});
 $('run').addEventListener('click',()=>{stop();if(!ready())return;running=true;$('run').setAttribute('aria-pressed','true');tick();});
 $('pause').addEventListener('click',()=>{stop();say('Paused at '+(index<0?'the initial state':'step '+(index+1))+'. Step or Run to continue.');});
 $('reveal').addEventListener('click',()=>{stop();if(!ready())return;index=model.frames.length-1;render();say('Final trace revealed. '+$('feedback').textContent);});
 $('reset').addEventListener('click',()=>reset());
 $('mode').addEventListener('change',()=>{const down=$('mode').value==='countdown';$('bound-wrap').hidden=down;$('sum-prediction-wrap').hidden=$('mode').value!=='sum';$('bound').value='inclusive';reset();});
 $('bound').addEventListener('change',()=>reset());$('count').addEventListener('input',()=>reset('Count changed. Make a fresh prediction.'));
 document.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{$('count').value=b.dataset.count;reset('Example ready. Make a prediction.');}));
 for(const id of ['prediction','sum-prediction'])$(id).addEventListener(id==='sum-prediction'?'input':'change',()=>{stop();index=-1;render();say('Prediction changed. Step, Run or Reveal.');});
 window.addEventListener('pagehide',stop);reset();
})();
