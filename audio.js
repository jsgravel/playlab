'use strict';
// Original compositions synthesized locally. No recordings, downloads, or external services.
(() => {
 const tracks = [
  {name:'A Path Through Ferns',bpm:76,root:60,scale:[0,2,4,7,9],chords:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],melody:[0,2,3,2,1,0,1,2,4,3,2,1,2,0,-1,1,2,3,4,3,2,1,0,1,3,2,1,0,1,0,-1,-1]},
  {name:'Lanterns by the Lake',bpm:68,root:62,scale:[0,2,3,7,9],chords:[[0,3,7],[5,9,12],[10,14,17],[0,3,7]],melody:[2,-1,3,4,3,2,1,0,1,2,3,-1,2,1,0,-1,0,1,2,4,3,-1,2,1,3,2,1,0,1,2,0,-1]},
  {name:'The Sleepy Windmill',bpm:82,root:65,scale:[0,2,4,7,9],chords:[[0,4,7],[7,11,14],[9,12,16],[5,9,12]],melody:[0,1,2,-1,3,2,1,2,4,3,2,-1,1,2,0,-1,2,3,4,2,3,2,1,0,1,3,2,1,2,0,-1,-1]},
  {name:'A Home Above the Clouds',bpm:64,root:60,scale:[0,2,5,7,9],chords:[[0,5,7],[5,9,12],[9,12,16],[7,12,14]],melody:[3,-1,2,1,0,-1,1,2,4,3,-1,2,1,0,-1,-1,0,2,3,4,3,2,-1,1,2,3,2,1,0,-1,0,-1]},
  {name:'Dewdrop Bells',bpm:72,root:67,lead:'bell',scale:[0,2,4,7,9],chords:[[0,4,7],[5,9,12],[2,5,9],[7,11,14]],melody:[4,-1,2,3,1,-1,0,2,3,4,-1,2,1,0,-1,1,2,-1,4,3,2,1,-1,0,3,2,4,1,0,-1,0,-1]},
  {name:'Willow Harp',bpm:70,root:62,lead:'harp',scale:[0,2,5,7,9],chords:[[0,5,7],[9,12,16],[5,9,12],[7,12,14]],melody:[0,2,-1,3,4,2,1,-1,2,3,1,0,2,-1,1,0,3,4,2,-1,1,0,1,2,4,3,2,1,0,1,-1,-1]},
  {name:'Firefly Waltz',bpm:78,root:64,lead:'bell',scale:[0,2,3,7,10],chords:[[0,3,7],[8,12,15],[5,8,12],[10,14,17]],melody:[2,3,-1,4,2,1,0,-1,1,2,3,-1,4,3,2,1,0,-1,2,3,4,2,1,-1,3,2,1,0,1,0,-1,-1]},
  {name:'Morning at the Sanctuary',bpm:66,root:65,lead:'flute',scale:[0,2,4,7,9],chords:[[0,4,7],[2,5,9],[5,9,12],[0,4,7]],melody:[0,-1,1,2,3,-1,4,3,2,1,-1,0,2,1,0,-1,2,3,-1,4,3,2,1,-1,0,1,2,3,1,0,-1,-1]}
 ];
 tracks.push(
  {name:'Rainy Window · Soft piano',style:'piano',lead:'piano',bpm:62,root:60,scale:[0,2,3,7,10],chords:[[0,3,7],[8,12,15],[5,8,12],[7,10,14]],melody:[0,-1,2,3,2,-1,1,0,3,-1,4,3,2,1,-1,0,2,3,-1,4,2,-1,1,0,1,2,3,-1,1,0,-1,-1]},
  {name:'Porch Swing · Plucked guitar',style:'guitar',lead:'guitar',bpm:86,root:55,scale:[0,2,4,7,9],chords:[[0,4,7],[5,9,12],[9,12,16],[7,11,14]],melody:[0,1,2,-1,3,2,0,-1,1,2,4,3,2,-1,1,0,3,2,1,0,2,3,4,-1,3,2,1,-1,2,0,-1,-1]},
  {name:'Moonlit Drift · Ambient pads',style:'ambient',lead:'ambient',bpm:54,root:57,scale:[0,2,5,7,9],chords:[[0,5,7],[5,9,12],[2,7,11],[0,7,12]],melody:[0,-1,-1,2,-1,-1,3,-1,4,-1,-1,3,-1,-1,2,-1,1,-1,-1,0,-1,-1,2,-1,3,-1,-1,1,-1,0,-1,-1]},
  {name:'Pocket Adventure · Gentle retro',style:'retro',lead:'retro',bpm:96,root:60,scale:[0,2,4,7,9],chords:[[0,4,7],[9,12,16],[5,9,12],[7,11,14]],melody:[0,2,3,-1,2,1,0,-1,1,2,4,-1,3,2,1,0,2,3,4,3,2,-1,1,0,1,3,2,1,0,-1,0,-1]}
 );
 let prefs={};try{prefs=JSON.parse(localStorage.getItem('tilehop-audio-v1')||'{}')||{};}catch(_){}
 let music=!!prefs.music,effects=!!prefs.effects,track=Number.isInteger(prefs.track)?Math.max(0,Math.min(tracks.length-1,prefs.track)):0;
 let volume=Number.isFinite(prefs.volume)?Math.max(0,Math.min(1,prefs.volume)):.45;
 let effectsVolume=Number.isFinite(prefs.effectsVolume)?Math.max(0,Math.min(1,prefs.effectsVolume)):.65;
 let ctx,musicBus,effectsBus,interval,nextTime=0,step=0,playing=false,unlocked=false,generation=0,effectsGeneration=0;
 const voices=new Set(),$=id=>document.getElementById(id),freq=n=>440*2**((n-69)/12);
 function save(){try{localStorage.setItem('tilehop-audio-v1',JSON.stringify({music,effects,track,volume,effectsVolume}));}catch(_){}}
 function ui(){
  $('music').innerHTML='♫ <span>Music '+(music?'on':'off')+'</span>';$('music').setAttribute('aria-pressed',String(music));$('music').setAttribute('aria-label',music?'Disable music':'Enable music');
  $('sound').innerHTML='✧ <span>Effects '+(effects?'on':'off')+'</span>';$('sound').setAttribute('aria-pressed',String(effects));$('sound').setAttribute('aria-label',effects?'Disable effects':'Enable effects');
  $('song').value=String(track);$('music-volume').value=String(Math.round(volume*100));$('effects-volume').value=String(Math.round(effectsVolume*100));$('music-volume-value').textContent=Math.round(volume*100)+'%';$('effects-volume-value').textContent=Math.round(effectsVolume*100)+'%';$('now-playing').textContent=playing?tracks[track].name:music?'Tap to start your soundtrack':'12 melodies · 5 musical moods';
 }
 async function unlock(){
  try{
   if(!ctx){ctx=new (window.AudioContext||window.webkitAudioContext)();musicBus=ctx.createGain();effectsBus=ctx.createGain();musicBus.gain.value=0;effectsBus.gain.value=effects?effectsVolume:0;musicBus.connect(ctx.destination);effectsBus.connect(ctx.destination);}
   if(ctx.state!=='running')await ctx.resume();unlocked=ctx.state==='running';$('audio-status').textContent=unlocked?'':'Tap an audio button again to resume audio.';return unlocked;
  }catch(_){$('audio-status').textContent='Audio is unavailable in this browser. You can still enjoy the game.';return false;}
 }
 function ramp(bus,value){if(!ctx||!bus)return;bus.gain.cancelScheduledValues(ctx.currentTime);bus.gain.setTargetAtTime(value,ctx.currentTime,.06);}
 function voice(note,time,duration,kind,level,bus=musicBus){
  // Quiet harmonics give each new instrument its own color and envelope.
  const partials=kind==='piano'?[[1,1,'sine'],[2,.28,'sine'],[3,.1,'sine']]:kind==='guitar'?[[1,1,'triangle'],[2,.16,'sine']]:kind==='ambient'?[[1,1,'sine'],[1.003,.35,'sine']]:kind==='retro'?[[1,.65,'triangle'],[2,.1,'square']]:[[1,1,kind==='harp'?'triangle':'sine']];
  const attack=kind==='ambient'?Math.min(.6,duration*.3):['harp','bell','piano','guitar','retro'].includes(kind)?.018:.12;
  for(const [multiple,strength,wave] of partials){
  const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type=wave;osc.frequency.value=freq(note)*multiple;
  gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(level*strength,time+attack);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
  osc.connect(gain);gain.connect(bus);osc.start(time);osc.stop(time+duration+.03);
  const v={osc,gain,bus};voices.add(v);osc.onended=()=>{osc.disconnect();gain.disconnect();voices.delete(v);};
  }
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
   const harp=chord[[0,1,2,1,0,2,1,2][step%8]];
   if(t.style==='ambient'){if(step%8===0)for(const n of chord)voice(t.root+n,nextTime,beat*5,'ambient',.018);}
   else if(t.style==='piano'){if(step%2===0)voice(t.root+harp,nextTime,beat*2.2,'piano',.032);}
   else if(t.style==='guitar')voice(t.root+harp,nextTime,beat*1.2,'guitar',.04);
   else if(t.style==='retro')voice(t.root+harp,nextTime,beat*.42,'retro',.032);
   else voice(t.root+harp,nextTime,beat*1.6,'harp',.045);
   if(step%2===0){const phrase=Math.floor(step/2)%32,m=t.melody[phrase];if(m>=0)voice(t.root+(t.style==='ambient'?0:12)+t.scale[m],nextTime+.018,beat*(t.style==='ambient'?3.8:t.style==='retro'?.65:t.lead==='bell'?2.4:1.75),t.lead||'flute',t.style?.045:.065);}
   nextTime+=beat/2;step++;
   // Two 16-bar passes per song, then continue through the playlist without silence.
   if(step===256){step=0;track=(track+1)%tracks.length;save();ui();}
  }
 }
 async function start(){stop();const token=generation;if(!music||document.hidden||!await unlock()||token!==generation||!music||document.hidden)return;playing=true;step=0;nextTime=ctx.currentTime+.1;ramp(musicBus,volume);schedule();interval=setInterval(schedule,100);ui();}
 async function effect(f,d){
  const token=effectsGeneration;
  if(!effects||effectsVolume===0||document.hidden)return;
  if((!ctx||ctx.state!=='running')&&!await unlock())return;
  if(!effects||token!==effectsGeneration||document.hidden)return;
  // Synchronize the actual bus, including when enabling effects after music created it muted.
  ramp(effectsBus,effectsVolume);
  voice(69+12*Math.log2(f/440),ctx.currentTime+.005,Math.max(.15,d),'harp',.1,effectsBus);
 }
 const cues={
  hop:[[72,0,.16,'harp']],nearby:[[67,0,.15,'flute'],[74,.055,.16,'harp']],
  key:[[67,0,.2,'flute',.032],[72,.085,.24,'flute',.028],[76,.17,.28,'flute',.024]],
  unlock:[[48,0,.16,'harp'],[60,.07,.18,'harp'],[76,.13,.28,'bell']],
  spend:[[55,0,.18,'harp',.045],[62,.07,.2,'harp',.035],[50,.15,.25,'harp',.03]],
  locked:[[43,0,.15,'harp'],[42,.08,.17,'harp']],blocked:[[55,0,.16,'harp']],
  springReady:[[64,0,.15,'harp'],[71,.06,.17,'harp']],
  spring:[[60,0,.16,'harp'],[67,.035,.17,'harp'],[76,.07,.2,'flute'],[84,.12,.24,'bell']],
  sun:[[79,0,.2,'bell'],[86,.07,.24,'bell']],star:[[88,0,.18,'bell'],[95,.06,.22,'bell']],
  complete:[[72,0,.22,'harp'],[76,.1,.25,'bell'],[79,.2,.35,'bell']],
  garden:[[60,0,.28,'harp'],[67,.1,.3,'harp'],[72,.2,.35,'bell'],[76,.3,.35,'bell'],[84,.45,.5,'bell']],
  finale:[[60,0,.35,'harp'],[64,0,.35,'harp'],[67,.12,.35,'harp'],[72,.24,.35,'bell'],[76,.36,.4,'bell'],[79,.48,.4,'bell'],[84,.65,.65,'bell']]
 };
 function cue(name){return playCue(cues[name]);}
 function combo(streak){
  if(!Number.isInteger(streak)||streak<1)return;
  const scale=[60,62,64,67,69,72,74,76],pitch=scale[Math.min(streak-1,scale.length-1)];
  const notes=[[pitch,0,.2,'harp',.035]];
  if(streak>=3)notes.push([pitch-12,.015,.24,'piano',.019]);
  if(streak>=6)notes.push([pitch-5,.045,.26,'harp',.018]);
  if(streak>=10)notes.push([pitch+4,.075,.3,'bell',.014]);
  return playCue(notes);
 }
 async function playCue(notes){
  const token=effectsGeneration;if(!notes||!effects||effectsVolume===0||document.hidden)return;
  if((!ctx||ctx.state!=='running')&&!await unlock())return;
  if(!effects||token!==effectsGeneration||document.hidden)return;
  ramp(effectsBus,effectsVolume);
  for(const [pitch,delay,duration,kind,gain=.07] of notes)voice(pitch,ctx.currentTime+.005+delay,duration,kind,gain,effectsBus);
 }
 function muteEffects(){
  if(!ctx)return;ramp(effectsBus,0);
  for(const v of voices)if(v.bus===effectsBus){try{v.gain.gain.cancelScheduledValues(ctx.currentTime);v.gain.gain.setTargetAtTime(.0001,ctx.currentTime,.008);v.osc.stop(ctx.currentTime+.03);}catch(_){}}
 }
 $('song').innerHTML=tracks.map((t,i)=>`<option value="${i}">${t.name}</option>`).join('');
 $('music').onclick=()=>{music=!music;save();ui();if(music)start();else stop();};
 $('sound').onclick=()=>{effects=!effects;effectsGeneration++;save();ui();if(effects)effect(550,.15);else muteEffects();};
 $('song').onchange=()=>{track=Number($('song').value);save();if(music)start();else ui();};
 $('next-song').onclick=()=>{track=(track+1)%tracks.length;save();if(music)start();else ui();};
 $('music-volume').oninput=()=>{volume=Number($('music-volume').value)/100;save();$('music-volume-value').textContent=Math.round(volume*100)+'%';if(playing)ramp(musicBus,volume);};
 $('effects-volume').oninput=()=>{effectsVolume=Number($('effects-volume').value)/100;save();$('effects-volume-value').textContent=Math.round(effectsVolume*100)+'%';if(effects)ramp(effectsBus,effectsVolume);};
 document.addEventListener('pointerdown',()=>{if(music&&!unlocked)start();},{once:true});
 document.addEventListener('keydown',()=>{if(music&&!unlocked)start();},{once:true});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();if(ctx)ctx.suspend();}else if(music&&unlocked)start();});
 window.addEventListener('pagehide',()=>{stop();if(ctx)ctx.suspend();});
 ui();window.TileHopAudio={effect,cue,combo,tracks};
})();
