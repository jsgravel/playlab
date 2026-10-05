'use strict';
const SYMBOLS = ['✿', '◆', '☾', '♣', '☀'];
const COLORS = ['#ca805f','#ba983d','#7a8cac','#64875b','#b36e9a'];
const SYMBOL_NAMES = ['flower','diamond','moon','clover','sun'];
const GARDENS = [
 {name:'Clover Garden',icon:'🌿',theme:'clover',rule:'Match tiles and find your way to the top.',message:'Every little flower has opened. Your first garden is complete!',titles:[]},
 {name:'Willow Walk',icon:'🍃',theme:'willow',rule:'Willow branches reach only one column sideways. Plan nearby hops.',message:'You found your way through the winding willows!',titles:['A nearby branch','Across the brook','Willow whispers','The winding way','Leaf by leaf','A narrow crossing','Branching thoughts','Bend with the breeze','The quiet bank','Roots and routes','Between the leaves','The willow gate']},
 {name:'Lantern Orchard',icon:'🏮',theme:'lantern',rule:'Collect a key ⚿ before landing on a locked tile ▣. Keys stay with you.',message:'The orchard lanterns are glowing. You opened every garden gate!',titles:['The first little key','An orchard gate','Under the lanterns','Pick your path','A hidden doorway','Golden branches','The keeper’s trail','A key detour','Lantern lanes','Behind the gate','The last orchard key','All lanterns alight']},
 {name:'Cloud Springs',icon:'☁',theme:'cloud',rule:'Land on a spring ↑↑ to jump over the next row. Match two rows above!',message:'You danced over the clouds and brought the springs to life!',titles:['A spring in your step','Above the mist','A gentle lift','Cloud stepping','Over the rainbow','Two rows higher','The floating key','A skyward shortcut','Beyond the drizzle','The cloud crossing','A soft landing','The cloud gateway']},
 {name:'Starlight Sanctuary',icon:'🌙',theme:'starlight',rule:'A fifth symbol, nearby hops, springs, and two-key gates. Take your time.',message:'The sanctuary is shining. Every garden in your adventure is complete!',titles:['The fifth little symbol','Moonlit branches','Two little keys','A starry spring','The patient path','Midnight lanterns','The silver crossing','Constellation climb','A winding wish','The final gateway','Almost among the stars','A home in starlight']}
];
const LEVELS_PER_GARDEN=12,TOTAL_LEVELS=GARDENS.length*LEVELS_PER_GARDEN;
const DESTINATIONS=[{icon:'🏡',name:'The clover treehouse'},{icon:'🌳',name:'The willow lookout'},{icon:'🏮',name:'The lantern pavilion'},{icon:'🪺',name:'The cloud nest'},{icon:'🌙',name:'The starlight home'}];
const NAMES = ['First little steps','A fork in the flowers','Follow the moon','The scenic route','Clover company','A golden detour','Above the treetops','Petal paths','Cloud companions','The long way home','One more little hop','A home in the clouds'];
const $ = id => document.getElementById(id);
let saved = {};
try { saved = JSON.parse(localStorage.getItem('tilehop-v1') || '{}') || {}; } catch (_) {}
let levelIndex = Math.min(TOTAL_LEVELS-1, Math.max(0, Math.floor(Number(saved.level) || 0)));
let records = saved.records && typeof saved.records === 'object' ? saved.records : {};
let tutorialsSeen=saved.tutorialsSeen&&typeof saved.tutorialsSeen==='object'?saved.tutorialsSeen:{};
function validCount(value){return Number.isSafeInteger(value)&&value>=0?value:0;}
function levelFlags(value){return Object.fromEntries(Object.entries(value&&typeof value==='object'?value:{}).filter(([key,v])=>Number.isInteger(Number(key))&&Number(key)>=0&&Number(key)<TOTAL_LEVELS&&v===true));}
const storedStats=saved.stats&&typeof saved.stats==='object'?saved.stats:{};
let stats={undoUses:validCount(storedStats.undoUses),restarts:validCount(storedStats.restarts),flawless:levelFlags(storedStats.flawless),dirty:levelFlags(storedStats.dirty)};
function markError(){stats.dirty[levelIndex]=true;persist();}
let level, path, animationTimer, feedbackTimer;
function completed(index){return Object.hasOwn(records,index);}
function gardenComplete(g){return Array.from({length:12},(_,i)=>completed(g*12+i)).every(Boolean);}
function unlockedGarden(g){return g===0||Array.from({length:g},(_,i)=>gardenComplete(i)).every(Boolean);}
function title(index){return index<12?NAMES[index]:GARDENS[Math.floor(index/12)].titles[index%12];}
function firstUnfinished(g){return Array.from({length:12},(_,i)=>g*12+i).find(i=>!completed(i))??g*12;}
function keyCount(route=path){return route.filter(n=>n.key).length;}
function random(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
// Every board includes a complete path. Cross-route choices can require an undo;
// the hint solver checks the entire remaining route, not just the next match.
function makeLevel(index) {
 if(index>=12)return makeAdvancedLevel(index);
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
 return {nodes,start,rows,count:index===0?2:3,garden:0};
}
function makeAdvancedLevel(index){
 const garden=Math.floor(index/12),local=index%12,rng=random(427+index*173);
 const rows=garden===1?5:garden===2?5+Number(local>=6):garden===3?6:6+Number(local>=6);
 const count=garden<2?3:4,symbols=garden===4?5:4,nodes=[];
 for(let r=0;r<rows;r++)for(let c=0;c<count;c++)nodes.push({id:`${r}-${c}`,r,c,entry:Math.floor(rng()*symbols),next:Math.floor(rng()*symbols),star:false});
 const start={id:'start',r:-1,c:1,entry:index%symbols,next:index%symbols};
 let previous=start,r=0;
 while(r<rows){
  const candidates=nodes.filter(n=>n.r===r&&Math.abs(n.c-previous.c)<=1),n=candidates[Math.floor(rng()*candidates.length)];
  n.entry=previous.next;
  const firstKeyRow=garden===2?(local<6?1:2):garden===3?(local<6?0:3):0;
  if(garden>=2&&r===firstKeyRow)n.key=true;
  if(garden===4&&r===3)n.key=true;
  if(garden>=2&&r===rows-1)n.lock=garden===4?2:1;
  if(garden>=3&&r===1)n.spring=true;
  previous=n;r+=n.spring?2:1;
 }
 // Extra branches have genuine consequences, while the authored backbone remains solvable.
 for(const n of nodes){
  if(garden>=2&&!n.key&&!n.lock&&n.r>1&&rng()<.18)n.lock=garden===4&&n.r>3?2:1;
  if(garden>=3&&n.r===2&&rng()<.35)n.spring=true;
  if(n.r>0&&rng()<.25)n.star=true;
 }
 return {nodes,start,rows,count,garden};
}
function current(){return path[path.length-1];}
function reachable(n,t,keys=keyCount()){return t.r===n.r+(n.spring?2:1)&&(level.garden===0||Math.abs(t.c-n.c)<=1)&&(!t.lock||keys>=t.lock);}
function choices(n,keys=keyCount()){return level.nodes.filter(t=>reachable(n,t,keys)&&t.entry===n.next);}
function bestRoute(n,keys=keyCount()) {
 if(n.r===level.rows-1)return {score:0,route:[]};
 let best=null;
 for(const t of choices(n,keys)){const rest=bestRoute(t,keys+(t.key?1:0));if(rest){const score=rest.score+(t.star?1:0);if(!best||score>best.score)best={score,route:[t,...rest.route]};}}
 return best;
}
function symbolHTML(s,cls='symbol'){return `<span class="${cls}" style="color:${COLORS[s]}">${SYMBOLS[s]}</span>`;}
function mechanicIcon(kind){const drawing=kind==='key'?'<circle cx="7" cy="8" r="4"/><path d="m10 11 9 9m-4-4 3-3m-6 0 3-3"/>':`<rect x="5" y="10" width="14" height="11" rx="3"/><path d="${kind==='open'?'M9 10V6a4 4 0 0 1 8 0':'M8 10V6a4 4 0 0 1 8 0v4'}"/><circle cx="12" cy="15" r="1"/>`;return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</svg>`;}
function boardHeight(){return level.rows*80+115;}
function playWindowHeight(){const immersive=document.body?.classList?.contains?.('immersive'),phone=(window.innerWidth||800)<600;return Math.min(boardHeight(),Math.max(280,Math.min(460,(window.innerHeight||800)-(immersive?230:phone?360:300))));}
function followRabbit(){const p=position(current()),height=playWindowHeight();$('playfield').scrollTop=Math.max(0,Math.min(boardHeight()-height,p.y-height+80));}
function position(n){return {x:n.r<0&&level.garden===0?50:(n.c+1)*100/(level.count+1),y:boardHeight()-40-(n.r+1)*80};}
const bunny = '<svg viewBox="0 0 50 60" aria-hidden="true"><ellipse cx="18" cy="17" rx="5" ry="15" fill="#fff9e9" stroke="#bcbfa6"/><ellipse cx="32" cy="15" rx="5" ry="15" fill="#fff9e9" stroke="#bcbfa6"/><path d="M18 7v15M32 5v15" stroke="#e4b5a2" stroke-width="3" stroke-linecap="round"/><ellipse cx="25" cy="43" rx="16" ry="15" fill="#fff9e9" stroke="#bcbfa6"/><ellipse cx="25" cy="31" rx="17" ry="14" fill="#fff9e9" stroke="#bcbfa6"/><circle cx="19" cy="30" r="1.6" fill="#3f5946"/><circle cx="31" cy="30" r="1.6" fill="#3f5946"/><path d="m23 34 2 2 2-2" fill="#cf9686"/><circle cx="15" cy="35" r="3" fill="#edc8af"/><circle cx="35" cy="35" r="3" fill="#edc8af"/><ellipse cx="16" cy="55" rx="7" ry="3" fill="#fff9e9"/><ellipse cx="34" cy="55" rx="7" ry="3" fill="#fff9e9"/></svg>';
function load(index){if(!Number.isInteger(index)||index<0||index>=TOTAL_LEVELS||!unlockedGarden(Math.floor(index/12)))return false;clearTimeout(animationTimer);clearTimeout(feedbackTimer);levelIndex=index;level=makeLevel(index);path=[level.start];$('rabbit').innerHTML=bunny;$('rabbit').classList.remove('hopping');render();persist();if(!tutorialsSeen[level.garden])showLesson();return true;}
function showLesson(){const g=level.garden;window.TileHopLessons?.show(g,{bunny,icon:mechanicIcon,onSound:cue,onDone:()=>{tutorialsSeen[g]=true;persist();}});}
function render(){
 const garden=GARDENS[level.garden];
 $('level-title').textContent=title(levelIndex);$('chapter').textContent=`${level.garden+1} / ${GARDENS.length} · ${garden.name.toUpperCase()}`;$('levels').textContent=`${String(levelIndex%12+1).padStart(2,'0')} / 12`;
 $('garden-rule').textContent=garden.rule;$('garden-progress').textContent=`${Array.from({length:12},(_,i)=>completed(level.garden*12+i)).filter(Boolean).length} of 12 climbs complete`;
 const n=current(),board=$('board');board.innerHTML='';$('playfield').style.height=playWindowHeight()+'px';board.style.height=boardHeight()+'px';$('playfield').dataset.theme=garden.theme;$('playfield').dataset.columns=String(level.count);
 for(const tile of [level.start,...level.nodes]){
  const p=position(tile),b=document.createElement('button');b.className='tile'+(tile.r<n.r?' past':'')+(tile.id===n.id?' current':'');b.style.left=p.x+'%';b.style.top=p.y+'px';b.dataset.id=tile.id;
  const isFinish=tile.r===level.rows-1;
  if(isFinish)b.classList.add('finish-tile');
  const gateOpened=tile.lock&&path.some(t=>t.id===tile.id);
  b.innerHTML=symbolHTML(tile.id===n.id&&!isFinish?tile.next:tile.entry)+(tile.id===n.id||isFinish?'':symbolHTML(tile.next,'next'))+(tile.star?'<span class="star">✦</span>':'')+((tile.key||tile.lock||tile.spring)?`<span class="mechanic has-icon">${tile.key?mechanicIcon('key'):''}${tile.lock?mechanicIcon(gateOpened?'open':'lock')+`<small>${tile.lock}</small>`:''}${tile.spring?'↑↑':''}</span>`:'');
  if(gateOpened&&tile.id===n.id)b.classList.add('gate-opened');
  b.setAttribute('aria-label',`${SYMBOL_NAMES[tile.entry]} tile${isFinish?', finish':`, next match ${SYMBOL_NAMES[tile.next]}`}${tile.star?', with star':''}${tile.key?', collect a key':''}${tile.lock?`, requires ${tile.lock} keys`:''}${tile.spring?', spring: next jump skips one row':''}`);
  const inRow=tile.r===n.r+(n.spring?2:1),nearby=level.garden===0||Math.abs(tile.c-n.c)<=1;
  b.disabled=!inRow||!nearby;
  if(n.spring&&tile.r===n.r+1)b.classList.add('spring-skipped');
  if(n.spring&&inRow)b.classList.add('spring-landing');
  if(inRow&&!nearby)b.classList.add('out-of-reach');
  if(tile.lock&&keyCount()<tile.lock)b.classList.add('locked');
  b.onclick=()=>hop(tile);board.append(b);
 }
 const destination=document.createElement('div');destination.className='destination'+(n.r===level.rows-1?' arrived':'');destination.innerHTML=`<span>${DESTINATIONS[level.garden].icon}</span><div><small>${n.r===level.rows-1?'WELCOME HOME':'YOUR LITTLE DESTINATION'}</small><strong>${DESTINATIONS[level.garden].name}</strong></div>`;board.append(destination);
 if(n.spring){const marker=document.createElement('div');marker.className='spring-row-label';marker.textContent='↑↑ LAND TWO ROWS ABOVE';marker.style.top=(position({r:n.r+2,c:0}).y-42)+'px';board.append(marker);}
 const rabbit=$('rabbit'),p=position(n);rabbit.style.left=p.x+'%';rabbit.style.top=(p.y-19)+'px';
 const finished=n.r===level.rows-1;
 $('progress').style.width=((path.length-1)/level.rows*100)+'%';$('match').innerHTML=finished?'✦':symbolHTML(n.next);$('stars').textContent=path.filter(t=>t.star).length;$('undo').disabled=path.length===1;
 $('keys').innerHTML=mechanicIcon('key')+`<strong>${keyCount()}</strong>`;$('keys').hidden=level.garden<2;$('keys').setAttribute('aria-label',`${keyCount()} keys collected`);
 const stuck=choices(n).length===0&&n.r<level.rows-1;
 $('prompt').textContent=finished?'You made it to the top!':stuck?'A little detour!':path.length===1&&levelIndex===0?'Tap a flower to hop':'Find a '+SYMBOL_NAMES[n.next];
 $('subprompt').textContent=finished?'Enjoy the view. Your climb is complete.':stuck?'Undo a hop and try another path.':n.spring?'Spring hop! Match two rows above.':level.garden>=2?`⚿ ${keyCount()} ${keyCount()===1?'key':'keys'} collected · ▣ gates need keys.`:level.garden===1?'Stay nearby: at most one column sideways.':'Small symbol = your next match. ✦ = bonus star.';
 followRabbit();
}
function hop(tile){
 const n=current();if(tile.r!==n.r+(n.spring?2:1)||level.garden>0&&Math.abs(tile.c-n.c)>1)return;
 if(tile.lock&&keyCount()<tile.lock){markError();$('prompt').textContent=`This gate needs ${tile.lock} ${tile.lock===1?'key':'keys'}`;$('subprompt').textContent='Undo and take a path through a key tile ⚿.';$('announcement').textContent=$('prompt').textContent;cue('locked');return;}
 if(tile.entry!==n.next){markError();const b=document.querySelector(`[data-id="${tile.id}"]`);b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');$('prompt').textContent='Look for the same symbol';clearTimeout(feedbackTimer);feedbackTimer=setTimeout(render,1100);tone(160,.08);return;}
 clearTimeout(feedbackTimer);clearTimeout(animationTimer);
 // Commit the move immediately. Animation is decoration, never an input lock.
 path.push(tile);render();const rabbit=$('rabbit');rabbit.classList.remove('hopping');void rabbit.offsetWidth;rabbit.classList.add('hopping');
 if(n.spring)cue('spring');else if(tile.lock)cue('unlock');else if(tile.key)cue('key');else if(tile.spring)cue('springReady');else if(tile.entry===4)cue('sun');else if(level.garden===1)cue('nearby');else tone(420+tile.r*65,.12);
 if(tile.key&&(n.spring||tile.lock))cue('key');if(tile.lock&&n.spring)cue('unlock');if(tile.star&&!tile.key&&!tile.lock)cue('star');
 $('announcement').textContent=`Row ${tile.r+1} of ${level.rows}. ${tile.key?'Key collected. ':''}${tile.star?'Star collected.':''}`;
 if(tile.star||tile.key)celebrate();
 if(tile.r===level.rows-1)animationTimer=setTimeout(win,180);
}
function celebrate(){for(let i=0;i<8;i++){const s=document.createElement('span');s.className='confetti';s.textContent='✦';s.style.left=(25+Math.random()*50)+'%';s.style.top=(($('playfield').scrollTop||0)+60+Math.random()*150)+'px';$('playfield').append(s);setTimeout(()=>s.remove(),1100);}}
function persist(){try{localStorage.setItem('tilehop-v1',JSON.stringify({level:levelIndex,records,tutorialsSeen,stats}));}catch(_){}}
function modal(html){$('dialog-content').innerHTML=html;if(!$('dialog').open)$('dialog').showModal();}
function close(){ $('dialog').close(); }
function win(){
 animationTimer=undefined;
 const stars=path.filter(t=>t.star).length,g=level.garden,wasComplete=gardenComplete(g),wasGameComplete=GARDENS.every((_,i)=>gardenComplete(i));
 records[levelIndex]=Math.max(Number(records[levelIndex])||0,stars);if(!stats.dirty[levelIndex])stats.flawless[levelIndex]=true;delete stats.dirty[levelIndex];persist();render();celebrate();
 if(!wasGameComplete&&GARDENS.every((_,i)=>gardenComplete(i))){showFinale();return;}
 if(!wasComplete&&gardenComplete(g)){showGardenWin(g);return;}
 cue('complete');
 const next=Array.from({length:12},(_,i)=>g*12+i).find(i=>!completed(i));
 modal(`<div class="big-icon">${GARDENS[g].icon}</div><div class="eyebrow">A LITTLE MOMENT TO CELEBRATE</div><h2>Look how far you hopped.</h2><p>You reached the top of ${title(levelIndex).toLowerCase()}! ${stars?`You found ${stars===1?'a little star':`${stars} little stars`} along the way. `:''}Another little adventure is waiting.</p><button class="primary" id="next-level">${next===undefined?'Explore the gardens':'Next little climb →'}</button><button class="secondary" id="again">Try another route</button>`);
 $('next-level').onclick=()=>{close();next===undefined?showLevels():load(next);};$('again').onclick=()=>{close();load(levelIndex);};
}
function showGardenWin(g){
 cue('garden');
 modal(`<div class="garden-celebration"><div class="big-icon">${GARDENS[g].icon}</div><div class="eyebrow">ALL 12 CLIMBS COMPLETE</div><h2>${GARDENS[g].name} complete!</h2><p>${GARDENS[g].message}</p>${g<GARDENS.length-1?`<div class="unlock-card"><span>NEW GARDEN UNLOCKED</span><strong>${GARDENS[g+1].icon} ${GARDENS[g+1].name}</strong><p>${GARDENS[g+1].rule}</p></div>`:''}<button class="primary" id="next-garden">${g<GARDENS.length-1?'Enter the next garden →':'Explore the gardens'}</button><button class="secondary" id="garden-map">View your adventure</button></div>`);
 $('next-garden').onclick=()=>{close();g<GARDENS.length-1?load(firstUnfinished(g+1)):showLevels();};$('garden-map').onclick=showLevels;
}
function showFinale(){
 cue('finale');
 celebrate();modal(`<div class="finale"><div class="finale-crown">✦ 🌙 ✦</div><div class="eyebrow">EVERY GARDEN. EVERY LITTLE CLIMB.</div><h2>CONGRATULATIONS!</h2><h3>You beat Tile Hop!</h3><p><strong>Starlight Sanctuary complete!</strong> You completed all <strong>60 levels</strong> across <strong>5 gardens</strong>. From your first flower to your final spring, you found a way through every puzzle.</p><div class="garden-medals">${GARDENS.map(g=>`<span title="${g.name}">${g.icon}</span>`).join('')}</div><p>The whole garden is blooming because of you. Take a moment to enjoy it—you earned this view.</p><button class="primary" id="garden-map">Explore your completed gardens</button><button class="secondary" id="close">Enjoy the view</button></div>`);
 $('garden-map').onclick=showLevels;$('close').onclick=close;
}
function showLevels(selected=level.garden){
 const g=Number.isInteger(selected)?Math.max(0,Math.min(4,selected)):level.garden,open=unlockedGarden(g),done=Array.from({length:12},(_,i)=>completed(g*12+i)).filter(Boolean).length;
 modal(`<div class="eyebrow">YOUR ADVENTURE · ${Object.keys(records).filter(k=>Number(k)>=0&&Number(k)<TOTAL_LEVELS).length} / 60 CLIMBS</div><h2>The garden trail.</h2>${gardenCards(g)}<h3>${GARDENS[g].name}</h3><p>${open?GARDENS[g].rule:`Complete all 12 climbs in ${GARDENS[g-1].name} to unlock this garden.`}</p>${open?`<div class="map-progress">${done} / 12 complete ${done===12?'· Garden blooming!':''}</div><div class="level-grid">${Array.from({length:12},(_,i)=>{const index=g*12+i;return `<button data-level="${index}" aria-label="${title(index)}${completed(index)?', completed':''}">${String(i+1).padStart(2,'0')}<small>${completed(index)?'✓':'·'}</small></button>`;}).join('')}</div>`:'<div class="locked-garden">▣<p>A new adventure is waiting beyond the gate.</p></div>'}${GARDENS.every((_,i)=>gardenComplete(i))?'<button class="primary" id="finale">Celebrate your adventure ✦</button>':''}<button class="secondary" id="close">Back to the climb</button>`);
 // Put dialog focus on the selected garden, rather than the first garden button.
 document.querySelector(`[data-garden="${g}"]`)?.focus?.({preventScroll:true});
 document.querySelectorAll('[data-garden]').forEach(b=>b.onclick=()=>showLevels(Number(b.dataset.garden)));
 document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{close();load(Number(b.dataset.level));});if($('finale'))$('finale').onclick=showFinale;$('close').onclick=close;
}
function gardenCards(selected){return `<div class="garden-tabs garden-cards">${GARDENS.map((garden,i)=>{const count=Array.from({length:12},(_,j)=>completed(i*12+j)).filter(Boolean).length,open=unlockedGarden(i);return `<button data-garden="${i}" class="${i===selected?'selected':''} ${open?'':'card-locked'}" aria-label="${garden.name}, ${open?`${count} of 12 complete`:'locked'}" aria-pressed="${i===selected}"><span>${garden.icon}</span><strong>${garden.name}</strong><small>${count===12?'✓ Garden complete':open?`${count} / 12 climbs${i===level.garden?' · Playing':''}`:`Finish ${GARDENS[i-1].name}`}</small><div class="card-meter"><i style="width:${count/12*100}%"></i></div></button>`;}).join('')}</div>`;}
function tone(freq,duration){window.TileHopAudio?.effect(freq,duration);}
function cue(name){window.TileHopAudio?.cue(name);}
function finishPendingClimb(){if(animationTimer&&current().r===level.rows-1){clearTimeout(animationTimer);win();}}
function showStats(){
 finishPendingClimb();
 const cleared=Array.from({length:TOTAL_LEVELS},(_,i)=>completed(i)).filter(Boolean).length;
 modal(`<div class="eyebrow">YOUR LITTLE ADVENTURE</div><h2>Your stats.</h2><div class="stats-grid"><div><strong>${stats.undoUses}</strong><span>Undo uses</span></div><div><strong>${stats.restarts}</strong><span>Level restarts</span></div><div><strong>${Object.keys(stats.flawless).length}</strong><span>Flawless levels</span></div><div><strong>${cleared} / ${TOTAL_LEVELS}</strong><span>Levels completed</span></div></div><p>A flawless level is a climb completed without a wrong match, blocked-gate tap, undo, or restart. Each level counts once; a clean replay can earn its flawless mark.</p><p>Hints are welcome and do not count as mistakes. These stats started tracking with this update; earlier clears keep their progress, but have no recorded flawless result.</p><button class="secondary" id="reset-from-stats">Restart entire game…</button><button class="primary" id="close">Back to the garden</button>`);
 $('reset-from-stats').onclick=warnReset;$('close').onclick=close;
}
function warnReset(){
 finishPendingClimb();
 modal('<div class="big-icon">↻</div><div class="eyebrow">START A BRAND-NEW ADVENTURE?</div><h2>Restart the entire game?</h2><p>This will erase <strong>all completed levels, unlocked gardens, collected star records, tutorial acknowledgements, and statistics</strong> saved in this browser.</p><p><strong>This cannot be undone.</strong> You’ll return to level 1 in Clover Garden. Your music and effects preferences will stay.</p><button class="primary" id="cancel-reset" autofocus>Keep my progress</button><button class="danger" id="confirm-reset">Yes, erase progress and restart</button>');
 $('cancel-reset').onclick=close;$('confirm-reset').onclick=()=>{
  clearTimeout(animationTimer);clearTimeout(feedbackTimer);window.TileHopLessons?.cleanup();$('lesson-dialog').close();close();
  records={};tutorialsSeen={};stats={undoUses:0,restarts:0,flawless:{},dirty:{}};load(0);$('announcement').textContent='Game restarted. Welcome back to Clover Garden.';
 };
 $('cancel-reset').focus?.({preventScroll:true});
}
$('undo').onclick=()=>{if(path.length===1)return;stats.undoUses++;markError();clearTimeout(animationTimer);clearTimeout(feedbackTimer);path.pop();render();tone(300,.08);};$('restart').onclick=()=>{stats.restarts++;markError();load(levelIndex);};
$('stats').onclick=showStats;$('reset-game').onclick=warnReset;
$('hint').onclick=()=>{const route=bestRoute(current());if(!route){$('prompt').textContent='Try undoing your last hop';$('announcement').textContent='This path cannot reach the top. Undo your last hop.';return;}const next=route.route[0];if(next){document.querySelector(`[data-id="${next.id}"]`).classList.add('hinted');$('prompt').textContent='This tile leads toward home';}};
$('levels').onclick=()=>showLevels();
$('help').onclick=()=>{modal('<div class="big-icon">☁</div><div class="eyebrow">WELCOME TO TILE HOP</div><h2>A hop, a match, a smile.</h2><p><strong>1.</strong> Look at the big symbol on your current tile.<br><strong>2.</strong> Tap the same symbol in the next reachable row.<br><strong>3.</strong> The small symbol previews your next match.</p><p>Reach the top to complete your climb. Stars are optional little discoveries. Wrong taps are harmless; undo is always free. No timer, no rush.</p><button class="primary" id="review-lesson">Show this garden’s example</button><button class="secondary" id="close">Let’s hop →</button>');$('review-lesson').onclick=()=>{close();showLesson();};$('close').onclick=close;};
if(!unlockedGarden(Math.floor(levelIndex/12)))levelIndex=firstUnfinished(0);
load(levelIndex);
window.addEventListener?.('resize',()=>render());
// Pure generation and solver helpers are exposed for lightweight offline checks.
window.TileHop={makeLevel,getState:()=>({levelIndex,level,path:[...path],records:{...records}}),bestRoute,load,completed,gardenComplete,unlockedGarden,showLevels};
