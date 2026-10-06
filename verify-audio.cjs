const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),events={},windowEvents={},intervals=new Set(),notes=[];
let stored='{}',contextCount=0,audioContext;
function element(){return {value:'',innerHTML:'',textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;}};}
const document={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},addEventListener(name,fn){events[name]=fn;}};
const param=()=>({value:0,cancelScheduledValues(){},setTargetAtTime(v){this.value=v;},setValueAtTime(v){assert.ok(Number.isFinite(v));this.value=v;},exponentialRampToValueAtTime(v){assert.ok(v>0);this.value=v;}});
class AudioContext{
 constructor(){contextCount++;audioContext=this;this.currentTime=0;this.state='suspended';this.destination={};this.gains=[];}
 async resume(){this.state='running';}async suspend(){this.state='suspended';}
 createGain(){const node={gain:param(),connect(){},disconnect(){}};this.gains.push(node);return node;}
 createOscillator(){const o={frequency:param(),connect(){},disconnect(){},start(t){assert.ok(t>=0);notes.push(o);},stop(t){assert.ok(t>=0);}};return o;}
}
const context={document,window:{AudioContext,addEventListener(name,fn){windowEvents[name]=fn;}},localStorage:{getItem:()=>stored,setItem:(k,v)=>{stored=v;}},setInterval(fn){intervals.add(fn);return fn;},clearInterval(fn){intervals.delete(fn);},console};
vm.createContext(context);vm.runInContext(fs.readFileSync('audio.js','utf8'),context);
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
(async()=>{
 assert.equal(contextCount,0,'No autoplay or AudioContext before interaction');
 assert.equal(context.window.TileHopAudio.tracks.length,12);
 const music=document.getElementById('music'),effects=document.getElementById('sound');
 music.onclick();await flush();assert.equal(intervals.size,1);assert.ok(notes.length>0);assert.equal(effects.attributes['aria-pressed'],'false');
 const before=notes.length;await context.window.TileHopAudio.effect(440,.1);assert.equal(notes.length,before,'Effects stay muted while music plays');
 await effects.onclick();await flush();assert.equal(effects.attributes['aria-pressed'],'true');
 assert.equal(audioContext.gains[1].gain.value,.65,'Effects bus unmutes after music initialized it muted');
 effects.onclick();assert.equal(audioContext.gains[1].gain.value,0);assert.equal(effects.attributes['aria-pressed'],'false');
 const mutedNotes=notes.length;await context.window.TileHopAudio.effect(440,.1);assert.equal(notes.length,mutedNotes);
 effects.onclick();await flush();assert.equal(audioContext.gains[1].gain.value,.65);
 const signatures=new Set();
 for(const name of ['key','unlock','spend','locked','springReady','spring','sun','star','nearby','complete','garden','finale']){const start=notes.length;await context.window.TileHopAudio.cue(name);const signature=notes.slice(start).map(n=>n.frequency.value.toFixed(2)).join(',');assert.ok(signature);signatures.add(signature);}
 assert.equal(signatures.size,12,'Mechanics and celebrations have distinct sound cues');
 const comboSignatures=new Set();
 for(const streak of [1,2,3,6,10]){const start=notes.length;await context.window.TileHopAudio.combo(streak);comboSignatures.add(notes.slice(start).map(n=>n.frequency.value.toFixed(2)).join(','));}
 assert.equal(comboSignatures.size,5,'Rising notes and richer combo tiers sound distinct');
 const resetStart=notes.length;await context.window.TileHopAudio.combo(1);assert.equal(notes[resetStart].frequency.value,261.6255653005986,'A broken streak restarts the gentle melody');
 effects.onclick();const mutedCues=notes.length;await context.window.TileHopAudio.cue('key');await context.window.TileHopAudio.cue('spring');await context.window.TileHopAudio.combo(10);assert.equal(notes.length,mutedCues,'All mechanic cues respect effects mute');effects.onclick();await flush();
 document.getElementById('effects-volume').value='30';document.getElementById('effects-volume').oninput();assert.equal(audioContext.gains[1].gain.value,.3);assert.equal(JSON.parse(stored).effectsVolume,.3);
 document.getElementById('music-volume').value='20';document.getElementById('music-volume').oninput();assert.equal(audioContext.gains[0].gain.value,.2);assert.equal(audioContext.gains[1].gain.value,.3);
 document.getElementById('next-song').onclick();await flush();assert.equal(intervals.size,1,'Changing songs must not stack schedulers');assert.equal(JSON.parse(stored).track,1);
 // Distinct instruments must create distinct harmonic and waveform arrangements.
 const arrangements=new Set();
 for(let track=8;track<12;track++){
  const start=notes.length;document.getElementById('song').value=String(track);document.getElementById('song').onchange();await flush();
  arrangements.add(notes.slice(start).map(n=>n.type+':'+n.frequency.value.toFixed(2)).join(','));
 }
 assert.equal(arrangements.size,4,'Piano, guitar, ambient and retro arrangements differ');
 // Exercise scheduling across every track and the automatic playlist wrap.
 for(let track=0;track<12;track++){
  const previous=JSON.parse(stored).track;
  for(let i=0;i<1800&&JSON.parse(stored).track===previous;i++){audioContext.currentTime+=.1;for(const schedule of intervals)schedule();}
  assert.equal(JSON.parse(stored).track,(previous+1)%12,'Playlist advances automatically, including wrap');
  assert.equal(intervals.size,1);
 }
 music.onclick();await flush();assert.equal(intervals.size,0);assert.equal(effects.attributes['aria-pressed'],'true');
 const afterMute=notes.length;await context.window.TileHopAudio.effect(550,.12);assert.ok(notes.length>afterMute,'Effects remain available with music off');
 music.onclick();await flush();document.hidden=true;events.visibilitychange();assert.equal(intervals.size,0);
 document.hidden=false;events.visibilitychange();await flush();assert.equal(intervals.size,1);
 music.onclick();music.onclick();music.onclick();await flush();assert.equal(intervals.size,0,'Rapid toggles must not restart muted music');
 assert.equal(JSON.parse(stored).music,false);assert.equal(JSON.parse(stored).effects,true);
 // An unfinished resume must not unmute effects after the player turned them off.
 effects.onclick();audioContext.state='suspended';let resolveResume;
 audioContext.resume=()=>new Promise(resolve=>{resolveResume=()=>{audioContext.state='running';resolve();};});
 effects.onclick();effects.onclick();const beforeResume=notes.length;resolveResume();await flush();
 assert.equal(effects.attributes['aria-pressed'],'false');assert.equal(audioContext.gains[1].gain.value,0);assert.equal(notes.length,beforeResume,'No stale preview plays after mute');
 console.log('PASS: 12 songs; independent volume and mute buses, effects off/on, delayed-resume race, playlist cycling, and background pause.');
})().catch(error=>{console.error(error);process.exitCode=1;});
