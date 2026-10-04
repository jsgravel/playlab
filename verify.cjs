// No dependencies: check solvability, state changes, undo, and saved completion.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const elements = new Map();
function element() { return {style:{},dataset:{},classList:{add(){},remove(){}},children:[],innerHTML:'',textContent:'',append(x){this.children.push(x);},setAttribute(){},showModal(){this.open=true;},close(){this.open=false;},remove(){}}; }
const timers=[];
const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelector(){return element();},querySelectorAll(){return [];}};
let storage='{}';
const context={document,window:{},localStorage:{getItem:()=>storage,setItem:(k,v)=>{storage=v;}},setTimeout:(fn)=>{timers.push(fn);return timers.length;},clearTimeout(){},console,Math};
vm.createContext(context);vm.runInContext(fs.readFileSync('game.js','utf8'),context);
const api=context.window.TileHop;
for(let i=0;i<12;i++){
 api.load(i);
 const state=api.getState();const route=api.bestRoute(state.level.start);
 assert.ok(route,`Level ${i+1} must have a complete route`);
 assert.equal(route.route.length,state.level.rows);
 for(const tile of route.route){context.hop(tile);assert.equal(api.getState().busy,true);timers.shift()();while(timers.length)timers.shift()();assert.equal(api.getState().path.at(-1).id,tile.id);}
 assert.equal(api.getState().path.length,state.level.rows+1);
 assert.ok(Object.hasOwn(JSON.parse(storage).records,i));
 document.getElementById('dialog').close();
 api.load(i);context.hop(api.bestRoute(api.getState().level.start).route[0]);timers.shift()();while(timers.length)timers.shift()();
 document.getElementById('undo').onclick();assert.equal(api.getState().path.length,1);
}
api.load(0);const before=api.getState().path.length;
const wrong=api.getState().level.nodes.find(n=>n.r===0&&n.entry!==api.getState().level.start.next);
if(wrong){context.hop(wrong);assert.equal(api.getState().path.length,before);}
console.log('PASS: all 12 levels solvable; complete routes, saved results, and undo verified.');
