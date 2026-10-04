// Dependency-free checks of real game state, progression, and generated puzzle rules.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function boot(saved={}){
 const elements=new Map(),timers=new Map();let nextTimer=0,storage=JSON.stringify(saved);
 function element(){let html='';return {style:{},dataset:{},classList:{add(){},remove(){}},children:[],get innerHTML(){return html;},set innerHTML(v){html=v;this.children=[];},textContent:'',append(x){this.children.push(x);},setAttribute(k,v){this[k]=v;},showModal(){this.open=true;},close(){this.open=false;},remove(){}};}
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelector(){return element();},querySelectorAll(){return [];}};
 const context={document,window:{},localStorage:{getItem:()=>storage,setItem:(k,v)=>{storage=v;}},setTimeout(fn){timers.set(++nextTimer,fn);return nextTimer;},clearTimeout(id){timers.delete(id);},console,Math};
 vm.createContext(context);vm.runInContext(fs.readFileSync('game.js','utf8'),context);
 return {api:context.window.TileHop,context,document,storage:()=>JSON.parse(storage),flush(){while(timers.size){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}}};
}
const app=boot(),{api,context,document}=app;
assert.equal(api.load(12),false,'The second garden starts locked');
function finish(index){
 assert.equal(api.load(index),true);
 const state=api.getState(),route=api.bestRoute(state.level.start);
 assert.ok(route,`Level ${index+1} is solvable`);
 const tiles=document.getElementById('board').children.filter(n=>n.dataset.id&&state.level.nodes.some(t=>t.id===n.dataset.id&&t.r===state.level.rows-1));
 assert.ok(tiles.every(t=>!t.innerHTML.includes('class="next"')),'No next-symbol previews on finish tiles');
 let keys=0;
 for(const tile of route.route){
  const current=api.getState().path.at(-1);assert.equal(tile.r,current.r+(current.spring?2:1));
  if(state.level.garden>0)assert.ok(Math.abs(tile.c-current.c)<=1,'Later gardens require nearby hops');
  assert.ok(!tile.lock||keys>=tile.lock,'A route must collect keys before gates');
  context.hop(tile);assert.equal(api.getState().busy,true);app.flush();assert.equal(api.getState().path.at(-1).id,tile.id);if(tile.key)keys++;
 }
 assert.equal(api.getState().path.at(-1).r,state.level.rows-1);assert.ok(Object.hasOwn(app.storage().records,index));
 const content=document.getElementById('dialog-content').innerHTML;assert.ok(!/\d+ of \d+ stars/.test(content));document.getElementById('dialog').close();return content;
}
finish(11);assert.equal(api.unlockedGarden(1),false,'Completing level 12 alone does not unlock garden 2');
for(let i=0;i<11;i++){const content=finish(i);if(i===10){assert.ok(content.includes('Clover Garden complete!'));assert.ok(content.includes('Willow Walk'));}}
assert.equal(api.unlockedGarden(1),true);
for(let i=12;i<60;i++){
 const content=finish(i),garden=Math.floor(i/12);
 if(i%12===11&&i<59){assert.ok(content.includes('NEW GARDEN UNLOCKED'));assert.equal(api.unlockedGarden(garden+1),true);}
 if(i===59){assert.ok(content.includes('CONGRATULATIONS!'));assert.ok(content.includes('You beat Tile Hop!'));assert.ok(content.includes('60 levels'));}
 if(i%12!==11&&garden<4)assert.equal(api.unlockedGarden(garden+1),false);
 api.load(i);const first=api.bestRoute(api.getState().level.start).route[0];context.hop(first);app.flush();document.getElementById('undo').onclick();assert.equal(api.getState().path.length,1);assert.equal(api.getState().path.filter(t=>t.key).length,0);
}
api.load(24);const keyRoute=api.bestRoute(api.getState().level.start).route;
for(const tile of keyRoute){context.hop(tile);app.flush();if(tile.key){assert.equal(api.getState().path.filter(t=>t.key).length,1);document.getElementById('undo').onclick();assert.equal(api.getState().path.filter(t=>t.key).length,0);break;}}
api.load(36);const springRoute=api.bestRoute(api.getState().level.start).route;
for(let i=0;i<springRoute.length;i++){context.hop(springRoute[i]);app.flush();if(i>0&&springRoute[i-1].spring){const landed=api.getState().path.at(-1);document.getElementById('undo').onclick();assert.equal(api.getState().path.at(-1).spring,true);context.hop(landed);app.flush();assert.equal(api.getState().path.at(-1).id,landed.id);break;}}
api.load(24);const route=api.bestRoute(api.getState().level.start).route;
for(const tile of route.slice(0,-1)){context.hop(tile);app.flush();}
vm.runInContext('path = path.filter(n => !n.key)',context);
const before=api.getState().path.length;context.hop(route.at(-1));app.flush();assert.equal(api.getState().path.length,before);assert.match(document.getElementById('prompt').textContent,/needs 1 key/);
api.load(48);const far=api.getState().level.nodes.find(t=>t.r===0&&t.c===3);context.hop(far);assert.equal(api.getState().path.length,1,'Out-of-reach tiles cannot be hopped to');
const oldRecords=Object.fromEntries(Array.from({length:12},(_,i)=>[i,0]));
const migrated=boot({level:11,records:oldRecords});assert.equal(migrated.api.unlockedGarden(1),true);assert.equal(migrated.api.unlockedGarden(2),false);
assert.equal(boot(app.storage()).api.gardenComplete(4),true);
assert.equal(boot({level:59,records:{}}).api.getState().levelIndex,0,'A stale save cannot enter locked gardens');
console.log('PASS: all 60 levels solvable; garden locks, out-of-order completion, keys, springs, reach, undo, migration, saved progress, garden celebrations, and finale.');
