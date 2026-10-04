'use strict';
const SYMBOLS = ['✿', '◆', '☾', '♣'];
const COLORS = ['#ca805f','#ba983d','#7a8cac','#64875b'];
const NAMES = ['First little steps','A fork in the flowers','Follow the moon','The scenic route','Clover company','A golden detour','Above the treetops','Petal paths','Cloud companions','The long way home','One more little hop','A home in the clouds'];
const $ = id => document.getElementById(id);
let saved = {};
try { saved = JSON.parse(localStorage.getItem('tilehop-v1') || '{}') || {}; } catch (_) {}
let levelIndex = Math.min(11, Math.max(0, Math.floor(Number(saved.level) || 0)));
let records = saved.records && typeof saved.records === 'object' ? saved.records : {};
let level, path, busy = false, sound = false, audio, animationTimer, feedbackTimer;
function random(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
// Every board includes two complete paths. Cross-route choices can require an undo;
// the hint solver checks the entire remaining route, not just the next match.
function makeLevel(index) {
 const rng = random(427 + index * 173), rows = 4 + Math.floor(index / 8), nodes = [];
 const routes = [[], []];
 for (let r = 0; r < rows; r++) {
  const count = index === 0 ? 2 : 3;
  for (let c = 0; c < count; c++) nodes.push({id:`${r}-${c}`,r,c,entry:Math.floor(rng()*4),next:Math.floor(rng()*4),star:false});
  routes[0].push(nodes.find(n=>n.r===r&&n.c===(r%2)));
  routes[1].push(nodes.find(n=>n.r===r&&n.c===(count-1-(r%2))));
 }
 const start = {id:'start',r:-1,c:1,next:index%4,entry:index%4};
 // Build one guaranteed route, then an alternate route where nodes do not overlap.
 let symbol = start.next;
 for (const n of routes[0]) { n.entry=symbol; symbol=n.next; }
 symbol=start.next;
 for(let r=0;r<rows;r++) {const n=routes[1][r]; if(!routes[0].includes(n)) n.entry=symbol; symbol=n.next;}
 for(let r=1;r<rows;r++) {const candidates=nodes.filter(n=>n.r===r); candidates[Math.floor(rng()*candidates.length)].star=true;}
 return {nodes,start,rows};
}
function current(){return path[path.length-1];}
function choices(n){return level.nodes.filter(t=>t.r===n.r+1&&t.entry===n.next);}
function bestRoute(n) {
 if(n.r===level.rows-1)return {score:0,route:[]};
 let best=null;
 for(const t of choices(n)){const rest=bestRoute(t);if(rest){const score=rest.score+(t.star?1:0);if(!best||score>best.score)best={score,route:[t,...rest.route]};}}
 return best;
}
function symbolHTML(s,cls='symbol'){return `<span class="${cls}" style="color:${COLORS[s]}">${SYMBOLS[s]}</span>`;}
function position(n){const height=level.rows===5?400:350;return {x:n.r<0?50: (n.c+1)*100/((levelIndex===0?2:3)+1),y:height-40-(n.r+1)*((height-80)/level.rows)};}
const bunny = '<svg viewBox="0 0 50 60" aria-hidden="true"><ellipse cx="18" cy="17" rx="5" ry="15" fill="#fff9e9" stroke="#bcbfa6"/><ellipse cx="32" cy="15" rx="5" ry="15" fill="#fff9e9" stroke="#bcbfa6"/><path d="M18 7v15M32 5v15" stroke="#e4b5a2" stroke-width="3" stroke-linecap="round"/><ellipse cx="25" cy="43" rx="16" ry="15" fill="#fff9e9" stroke="#bcbfa6"/><ellipse cx="25" cy="31" rx="17" ry="14" fill="#fff9e9" stroke="#bcbfa6"/><circle cx="19" cy="30" r="1.6" fill="#3f5946"/><circle cx="31" cy="30" r="1.6" fill="#3f5946"/><path d="m23 34 2 2 2-2" fill="#cf9686"/><circle cx="15" cy="35" r="3" fill="#edc8af"/><circle cx="35" cy="35" r="3" fill="#edc8af"/><ellipse cx="16" cy="55" rx="7" ry="3" fill="#fff9e9"/><ellipse cx="34" cy="55" rx="7" ry="3" fill="#fff9e9"/></svg>';
function load(index){clearTimeout(animationTimer);clearTimeout(feedbackTimer);levelIndex=index;level=makeLevel(index);path=[level.start];busy=false;render();persist();}
function render(){
 $('level-title').textContent=NAMES[levelIndex];$('chapter').textContent=levelIndex<4?'THE CLOVER GARDEN':levelIndex<8?'ABOVE THE TREETOPS':'THE CLOUD GARDEN';$('levels').textContent=`${String(levelIndex+1).padStart(2,'0')} / 12`;
 const n=current(),board=$('board');board.innerHTML='';$('playfield').style.height=(level.rows===5?400:350)+'px';
 for(const tile of [level.start,...level.nodes]){
  const p=position(tile),b=document.createElement('button');b.className='tile'+(tile.r<n.r?' past':'')+(tile.id===n.id?' current':'');b.style.left=p.x+'%';b.style.top=p.y+'px';b.dataset.id=tile.id;
  const isFinish=tile.r===level.rows-1;
  b.innerHTML=symbolHTML(tile.id===n.id&&!isFinish?tile.next:tile.entry)+(tile.id===n.id||isFinish?'':symbolHTML(tile.next,'next'))+(tile.star?'<span class="star">✦</span>':'');b.setAttribute('aria-label',`${['Flower','Diamond','Moon','Clover'][tile.entry]} tile${isFinish?', finish':`, next match ${['flower','diamond','moon','clover'][tile.next]}`}${tile.star?', with star':''}`);b.disabled=tile.r!==n.r+1;b.onclick=()=>hop(tile);board.append(b);
 }
 const rabbit=document.createElement('div');rabbit.id='rabbit';rabbit.className='rabbit';rabbit.innerHTML=bunny;const p=position(n);rabbit.style.left=p.x+'%';rabbit.style.top=(p.y-19)+'px';board.append(rabbit);
 const finished=n.r===level.rows-1;
 $('progress').style.width=((path.length-1)/level.rows*100)+'%';$('match').innerHTML=finished?'✦':symbolHTML(n.next);$('stars').textContent=path.filter(t=>t.star).length;$('undo').disabled=path.length===1;
 const stuck=choices(n).length===0&&n.r<level.rows-1;
 $('prompt').textContent=finished?'You made it to the top!':stuck?'A little detour!':path.length===1&&levelIndex===0?'Tap a flower to hop':'Find '+['a flower','a diamond','a moon','a clover'][n.next];
 $('subprompt').textContent=finished?'Enjoy the view. Your climb is complete.':stuck?'Undo a hop and try another path.':'Small symbol = your next match. ✦ = bonus star.';
}
function hop(tile){
 if(busy)return;
 const n=current();if(tile.r!==n.r+1)return;
 if(tile.entry!==n.next){const b=document.querySelector(`[data-id="${tile.id}"]`);b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');$('prompt').textContent='Look for the same symbol';clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{if(!busy)render();},1100);tone(160,.08);return;}
 busy=true;clearTimeout(feedbackTimer);const rabbit=$('rabbit'),p=position(tile);rabbit.classList.add('hopping');rabbit.style.left=p.x+'%';rabbit.style.top=(p.y-19)+'px';tone(420+tile.r*65,.12);
 animationTimer=setTimeout(()=>{path.push(tile);busy=false;render();$('announcement').textContent=`Hop ${path.length-1} of ${level.rows}. ${tile.star?'Star collected.':''}`;if(tile.star)celebrate();if(tile.r===level.rows-1)win();},400);
}
function celebrate(){for(let i=0;i<8;i++){const s=document.createElement('span');s.className='confetti';s.textContent='✦';s.style.left=(25+Math.random()*50)+'%';s.style.top=(60+Math.random()*150)+'px';$('playfield').append(s);setTimeout(()=>s.remove(),1100);}}
function persist(){try{localStorage.setItem('tilehop-v1',JSON.stringify({level:levelIndex,records}));}catch(_){}}
function modal(html){$('dialog-content').innerHTML=html;if(!$('dialog').open)$('dialog').showModal();}
function close(){ $('dialog').close(); }
function win(){const stars=path.filter(t=>t.star).length;records[levelIndex]=Math.max(Number(records[levelIndex])||0,stars);persist();celebrate();tone(880,.25);modal(`<div class="big-icon">🌿</div><div class="eyebrow">A LITTLE MOMENT TO CELEBRATE</div><h2>${levelIndex===11?'Home in the clouds!':'Look how far you hopped.'}</h2><p>You finished ${NAMES[levelIndex].toLowerCase()} and gathered ${stars} of ${level.nodes.filter(n=>n.star).length} stars. ${levelIndex===11?'Your garden adventure is complete. Revisit a favourite path to find more stars.':'Another little adventure is waiting.'}</p><button class="primary" id="next-level">${levelIndex===11?'Explore the gardens':'Next little climb →'}</button><button class="secondary" id="again">Try another route</button>`);$('next-level').onclick=()=>{close();if(levelIndex===11)showLevels();else load(levelIndex+1);};$('again').onclick=()=>{close();load(levelIndex);};}
function showLevels(){modal('<div class="eyebrow">YOUR LITTLE ADVENTURE</div><h2>Pick a garden.</h2><p>Explore at your own pace. Every climb is open.</p><div class="level-grid">'+NAMES.map((name,i)=>`<button data-level="${i}" aria-label="Level ${i+1}: ${name}">${String(i+1).padStart(2,'0')}<small>${Object.hasOwn(records,i)?'✓ '+records[i]+' ✦':'·'}</small></button>`).join('')+'</div><button class="secondary" id="close">Back to the climb</button>');document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{close();load(Number(b.dataset.level));});$('close').onclick=close;}
function tone(freq,duration){if(!sound)return;try{audio ||= new (window.AudioContext||window.webkitAudioContext)();audio.resume();const o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(.07,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);o.connect(g);g.connect(audio.destination);o.start();o.stop(audio.currentTime+duration);}catch(_){}}
$('undo').onclick=()=>{if(busy||path.length===1)return;path.pop();render();tone(300,.08);};$('restart').onclick=()=>load(levelIndex);
$('hint').onclick=()=>{if(busy)return;const route=bestRoute(current());if(!route){$('prompt').textContent='Try undoing your last hop';$('announcement').textContent='This path cannot reach the top. Undo your last hop.';return;}const next=route.route[0];if(next){document.querySelector(`[data-id="${next.id}"]`).classList.add('hinted');$('prompt').textContent='This tile leads toward home';}};
$('levels').onclick=showLevels;$('sound').onclick=()=>{sound=!sound;$('sound').innerHTML='♫ <span>'+(sound?'on':'off')+'</span>';$('sound').setAttribute('aria-pressed',String(sound));$('sound').setAttribute('aria-label',sound?'Disable sound':'Enable sound');tone(550,.12);};
$('help').onclick=()=>{modal('<div class="big-icon">☁</div><div class="eyebrow">WELCOME TO TILE HOP</div><h2>A hop, a match, a smile.</h2><p><strong>1.</strong> Look at the big symbol on your current tile.<br><strong>2.</strong> Tap the same symbol in the row just above.<br><strong>3.</strong> After landing, follow the small symbol for your next match.</p><p>Plan ahead using the small symbols on other tiles. Collect stars along the way and reach the top. Wrong taps are harmless; undo is always free. No timer, no rush.</p><button class="primary" id="close">Let’s hop →</button>');$('close').onclick=close;};
load(levelIndex);
// Pure generation and solver helpers are exposed for lightweight offline checks.
window.TileHop={makeLevel,getState:()=>({levelIndex,level,path:[...path],busy}),bestRoute,load};
