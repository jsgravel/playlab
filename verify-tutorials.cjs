const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),timers=new Map();let timerId=0,buttons=[];
function element(){let html='';return {style:{},dataset:{},classList:{toggle(){}},get innerHTML(){return html;},set innerHTML(v){html=v;if(v.includes('data-example'))buttons=[...v.matchAll(/data-example="(\d+)"/g)].map(m=>({dataset:{example:m[1]},classList:{toggle(){}}}));},querySelectorAll(){return buttons;},showModal(){this.open=true;},close(){this.open=false;this.onclose?.();}};}
const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);}};
const context={document,window:{},setTimeout(fn){timers.set(++timerId,fn);return timerId;},clearTimeout(id){timers.delete(id);}};
vm.runInNewContext(fs.readFileSync('tutorials.js','utf8'),context);
function flush(){while(timers.size){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}}
let acknowledgements=0;const sounds=[];
for(let g=0;g<5;g++){
 context.window.TileHopLessons.show(g,{bunny:'<svg></svg>',onDone(){acknowledgements++;},onSound:n=>sounds.push(n)});
 assert.ok(document.getElementById('lesson-dialog').open);flush();
 for(let page=0;page<context.window.TileHopLessons.groups[g].length;page++){
  document.getElementById('lesson-try').onclick();assert.equal(timers.size,0,'Manual mode cancels autoplay');
  const lesson=context.window.TileHopLessons.groups[g][page],count=['twoKeys','combo'].includes(lesson)?3:2;
  for(let i=1;i<=count;i++)buttons.find(b=>Number(b.dataset.example)===i).onclick();
  const finalTip=document.getElementById('lesson-tip').textContent;
  if(lesson==='key')assert.match(finalTip,/gate opens/);if(lesson==='spring')assert.match(finalTip,/bigger hop/);if(lesson==='twoKeys')assert.match(finalTip,/Both keys/);if(lesson==='combo')assert.match(finalTip,/3× combo/);
  document.getElementById('lesson-next').onclick();
 }
 assert.equal(document.getElementById('lesson-dialog').open,false);assert.equal(timers.size,0);
}
assert.equal(acknowledgements,5);assert.ok(sounds.includes('key'));assert.ok(sounds.includes('unlock'));assert.ok(sounds.includes('spring'));
context.window.TileHopLessons.show(3,{bunny:'',onDone(){},onSound(){}});document.getElementById('lesson-dialog').close();assert.equal(timers.size,0,'Closing a lesson cancels its animation callbacks');
console.log('PASS: all garden demos, manual interaction, two-part finale lesson, sound events, and timer cleanup.');
