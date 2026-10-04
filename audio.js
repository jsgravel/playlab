'use strict';
// Original compositions synthesized locally. No recordings, downloads, or external services.
(() => {
 const tracks = [
  {name:'A Path Through Ferns',bpm:76,root:60,scale:[0,2,4,7,9],chords:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],melody:[0,2,3,2,1,0,1,2,4,3,2,1,2,0,-1,1,2,3,4,3,2,1,0,1,3,2,1,0,1,0,-1,-1]},
  {name:'Lanterns by the Lake',bpm:68,root:62,scale:[0,2,3,7,9],chords:[[0,3,7],[5,9,12],[10,14,17],[0,3,7]],melody:[2,-1,3,4,3,2,1,0,1,2,3,-1,2,1,0,-1,0,1,2,4,3,-1,2,1,3,2,1,0,1,2,0,-1]},
  {name:'The Sleepy Windmill',bpm:82,root:65,scale:[0,2,4,7,9],chords:[[0,4,7],[7,11,14],[9,12,16],[5,9,12]],melody:[0,1,2,-1,3,2,1,2,4,3,2,-1,1,2,0,-1,2,3,4,2,3,2,1,0,1,3,2,1,2,0,-1,-1]},
  {name:'A Home Above the Clouds',bpm:64,root:60,scale:[0,2,5,7,9],chords:[[0,5,7],[5,9,12],[9,12,16],[7,12,14]],melody:[3,-1,2,1,0,-1,1,2,4,3,-1,2,1,0,-1,-1,0,2,3,4,3,2,-1,1,2,3,2,1,0,-1,0,-1]}
 ];
 let prefs={};try{prefs=JSON.parse(localStorage.getItem('tilehop-audio-v1')||'{}')||{};}catch(_){}
 let music=!!prefs.music,effects=!!prefs.effects,track=Number.isInteger(prefs.track)?Math.max(0,Math.min(3,prefs.track)):0;
 let volume=Number.isFinite(prefs.volume)?Math.max(0,Math.min(1,prefs.volume)):.45;
 let ctx,musicBus,effectsBus,interval,nextTime=0,step=0,playing=false,unlocked=false,generation=0;
 const voices=new Set(),$=id=>document.getElementById(id),freq=n=>440*2**((n-69)/12);
 function save(){try{localStorage.setItem('tilehop-audio-v1',JSON.stringify({music,effects,track,volume}));}catch(_){}}
 function ui(){
  $('music').innerHTML='♫ <span>Music '+(music?'on':'off')+'</span>';$('music').setAttribute('aria-pressed',String(music));$('music').setAttribute('aria-label',music?'Disable music':'Enable music');
  $('sound').innerHTML='✧ <span>Effects '+(effects?'on':'off')+'</span>';$('sound').setAttribute('aria-pressed',String(effects));$('sound').setAttribute('aria-label',effects?'Disable effects':'Enable effects');
  $('song').value=String(track);$('music-volume').value=String(Math.round(volume*100));$('now-playing').textContent=playing?tracks[track].name:music?'Tap to start your soundtrack':'Four little fantasy melodies';
 }
 async function unlock(){
  try{
   if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();musicBus=ctx.createGain();effectsBus=ctx.createGain();musicBus.gain.value=0;effectsBus.gain.value=effects?1:0;musicBus.connect(ctx.destination);effectsBus.connect(ctx.destination);}
   await ctx.resume();unlocked=ctx.state==='running';$('audio-status').textContent=unlocked?'':'Tap Music again to resume audio.';return unlocked;
  }catch(_){$('audio-status').textContent='Audio is unavailable in this browser. You can still enjoy the game.';return false;}
 }
 function ramp(bus,value){if(!ctx||!bus)return;bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setTargetAtTime(value,ctx.currentTime,.06);}
 function voice(note,time,duration,kind,level,bus=musicBus){
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=kind==='harp'?'triangle':'sine';osc.frequency.value=freq(note);
  // Gentle attacks avoid clicks; a sine flute and rounded triangle harp keep the mix light.
  gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(level,time+(kind==='harp'?.018:.12));gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  osc.connect(gain);gain.connect(bus);osc.start(time);osc.stop(time+duration+.03);
  const v={osc,gain,bus};voices.add(v);osc.onended=()=>{osc.disconnect();gain.disconnect();voices.delete(v);};
 }
 function stop(){generation++;if(interval!==undefined)clearInterval(interval);interval=undefined;playing=false;ramp(musicBus,0);
  // Stop scheduled notes as well as audible ones so toggling never stacks songs.
  if(ctx)for(const v of voices)if(v.bus===musicBus){try{v.gain.gain.cancelScheduledValues(ctx.currentTime);v.gain.gain.setTargetAtTime(.0001,ctx.currentTime,.025);v.osc.stop(ctx.currentTime+.15);}catch(_){}}
  ui();
 }
 function schedule(){
  if(!playing||!ctx||ctx.state!=='running')return;
  if(nextTime<ctx.currentTime)nextTime=ctx.currentTime+.05;
  while(nextTime<ctx.currentTime+.25){
   const t=tracks[track],beat=60/t.bpm,bar=Math.floor(step/8),chord=t.chords[bar%4];
   if(step%8===0){for(const n of chord)voice(t.root+n-12,nextTime,beat*4.7,'pad',.025);voice(t.root+chord[0]-24,nextTime,beat*3.8,'pad',.04);}
   const harp=chord[[0,1,2,1,0,2,1,2][step%8]];voice(t.root+harp,nextTime,beat*1.6,'harp',.045);
   if(step%2===0){const phrase=Math.floor(step/2)%32,m=t.melody[phrase];if(m>=0)voice(t.root+12+t.scale[m],nextTime+.018,beat*1.75,'flute',.065);}
   nextTime+=beat/2;step++;
   // Two 16-bar passes per song, then continue through the playlist without silence.
   if(step===256){step=0;track=(track+1)%tracks.length;save();ui();}
  }
 }
 async function start(){stop();const token=generation;if(!music||document.hidden||!await unlock()||token!==generation||!music||document.hidden)return;playing=true;step=0;nextTime=ctx.currentTime+.1;ramp(musicBus,volume);schedule();interval=setInterval(schedule,100);ui();}
 async function effect(f,d){if(!effects||document.hidden||!await unlock()||!effects)return;voice(69+12*Math.log2(f/440),ctx.currentTime+.005,Math.max(.15,d),'harp',.07,effectsBus);}
 $('song').innerHTML=tracks.map((t,i)=>`<option value="${i}">${t.name}</option>`).join('');
 $('music').onclick=()=>{music=!music;save();ui();if(music)start();else stop();};
 $('sound').onclick=async()=>{effects=!effects;save();ui();if(effects){await unlock();ramp(effectsBus,1);effect(550,.15);}else ramp(effectsBus,0);};
 $('song').onchange=()=>{track=Number($('song').value);save();if(music)start();else ui();};
 $('next-song').onclick=()=>{track=(track+1)%tracks.length;save();if(music)start();else ui();};
 $('music-volume').oninput=()=>{volume=Number($('music-volume').value)/100;save();if(playing)ramp(musicBus,volume);};
 document.addEventListener('pointerdown',()=>{if(music&&!unlocked)start();},{once:true});
 document.addEventListener('keydown',()=>{if(music&&!unlocked)start();},{once:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(ctx)ctx.suspend();}else if(music&&unlocked)start();});
 window.addEventListener('pagehide',()=>{stop();if(ctx)ctx.suspend();});
 ui();window.TileHopAudio={effect,tracks};
})();
