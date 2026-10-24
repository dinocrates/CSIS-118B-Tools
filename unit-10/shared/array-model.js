/* Exact illustrative array arithmetic. No memory access, code execution or I/O. */
(function(root,factory){const api=factory();if(typeof module!=='undefined'&&module.exports)module.exports=api;else(root.CSIS118B=root.CSIS118B||{}).ArrayModel=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';const U64=(1n<<64n)-1n;
 function parse(raw){const s=String(raw).trim();if(s.length>40||! /^(?:-?\d+|0x[0-9a-f]+)$/i.test(s))throw Error('Use decimal integers or nonnegative 0x hexadecimal, without fractions or expressions.');return BigInt(s);}
 const hex=(n,digits=1)=>'0x'+n.toString(16).toUpperCase().padStart(digits,'0');
 function element(value,width){if(![1,2,4,8].includes(width))throw Error('Element width must be 1, 2, 4 or 8 bytes.');const bits=BigInt(width*8),mod=1n<<bits,min=-(1n<<(bits-1n));if(value<min||value>=mod)throw Error('Element must fit signed minimum through unsigned maximum for this width.');const unsigned=BigInt.asUintN(width*8,value),signed=BigInt.asIntN(width*8,value),bytes=[];for(let i=0;i<width;i++)bytes.push(Number(unsigned>>BigInt(i*8)&255n));return {value,unsigned,signed,bytes};}
 function explore({width,base,values,length,index}){
  width=Number(width);if(![1,2,4,8].includes(width))throw Error('Choose an element width.');
  const parts=String(values).trim().split(/[\s,]+/);if(!String(values).trim()||parts.length>8)throw Error('Enter 1 through 8 values; active length may still be zero.');const elements=parts.map(v=>element(parse(v),width));
  const b=parse(base),n=parse(length),i=parse(index);if(b<0n||b>U64)throw Error('Illustrative base must be in unsigned 64-bit range.');if(b+BigInt(elements.length*width)-1n>U64)throw Error('The allocated byte range would exceed unsigned 64-bit address arithmetic.');
  if(n<0n||n>BigInt(elements.length))throw Error('Active length must be between zero and the number of supplied elements.');if(i<-(1n<<63n)||i>(1n<<63n)-1n)throw Error('Index must fit signed 64-bit range.');
  const rows=elements.map((e,k)=>({...e,index:k,offset:BigInt(k*width),address:b+BigInt(k*width),active:BigInt(k)<n}));
  const valid=i>=0n&&i<n,selected=valid?rows[Number(i)]:null;
  return {width,base:b,length:n,index:i,capacity:elements.length,rows,valid,selected,reason:i<0n?'Negative index':i>=n?'Index is not less than active length':'Within active bounds'};
 }
 return {explore,element,parse,hex};
});
