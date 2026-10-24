/* Curated P115 decisions. No arbitrary code execution, DOM, I/O, or floating-point operands. */
(function(root,factory){
  const node=typeof module!=='undefined'&&module.exports;
  const api=factory(node?require('../../unit-05/shared/branch-model.js'):root.CSIS118B.BranchModel);
  if(node)module.exports=api;else root.CSIS118B.DecisionModel=api;
})(typeof window!=='undefined'?window:globalThis,function(B){
  'use strict';
  const choices={parity:['Even','Odd'],ladder:['Excellent work','Above average work','Average work','Below average work','Failing grade','Unrecognized grade'],and:['In range: both checks passed','Out of range: lower check failed; upper skipped','Out of range: upper check failed'],or:['Outside: lower check true; upper skipped','Outside: upper check true','Inside: both outside checks false']};
  function trace(mode,raw){
    if(!Object.prototype.hasOwnProperty.call(choices,mode))throw Error('Choose a supported decision.');
    const text=String(raw).trim();let value;
    if(mode==='ladder'){
      if(!/^[\x20-\x7E]$/.test(String(raw)))throw Error('Enter exactly one printable ASCII character; use ? for an unrecognized letter.');
      value=BigInt(String(raw).charCodeAt(0));
    }else{
      if(text.length>21||! /^-?\d+$/.test(text))throw Error('Enter a signed decimal integer, without fractions, expressions or exponent notation.');
      value=BigInt(text);
      if(value<-(1n<<63n)||value>(1n<<63n)-1n)throw Error('Use signed 64-bit range: -9223372036854775808 through 9223372036854775807.');
    }
    const rows=[];let outcome,path;
    function add(question,op,width,b,jump,destination,negate){
      const executed=outcome===undefined;
      const result=executed?B.evaluate(op,width,String(value),String(b),jump):null;
      const row={question,instruction:op.toLowerCase()+' '+(width===8?'al':'rax')+', '+(width===8?"'"+String.fromCharCode(Number(b))+"'":b),jump:jump.toLowerCase()+' '+destination,executed,truth:executed?(negate?!result.taken:result.taken):null,taken:executed?result.taken:null,flags:executed?result.flags:null};
      rows.push(row);return result&&result.taken;
    }
    if(mode==='parity'){
      const even=add('Is the integer even?','TEST',64,1n,'JE','even',false);
      outcome=even?'Even':'Odd';path=even?'even → show':'odd fall-through → jmp show';
    }else if(mode==='ladder'){
      ['A','B','C','D','F'].forEach((letter,i)=>{
        [letter,letter.toLowerCase()].forEach(c=>{
          if(add('Does the character equal '+c+'?','CMP',8,BigInt(c.charCodeAt(0)),'JE','grade_'+letter.toLowerCase(),false)){
            outcome=choices.ladder[i];path='grade_'+letter.toLowerCase()+' → jmp show';
          }
        });
      });
      if(outcome===undefined){outcome=choices.ladder[5];path='default → jmp show';}
    }else{
      const inside=mode==='and';
      if(add(inside?'Is x ≥ 1?':'Is x < 1?','CMP',64,1n,'JL',inside?'too_low':'outside_low',inside)){
        outcome=choices[mode][inside?1:0];path=(inside?'too_low':'outside_low')+' → jmp show';
      }
      if(add(inside?'Is x ≤ 10?':'Is x > 10?','CMP',64,10n,'JG',inside?'too_high':'outside_high',inside)){
        outcome=choices[mode][inside?2:1];path=(inside?'too_high':'outside_high')+' → show';
      }
      if(outcome===undefined){outcome=choices[mode][inside?0:2];path='inside fall-through → jmp show';}
    }
    return {mode,value,rows,outcome,path,executed:rows.filter(r=>r.executed).length};
  }
  return {trace,choices};
});
