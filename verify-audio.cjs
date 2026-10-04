const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const elements=new Map(),events={},windowEvents={},intervals=new Set(),notes=[];
let stored='{}',contextCount=0,audioContext;
function element(){return {value:'',innerHTML:'',textContent:'',attributes:{},setAttribute(k,v){this.attributes[k]=v;}};}
const document={hidden:false,getElementById(id){if(!elements.has(id))elements.set(id,element());return elements.get(id);},addEventListener(name,fn){events[name]=fn;}};
const param=()=>({value:0,cancelScheduledValues(){},setTargetAtTime(){},setValueAtTime(v){assert.ok(Number.isFinite(v));},exponentialRampToValueAtTime(v){assert.ok(v>0);}});
class AudioContext{
 constructor(){contextCount++;audioContext=this;this.currentTime=0;this.state='suspended';this.destination={};}
 async resume(){this.state='running';}async suspend(){this.state='suspended';}
 createGain(){return {gain:param(),connect(){},disconnect(){}};}
 createOscillator(){const o={frequency:param(),connect(){},disconnect(){},start(t){assert.ok(t>=0);notes.push(o);},stop(t){assert.ok(t>=0);}};return o;}
}
const context={document,window:{AudioContext,addEventListener(name,fn){windowEvents[name]=fn;}},localStorage:{getItem:()=>stored,setItem:(k,v)=>{stored=v;}},setInterval(fn){intervals.add(fn);return fn;},clearInterval(fn){intervals.delete(fn);},console};
vm.createContext(context);vm.runInContext(fs.readFileSync('audio.js','utf8'),context);
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
(async()=>{
 assert.equal(contextCount,0,'No autoplay or AudioContext before interaction');
 assert.equal(context.window.TileHopAudio.tracks.length,4);
 const music=document.getElementById('music'),effects=document.getElementById('sound');
 music.onclick();await flush();assert.equal(intervals.size,1);assert.ok(notes.length>0);assert.equal(effects.attributes['aria-pressed'],'false');
 const before=notes.length;await context.window.TileHopAudio.effect(440,.1);assert.equal(notes.length,before,'Effects stay muted while music plays');
 await effects.onclick();await flush();assert.equal(effects.attributes['aria-pressed'],'true');
 document.getElementById('next-song').onclick();await flush();assert.equal(intervals.size,1,'Changing songs must not stack schedulers');assert.equal(JSON.parse(stored).track,1);
 // Exercise scheduling across every track and the automatic playlist wrap.
 for(let track=0;track<4;track++){
  const previous=JSON.parse(stored).track;
  for(let i=0;i<1800&&JSON.parse(stored).track===previous;i++){audioContext.currentTime+=.1;for(const schedule of intervals)schedule();}
  assert.equal(JSON.parse(stored).track,(previous+1)%4,'Playlist advances automatically, including wrap');
  assert.equal(intervals.size,1);
 }
 music.onclick();await flush();assert.equal(intervals.size,0);assert.equal(effects.attributes['aria-pressed'],'true');
 const afterMute=notes.length;await context.window.TileHopAudio.effect(550,.12);assert.ok(notes.length>afterMute,'Effects remain available with music off');
 music.onclick();await flush();document.hidden=true;events.visibilitychange();assert.equal(intervals.size,0);
 document.hidden=false;events.visibilitychange();await flush();assert.equal(intervals.size,1);
 music.onclick();music.onclick();music.onclick();await flush();assert.equal(intervals.size,0,'Rapid toggles must not restart muted music');
 assert.equal(JSON.parse(stored).music,false);assert.equal(JSON.parse(stored).effects,true);
 console.log('PASS: 4 songs; audio opt-in, independent mutes, track switching, background pause, saved settings, and rapid toggles.');
})().catch(error=>{console.error(error);process.exitCode=1;});
