// Pause/resume use taps. Start, reopen, half/full-time and reset use 1.5s holds.
let clockHold=null,clockClickQuietUntil=0;
function clockHasStarted(m){return !!(m.clockStarted||m.elapsed||m.running||m.ended||m.halfTime)}
function clockButtonLabel(m){return m.ended?'Reopen match':m.halfTime?'Start second half':m.running?'Pause':clockHasStarted(m)?'Resume':'Start'}
function selectClock(action){
  const m=match();if(!m)return;
  let feedback='';
  if(action==='toggle'){
    if(m.running){m.elapsed=elapsed(m);m.running=false;feedback='Clock paused'}
    else{
      const secondHalf=m.halfTime,reopening=m.ended,wasStarted=clockHasStarted(m);
      if(secondHalf){m.firstHalfElapsed=m.elapsed||0;m.period=2;m.elapsed=0}
      else m.period=m.period===2?2:1;
      m.clockStarted=true;m.running=true;m.started=Date.now();m.ended=false;m.halfTime=false;
      feedback=secondHalf?'Second half started':reopening?'Match reopened':wasStarted?'Clock resumed':'Clock started';
    }
  }else{
    if(m.running||!clockHasStarted(m))return;
    if(action==='half'){if(!usesHalves(m)||m.period===2||m.halfTime)return;m.firstHalfElapsed=m.elapsed||0;m.halfTime=true;m.ended=false;feedback='Half time'}
    else if(action==='full'){m.ended=true;m.halfTime=false;feedback='Full time'}
    else if(action==='restart'){m.elapsed=0;m.running=false;m.started=null;m.clockStarted=false;m.ended=false;m.halfTime=false;m.period=1;m.firstHalfElapsed=0;m.events=[];pending=null;undoMode=false;feedback='Match reset'}
    else return;
  }
  save();render();showActionFeedback(feedback,action==='restart'?'00:00 · all match actions cleared':clockText(m),false,'clock');
}
toggleClock=function(){selectClock('toggle')};
endMatch=function(){selectClock('full')};
function clockHoldHint(){if(Date.now()<clockClickQuietUntil)return;toast('Hold the clock button for 1.5 seconds to select.');}
function startClockHold(e,button,action){
  if(e.isPrimary===false||(e.button!==undefined&&e.button!==0)||clockHold)return;
  cancelActionHold();const m=match();if(!m)return;
  if(action!=='toggle'&&(m.running||!clockHasStarted(m)))return;
  const h={pointer:e.pointerId,x:e.clientX,y:e.clientY,button,action,match:m,fired:false};clockHold=h;
  button.classList?.add('holding-clock');clearTimeout(feedbackTimer);
  const label=action==='toggle'?clockButtonLabel(m):{half:'Half time',full:'Full time',restart:'Reset match'}[action];
  const box=$('#actionFeedback');box.classList.remove('hidden');box.classList.remove('is-great');
  box.innerHTML=`<span class="feedback-tag">HOLD TO SELECT · 1.5 SECONDS</span><strong>${label}</strong><div class="hold-bar"><i></i></div><small>Keep holding to confirm<br>Release early to cancel</small>`;
  h.timer=setTimeout(()=>{
    if(clockHold!==h||match()!==h.match||view!=='live'||document.hidden)return cancelClockHold();
    h.fired=true;clockClickQuietUntil=Date.now()+1000;selectClock(action);
  },1500);
}
function cancelClockHold(){const h=clockHold;if(!h)return;clearTimeout(h.timer);h.button.classList?.remove('holding-clock');clockHold=null;clockClickQuietUntil=Date.now()+900;if(!h.fired)hideHoldFeedback()}
function releaseClockHold(e){if(clockHold&&e.pointerId===clockHold.pointer)cancelClockHold()}
function moveClockHold(e){const h=clockHold;if(h&&e.pointerId===h.pointer&&Math.hypot(e.clientX-h.x,e.clientY-h.y)>14)cancelClockHold()}
function clockKeyDown(e,button,action){if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();if(e.repeat)return;startClockHold({pointerId:'keyboard',isPrimary:true,button:0,clientX:0,clientY:0},button,action)}
function clockKeyUp(e){if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();releaseClockHold({pointerId:'keyboard'})}
function clockIconSVG(action,m=match()){
  const symbol=action==='toggle'?(m.running?'pause':'play'):action;
  const paths=symbol==='pause'?'<path d="M8 5v14M16 5v14"/>':symbol==='play'?'<path d="m8 5 11 7-11 7z"/>':symbol==='restart'?'<path d="M5 10a8 8 0 1 1 0 6M5 4v6h6"/>':`<path d="M10 2h4M12 2v3M18 5l2 2"/><circle cx="12" cy="14" r="8"/>${symbol==='half'?'<path d="M12 6a8 8 0 0 1 0 16z" fill="currentColor" opacity=".28"/>':'<circle cx="12" cy="14" r="6" fill="currentColor" opacity=".2"/>'}<path d="M12 10v4l3 2"/>`;
  return `<svg class="clock-icon" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}</svg>`;
}
function matchClockHTML(m){
  const status=m.ended?'Full time':m.halfTime?'Half time':m.running?'IN PLAY':clockHasStarted(m)?'Paused':'Ready';
  return `<div class="timer-block"><div class="timer-status" role="status">${status}</div><div class="timer-row">${m.running?'<span class="live-clock-dot" aria-hidden="true"></span>':''}<div class="clock" id="clock">${clockText(m)}</div></div></div>`;
}
function clockButton(action,label,primary=false){
  const content=`<span class="clock-button-label">${clockIconSVG(action)}<span>${label}</span></span>`;
  if(action==='toggle'&&clockHasStarted(match())&&!match().ended)return `<button class="clock-choice primary" onclick="selectClock('toggle')">${content}<small>Tap</small></button>`;
  return `<button class="clock-choice ${primary?'primary':''}" onpointerdown="startClockHold(event,this,'${action}')" onpointerup="releaseClockHold(event)" onpointermove="moveClockHold(event)" onpointercancel="cancelClockHold()" oncontextmenu="event.preventDefault()" onkeydown="clockKeyDown(event,this,'${action}')" onkeyup="clockKeyUp(event)" onclick="clockHoldHint()" aria-label="${label}. Hold 1.5 seconds to select.">${content}<small>Hold</small></button>`;
}
function clockControlsHTML(m){
  const paused=!m.running&&clockHasStarted(m);
  return `<div class="clock-meta">${usesHalves(m)?(m.period===2?'2nd half':'1st half')+' – '+durationFor(m)/2+' minutes':'Single period – '+durationFor(m)+' minutes'}</div><div class="controls clock-main">${clockButton('toggle',clockButtonLabel(m),true)}</div>${paused?`<div class="controls clock-paused-options">${usesHalves(m)&&!m.ended&&!m.halfTime&&m.period!==2?clockButton('half','Half time'):''}${!m.ended?clockButton('full','Full time'):''}${clockButton('restart','Reset match')}</div><p class="clock-note">${m.ended?'Match finished. Reopen to record more actions.':m.halfTime?'Next: tap Start second half. The clock starts at '+durationFor(m)/2+':00.':''} Reset clears the clock, score and actions for this match.</p>`:''}`;
}
window.addEventListener('pointerup',releaseClockHold);
window.addEventListener('pointercancel',cancelClockHold);
window.addEventListener('pointermove',moveClockHold);
window.addEventListener('blur',cancelClockHold);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelClockHold()});
const beforeClockRender=render;
render=function(){
  if(clockHold&&clockHold.match!==match())cancelClockHold();
  beforeClockRender();if(view!=='live'||!match())return;
  const m=match(),paused=!m.running&&clockHasStarted(m);
  const controls=clockControlsHTML(m);
  const app=$('#app');app.innerHTML=app.innerHTML.replace(/<div class="controls">[\s\S]*?<\/div>/,controls);
  const status=m.ended?'Full time':m.halfTime?'Half time':m.running?'● Match in progress':paused?'Clock paused':'Ready when you are';
  app.innerHTML=app.innerHTML.replace(/(class="score"><div class="eyebrow">)[^<]+/,`$1${status} · Match ${mi+1} of ${day().matches.length}`);
};
render();
