/* Fixed bounded lesson loops; exact integers, no arbitrary execution or I/O. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else (root.CSIS118B=root.CSIS118B||{}).LoopModel=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function trace(mode,raw,variant='inclusive'){
  if(!['countdown','countup','sum'].includes(mode))throw Error('Choose a supported loop.');
  if(!['inclusive','exclusive'].includes(variant)||mode==='countdown'&&variant!=='inclusive')throw Error('Choose a supported bound.');
  const text=String(raw).trim();
  if(text.length>80||!/^\d+$/.test(text))throw Error('Enter a whole-number count from 0 through 10.');
  const n=BigInt(text);if(n>10n)throw Error('Count must be 0 through 10.');
  let counter=mode==='countdown'?n:1n,total=0n,iterations=0n;const frames=[],lines=[];
  function record(phase,action,next){frames.push({phase,action,next,counter,total,iterations,output:lines.join('\n')});if(frames.length>60)throw Error('Trace safety limit exceeded.');}
  record('Initialization',mode==='countdown'?'mov r12, N':mode==='sum'?'mov r12, N; mov r13, 1; xor r14, r14':'mov r12, N; mov r13, 1',mode==='countdown'?'zero guard':'check');
  if(mode==='countdown'){
   record('Condition','cmp r12, 0; je finished: '+(counter===0n?'TAKEN':'NOT TAKEN'),counter===0n?'finished':'repeat_body');
   while(counter>0n){
    lines.push('Hello!');iterations++;record('Body','print_line: Hello!; R12 survives the helper','update');
    counter--;record('Update','dec r12: remaining becomes '+counter+'; ZF='+(counter===0n?1:0),'jnz');
    record('Condition','jnz repeat_body: '+(counter!==0n?'TAKEN':'NOT TAKEN'),counter!==0n?'repeat_body':'finished');
   }
  }else{
   while(true){
    const stop=variant==='inclusive'?counter>n:counter>=n;
    record('Condition','cmp r13, r12; '+(variant==='inclusive'?'jg':'jge')+' finished: '+(stop?'TAKEN':'NOT TAKEN'),stop?'finished':'body');
    if(stop)break;
    iterations++;if(mode==='sum')total+=counter;else lines.push(String(counter));
    record('Body',mode==='sum'?'add r14, r13: add '+counter:'print_int: '+counter+'; R12/R13 survive helpers','update');
    counter++;record('Update','inc r13: current becomes '+counter,'back edge');
    record('Back edge','jmp check: return to a fresh comparison','check');
   }
  }
  if(mode==='sum')lines.push('Sum: '+total);lines.push('Done.');record('Finish','finished: print final result / Done.; exit','exit');
  return {mode,n,variant,frames,iterations,total,output:'Count (0..10): '+lines.join('\n')};
 }
 return {trace};
});
