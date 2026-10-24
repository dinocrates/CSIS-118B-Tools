'use strict';
const M=require('../../unit-07/shared/loop-model.js');let assertions=0,traces=0;
function check(ok,label){if(!ok)throw Error(label);assertions++;}
for(const mode of ['countdown','countup','sum'])for(const variant of mode==='countdown'?['inclusive']:['inclusive','exclusive'])for(let n=0;n<=10;n++){
 const t=M.trace(mode,String(n),variant),expected=BigInt(variant==='inclusive'?n:Math.max(0,n-1));traces++;
 check(t.iterations===expected,'body count');check(t.frames.length<=44,'finite trace');check(t.frames[0].phase==='Initialization','initialize first');check(t.frames.at(-1).phase==='Finish','finish last');
 let bodies=0n,updates=0n;for(let i=0;i<t.frames.length;i++){
  const f=t.frames[i],prior=t.frames[i-1];if(f.phase==='Body')bodies++;if(f.phase==='Update')updates++;
  check(f.iterations===bodies,'body counter invariant');check(f.counter===(mode==='countdown'?BigInt(n)-updates:1n+updates),'counter invariant');check(f.counter>=0n&&f.counter<=11n,'safe counter');
  check(f.total===(mode==='sum'?bodies*(bodies+1n)/2n:0n),'accumulator invariant');
  if(f.phase==='Body')check(prior.phase==='Condition'&&prior.next!=='finished','body follows admitting condition');
  if(f.phase==='Update')check(prior.phase==='Body','one update after body');
  if(mode!=='countdown'&&f.phase==='Condition')check(f.total===(mode==='sum'?updates*(updates+1n)/2n:0n),'condition-check sum');
 }
 check(bodies===updates,'each body advances');check(t.total===(mode==='sum'?expected*(expected+1n)/2n:0n),'final sum');
 const body=mode==='countdown'?'Hello!\n'.repeat(Number(expected)):mode==='countup'?Array.from({length:Number(expected)},(_,i)=>(i+1)+'\n').join(''):'Sum: '+expected*(expected+1n)/2n+'\n';
 check(t.output==='Count (0..10): '+body+'Done.','exact expected output');
}
for(const mode of ['countdown','countup','sum'])for(const bad of ['', '-1','11','1.5','1e1','0xA','+1','NaN','Infinity','9223372036854775807','-9223372036854775808','9'.repeat(81)]){let error=false;try{M.trace(mode,bad);}catch{error=true;}check(error,'reject invalid count');}
for(const args of [['unknown','1'],['countdown','1','exclusive'],['sum','1','unknown']]){let error=false;try{M.trace(...args);}catch{error=true;}check(error,'reject mode/variant');}
check(M.trace('sum','00010').total===55n,'decimal leading zeros');
console.log(assertions+' assertions passed across '+traces+' complete traces and 39 invalid mode/count cases.');
