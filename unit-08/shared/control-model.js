/* Bounded teaching traces, not an interpreter. No I/O or arbitrary execution. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else(root.CSIS118B=root.CSIS118B||{}).ControlModel=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function integer(raw){const s=String(raw).trim();if(s.length>40||! /^-?\d+$/.test(s))throw Error('Use decimal integers only, without fractions or expressions.');const n=BigInt(s);if(n<-(1n<<63n)||n>(1n<<63n)-1n)throw Error('Each input must fit signed 64-bit range.');return n;}
 function trace(mode,raw,pattern){
  if(!['timing','digits'].includes(mode))throw Error('Choose a supported mode.');
  if(!(mode==='timing'?['pre','post']:['pre','post']).includes(pattern))throw Error('Choose a supported pattern.');
  let total=0n,count=0n,reads=0,candidate=null,remaining=null,quotient=null,remainder=null,reason='',output='';const frames=[];
  function record(phase,action,next){frames.push({phase,action,next,total,count,reads,candidate,remaining,quotient,remainder,output});if(frames.length>90)throw Error('Trace safety limit exceeded.');}
  if(mode==='digits'){
   remaining=integer(raw);if(remaining<0n||remaining>4294967295n)throw Error('Digit input must be 0 through 4294967295; negative values are not converted to absolute values.');
   const original=remaining;record('Initialization','Preserve remaining input; initialize sum to 0 and divisor to 10.','pre'===pattern?'check':'divide');
   while(true){
    if(pattern==='pre'){record('Condition','remaining = 0? JE finish '+(remaining===0n?'TAKEN':'NOT TAKEN')+'; continue while remaining is nonzero.',remaining===0n?'finish':'divide');if(remaining===0n)break;}
    const dividend=remaining;quotient=dividend/10n;remainder=dividend%10n;
    record('Division','Clear RDX, then unsigned DIV by 10: '+dividend+' = 10 × '+quotient+' + '+remainder+'.','accumulate');
    total+=remainder;count++;record('Accumulate','Add the remainder to the preserved sum.','update');
    remaining=quotient;record('Update','Replace remaining with the quotient.','check');
    if(pattern==='post'){record('Condition','remaining = 0? Until zero means JNE divide '+(remaining!==0n?'TAKEN':'NOT TAKEN')+'.',remaining!==0n?'divide':'finish');if(remaining===0n)break;}
   }
   reason='Digits complete';output='Enter a number (0..4294967295): The sum of the digits is '+total;record('Finish','Print the saved sum after selecting the label.','exit');
   return {mode,pattern,original,frames,total,count,reason,output,unused:0};
  }
  const parts=String(raw).trim().split(/[\s,]+/);if(!String(raw).trim()||parts.length>5)throw Error('Supply 1 through 5 decimal inputs, separated by spaces or commas.');const values=parts.map(integer),pre=pattern==='pre';
  record('Initialization',pre?'Set sum and processed count to zero.':'Set accepted-attempt count to zero.',pre?'read_next':'body');
  let prompts='';
  while(true){
   if(reads===values.length){reason='Needs more input';record('Waiting','Input list exhausted. The actual program would wait for another input; this is not normal termination.',pre?'read_next':'body');break;}
   candidate=values[reads++];prompts+=pre?'Number (-99..99, 0 stops): ':'Guess (1..10): ';record('Read',pre?'Prime or refresh the candidate before the processing condition.':'Enter the attempt body and read a candidate before testing success.','validate');
   const valid=pre?candidate>=-99n&&candidate<=99n:candidate>=1n&&candidate<=10n;
   record('Validation',valid?'Input is within the lesson domain.':'Input is out of range; it is not accepted or counted.',valid?(pre?'condition':'accept'):'invalid');
   if(!valid){reason='Invalid input';output=prompts+(pre?'Out of range. No sum reported.':'Invalid guess.\nAttempts: '+count);break;}
   if(pre){
    record('Condition','candidate = 0? JE sentinel '+(candidate===0n?'TAKEN':'NOT TAKEN')+'. While nonzero means exit on zero.',candidate===0n?'sentinel':'process');
    if(candidate===0n){reason='Zero sentinel';output=prompts+'Zero sentinel.\nSum: '+total;break;}
    total+=candidate;count++;record('Process','Add the nonzero value and increment the processed count.','limit check');
    record('Limit','processed = 5? JE limit '+(count===5n?'TAKEN':'NOT TAKEN')+'.',count===5n?'limit':'read_next');
    if(count===5n){reason='Five-value limit';output=prompts+'Five values processed.\nSum: '+total;break;}
   }else{
    count++;record('Accept','Preserve the valid guess and count this accepted attempt.','bottom test');
    record('Condition','guess = 7? JE success '+(candidate===7n?'TAKEN':'NOT TAKEN')+'. Test success after acceptance, before the cap.',candidate===7n?'success':'limit check');
    if(candidate===7n){reason='Correct guess';output=prompts+'Correct.\nAttempts: '+count;break;}
    record('Limit','attempts >= 3? JAE limit '+(count>=3n?'TAKEN':'NOT TAKEN')+'.',count>=3n?'limit':'repeat test');
    if(count>=3n){reason='Three-attempt limit';output=prompts+'Three-attempt limit.\nAttempts: '+count;break;}
    record('Repeat condition','Compare guess with 7 again. Until equal means JNE body TAKEN while unequal.','body');
   }
  }
  if(reason!=='Needs more input')record('Finish','Print the stop reason and the saved result, where applicable.','exit');
  return {mode,pattern,frames,total,count,reason,output,unused:values.length-reads};
 }
 return {trace};
});
