'use strict';
(() => {
 const button=document.getElementById('fullscreen'),status=document.getElementById('fullscreen-status'),root=document.documentElement;
 let focus=false,previousScroll=0;
 const nativeActive=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
 function update(){
  const active=nativeActive()||focus;
  document.body.classList.toggle('immersive',active);
  button.setAttribute('aria-pressed',String(active));button.setAttribute('aria-label',active?(focus?'Exit focus view':'Exit fullscreen'):'Enter fullscreen');
  button.innerHTML=active?'↙ <span>Exit</span>':'⛶ <span>Full screen</span>';
  if(!focus)status.textContent='';
 }
 function focusView(){focus=true;status.textContent='Focus view is on. For a browser-free view on iPhone, use Safari’s Share → Add to Home Screen, then open Tile Hop from there.';update();window.scrollTo(0,0);}
 button.onclick=async()=>{
  if(button.disabled)return;
  if(focus){focus=false;update();window.scrollTo(0,previousScroll);return;}
  button.disabled=true;
  try{
   if(nativeActive()){
    const exit=document.exitFullscreen||document.webkitExitFullscreen;if(exit)await exit.call(document);
   }else{
    previousScroll=window.scrollY;
    const enter=root.requestFullscreen||root.webkitRequestFullscreen;
    if(enter&&document.fullscreenEnabled!==false){await enter.call(root);update();window.scrollTo(0,0);}else focusView();
   }
  }catch(_){if(!nativeActive())focusView();else status.textContent='Use your browser’s fullscreen exit control or Escape to leave fullscreen.';}
  finally{button.disabled=false;update();}
 };
 document.addEventListener('fullscreenchange',update);document.addEventListener('webkitfullscreenchange',update);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&focus){focus=false;update();window.scrollTo(0,previousScroll);}});
 update();
})();
