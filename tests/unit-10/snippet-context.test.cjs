'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),html=fs.readFileSync(path.join(root,'unit-10/array-address/index.html'),'utf8'),app=fs.readFileSync(path.join(root,'unit-10/array-address/app.js'),'utf8');let checks=0;
function check(ok,message){assert.ok(ok,message);checks++;}
check(/id="snippet-context"/.test(html)&&/aria-describedby="snippet-context"/.test(html),'code has accessible prerequisite');
for(const text of ['not standalone programs','csis118b.inc','main:','sub rsp, 8','single','before every helper CALL','do not repeat','initialized storage','both bounds checks'])check(html.includes(text),'prerequisite: '+text);
const elements={};function element(){return {value:'',textContent:'',hidden:false,children:[],handlers:{},classList:{add(){},toggle(){}},addEventListener(e,f){this.handlers[e]=f;},replaceChildren(){this.children=[];},append(c){this.children.push(c);},setAttribute(){},removeAttribute(){},focus(){}};}
for(const id of ['width','base','values','length','index','prediction','interpretation','value-prediction','status','result','rows','load-result','code-wrap','feedback','decision','formula','signed','unsigned','extension','code','reveal','reset'])elements[id]=element();
Object.entries({width:'4',base:'0x1000',values:'-4,7,-4,0,2',length:'5',index:'0',interpretation:'signed'}).forEach(([id,value])=>elements[id].value=value);
vm.runInNewContext(app,{window:{CSIS118B:{ArrayModel:require('../../unit-10/shared/array-model.js')}},document:{getElementById:id=>elements[id],querySelectorAll:()=>[],createElement:element,body:element()},location:{search:'?embed=1'},URLSearchParams});
for(const width of ['1','2','4','8']){elements.width.value=width;elements.width.handlers.change();elements.prediction.value='load';elements.reveal.handlers.click();const code=elements.code.textContent;
 check(!elements.result.hidden&&!elements['code-wrap'].hidden,'valid snippet revealed');
 check(code.startsWith('; Fragment inside an initialized, aligned course main program.'),'copy includes program context');
 check(code.includes('RSP must be 16-byte aligned before each CALL'),'copy includes alignment prerequisite');
 check(code.includes('do not repeat it here'),'copy warns against duplicate adjustment');
 const instructions=code.split('\n').map(s=>s.split(';')[0].trim()).filter(Boolean);
 check(!instructions.some(s=>/\brsp\b|^main:|^%include/.test(s)),'fragment adds no stack adjustment or fake standalone entry');
 check(instructions.filter(s=>s.startsWith('call ')).join(',')==='call print_int,call print_newline,call print_uint,call print_newline','all four helper calls preserved');
 check(code.includes('[r12+r14*'+width+']'),'width scale unchanged');
 const expected={1:['movsx rdi,byte','movzx edi,byte'],2:['movsx rdi,word','movzx edi,word'],4:['movsxd rdi,dword','mov edi,dword'],8:['mov rdi,qword','mov rdi,qword']}[width];
 check(expected.every(s=>code.includes(s+' [r12+r14*'+width+']')),'signed/unsigned load contracts preserved');
}
elements.index.value='5';elements.index.handlers.input();elements.prediction.value='reject';elements.reveal.handlers.click();check(elements['code-wrap'].hidden,'rejected index does not show a runnable fragment');check(elements.decision.textContent.startsWith('REJECTED:'),'bounds rejection unchanged');
console.log(checks+' snippet-context assertions passed.');
