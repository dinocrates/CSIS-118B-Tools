'use strict';
// Pure local tests; reviewed dependency chain has no network/process/filesystem side effects.
const M=require('../../unit-06/shared/decision-model.js');let pass=0;
function check(value,name){if(!value)throw Error(name);pass++;}
function structure(t){check(t.rows.filter(r=>r.executed).length===t.executed,'count');let skipped=false;for(const r of t.rows){if(!r.executed){skipped=true;check(r.flags===null&&r.truth===null&&r.taken===null,'skipped means unevaluated');}else check(!skipped&&r.flags!==null,'execution is a prefix');}}
const nums=[...Array.from({length:81},(_,i)=>BigInt(i-40)),-(1n<<63n),(1n<<63n)-1n,9007199254740993n,-9007199254740993n];
for(const x of nums){
 const parity=M.trace('parity',String(x));structure(parity);check(parity.outcome===(x%2n===0n?'Even':'Odd'),'signed parity');check(parity.executed===1,'one two-way test');check(parity.rows[0].flags.cf===0&&parity.rows[0].flags.of===0&&parity.rows[0].flags.af===null,'TEST flags');
 for(const mode of ['and','or']){
  const t=M.trace(mode,String(x));structure(t);const low=x<1n,high=x>10n,inside=!low&&!high;
  check(t.executed===(low?1:2),'short circuit lower');
  const expected=mode==='and'?(low?M.choices.and[1]:high?M.choices.and[2]:M.choices.and[0]):(low?M.choices.or[0]:high?M.choices.or[1]:M.choices.or[2]);
  check(t.outcome===expected,'selected range message');check(t.rows[0].truth===(mode==='and'?!low:low),'first proposition');check(t.rows[0].taken===low,'first failure/success jump');
  if(!low){check(t.rows[1].truth===(mode==='and'?!high:high),'second proposition');check(t.rows[1].taken===high,'second jump');}
  check((t.outcome===M.choices[mode][mode==='and'?0:2])===inside,'inclusive endpoints');
 }
}
const bank='AaBbCcDdFf';
for(let code=32;code<=126;code++){
 const c=String.fromCharCode(code),t=M.trace('ladder',c),index=bank.indexOf(c);structure(t);
 check(t.outcome===M.choices.ladder[index<0?5:Math.floor(index/2)],'ladder output '+c);
 check(t.executed===(index<0?10:index+1),'first match '+c);
 for(let i=0;i<t.executed;i++)check(t.rows[i].taken===(bank[i]===c),'ladder compare '+c);
}
for(const mode of ['parity','and','or'])for(const value of ['', '1.5','1e3','0x10','+1','1+1','9223372036854775808','-9223372036854775809','9'.repeat(80)]){let threw=false;try{M.trace(mode,value);}catch{threw=true;}check(threw,'invalid numeric');}
for(const value of ['','aa','é','😀','\n']){let threw=false;try{M.trace('ladder',value);}catch{threw=true;}check(threw,'invalid character');}
let threw=false;try{M.trace('unknown','1');}catch{threw=true;}check(threw,'invalid mode');
console.log(pass+' assertions passed: 85 signed values across all numeric structures, all 95 printable ASCII characters, 33 invalid mode/input cases.');
