const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function setup(mode){
 const events={},classes=new Set(),button={disabled:false,setAttribute(k,v){this[k]=v;}},status={textContent:''};
 const document={documentElement:{},body:{classList:{toggle(k,v){v?classes.add(k):classes.delete(k);}}},getElementById:id=>id==='fullscreen'?button:status,addEventListener(k,fn){events[k]=fn;}};
 const window={scrollY:120,scrollTo(x,y){this.scrollY=y;}};
 if(mode==='native'){document.documentElement.requestFullscreen=async()=>{document.fullscreenElement=document.documentElement;events.fullscreenchange();};document.exitFullscreen=async()=>{document.fullscreenElement=null;events.fullscreenchange();};}
 if(mode==='reject')document.documentElement.requestFullscreen=async()=>{throw Error('Not supported');};
 vm.runInNewContext(fs.readFileSync('fullscreen.js','utf8'),{document,window});return {button,status,events,classes,document,window};
}
(async()=>{
 const native=setup('native');await native.button.onclick();assert.ok(native.classes.has('immersive'));assert.equal(native.button['aria-pressed'],'true');await native.button.onclick();assert.ok(!native.classes.has('immersive'));
 await native.button.onclick();native.document.fullscreenElement=null;native.events.fullscreenchange();assert.equal(native.button['aria-pressed'],'false','Browser exit keeps button synchronized');
 for(const mode of ['missing','reject']){const app=setup(mode);await app.button.onclick();assert.ok(app.classes.has('immersive'));assert.match(app.status.textContent,/Add to Home Screen/);app.events.keydown({key:'Escape'});assert.ok(!app.classes.has('immersive'));assert.equal(app.window.scrollY,120);await app.button.onclick();await app.button.onclick();assert.equal(app.button['aria-pressed'],'false');}
 console.log('PASS: fullscreen entry/exit, browser exit synchronization, unsupported/rejected fallback, and Escape.');
})().catch(e=>{console.error(e);process.exitCode=1;});
