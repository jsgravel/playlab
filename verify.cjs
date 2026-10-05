// Dependency-free checks of real game state, progression, and generated puzzle rules.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function boot(saved={},lessons){
 const elements=new Map(),timers=new Map(),soundEvents=[];let nextTimer=0,storage=JSON.stringify(saved);
 function element(){let html='';return {style:{},dataset:{},classList:{add(){},remove(){}},children:[],get innerHTML(){return html;},set innerHTML(v){html=v;this.children=[];},textContent:'',append(x){this.children.push(x);},setAttribute(k,v){this[k]=v;},showModal(){this.open=true;},close(){this.open=false;},remove(){}};}
 const document={getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},createElement:element,querySelector(){return element();},querySelectorAll(){return [];}};
 const context={document,window:{TileHopLessons:lessons,TileHopAudio:{cue:n=>soundEvents.push(n),effect(){}}},localStorage:{getItem:()=>storage,setItem:(k,v)=>{storage=v;}},setTimeout(fn){timers.set(++nextTimer,fn);return nextTimer;},clearTimeout(id){timers.delete(id);},console,Math};
 vm.createContext(context);vm.runInContext(fs.readFileSync('game.js','utf8'),context);
 return {api:context.window.TileHop,context,document,soundEvents,storage:()=>JSON.parse(storage),flush(){while(timers.size){const [id,fn]=timers.entries().next().value;timers.delete(id);fn();}}};
}
const app=boot(),{api,context,document}=app;
assert.equal(api.load(12),false,'The second garden starts locked');
function finish(index){
 assert.equal(api.load(index),true);
 const state=api.getState(),route=api.bestRoute(state.level.start);
 assert.ok(route,`Level ${index+1} is solvable`);
 if(index>=12)assert.ok(state.level.forks>0,'Every later puzzle has a deliberately placed fork');
 if(index>=24)assert.ok(route.route.length>=7,'Later gardens support longer accuracy streaks');
 const tiles=document.getElementById('board').children.filter(n=>n.dataset.id&&state.level.nodes.some(t=>t.id===n.dataset.id&&t.r===state.level.rows-1));
 assert.ok(tiles.every(t=>!t.innerHTML.includes('class="next"')),'No next-symbol previews on finish tiles');
 let keys=0;
 for(const tile of route.route){
  const current=api.getState().path.at(-1);assert.equal(tile.r,current.r+(current.spring?2:1));
  if(state.level.garden>0)assert.ok(Math.abs(tile.c-current.c)<=1,'Later gardens require nearby hops');
  assert.ok(!tile.lock||keys>=tile.lock,'A route must collect keys before gates');
  context.hop(tile);assert.equal(api.getState().path.at(-1).id,tile.id,'Moves commit immediately without waiting for animation');if(tile.key)keys++;
 }
 assert.equal(api.getState().path.at(-1).r,state.level.rows-1);app.flush();assert.ok(Object.hasOwn(app.storage().records,index));
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
const interrupted=boot();const fastRoute=interrupted.api.bestRoute(interrupted.api.getState().level.start).route;
for(const tile of fastRoute)interrupted.context.hop(tile);
interrupted.document.getElementById('undo').onclick();interrupted.flush();assert.equal(interrupted.api.completed(0),false,'Undo cancels a pending finish celebration');
interrupted.context.hop(fastRoute.at(-1));interrupted.api.load(1);interrupted.flush();assert.equal(interrupted.api.completed(0),false,'Changing levels cancels a pending finish');
const migrated=boot({level:11,records:oldRecords});assert.equal(migrated.api.unlockedGarden(1),true);assert.equal(migrated.api.unlockedGarden(2),false);
const shown=[];const taught=boot({level:12,records:oldRecords},{show(g,options){shown.push(g);options.onDone();}});
assert.deepEqual(shown,[1]);taught.api.load(13);assert.deepEqual(shown,[1],'Acknowledged garden lesson does not repeat each level');assert.equal(taught.storage().tutorialsSeen[1],true);
const reviewing=boot(taught.storage(),{show(g,options){shown.push(g);options.onDone();}});assert.deepEqual(shown,[1],'Tutorial acknowledgement survives a reload');vm.runInContext('showLesson()',reviewing.context);assert.deepEqual(shown,[1,1],'Examples can be reviewed explicitly');
assert.equal(boot(app.storage()).api.gardenComplete(4),true);
assert.equal(boot({level:59,records:{}}).api.getState().levelIndex,0,'A stale save cannot enter locked gardens');
for(const cue of ['key','unlock','locked','springReady','spring','sun','nearby','garden','finale'])assert.ok(app.soundEvents.includes(cue),`Game events trigger the ${cue} sound`);
function clearLevel(target,index){target.api.load(index);for(const tile of target.api.bestRoute(target.api.getState().level.start).route)target.context.hop(tile);target.flush();}
const tracking=boot();clearLevel(tracking,0);assert.equal(Object.keys(tracking.storage().stats.flawless).length,1);clearLevel(tracking,0);assert.equal(Object.keys(tracking.storage().stats.flawless).length,1,'Replaying a flawless level does not inflate the count');
tracking.api.load(1);const next=tracking.api.bestRoute(tracking.api.getState().level.start).route[0];tracking.context.hop(next);tracking.document.getElementById('undo').onclick();assert.equal(tracking.storage().stats.undoUses,1);for(const tile of tracking.api.bestRoute(tracking.api.getState().level.start).route)tracking.context.hop(tile);tracking.flush();assert.equal(tracking.storage().stats.flawless[1],undefined,'Undo disqualifies the current climb');
clearLevel(tracking,1);assert.equal(tracking.storage().stats.flawless[1],true,'A later clean replay earns a flawless mark');
tracking.api.load(2);tracking.document.getElementById('restart').onclick();assert.equal(tracking.storage().stats.restarts,1);const restoredTracking=boot(tracking.storage());assert.equal(restoredTracking.storage().stats.dirty[2],true,'Reloading preserves restart/error state');for(const tile of restoredTracking.api.bestRoute(restoredTracking.api.getState().level.start).route)restoredTracking.context.hop(tile);restoredTracking.flush();assert.equal(restoredTracking.storage().stats.flawless[2],undefined);
const wrongApp=boot();let wrongIndex,wrongTile;
for(let i=0;i<12;i++){wrongApp.api.load(i);const state=wrongApp.api.getState();wrongTile=state.level.nodes.find(t=>t.r===0&&t.entry!==state.level.start.next);if(wrongTile){wrongIndex=i;break;}}
assert.ok(wrongTile);wrongApp.context.hop(wrongTile);for(const tile of wrongApp.api.bestRoute(wrongApp.api.getState().level.start).route)wrongApp.context.hop(tile);wrongApp.flush();assert.equal(wrongApp.storage().stats.flawless[wrongIndex],undefined,'Wrong matching taps disqualify flawless');
tracking.document.getElementById('stats').onclick();assert.match(tracking.document.getElementById('dialog-content').innerHTML,/Flawless levels/);
tracking.document.getElementById('reset-game').onclick();assert.match(tracking.document.getElementById('dialog-content').innerHTML,/cannot be undone/);const beforeCancel=JSON.stringify(tracking.storage());tracking.document.getElementById('cancel-reset').onclick();assert.equal(JSON.stringify(tracking.storage()),beforeCancel,'Cancelling full reset preserves all data');
tracking.document.getElementById('reset-game').onclick();tracking.document.getElementById('confirm-reset').onclick();assert.equal(tracking.api.getState().levelIndex,0);assert.equal(Object.keys(tracking.storage().records).length,0);assert.equal(tracking.storage().stats.undoUses,0);assert.equal(tracking.storage().stats.restarts,0);assert.equal(Object.keys(tracking.storage().stats.flawless).length,0);assert.equal(tracking.api.unlockedGarden(1),false);
const pending=boot();for(const tile of pending.api.bestRoute(pending.api.getState().level.start).route)pending.context.hop(tile);pending.document.getElementById('reset-game').onclick();pending.flush();assert.match(pending.document.getElementById('dialog-content').innerHTML,/Restart the entire game/,'Pending finish cannot replace the reset warning');
assert.equal(Object.keys(migrated.storage().stats.flawless).length,0,'Old saves keep progress without invented historical flawless stats');
const unlockedRecords=Object.fromEntries(Array.from({length:48},(_,i)=>[i,0]));
const streak=boot({level:24,records:unlockedRecords,comboSeen:true,tutorialsSeen:{2:true}});
let streakRoute=streak.api.bestRoute(streak.api.getState().level.start).route;
for(const tile of streakRoute.slice(0,3))streak.context.hop(tile);
assert.equal(streak.api.getState().combo,3);assert.equal(streak.document.getElementById('combo-bar').dataset.tier,'bud');
streak.document.getElementById('hint').onclick();assert.equal(streak.api.getState().combo,3,'Hints never break a combo');streak.flush();assert.equal(streak.api.getState().combo,3,'Waiting never breaks a combo');
streak.document.getElementById('undo').onclick();assert.equal(streak.api.getState().combo,0);assert.equal(streak.storage().stats.bestCombo,3);
streak.api.load(24);streakRoute=streak.api.bestRoute(streak.api.getState().level.start).route;
let wrongStreak;
for(const tile of streakRoute){streak.context.hop(tile);wrongStreak=vm.runInContext('level.nodes.find(t=>reachable(current(),t)&&t.entry!==current().next)',streak.context);if(wrongStreak)break;}
assert.ok(wrongStreak);streak.context.hop(wrongStreak);assert.equal(streak.api.getState().combo,0,'A wrong match resets the streak immediately');
streak.api.load(59);const finalRoute=vm.runInContext(`(function longest(n,k=0){if(n.r===level.rows-1)return [];let best=null;for(const t of choices(n,k)){const rest=longest(t,k+(t.key?1:0));if(rest&&(!best||rest.length+1>best.length))best=[t,...rest];}return best;})(level.start)`,streak.context);
assert.ok(finalRoute.length>=10,'Final garden supports the strongest visual tier');
for(const tile of finalRoute)streak.context.hop(tile);
assert.equal(streak.document.getElementById('combo-bar').dataset.tier,'starlight');assert.ok(streak.storage().stats.bestCombo>=10);
streak.document.getElementById('restart').onclick();assert.equal(streak.api.getState().combo,0,'Restart resets a combo');const savedBest=streak.storage().stats.bestCombo;assert.equal(boot(streak.storage()).storage().stats.bestCombo,savedBest);
streak.api.load(0);streak.context.hop(streak.api.bestRoute(streak.api.getState().level.start).route[0]);assert.equal(streak.api.getState().combo,0);assert.equal(streak.document.getElementById('combo-bar').hidden,true,'Combos are introduced only in later gardens');
// Small phones retain every reachable spring target above the rabbit inside the play window.
streak.context.window.innerWidth=375;streak.context.window.innerHeight=667;streak.api.load(36);
for(const tile of streak.api.bestRoute(streak.api.getState().level.start).route){streak.context.hop(tile);const target=vm.runInContext('choices(current())[0]',streak.context);if(target){const y=vm.runInContext(`position(level.nodes.find(t=>t.id==='${target.id}')).y`,streak.context)-streak.document.getElementById('playfield').scrollTop;assert.ok(y>=28&&y<=parseInt(streak.document.getElementById('playfield').style.height)-28,'Reachable targets remain visible after camera follow');}}
console.log('PASS: all 60 levels with rapid consecutive taps; cancelled finishes, garden locks, keys, springs, undo, saved progress, and celebrations.');
console.log('PASS: persistent undo/restart stats, distinct flawless clears, error tracking, replay, reload, reset confirmation/cancel, and pending-finish safety.');
console.log('PASS: designed forks, longer routes, combo tiers/reset/persistence, untimed hints, and small-phone spring visibility.');
