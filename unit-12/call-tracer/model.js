(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.CSIS118B=root.CSIS118B||{};root.CSIS118B.CallTracer=api;}})(typeof globalThis==='object'?globalThis:this,function(){'use strict';
 const BASE=4096n,SENTINEL=1234n;
 function program(bad=false){return [
  {label:'startup',op:'call',target:'main',text:'call main'},
  {op:'halt',text:'startup: terminate process (no return)'},
  {label:'main',op:'push',reg:'r12',text:'push r12'},
  {op:'input',text:'mov rdi, input ; fixed selected value'},
  {op:'call',target:'square',text:'call square'},
  {op:'save',text:'mov r12, rax ; keep result across calls'},
  {op:'call',target:'report',text:'call report'},
  {op:'pop',reg:'r12',text:'pop r12'},
  {op:'zero',text:'xor eax, eax ; return success'},
  {op:'ret',text:'ret ; back to startup'},
  {label:'square',op:'copy',text:'mov rax, rdi'},
  {op:'square',text:'imul rax, rdi'},
  {op:'ret',text:'ret ; leaf procedure'},
  {label:'report',op:bad?'skip':'sub',text:bad?'; BUG: missing sub rsp, 8':'sub rsp, 8'},
  {op:'argument',text:'mov rdi, r12'},
  {op:'call',target:'print_model',text:'call print_int ; modeled helper boundary'},
  {op:bad?'skip':'add',text:bad?'; BUG: missing matching add rsp, 8':'add rsp, 8'},
  {op:'ret',text:'ret ; non-leaf procedure'},
  {label:'print_model',op:'print',text:'[abstract helper body: print RDI; RAX becomes unspecified]'},
  {op:'ret',text:'ret ; modeled helper return'}
 ];}
 function create(input='-6',bad=false){if(!/^-?\d+$/.test(String(input)))throw Error('Use an integer from -10 through 10.');input=BigInt(input);if(input< -10n||input>10n)throw Error('Use an integer from -10 through 10.');if(typeof bad!=='boolean')throw Error('Invalid scenario.');return {input,bad,pc:0,rsp:BASE,regs:{rax:0n,rdi:0n,r12:SENTINEL},stack:[],output:[],history:[],status:'running',message:'Startup is ready to CALL main with RSP modulo 16 = 0.',steps:0};}
 const residue=s=>Number(s.rsp%16n);
 function step(old){const s={...old,regs:{...old.regs},stack:old.stack.map(x=>({...x})),output:[...old.output],history:[...old.history]};if(s.status!=='running')return s;const code=program(s.bad),i=code[s.pc];if(!i)throw Error('Invalid program counter');const before=s.rsp;s.steps++;if(s.steps>40)throw Error('Finite trace limit exceeded');let next=s.pc+1;
  function push(kind,value,description){s.rsp-=8n;s.stack.unshift({address:s.rsp,kind,value,description});}
  function pop(kind){const top=s.stack[0];if(!top||top.address!==s.rsp||top.kind!==kind)throw Error('Unbalanced stack: expected '+kind);s.stack.shift();s.rsp+=8n;return top;}
  switch(i.op){
   case 'call':if(residue(s)!==0){s.status='blocked';s.message='ABI CHECK: CALL would start with RSP modulo 16 = 8, not 0. Simulation stops before the call; real hardware does not automatically reject every misaligned CALL.';next=s.pc;break;}push('return',next,'Return to line '+(next+1));next=code.findIndex(x=>x.label===i.target);s.message='CALL pushes the following instruction address (8 bytes), then enters '+i.target+'. Callee entry modulo 16 = 8.';break;
   case 'ret':next=pop('return').value;s.message='RET pops the saved return address and resumes line '+(next+1)+'.';break;
   case 'push':push('saved',s.regs.r12,'Saved incoming R12 = '+s.regs.r12);s.message='Save incoming R12; pushing 8 bytes also aligns main for calls.';break;
   case 'pop':s.regs.r12=pop('saved').value;s.message='Restore incoming R12 and main’s entry stack pointer.';break;
   case 'sub':push('padding',null,'8 bytes of alignment padding, not a return address');s.message='Reserve 8 bytes so this non-leaf procedure can CALL with RSP modulo 16 = 0.';break;
   case 'add':pop('padding');s.message='Remove exactly report’s padding before RET.';break;
   case 'input':s.regs.rdi=s.input;s.message='RDI supplies the argument; it is caller-saved.';break;
   case 'copy':s.regs.rax=s.regs.rdi;s.message='Leaf square copies its argument to RAX.';break;
   case 'square':s.regs.rax*=s.regs.rdi;s.message='Leaf square computes the bounded signed result; no call or stack adjustment is needed.';break;
   case 'save':s.regs.r12=s.regs.rax;s.message='Keep the result in callee-saved R12 before further calls; main must restore its incoming value.';break;
   case 'argument':s.regs.rdi=s.regs.r12;s.message='Pass the saved result for printing.';break;
   case 'print':s.output.push(String(s.regs.rdi));s.regs.rax=null;s.message='Abstract print helper emits the value. RAX is unspecified after this call; R12 must survive. Internal helper instructions are omitted.';break;
   case 'zero':s.regs.rax=0n;s.message='Return success in RAX.';break;
   case 'skip':s.message='Counterexample omits alignment padding. Watch the next CALL check.';break;
   case 'halt':if(s.rsp!==BASE||s.stack.length||s.regs.r12!==SENTINEL)throw Error('Unbalanced completed trace');s.status='done';s.message='Balanced return to startup: original RSP and R12 restored. Startup terminates the process; exit is not a returning procedure.';next=s.pc;break;
  }
  s.history.push({line:s.pc+1,text:i.text,before,after:s.rsp,message:s.message});s.pc=next;return s;
 }
 function prediction(s){const n=step(s);return n.status==='blocked'?'blocked':n.status==='done'?'done':String(residue(n));}
 return {create,step,program,residue,prediction,BASE,SENTINEL};
});
