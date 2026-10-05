'use strict';
// Small, replayable examples teach rules without revealing the real puzzle's route.
(() => {
 const lessons = {
  match:{title:'A match makes a hop',text:'Match the big symbol in the next row. The small symbol previews your next match.',tiles:[{x:45,y:240,s:'✿'},{x:45,y:160,s:'✿',next:'◆'},{x:65,y:80,s:'◆'}],tips:['Look for a flower above the rabbit.','Now look for a diamond—the next symbol changed.','Two matches, two happy hops!'],sounds:['hop','hop']},
  nearby:{title:'Little hops, nearby branches',text:'Hop straight up or one column sideways. This rule applies in every later garden.',tiles:[{x:20,y:240,s:'✿'},{x:45,y:160,s:'✿',next:'☾'},{x:70,y:80,s:'☾'},{x:90,y:160,s:'✿',decoy:true}],tips:['The middle flower is nearby. The far-right flower is too far.','From here, the moon is just one column away.','Follow nearby branches, one row at a time.'],sounds:['nearby','nearby']},
  key:{title:'A little key opens a gate',text:'Collect a ⚿ key before a ▣1 gate. Gates keep your keys; Undo takes back a collected key.',tiles:[{x:35,y:240,s:'✿'},{x:50,y:160,s:'✿',next:'◆',badge:'⚿'},{x:65,y:80,s:'◆',badge:'▣1'}],tips:['Hop to the flower marked ⚿ to collect your key.','You have 1 key! Match the diamond to open its ▣1 gate.','Click! The gate opens, and you keep your key.'],sounds:['key','unlock']},
  spring:{title:'A spring sends you higher',text:'After landing on ↑↑, match TWO rows above. Stay within one column sideways.',tiles:[{x:35,y:250,s:'✿'},{x:50,y:185,s:'✿',next:'☾',badge:'↑↑'},{x:65,y:55,s:'☾'},{x:50,y:120,s:'☾',decoy:true}],tips:['First hop onto the flower spring ↑↑.','Boing! Choose the moon TWO rows above; skip the faded row.','A bigger hop, with the same matching rule.'],sounds:['springReady','spring']},
  sun:{title:'Meet the fifth symbol',text:'The sun ☀ is your fifth symbol. Match its shape, just like flowers, diamonds, moons, and clovers.',tiles:[{x:35,y:240,s:'☀'},{x:50,y:160,s:'☀',next:'♣'},{x:65,y:80,s:'♣'}],tips:['Match the sun ☀ above the rabbit.','Your next match is now a clover.','Five symbols, the same simple tap.'],sounds:['sun','hop']},
  twoKeys:{title:'Some gates need two keys',text:'Collect TWO keys before a ▣2 gate. One is not enough; nearby hops and springs still apply.',tiles:[{x:20,y:265,s:'✿'},{x:40,y:200,s:'✿',next:'◆',badge:'⚿'},{x:60,y:135,s:'◆',next:'☾',badge:'⚿'},{x:80,y:70,s:'☾',badge:'▣2'}],tips:['Collect the first key from the flower.','You have 1 key. Collect the second from the diamond.','You have 2 keys! Now match the moon gate ▣2.','Both keys turn, and the gate opens.'],sounds:['key','key','unlock']},
  combo:{title:'Good choices grow a combo',text:'Correct hops grow your streak. Reach 3, 6, and 10 for richer glows and sparkles. No timer; hints are welcome.',tiles:[{x:20,y:265,s:'✿'},{x:40,y:200,s:'✿',next:'◆'},{x:60,y:135,s:'◆',next:'☾'},{x:80,y:70,s:'☾'}],tips:['Start with a matching flower. Take as long as you like.','1× combo! Next, match the diamond.','2× combo! One more matching moon.','3× combo! Your first glow. Keep making good choices.'],sounds:['hop','hop','sun']}
 };
 lessons.spend={title:'Copper gates spend keys',text:'Copper gates take the number of keys shown. Collect replacements before the next gate. Regular gates still keep your keys.',tiles:[{x:20,y:265,s:'✿',badge:'⚿'},{x:40,y:200,s:'✿',next:'◆',badge:'▣1',spend:true},{x:60,y:135,s:'◆',next:'☾',badge:'⚿'},{x:80,y:70,s:'☾',badge:'▣1',spend:true}],tips:['Start with 1 key. The copper flower gate costs it.','0 keys left! Collect the diamond’s replacement key.','Back to 1 key. You can afford the copper moon gate.','Gate open! Plan your key budget before choosing a branch.'],sounds:['spend','key','spend']};
 lessons.plan={title:'Look beyond the next hop',text:'Both branches can match for several hops. Trace ahead: will you have enough keys after the toll? Swipe the real board to peek ahead.',tiles:[{x:25,y:265,s:'✿'},{x:45,y:200,s:'✿',next:'◆',badge:'⚿'},{x:60,y:135,s:'◆',next:'☾',badge:'⚿'},{x:75,y:70,s:'☾',badge:'▣2',spend:true},{x:85,y:200,s:'✿',next:'◆',decoy:true}],tips:['A tempting flower is not always the best route. Look ahead.','The nearby route collects the first key. Keep tracing.','Two keys collected! This route can afford the moon gate.','Plan, then hop. Undo and hints are always welcome.'],sounds:['key','key','spend']};
 const groups=[['match'],['nearby'],['key','combo'],['spring','combo'],['sun','twoKeys','combo'],['spend','plan'],['plan']];
 let timers=[],session=0;
 function cleanup(){session++;timers.forEach(clearTimeout);timers=[];}
 const sceneY=y=>`calc(52px + ${((y-55)/210).toFixed(4)} * (100% - 76px))`;
 function show(g,{bunny,icon,onDone,onSound}){
  cleanup();const dialog=document.getElementById('lesson-dialog'),content=document.getElementById('lesson-content');let page=0;
  function draw(){
   cleanup();const lesson=lessons[groups[g][page]],token=session;let step=0;
   content.innerHTML=`<div class="eyebrow">A NEW GARDEN, A LITTLE NEW TRICK · ${page+1} / ${groups[g].length}</div><h2>${lesson.title}</h2><p>${lesson.text}</p><div class="lesson-scene" aria-label="Interactive example"><div class="lesson-row" style="top:${sceneY(120)}"></div>${lesson.tiles.map((t,i)=>`<button class="lesson-tile ${t.decoy?'lesson-decoy':''} ${t.spend?'lesson-copper':''}" data-example="${i}" style="left:${t.x}%;top:${sceneY(t.y)}" aria-label="${t.s} example tile${t.badge?' '+t.badge:''}">${t.s}${t.next?`<small>${t.next}</small>`:''}${t.badge?`<b>${t.badge}</b>`:''}</button>`).join('')}<div class="lesson-rabbit" id="lesson-rabbit">${bunny}</div></div><p id="lesson-tip" class="lesson-tip" aria-live="polite"></p><div class="lesson-actions"><button class="secondary" id="lesson-replay">↻ Watch again</button><button class="secondary" id="lesson-try">Try it myself</button></div><button class="primary" id="lesson-next">${page<groups[g].length-1?'Next little trick →':'Let’s play →'}</button><p class="lesson-note">${groups[g][page]==='combo'?'Wrong matches, blocked gates, Undo, and Restart reset the streak.':'Tap the example tiles to try. Your progress stays safe.'}</p>`;
   if(icon)content.querySelectorAll('[data-example]').forEach(b=>{const badge=lesson.tiles[Number(b.dataset.example)].badge;if(badge){const label=b.querySelector('b');if(label)label.innerHTML=badge==='⚿'?icon('key'):icon('lock')+(lesson.tiles[Number(b.dataset.example)].spend?'−':'')+badge.slice(1);}});
   const rabbit=document.getElementById('lesson-rabbit'),tip=document.getElementById('lesson-tip');
   function paint(){const tile=lesson.tiles[step];rabbit.style.left=tile.x+'%';rabbit.style.top=`calc(${sceneY(tile.y)} - 17px)`;tip.textContent=lesson.tips[step];content.querySelector?.('.lesson-scene')?.setAttribute('data-demo-combo',groups[g][page]==='combo'?String(step):'0');content.querySelectorAll('[data-example]').forEach(b=>b.classList.toggle('lesson-target',Number(b.dataset.example)===step+1));}
   function advance(i){
    if(i!==step+1||lesson.tiles[i]?.decoy){tip.textContent=lesson.tips[step];onSound('blocked');return;}
    step=i;paint();onSound(lesson.sounds[step-1]);
   }
   content.querySelectorAll('[data-example]').forEach(b=>b.onclick=()=>{timers.forEach(clearTimeout);timers=[];advance(Number(b.dataset.example));});
   document.getElementById('lesson-replay').onclick=draw;
   document.getElementById('lesson-try').onclick=()=>{timers.forEach(clearTimeout);timers=[];step=0;paint();};
   document.getElementById('lesson-next').onclick=()=>{if(page<groups[g].length-1){page++;draw();}else{cleanup();dialog.close();onDone();}};
   paint();
   // Silent automatic demonstration; interactive/replayed steps respect the effects toggle.
   for(let i=1;i<lesson.tips.length;i++)timers.push(setTimeout(()=>{if(session!==token||!dialog.open)return;step=i;paint();},900+i*800));
  }
  dialog.onclose=cleanup;dialog.oncancel=cleanup;draw();if(!dialog.open)dialog.showModal();
 }
 window.TileHopLessons={show,cleanup,groups};
})();
