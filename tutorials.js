'use strict';
// Small, replayable examples teach rules without revealing the real puzzle's route.
(() => {
 const lessons = {
  match:{title:'A match makes a hop',text:'Tap the same big symbol in the next row. The small symbol on your landing tile tells you what to match next.',tiles:[{x:45,y:240,s:'✿'},{x:45,y:160,s:'✿',next:'◆'},{x:65,y:80,s:'◆'}],tips:['Look for a flower above the rabbit.','Now look for a diamond—the next symbol changed.','Two matches, two happy hops!'],sounds:['hop','hop']},
  nearby:{title:'Little hops, nearby branches',text:'You can hop straight up or one column sideways. A matching tile two columns away is too far. These limits apply in every later garden.',tiles:[{x:20,y:240,s:'✿'},{x:45,y:160,s:'✿',next:'☾'},{x:70,y:80,s:'☾'},{x:90,y:160,s:'✿',decoy:true}],tips:['The middle flower is nearby. The far-right flower is too far.','From here, the moon is just one column away.','Follow nearby branches, one row at a time.'],sounds:['nearby','nearby']},
  key:{title:'A little key opens a gate',text:'Land on a ⚿ tile to collect a key. Then you can land on a ▣1 gate. Gates do not use up your keys. Undo also undoes collecting a key.',tiles:[{x:35,y:240,s:'✿'},{x:50,y:160,s:'✿',next:'◆',badge:'⚿'},{x:65,y:80,s:'◆',badge:'▣1'}],tips:['Hop to the flower marked ⚿ to collect your key.','You have 1 key! Match the diamond to open its ▣1 gate.','Click! The gate opens, and you keep your key.'],sounds:['key','unlock']},
  spring:{title:'A spring sends you higher',text:'Land on an ↑↑ tile. Your NEXT hop skips one row, so match two rows above. Nearby-column limits still apply.',tiles:[{x:35,y:250,s:'✿'},{x:50,y:185,s:'✿',next:'☾',badge:'↑↑'},{x:65,y:55,s:'☾'},{x:50,y:120,s:'☾',decoy:true}],tips:['First hop onto the flower spring ↑↑.','Boing! Choose the moon TWO rows above; skip the faded row.','A bigger hop, with the same matching rule.'],sounds:['springReady','spring']},
  sun:{title:'Meet the fifth symbol',text:'The sun ☀ joins flowers, diamonds, moons, and clovers. Match its shape just like the other symbols—colour is only a helpful extra.',tiles:[{x:35,y:240,s:'☀'},{x:50,y:160,s:'☀',next:'♣'},{x:65,y:80,s:'♣'}],tips:['Match the sun ☀ above the rabbit.','Your next match is now a clover.','Five symbols, the same simple tap.'],sounds:['sun','hop']},
  twoKeys:{title:'Some gates need two keys',text:'A ▣2 gate needs TWO keys collected along this route. One key is not enough. Springs and nearby hops still apply, so plan your route.',tiles:[{x:20,y:265,s:'✿'},{x:40,y:200,s:'✿',next:'◆',badge:'⚿'},{x:60,y:135,s:'◆',next:'☾',badge:'⚿'},{x:80,y:70,s:'☾',badge:'▣2'}],tips:['Collect the first key from the flower.','You have 1 key. Collect the second from the diamond.','You have 2 keys! Now match the moon gate ▣2.','Both keys turn, and the gate opens.'],sounds:['key','key','unlock']}
 };
 const groups=[['match'],['nearby'],['key'],['spring'],['sun','twoKeys']];
 let timers=[],session=0;
 function cleanup(){session++;timers.forEach(clearTimeout);timers=[];}
 function show(g,{bunny,icon,onDone,onSound}){
  cleanup();const dialog=document.getElementById('lesson-dialog'),content=document.getElementById('lesson-content');let page=0;
  function draw(){
   cleanup();const lesson=lessons[groups[g][page]],token=session;let step=0;
   content.innerHTML=`<div class="eyebrow">A NEW GARDEN, A LITTLE NEW TRICK · ${page+1} / ${groups[g].length}</div><h2>${lesson.title}</h2><p>${lesson.text}</p><div class="lesson-scene" aria-label="Interactive example"><div class="lesson-row" style="top:120px"></div>${lesson.tiles.map((t,i)=>`<button class="lesson-tile ${t.decoy?'lesson-decoy':''}" data-example="${i}" style="left:${t.x}%;top:${t.y}px" aria-label="${t.s} example tile${t.badge?' '+t.badge:''}">${t.s}${t.next?`<small>${t.next}</small>`:''}${t.badge?`<b>${t.badge}</b>`:''}</button>`).join('')}<div class="lesson-rabbit" id="lesson-rabbit">${bunny}</div></div><p id="lesson-tip" class="lesson-tip" aria-live="polite"></p><div class="lesson-actions"><button class="secondary" id="lesson-replay">↻ Watch again</button><button class="secondary" id="lesson-try">Try it myself</button></div><button class="primary" id="lesson-next">${page<groups[g].length-1?'Next little trick →':'Let’s play →'}</button><p class="lesson-note">Tap the example tiles to try it yourself. No progress is changed.</p>`;
   if(icon)content.querySelectorAll('[data-example]').forEach(b=>{const badge=lesson.tiles[Number(b.dataset.example)].badge;if(badge){const label=b.querySelector('b');if(label)label.innerHTML=badge==='⚿'?icon('key'):icon('lock')+badge.slice(1);}});
   const rabbit=document.getElementById('lesson-rabbit'),tip=document.getElementById('lesson-tip');
   function paint(){const tile=lesson.tiles[step];rabbit.style.left=tile.x+'%';rabbit.style.top=(tile.y-22)+'px';tip.textContent=lesson.tips[step];content.querySelectorAll('[data-example]').forEach(b=>b.classList.toggle('lesson-target',Number(b.dataset.example)===step+1));}
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
