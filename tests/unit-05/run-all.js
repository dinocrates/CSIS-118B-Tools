'use strict';
// Local dependency-free tests. No network, subprocesses, or filesystem writes.
const M = require('../../unit-05/shared/branch-model.js');
let pass = 0;
function check(condition, name) { if (!condition) throw new Error(name); pass++; }
function parity(n) { return n.toString(2).split('1').length % 2 === 1 ? 1 : 0; }
function signed8(n) { return n > 127 ? n - 256 : n; }
for (let a=0;a<256;a++) for (let b=0;b<256;b++) {
  const sub = M.evaluate('CMP',8,String(a),String(b),'JL');
  const r = (a-b+256)%256;
  const f = sub.flags;
  check(sub.result === BigInt(r) && sub.afterA === BigInt(a) && sub.afterB === BigInt(b),'CMP result/operand preservation');
  check(f.cf === Number(a<b) && f.zf === Number(r===0) && f.sf === Number(r>=128) && f.pf === parity(r) && f.af === Number((a%16)<(b%16)), 'CMP flags');
  // Independent bitwise overflow oracle, unlike model's signed-range arithmetic.
  check(f.of === (((a^b)&(a^r)&128)?1:0),'CMP OF');
  check(sub.taken === (signed8(a)<signed8(b)),'JL matches signed comparison');
  const truths = {JE:a===b,JNE:a!==b,JGE:signed8(a)>=signed8(b),JLE:signed8(a)<=signed8(b),JG:signed8(a)>signed8(b),JB:a<b,JAE:a>=b,JBE:a<=b,JA:a>b,JS:r>=128,JNS:r<128,JO:f.of===1,JNO:f.of===0,JP:parity(r)===1,JNP:parity(r)===0};
  for(const [j,expected] of Object.entries(truths)) check(M.conditions[j][1](f) === expected,j+' predicate');
  const test = M.evaluate('TEST',8,String(a),String(b),'JE'), and = a&b, t=test.flags;
  check(test.result === BigInt(and) && test.afterA === BigInt(a) && test.afterB === BigInt(b),'TEST result/preservation');
  check(t.cf===0 && t.of===0 && t.af===null && t.zf===Number(and===0) && t.sf===Number(and>=128) && t.pf===parity(and),'TEST flags');
  check(test.taken === (and===0),'TEST JE means disjoint bits');
}
for(const w of [16,32,64]) {
  const mod=1n<<BigInt(w), sign=mod/2n, mask=mod-1n;
  const values=[0n,1n,15n,16n,255n,256n,sign-1n,sign,sign+1n,mask];
  const signed=n=>n>=sign?n-mod:n;
  for(const a of values) for(const b of values) for(const op of ['CMP','TEST']) {
    const s=M.evaluate(op,w,String(a),String(b),'JL'), r=op==='CMP'?(a-b+mod)%mod:a&b, f=s.flags;
    check(s.result===r && s.afterA===a && s.afterB===b,'wide exact result');
    check(f.zf===Number(r===0n) && f.sf===Number((r&sign)!==0n) && f.pf===parity(Number(r&255n)),'wide result flags');
    check(f.cf===(op==='CMP'?Number(a<b):0) && f.of===(op==='CMP'?Number(((a^b)&(a^r)&sign)!==0n):0) && f.af===(op==='CMP'?Number((a&15n)<(b&15n)):null),'wide arithmetic flags');
    if(op==='CMP') {
      for(const [j,v] of Object.entries({JE:a===b,JNE:a!==b,JL:signed(a)<signed(b),JGE:signed(a)>=signed(b),JLE:signed(a)<=signed(b),JG:signed(a)>signed(b),JB:a<b,JAE:a>=b,JBE:a<=b,JA:a>b})) check(M.evaluate(op,w,String(a),String(b),j).taken===v,'wide '+j);
    }
  }
  check(M.evaluate('CMP',w,String(-sign),'1','JL').taken,'negative minimum accepted');
  check(M.evaluate('CMP',w,'-1',String(mask),'JE').taken,'signed/unsigned spellings share bits');
}
const invalid=[['CMP',8,'','1','JE'],['CMP',8,'256','1','JE'],['CMP',8,'-129','1','JE'],['TEST',8,'1','256','JE'],['CMP',8,'1.5','0','JE'],['CMP',8,'1e2','0','JE'],['CMP',8,'-0x1','0','JE'],['CMP',8,'0b2','0','JE'],['CMP',8,'1+2','0','JE'],['CMP',8,'9'.repeat(81),'0','JE'],['CMP',7,'0','0','JE'],['ADD',8,'0','0','JE'],['CMP',8,'0','0','INVALID'],['CMP',64,'18446744073709551616','0','JE'],['CMP',64,'-9223372036854775809','0','JE']];
for(const args of invalid) { let threw=false; try{M.evaluate(...args);}catch(e){threw=true;} check(threw,'reject '+args.join('/')); }
check(M.evaluate('TEST',8,'0xAA','0b01010101','JE').taken,'radix inputs');
check(M.evaluate('CMP',8,' -1 ','255','JE').taken,'trim whitespace');
console.log(pass+' assertions passed; 65,536 operand pairs per operation at 8 bits; 600 larger-width operation cases; 15 invalid-input cases.');
