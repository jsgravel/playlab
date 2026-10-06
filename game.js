'use strict';
const SYMBOLS = ['✿', '◆', '☾', '♣', '☀'];
const COLORS = ['#ca805f','#ba983d','#7a8cac','#64875b','#b36e9a'];
const SYMBOL_NAMES = ['flower','diamond','moon','clover','sun'];
const GARDENS = [
 {name:'Clover Garden',icon:'🌿',theme:'clover',rule:'Match tiles and find your way to the top.',message:'Every little flower has opened. Your first garden is complete!',titles:[]},
 {name:'Willow Walk',icon:'🍃',theme:'willow',rule:'Willow branches reach only one column sideways. Plan nearby hops.',message:'You found your way through the winding willows!',titles:['A nearby branch','Across the brook','Willow whispers','The winding way','Leaf by leaf','A narrow crossing','Branching thoughts','Bend with the breeze','The quiet bank','Roots and routes','Between the leaves','The willow gate']},
 {name:'Lantern Orchard',icon:'🏮',theme:'lantern',rule:'Collect a key ⚿ before landing on a locked tile ▣. Keys stay with you.',message:'The orchard lanterns are glowing. You opened every garden gate!',titles:['The first little key','An orchard gate','Under the lanterns','Pick your path','A hidden doorway','Golden branches','The keeper’s trail','A key detour','Lantern lanes','Behind the gate','The last orchard key','All lanterns alight']},
 {name:'Cloud Springs',icon:'☁',theme:'cloud',rule:'Land on a spring ↑↑ to jump over the next row. Match two rows above!',message:'You danced over the clouds and brought the springs to life!',titles:['A spring in your step','Above the mist','A gentle lift','Cloud stepping','Over the rainbow','Two rows higher','The floating key','A skyward shortcut','Beyond the drizzle','The cloud crossing','A soft landing','The cloud gateway']},
 {name:'Starlight Sanctuary',icon:'🌙',theme:'starlight',rule:'A fifth symbol, nearby hops, springs, and two-key gates. Take your time.',message:'The sanctuary is shining. Every garden in your adventure is complete!',titles:['The fifth little symbol','Moonlit branches','Two little keys','A starry spring','The patient path','Midnight lanterns','The silver crossing','Constellation climb','A winding wish','The final gateway','Almost among the stars','A home in starlight']},
 {name:'Copper Grove',icon:'🍂',theme:'copper',rule:'Copper gates spend keys. Look beyond the next match and save enough for the gate ahead.',message:'You balanced every key and opened the copper grove!',titles:['A key spent wisely','The copper toll','Two tempting branches','Beyond the first gate','A key around the bend','The patient detour','Save one for later','A costly shortcut','Branch by branch','The quiet accountant','Enough for home','The copper crown']},
 {name:'Crystal Labyrinth',icon:'💎',theme:'crystal',rule:'Longer forks and two-key copper gates. Trace both routes and budget keys before you hop.',message:'Every winding route led you home. You mastered the crystal labyrinth!',titles:['Into the labyrinth','A distant gate','Follow the resources','The long fork','A crystal detour','The second toll','Two keys to spare','Beyond the shimmer','A winding budget','Four little decisions','The deepest branches','The final crystal gate']}
];
const LEVELS_PER_GARDEN=12,TOTAL_LEVELS=GARDENS.length*LEVELS_PER_GARDEN;
const DESTINATIONS=[{icon:'🏡',name:'The clover treehouse'},{icon:'🌳',name:'The willow lookout'},{icon:'🏮',name:'The lantern pavilion'},{icon:'🪺',name:'The cloud nest'},{icon:'🌙',name:'The starlight home'},{icon:'🍁',name:'The copper lodge'},{icon:'💎',name:'The crystal palace'}];
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
let stats={undoUses:validCount(storedStats.undoUses),restarts:validCount(storedStats.restarts),bestCombo:validCount(storedStats.bestCombo),failedHard:validCount(storedStats.failedHard),easyRestarts:validCount(storedStats.easyRestarts),hardRestarts:validCount(storedStats.hardRestarts),flawless:levelFlags(storedStats.flawless),dirty:levelFlags(storedStats.dirty)};
let combo=0,comboSeen=saved.comboSeen===true;
let assistSeen=saved.assistSeen&&typeof saved.assistSeen==='object'?saved.assistSeen:{};
let hardAttempts=saved.hardAttempts&&typeof saved.hardAttempts==='object'?saved.hardAttempts:{},attempt=null;
function assistLimits(g=level?.garden){return g===5?{undo:3,hint:2}:g===6?{undo:2,hint:1}:null;}
function recordHardFailure(){if(!attempt||attempt.failed)return;attempt.failed=true;stats.failedHard++;stats.dirty[levelIndex]=true;combo=0;}
function showFailure(reason){
 recordHardFailure();clearTimeout(animationTimer);clearTimeout(feedbackTimer);arrival='failed';
 $('arrival-panel').innerHTML=`<div class="eyebrow">HARD CLIMB · ATTEMPT ENDED</div><h2>A fresh start?</h2><p>${reason} This attempt counts as a failed hard level.</p><button class="primary" id="retry-hard">Restart this level →</button>`;
 $('retry-hard').onclick=()=>{stats.restarts++;stats.hardRestarts++;load(levelIndex,true);};render();persist();
}
function checkNoRecovery(){if(attempt&&!attempt.failed&&attempt.undoLeft===0&&current().r<level.rows-1&&choices(current()).length===0)showFailure('This route has no matching exit, and no undos remain.');}

function markError(){stats.dirty[levelIndex]=true;combo=0;updateCombo();persist();}
let level, path, animationTimer, feedbackTimer,arrival=null;
function updateCombo(){if(!level)return;const active=level.garden>=2,tier=combo>=10?'starlight':combo>=6?'bloom':combo>=3?'bud':'seed';$('combo-bar').hidden=!active;$('combo-count').textContent=combo+'×';$('combo-label').textContent=combo>=10?'Starlight flow':combo>=6?'In full bloom':combo>=3?'Finding your rhythm':combo?'A lovely start':'A fresh little streak';$('combo-bar').dataset.tier=tier;$('playfield').dataset.combo=active?tier:'seed';}
function comboSparkles(){if(combo<3)return;const count=combo>=10?8:combo>=6?4:2,p=position(current());for(let i=0;i<count;i++){const s=document.createElement('span');s.className='combo-spark';s.textContent=combo>=10?'✦':'✧';s.style.left=`calc(${p.x}% + ${(i-count/2)*11}px)`;s.style.top=(p.y-35)+'px';$('playfield').append(s);setTimeout(()=>s.remove(),650);}}
function completed(index){return Object.hasOwn(records,index);}
function gardenComplete(g){return Array.from({length:12},(_,i)=>completed(g*12+i)).every(Boolean);}
function unlockedGarden(g){return g===0||Array.from({length:g},(_,i)=>gardenComplete(i)).every(Boolean);}
function title(index){return index<12?NAMES[index]:GARDENS[Math.floor(index/12)].titles[index%12];}
function firstUnfinished(g){return Array.from({length:12},(_,i)=>g*12+i).find(i=>!completed(i))??g*12;}
function nextKeys(keys,tile){return keys+(tile.key?1:0)-(tile.spend?tile.lock:0);}
function keyCount(route=path){return route.reduce((keys,tile)=>nextKeys(keys,tile),0);}
function random(seed) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }; }
// Every board includes a complete path. Cross-route choices can require an undo;
// the hint solver checks the entire remaining route, not just the next match.
function makeLevel(index) {
 if(index>=60)return makeChallengeLevel(index);
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
 const rows=[0,5,8,10,12][garden]+Math.floor(local/4);
 const count=garden<2?3:4,symbols=garden===4?5:4,nodes=[];
 for(let r=0;r<rows;r++)for(let c=0;c<count;c++)nodes.push({id:`${r}-${c}`,r,c,entry:Math.floor(rng()*symbols),next:Math.floor(rng()*symbols),star:false});
 const start={id:'start',r:-1,c:1,entry:index%symbols,next:index%symbols};
 const backbone=[],pattern=[1,0,1,2,1,2,3,2,1,0,1,2,3,2];let previous=start,r=0;
 while(r<rows){
  let target=Math.min(count-1,pattern[(r+local%3)%pattern.length]);if(local%2)target=count-1-target;
  target=Math.max(previous.c-1,Math.min(previous.c+1,target));const n=nodes.find(t=>t.r===r&&t.c===target);
  n.entry=previous.next;
  const firstKeyRow=garden===2?2+local%3:garden===3?(local<4?0:3):0;
  if(garden>=2&&r===firstKeyRow)n.key=true;
  if(garden===4&&r===7)n.key=true;
  if(garden>=2&&r===rows-1)n.lock=garden===4?2:1;
  if(garden>=3&&(r===1||r>=5&&(r-1)%4===0)&&r<rows-2)n.spring=true;
  backbone.push(n);previous=n;r+=n.spring?2:1;
 }
 // Extra branches have genuine consequences, while the authored backbone remains solvable.
 for(const n of nodes){
  if(!backbone.includes(n)&&garden>=2&&n.r>4&&rng()<.16)n.lock=garden===4&&n.r>7?2:1;
  if(!backbone.includes(n)&&garden>=3&&n.r<rows-2&&rng()<.12)n.spring=true;
  if(n.r>0&&rng()<.14)n.star=true;
 }
 // Deliberate forks: some merge back, others match now but cannot continue.
 let forks=0;
 for(let i=0;i<backbone.length-1;i++){
  if(i%3!==local%3)continue;
  const good=backbone[i],prev=i?backbone[i-1]:start,next=backbone[i+1];
  const branch=nodes.find(t=>t.r===good.r&&t.c!==good.c&&Math.abs(t.c-prev.c)<=1&&Math.abs(t.c-next.c)<=1)||nodes.find(t=>t.r===good.r&&t.c!==good.c&&Math.abs(t.c-prev.c)<=1);
  if(!branch)continue;branch.entry=good.entry;branch.spring=good.spring;branch.key=false;branch.lock=0;
  if(!good.key&&(i+local)%2===0){branch.next=good.next;}else{
   const ahead=nodes.filter(t=>t.r===branch.r+(branch.spring?2:1)&&Math.abs(t.c-branch.c)<=1);
   branch.next=Array.from({length:symbols},(_,s)=>s).find(s=>ahead.every(t=>t.entry!==s))??good.next;
  }
  forks++;
 }
 return {nodes,start,rows,count,garden,forks};
}
// Authored resource forks: both branches keep matching for several hops.
// Their key budgets differ only deeper in the corridor, before a shared toll.
function makeChallengeLevel(index){
 const garden=Math.floor(index/12),local=index%12,rng=random(427+index*173);
 const modules=garden===5?(local<4?2:3):(local<8?3:4);
 const depth=(garden===5?3:4)+Math.floor(local/4),gateCost=garden===5?1:2;
 const rows=modules*(depth+2),count=4,nodes=[];
 const start={id:'start',r:-1,c:1,entry:index%5,next:index%5};let previous=start;
 function tile(r,c){let n=nodes.find(t=>t.r===r&&t.c===c);if(!n){n={id:`${r}-${c}`,r,c,entry:Math.floor(rng()*5),next:Math.floor(rng()*5),star:false};nodes.push(n);}return n;}
 for(let block=0;block<modules;block++){
  const base=block*(depth+2),mirror=rng()<.5;
  const good=[],other=[];
  for(let j=0;j<depth;j++){
   const edge=j===0||j===depth-1;
   const a=edge?previous.c+(mirror?1:-1):(mirror?3:0),b=edge?previous.c+(mirror?-1:1):(mirror?0:3);
   const g=tile(base+j,a),bad=tile(base+j,b);
   g.entry=j===0?previous.next:good[j-1].next;
   bad.entry=j===0?previous.next:other[j-1].next;
   // Separate next symbols where the branches could reach one another.
   if(j>0&&g.entry===bad.entry){bad.entry=(bad.entry+1)%5;other[j-1].next=bad.entry;}
   good.push(g);other.push(bad);
  }
  const merge=tile(base+depth,previous.c),gate=tile(base+depth+1,rng()<.5?1:2);
  merge.entry=good.at(-1).next;other.at(-1).next=merge.entry;
  gate.entry=merge.next;gate.lock=gateCost;gate.spend=true;
  // First grove puzzles demonstrate spending; later forks hide the replacement
  // key farther ahead. Both routes otherwise offer the same valid matches.
  if(garden===5&&local<4){good[0].key=true;other[0].key=true;other[1].lock=1;other[1].spend=true;}
  else{
   const initial=gateCost,spend= garden===6&&local>=8?2:1;
   for(let j=0;j<initial;j++){good[j].key=true;other[j].key=true;}
   const tollRow=initial;good[tollRow].lock=spend;good[tollRow].spend=true;other[tollRow].lock=spend;other[tollRow].spend=true;
   for(let j=0;j<spend;j++)good[depth-1-j].key=true;
   if(spend===2)other[depth-1].key=true;
  }
  good.forEach(n=>{if(rng()<.17)n.star=true;});other.forEach(n=>{if(rng()<.3)n.star=true;});
  previous=gate;
 }
 // Fill spare spaces with harmless decoys; they never add a matching exit.
 for(let r=0;r<rows;r++)for(let c=0;c<count;c++){
  if(nodes.some(n=>n.r===r&&n.c===c))continue;
  const incoming=[start,...nodes].filter(n=>n.r===r-1&&Math.abs(n.c-c)<=1).map(n=>n.next);
  const symbol=[0,1,2,3,4].find(v=>!incoming.includes(v));
  if(symbol===undefined)continue;const n=tile(r,c);n.entry=symbol;
 }
 return {nodes,start,rows,count,garden,forks:modules,planningDepth:depth};
}
function current(){return path[path.length-1];}
function reachable(n,t,keys=keyCount()){return t.r===n.r+(n.spring?2:1)&&(level.garden===0||Math.abs(t.c-n.c)<=1)&&(!t.lock||keys>=t.lock);}
function choices(n,keys=keyCount()){return level.nodes.filter(t=>reachable(n,t,keys)&&t.entry===n.next);}
function bestRoute(n,keys=keyCount()) {
 const memo=new Map();
 function visit(tile,k){const id=tile.id+':'+k;if(memo.has(id))return memo.get(id);if(tile.r===level.rows-1)return {score:0,route:[]};let best=null;for(const t of choices(tile,k)){const rest=visit(t,nextKeys(k,t));if(rest){const score=rest.score+(t.star?1:0);if(!best||score>best.score)best={score,route:[t,...rest.route]};}}memo.set(id,best);return best;}
 return visit(n,keys);
}
function symbolHTML(s,cls='symbol'){return `<span class="${cls}" style="color:${COLORS[s]}">${SYMBOLS[s]}</span>`;}
function mechanicIcon(kind){const drawing=kind==='key'?'<circle cx="7" cy="8" r="4"/><path d="m10 11 9 9m-4-4 3-3m-6 0 3-3"/>':`<rect x="5" y="10" width="14" height="11" rx="3"/><path d="${kind==='open'?'M9 10V6a4 4 0 0 1 8 0':'M8 10V6a4 4 0 0 1 8 0v4'}"/><circle cx="12" cy="15" r="1"/>`;return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${drawing}</svg>`;}
function boardHeight(){return level.rows*80+155;}
function playWindowHeight(){const immersive=document.body?.classList?.contains?.('immersive'),phone=(window.innerWidth||800)<600;return Math.min(boardHeight(),Math.max(arrival?160:260,Math.min(460,(window.innerHeight||800)-(immersive?290:phone?410:300)-(level.garden>=2?42:0))));}
let cameraTile,cameraTarget;
function followRabbit(smooth=true){
 const frame=$('playfield'),n=current(),p=position(n),height=parseFloat(frame.style.height)||playWindowHeight();
 const top=Math.max(0,Math.min(boardHeight()-height,p.y-height+72));
 // Repainting HUD or the completion message must not interrupt an ongoing glide.
 if(smooth&&cameraTile===n&&cameraTarget===top)return;
 cameraTile=n;cameraTarget=top;
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(frame.scrollTo)frame.scrollTo({top,behavior:smooth&&!reduced?'smooth':'instant'});
 else frame.scrollTop=top;
}
function position(n){return {x:n.r<0&&level.garden===0?50:(n.c+1)*100/(level.count+1),y:boardHeight()-40-(n.r+1)*80};}
const bunny = '<svg viewBox="0 0 50 60" aria-hidden="true"><ellipse cx="18" cy="17" rx="5" ry="15" fill="#fff9e9" stroke="#bcbfa6"/><ellipse cx="32" cy="15" rx="5" ry="15" fill="#fff9e9" stroke="#bcbfa6"/><path d="M18 7v15M32 5v15" stroke="#e4b5a2" stroke-width="3" stroke-linecap="round"/><ellipse cx="25" cy="43" rx="16" ry="15" fill="#fff9e9" stroke="#bcbfa6"/><ellipse cx="25" cy="31" rx="17" ry="14" fill="#fff9e9" stroke="#bcbfa6"/><circle cx="19" cy="30" r="1.6" fill="#3f5946"/><circle cx="31" cy="30" r="1.6" fill="#3f5946"/><path d="m23 34 2 2 2-2" fill="#cf9686"/><circle cx="15" cy="35" r="3" fill="#edc8af"/><circle cx="35" cy="35" r="3" fill="#edc8af"/><ellipse cx="16" cy="55" rx="7" ry="3" fill="#fff9e9"/><ellipse cx="34" cy="55" rx="7" ry="3" fill="#fff9e9"/></svg>';
function load(index,fresh=false){
 if(!Number.isInteger(index)||index<0||index>=TOTAL_LEVELS||!unlockedGarden(Math.floor(index/12)))return false;
 clearTimeout(animationTimer);clearTimeout(feedbackTimer);levelIndex=index;level=makeLevel(index);path=[level.start];combo=0;arrival=null;
 const limits=assistLimits();attempt=null;
 if(limits){
  const old=!fresh&&hardAttempts[index];
  attempt={undoLeft:Number.isInteger(old?.undoLeft)?Math.max(0,Math.min(limits.undo,old.undoLeft)):limits.undo,hintLeft:Number.isInteger(old?.hintLeft)?Math.max(0,Math.min(limits.hint,old.hintLeft)):limits.hint,failed:old?.failed===true,hintFor:typeof old?.hintFor==='string'?old.hintFor:null};
  if(Array.isArray(old?.pathIds))for(const id of old.pathIds.slice(0,40)){const tile=level.nodes.find(t=>t.id===id);if(!tile||!reachable(current(),tile)||tile.entry!==current().next)break;path.push(tile);}
 }
 $('arrival-panel').hidden=true;$('rabbit').classList.remove('celebrating');$('rabbit').innerHTML=bunny;$('rabbit').classList.remove('hopping');
 if(attempt?.failed)showFailure('This hard-level attempt has ended. Restart to refill your assists.');else{render(false);persist();}
 if(!attempt?.failed&&(!tutorialsSeen[level.garden]||level.garden>=2&&!comboSeen||limits&&!assistSeen[level.garden]))showLesson();
 return true;
}
function showLesson(g=level.garden,preview=false){window.TileHopLessons?.show(g,{bunny,icon:mechanicIcon,onSound:cue,onDone:()=>{if(preview){showLevels(g);return;}tutorialsSeen[g]=true;if(g>=2)comboSeen=true;if(g>=5)assistSeen[g]=true;persist();}});}
function render(smooth=true){
 const garden=GARDENS[level.garden];
 $('arrival-panel').hidden=!arrival;$('instruction').hidden=!!arrival;$('hop-controls').hidden=!!arrival;
 $('level-title').textContent=title(levelIndex);$('chapter').textContent=`${level.garden+1} / ${GARDENS.length} · ${garden.name.toUpperCase()}`;$('levels').textContent=`${String(levelIndex%12+1).padStart(2,'0')} / 12`;
 $('garden-rule').textContent=garden.rule;$('garden-progress').textContent=`${Array.from({length:12},(_,i)=>completed(level.garden*12+i)).filter(Boolean).length} of 12 climbs complete`;
 const n=current(),board=$('board');board.innerHTML='';$('playfield').style.height=playWindowHeight()+'px';board.style.height=boardHeight()+'px';$('playfield').dataset.theme=garden.theme;$('playfield').dataset.columns=String(level.count);
 for(const tile of [level.start,...level.nodes]){
  const p=position(tile),b=document.createElement('button');b.className='tile'+(tile.spend?' copper-gate':'')+(tile.r<n.r?' past':'')+(tile.id===n.id?' current':'');b.style.left=p.x+'%';b.style.top=p.y+'px';b.dataset.id=tile.id;
  const isFinish=tile.r===level.rows-1;
  if(isFinish)b.classList.add('finish-tile');
  const gateOpened=tile.lock&&path.some(t=>t.id===tile.id),gateReady=tile.lock&&keyCount()>=tile.lock;
  if(gateOpened||gateReady)b.classList.add('gate-ready');
  b.innerHTML=symbolHTML(tile.id===n.id&&!isFinish?tile.next:tile.entry)+(tile.id===n.id||isFinish?'':symbolHTML(tile.next,'next'))+(tile.star?'<span class="star">✦</span>':'')+((tile.key||tile.lock||tile.spring)?`<span class="mechanic has-icon">${tile.key?mechanicIcon('key'):''}${tile.lock?mechanicIcon(gateOpened||gateReady?'open':'lock')+`<small>${tile.spend?'−':''}${tile.lock}</small>`:''}${tile.spring?'↑↑':''}</span>`:'');
  if(gateOpened&&tile.id===n.id)b.classList.add('gate-opened');
  b.setAttribute('aria-label',`${SYMBOL_NAMES[tile.entry]} tile${isFinish?', finish':`, next match ${SYMBOL_NAMES[tile.next]}`}${tile.star?', with star':''}${tile.key?', collect a key':''}${tile.lock?`, ${gateOpened?'opened':gateReady?'ready to open':'locked'}, requires ${tile.lock} keys${tile.spend?', spends these keys':''}`:''}${tile.spring?', spring: next jump skips one row':''}`);
  const inRow=tile.r===n.r+(n.spring?2:1),nearby=level.garden===0||Math.abs(tile.c-n.c)<=1;
  b.disabled=!inRow||!nearby;
  if(n.spring&&tile.r===n.r+1)b.classList.add('spring-skipped');
  if(n.spring&&inRow)b.classList.add('spring-landing');
  if(inRow&&!nearby)b.classList.add('out-of-reach');
  if(tile.lock&&!gateOpened&&keyCount()<tile.lock)b.classList.add('locked');
  b.onclick=()=>hop(tile);board.append(b);
 }
 const destination=document.createElement('div');destination.className='destination'+(n.r===level.rows-1?' arrived':'');destination.innerHTML=`<span>${DESTINATIONS[level.garden].icon}</span><div><small>${n.r===level.rows-1?'WELCOME HOME':'YOUR LITTLE DESTINATION'}</small><strong>${DESTINATIONS[level.garden].name}</strong></div>`;board.append(destination);
 if(n.spring){const marker=document.createElement('div');marker.className='spring-row-label';marker.textContent='↑↑ LAND TWO ROWS ABOVE';marker.style.top=(position({r:n.r+2,c:0}).y-42)+'px';board.append(marker);}
 const rabbit=$('rabbit'),p=position(n);rabbit.style.left=p.x+'%';rabbit.style.top=(p.y-19)+'px';
 const finished=n.r===level.rows-1;
 $('progress').style.width=((n.r+1)/level.rows*100)+'%';$('match').innerHTML=finished?'✦':symbolHTML(n.next);$('stars').textContent=path.filter(t=>t.star).length;$('undo').disabled=path.length===1;
 $('undo').innerHTML='↶ <span>Undo'+(attempt?` · ${attempt.undoLeft}`:'')+'</span>';$('hint').innerHTML='☀ <span>Hint'+(attempt?` · ${attempt.hintLeft}`:'')+'</span>';
 $('undo').setAttribute('aria-label',attempt?`Undo, ${attempt.undoLeft} remaining`:'Undo');$('hint').setAttribute('aria-label',attempt?`Hint, ${attempt.hintLeft} remaining`:'Hint');
 $('assist-status').hidden=!attempt||!!arrival;$('assist-status').textContent=attempt?`Hard climb · ${attempt.undoLeft} undos / ${attempt.hintLeft} hints left · Need more? Restart required.`:'';
 $('keys').innerHTML=mechanicIcon('key')+`<strong>${keyCount()}</strong>`;$('keys').hidden=level.garden<2;$('keys').setAttribute('aria-label',`${keyCount()} keys available`);
 const stuck=choices(n).length===0&&n.r<level.rows-1;
 $('prompt').textContent=finished?'You made it to the top!':stuck?'A little detour!':path.length===1&&levelIndex===0?'Tap a flower to hop':'Find a '+SYMBOL_NAMES[n.next];
 $('subprompt').textContent=finished?'Enjoy the view. Your climb is complete.':stuck?'Undo a hop and try another path.':n.spring?'Spring hop! Match two rows above.':level.garden>=2?`⚿ ${keyCount()} ${keyCount()===1?'key':'keys'} ${level.garden>=5?'available · Copper gates spend keys.':'collected · ▣ gates need keys.'}`:level.garden===1?'Stay nearby: at most one column sideways.':'Small symbol = your next match. ✦ = bonus star.';
 const frame=$('playfield').getBoundingClientRect?.();if(frame&&window.innerHeight){const lower=['.instruction','.controls','.arrival-panel','#assist-status'].reduce((sum,selector)=>sum+(document.querySelector(selector)?.getBoundingClientRect?.().height||0),0);$('playfield').style.height=Math.min(boardHeight(),Math.max(arrival?160:260,Math.min(460,window.innerHeight-Math.max(0,frame.top)-lower-8)))+'px';}
 followRabbit(smooth);
 updateCombo();
}
function hop(tile){
 if(attempt?.failed||arrival)return;
 const n=current();if(tile.r!==n.r+(n.spring?2:1)||level.garden>0&&Math.abs(tile.c-n.c)>1)return;
 if(tile.lock&&keyCount()<tile.lock){markError();$('prompt').textContent=`This gate needs ${tile.lock} ${tile.lock===1?'key':'keys'}`;$('subprompt').textContent=level.garden>=5?'Undo to the fork. Check the keys collected and spent on each route.':'Undo and take a path through a key tile ⚿.';$('announcement').textContent=$('prompt').textContent;cue('locked');return;}
 if(tile.entry!==n.next){markError();const b=document.querySelector(`[data-id="${tile.id}"]`);b.classList.remove('wrong');void b.offsetWidth;b.classList.add('wrong');$('prompt').textContent='Look for the same symbol';clearTimeout(feedbackTimer);feedbackTimer=setTimeout(render,1100);tone(160,.08);return;}
 clearTimeout(feedbackTimer);clearTimeout(animationTimer);
 // Commit the move immediately. Animation is decoration, never an input lock.
 path.push(tile);if(attempt)attempt.hintFor=null;if(level.garden>=2){combo++;stats.bestCombo=Math.max(stats.bestCombo,combo);persist();}render();const rabbit=$('rabbit');rabbit.classList.remove('hopping');void rabbit.offsetWidth;rabbit.classList.add('hopping');comboSparkles();
 if(n.spring)cue('spring');else if(tile.spend)cue('spend');else if(tile.lock)cue('unlock');else if(tile.key)cue('key');else if(tile.spring)cue('springReady');else if(tile.entry===4)cue('sun');else if(level.garden===1)cue('nearby');else if(level.garden<2)tone(420+tile.r*65,.12);
 if(level.garden>=2)window.TileHopAudio?.combo?.(combo);
 if(tile.key&&(n.spring||tile.lock))cue('key');if(tile.lock&&n.spring)cue('unlock');if(tile.star&&!tile.key&&!tile.lock)cue('star');
 $('announcement').textContent=`Row ${tile.r+1} of ${level.rows}. ${tile.key?'Key collected. ':''}${tile.spend?`${tile.lock} keys spent. `:''}${tile.star?'Star collected.':''}`;
 if(tile.star||tile.key)celebrate();
 if(tile.r===level.rows-1)animationTimer=setTimeout(win,180);else checkNoRecovery();
}
function celebrate(){for(let i=0;i<8;i++){const s=document.createElement('span');s.className='confetti';s.textContent='✦';s.style.left=(25+Math.random()*50)+'%';s.style.top=(($('playfield').scrollTop||0)+60+Math.random()*150)+'px';$('playfield').append(s);setTimeout(()=>s.remove(),1100);}}
function persist(){if(level&&attempt){if(current().r===level.rows-1&&!attempt.failed)delete hardAttempts[levelIndex];else hardAttempts[levelIndex]={...attempt,pathIds:path.slice(1).map(t=>t.id)};}try{localStorage.setItem('tilehop-v1',JSON.stringify({level:levelIndex,records,tutorialsSeen,comboSeen,assistSeen,hardAttempts,stats}));}catch(_){}}
function modal(html,view=''){$('dialog').dataset.view=view;$('dialog-content').innerHTML=html;if(!$('dialog').open)$('dialog').showModal();}
function close(){ $('dialog').close(); }
function win(){
 animationTimer=undefined;
 const stars=path.filter(t=>t.star).length,g=level.garden,wasComplete=gardenComplete(g),wasGameComplete=GARDENS.every((_,i)=>gardenComplete(i));
 records[levelIndex]=Math.max(Number(records[levelIndex])||0,stars);if(!stats.dirty[levelIndex])stats.flawless[levelIndex]=true;delete stats.dirty[levelIndex];persist();
 const finale=!wasGameComplete&&GARDENS.every((_,i)=>gardenComplete(i)),garden=!wasComplete&&gardenComplete(g);
 arrival=finale?'finale':garden?'garden':'level';
 const next=Array.from({length:12},(_,i)=>g*12+i).find(i=>!completed(i));
 const nextGarden=next===undefined&&g<GARDENS.length-1&&unlockedGarden(g+1);
 const heading=finale?'CONGRATULATIONS!':garden?`${GARDENS[g].name} complete!`:'Home, sweet home!';
 const message=finale?`You beat Tile Hop! All ${TOTAL_LEVELS} levels and ${GARDENS.length} gardens complete.`:garden?`NEW GARDEN UNLOCKED · ${GARDENS[g+1]?.name||'Every garden is blooming!'}`:`A lovely climb${stars?` · ${stars} little ${stars===1?'star':'stars'} found`:''}.`;
 $('arrival-panel').innerHTML=`<div class="eyebrow">${finale?'EVERY GARDEN IS BLOOMING':garden?'A WHOLE GARDEN, BEAUTIFULLY DONE':'YOU MADE IT HOME'}</div><h2>${heading}</h2><p>${message}</p><button class="primary" id="next-level">${finale?'Explore the gardens':next!==undefined?'Next little climb →':nextGarden?'Enter the next garden →':'Explore the gardens'}</button>`;
 $('next-level').onclick=()=>{if(finale||next===undefined&&!nextGarden){showLevels();return;}load(next!==undefined?next:firstUnfinished(g+1));};
 render();
 const rabbit=$('rabbit');rabbit.classList.remove('hopping');rabbit.classList.add('celebrating');
 rabbit.innerHTML=bunny.replace('<circle cx="19" cy="30" r="1.6" fill="#3f5946"/><circle cx="31" cy="30" r="1.6" fill="#3f5946"/>','<path d="M16 30q3-4 6 0M28 30q3-4 6 0" fill="none" stroke="#3f5946" stroke-width="1.8" stroke-linecap="round"/>').replace('<path d="m23 34 2 2 2-2" fill="#cf9686"/>','<path d="m23 33 2 2 2-2" fill="#cf9686"/><path d="M21 36q4 5 8 0" fill="none" stroke="#795b51" stroke-width="1.5" stroke-linecap="round"/>');
 confettiBurst();cue(finale?'finale':garden?'garden':'complete');
 $('announcement').textContent=heading+' '+message;
}
function confettiBurst(){
 if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
 const p=position(current()),colors=['#ce8a64','#a6b875','#caa24d','#9b9dcc','#7baca4'];
 for(let i=0;i<40;i++){
  const piece=document.createElement('span');piece.className='party-confetti';piece.style.left=p.x+'%';piece.style.top=(p.y-25)+'px';piece.style.background=colors[i%colors.length];
  piece.style.setProperty?.('--dx',(Math.random()-.5)*290+'px');piece.style.setProperty?.('--rise',(-35-Math.random()*90)+'px');piece.style.setProperty?.('--fall',(65+Math.random()*100)+'px');piece.style.setProperty?.('--spin',(Math.random()-.5)*900+'deg');piece.style.animationDelay=Math.random()*.12+'s';
  $('playfield').append(piece);setTimeout(()=>piece.remove(),1700);
 }
}
function showFinale(){
 cue('finale');
 celebrate();modal(`<div class="finale"><div class="finale-crown">✦ 🌙 ✦</div><div class="eyebrow">EVERY GARDEN. EVERY LITTLE CLIMB.</div><h2>CONGRATULATIONS!</h2><h3>You beat Tile Hop!</h3><p><strong>${GARDENS.at(-1).name} complete!</strong> You completed all <strong>${TOTAL_LEVELS} levels</strong> across <strong>${GARDENS.length} gardens</strong>. From your first flower to your final crystal gate, you found a way through every puzzle.</p><div class="garden-medals">${GARDENS.map(g=>`<span title="${g.name}">${g.icon}</span>`).join('')}</div><p>The whole garden is blooming because of you. Take a moment to enjoy it—you earned this view.</p><button class="primary" id="garden-map">Explore your completed gardens</button><button class="secondary" id="close">Enjoy the view</button></div>`);
 $('garden-map').onclick=showLevels;$('close').onclick=close;
}
function showLevels(selected=level.garden){
 const g=Number.isInteger(selected)?Math.max(0,Math.min(GARDENS.length-1,selected)):level.garden,open=unlockedGarden(g),done=Array.from({length:12},(_,i)=>completed(g*12+i)).filter(Boolean).length;
 modal(`<div class="eyebrow">YOUR ADVENTURE · ${Object.keys(records).filter(k=>Number(k)>=0&&Number(k)<TOTAL_LEVELS).length} / ${TOTAL_LEVELS} CLIMBS</div><h2>The garden trail.</h2>${gardenCards(g)}<h3>${GARDENS[g].name}</h3><p>${open?GARDENS[g].rule:`Complete all 12 climbs in ${GARDENS[g-1].name} to unlock this garden.`}</p>${open?`<div class="map-progress">${done} / 12 complete ${done===12?'· Garden blooming!':''}</div><div class="level-grid">${Array.from({length:12},(_,i)=>{const index=g*12+i;return `<button data-level="${index}" aria-label="${title(index)}${completed(index)?', completed':''}">${String(i+1).padStart(2,'0')}<small>${completed(index)?'✓':'·'}</small></button>`;}).join('')}</div>`:'<div class="locked-garden">▣<p>A new adventure is waiting beyond the gate.</p><button class="secondary" id="preview-lesson">Preview this garden’s trick</button></div>'}<div class="map-actions">${GARDENS.every((_,i)=>gardenComplete(i))?'<button class="primary" id="finale">Celebrate your adventure ✦</button>':''}<button class="secondary" id="close">Back to the climb</button></div>`,'map');
 // Put dialog focus on the selected garden, rather than the first garden button.
 document.querySelector(`[data-garden="${g}"]`)?.focus?.({preventScroll:true});
 document.querySelectorAll('[data-garden]').forEach(b=>b.onclick=()=>showLevels(Number(b.dataset.garden)));
 document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{close();load(Number(b.dataset.level));});if($('finale'))$('finale').onclick=showFinale;if(!open)$('preview-lesson').onclick=()=>{close();showLesson(g,true);};$('close').onclick=close;
}
function gardenCards(selected){return `<div class="garden-tabs garden-cards">${GARDENS.map((garden,i)=>{const count=Array.from({length:12},(_,j)=>completed(i*12+j)).filter(Boolean).length,open=unlockedGarden(i);return `<button data-garden="${i}" class="${i===selected?'selected':''} ${open?'':'card-locked'}" aria-label="${garden.name}, ${open?`${count} of 12 complete`:'locked'}" aria-pressed="${i===selected}"><span>${garden.icon}</span><strong>${garden.name.split(' ')[0]}</strong><small>${count===12?'✓ 12/12':open?`${count}/12`:'Locked'}</small><div class="card-meter"><i style="width:${count/12*100}%"></i></div></button>`;}).join('')}</div>`;}
function tone(freq,duration){window.TileHopAudio?.effect(freq,duration);}
function cue(name){window.TileHopAudio?.cue(name);}
function finishPendingClimb(){if(animationTimer&&current().r===level.rows-1){clearTimeout(animationTimer);win();}}
function showOptions(){
 finishPendingClimb();
 modal('<div class="eyebrow">TAKE A LITTLE PAUSE</div><h2>Options.</h2><div class="options-list"><button class="secondary" id="stats">▤ Show stats</button><button class="secondary" id="reset-game">Restart entire game…</button></div><p>Restarting the entire game erases saved progress. You’ll be asked to confirm first.</p><button class="primary" id="close">Back to the climb</button>');
 $('stats').onclick=showStats;$('reset-game').onclick=warnReset;$('close').onclick=close;
}
function warnRestart(){
 finishPendingClimb();
 modal('<div class="eyebrow">TRY THIS CLIMB AGAIN?</div><h2>Restart this level?</h2><p>Your rabbit will return to the bottom of this climb and your current combo will reset. Completed levels and unlocked gardens stay saved.</p><p>This counts as one level restart in your stats.</p><button class="primary" id="cancel-restart" autofocus>Keep climbing</button><button class="secondary" id="confirm-restart">Yes, restart this level</button>'.replace('This counts as one level restart in your stats.',attempt?'Restart refills your hints and undos. Abandoning an active hard climb counts as a failed hard level.':'This counts as one level restart in your stats.'));
 $('cancel-restart').onclick=close;$('confirm-restart').onclick=()=>{close();stats.restarts++;if(attempt){stats.hardRestarts++;if(!arrival&&(path.length>1||attempt.hintLeft<assistLimits().hint))recordHardFailure();}else stats.easyRestarts++;markError();load(levelIndex,true);};
 $('cancel-restart').focus?.({preventScroll:true});
}
function shareSummary(){
 const cleared=Array.from({length:TOTAL_LEVELS},(_,i)=>completed(i)).filter(Boolean).length,gardens=GARDENS.filter((_,i)=>gardenComplete(i)).length;
 const url='https://jsgravel.github.io/playlab/';
 const text=[cleared===TOTAL_LEVELS?'🐇 I beat Tile Hop!':'🐇 My Tile Hop adventure',`Levels completed: ${cleared}/${TOTAL_LEVELS}`,`Gardens completed: ${gardens}/${GARDENS.length}`,`Flawless levels: ${Object.keys(stats.flawless).length}`,`Best combo: ${stats.bestCombo}×`,`Undo uses: ${stats.undoUses} · Restarts: ${stats.restarts}`,`Failed hard attempts: ${stats.failedHard}`,'Can you hop your way home?'].join('\n');
 return {title:'My Tile Hop progress',text,url};
}
function bindStatsSharing(){
 const data=shareSummary(),full=data.text+'\n\n'+data.url;
 const share=$('share-stats'),copy=$('copy-stats'),status=$('share-status'),preview=$('share-preview'),field=$('share-text');
 field.value=full;
 let busy=false;
 async function copyProgress(){
  try{if(!window.navigator?.clipboard?.writeText)throw new Error('Clipboard unavailable');await window.navigator.clipboard.writeText(full);status.textContent='Progress copied! Paste it into a message to your friend.';}
  catch(_){preview.open=true;field.focus?.();field.select?.();status.textContent='Select and copy this summary, then paste it into a message.';}
 }
 async function run(native){
  if(busy)return;busy=true;share.disabled=true;copy.disabled=true;status.textContent='';
  try{
   if(native&&window.navigator?.share){try{await window.navigator.share(data);status.textContent='Progress shared!';return;}catch(error){if(error?.name==='AbortError'){status.textContent='Sharing cancelled.';return;}}}
   await copyProgress();
  }finally{busy=false;share.disabled=false;copy.disabled=false;}
 }
 share.onclick=()=>run(true);copy.onclick=()=>run(false);
}
function showStats(){
 finishPendingClimb();
 const cleared=Array.from({length:TOTAL_LEVELS},(_,i)=>completed(i)).filter(Boolean).length;
 modal(`<div class="eyebrow">YOUR LITTLE ADVENTURE</div><h2>Your stats.</h2><div class="stats-share"><button class="primary" id="share-stats">↗ Share progress</button><button class="secondary" id="copy-stats">Copy</button></div><p id="share-status" class="share-status" role="status"></p><details id="share-preview" class="share-preview"><summary>Preview shared summary</summary><textarea id="share-text" readonly aria-label="Progress summary to share"></textarea></details><div class="stats-grid"><div><strong>${stats.undoUses}</strong><span>Undo uses</span></div><div><strong>${stats.restarts}</strong><span>Total level restarts</span></div><div><strong>${Object.keys(stats.flawless).length}</strong><span>Flawless levels</span></div><div><strong>${cleared} / ${TOTAL_LEVELS}</strong><span>Levels completed</span></div><div><strong>${stats.bestCombo}×</strong><span>Best combo · Lantern Orchard onward</span></div><div><strong>${stats.easyRestarts}</strong><span>Easy-level restarts</span></div><div><strong>${stats.failedHard}</strong><span>Failed hard attempts</span></div><div><strong>${stats.hardRestarts}</strong><span>Hard-level restarts</span></div></div><p>A flawless level is a climb completed without a wrong match, blocked-gate tap, undo, or restart. Each level counts once; a clean replay can earn its flawless mark.</p><p>Hints are welcome and do not count as mistakes. Easy restarts and hard failures are tracked separately from this update. Historical restarts remain in the total.</p><button class="secondary" id="reset-from-stats">Back to options</button><button class="primary" id="close">Back to the garden</button>`);
 bindStatsSharing();$('reset-from-stats').onclick=showOptions;$('close').onclick=close;
}
function warnReset(){
 finishPendingClimb();
 modal('<div class="big-icon">↻</div><div class="eyebrow">START A BRAND-NEW ADVENTURE?</div><h2>Restart the entire game?</h2><p>This will erase <strong>all completed levels, unlocked gardens, collected star records, tutorial acknowledgements, and statistics</strong> saved in this browser.</p><p><strong>This cannot be undone.</strong> You’ll return to level 1 in Clover Garden. Your music and effects preferences will stay.</p><button class="primary" id="cancel-reset" autofocus>Keep my progress</button><button class="danger" id="confirm-reset">Yes, erase progress and restart</button>');
 $('cancel-reset').onclick=close;$('confirm-reset').onclick=()=>{
  clearTimeout(animationTimer);clearTimeout(feedbackTimer);window.TileHopLessons?.cleanup();$('lesson-dialog').close();close();
  records={};tutorialsSeen={};comboSeen=false;assistSeen={};hardAttempts={};stats={undoUses:0,restarts:0,bestCombo:0,failedHard:0,easyRestarts:0,hardRestarts:0,flawless:{},dirty:{}};load(0);$('announcement').textContent='Game restarted. Welcome back to Clover Garden.';
 };
 $('cancel-reset').focus?.({preventScroll:true});
}
$('undo').onclick=()=>{
 if(path.length===1||attempt?.failed||arrival)return;
 if(attempt&&attempt.undoLeft===0){showFailure('No undos remain. Restart for a new attempt.');return;}
 if(attempt)attempt.undoLeft--;stats.undoUses++;markError();clearTimeout(animationTimer);clearTimeout(feedbackTimer);path.pop();arrival=null;if(attempt)attempt.hintFor=null;$('rabbit').classList.remove('celebrating');$('rabbit').innerHTML=bunny;render();persist();tone(300,.08);checkNoRecovery();
};$('restart').onclick=warnRestart;
$('options').onclick=showOptions;
$('hint').onclick=()=>{
 if(attempt?.failed||arrival)return;
 const repeated=attempt?.hintFor===current().id;
 if(attempt&&!repeated){if(attempt.hintLeft===0){showFailure('No hints remain. Restart for a new attempt.');return;}attempt.hintLeft--;attempt.hintFor=current().id;persist();render();}
 const route=bestRoute(current());if(!route){$('prompt').textContent='Try undoing your last hop';$('announcement').textContent='This path cannot reach the top. Undo your last hop.';checkNoRecovery();return;}
 const next=route.route[0];if(next){document.querySelector(`[data-id="${next.id}"]`).classList.add('hinted');$('prompt').textContent='This tile leads toward home';}
};
$('levels').onclick=()=>showLevels();
$('help').onclick=()=>{modal('<div class="big-icon">☁</div><div class="eyebrow">WELCOME TO TILE HOP</div><h2>A hop, a match, a smile.</h2><p><strong>1.</strong> Look at the big symbol on your current tile.<br><strong>2.</strong> Tap the same symbol in the next reachable row.<br><strong>3.</strong> The small symbol previews your next match.</p><p>Reach the top to complete your climb. Stars are optional little discoveries. Wrong taps reset your combo. The first five gardens have unlimited assists. Copper Grove has 3 undos / 2 hints; Crystal Labyrinth has 2 undos / 1 hint. Needing more ends a hard attempt. No timer, no rush.</p><button class="primary" id="review-lesson">Show this garden’s example</button><button class="secondary" id="close">Let’s hop →</button>');$('review-lesson').onclick=()=>{close();showLesson();};$('close').onclick=close;};
if(!unlockedGarden(Math.floor(levelIndex/12)))levelIndex=firstUnfinished(0);
load(levelIndex);
window.addEventListener?.('resize',()=>render(false));
// Pure generation and solver helpers are exposed for lightweight offline checks.
window.TileHop={makeLevel,getState:()=>({levelIndex,level,path:[...path],combo,records:{...records}}),bestRoute,load,completed,gardenComplete,unlockedGarden,showLevels};
