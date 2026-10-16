// All non-goal actions are single-tap. A deliberate 1.5-second hold upgrades
// exactly one event to Great, without a synthetic click adding a second event.
gridActions[4]={label:'Save',icon:'◇',base:'Save',quick:true};
let activeHold=null,suppressedTap=null,feedbackTimer=null;
function actionKey(action){return action.replace(/^(good|great|amazing)\s+/i,'').replace(/\s/g,'').toLowerCase()}
function countAction(player,action){return match().events.filter(e=>!e.opp&&e.player===player&&actionKey(e.action)===actionKey(action)).length}
function countGreatAction(player,action){return match().events.filter(e=>!e.opp&&e.player===player&&/^great\s/i.test(e.action)&&actionKey(e.action)===actionKey(action)).length}
function countPlayer(player){return match().events.reduce((n,e)=>n+(!e.opp&&e.player===player?1:0)+(e.assist?.player===player?1:0),0)}
function showActionFeedback(action,player,holding=false,kind='action'){
  clearTimeout(feedbackTimer);
  const box=$('#actionFeedback');box.classList.remove('hidden');box.classList.add('action-feedback');
  box.setAttribute('role','status');box.setAttribute('aria-live','polite');
  const great=!holding&&/^great\s/i.test(action);box.classList.remove('is-great');if(great)box.classList.add('is-great');
  box.innerHTML=`${kind==='clock'?'':`<span class="feedback-tag">${holding?'HOLDING · 1.5 SECONDS':great?'★ GREAT ACTION':'✓ RECORDED'}</span>`}<strong>${esc(holding?action+'…':action)}</strong><small>${esc(player)}</small>${holding?`<div class="hold-bar"><i></i></div><small>Release for ${esc(action)}<br>Keep holding for Great ${esc(action)}</small>`:''}`;
  if(!holding)feedbackTimer=setTimeout(()=>box.classList.add('hidden'),great?2800:2200);
}
function hideHoldFeedback(){const box=$('#actionFeedback');box.classList.add('hidden')}
commitMoment=function(){
  const p=pending;if(!p)return;delete p.stage;match().events.push(p);save();closeModal();render();
  showActionFeedback(p.action,p.player+(p.assist?' · assist: '+p.assist.player:''));
};
gridEvent=function(pi,ai,great=false,at=null){
  const m=match(),a=gridActions[ai];
  if(m.ended)return toast('Match finished. Reopen the match to record more actions.');
  if(!m.running&&!m.elapsed&&!m.ended)return toast('Start the match clock first.');
  pending={id:crypto.randomUUID(),action:(great?'Great ':'')+a.base,...captureEventTime(m,at??elapsed(m)),opp:false,player:m.lineup[pi],zone:null};
  if(ai===4)return saveInGoalBox();
  if(a.quick)return commitMoment();
  pending.stage='shot';eventModal();
};
function recordAction(pi,ai,great=false,at=null){
  if(pi!==-1)return gridEvent(pi,ai,great,at);
  const m=match();if(m.ended)return toast('Match finished. Reopen the match to record more actions.');if(!m.running&&!m.elapsed&&!m.ended)return toast('Start the match clock first.');
  pending={id:crypto.randomUUID(),action:great?'Great save':'Save',...captureEventTime(m,at??elapsed(m)),opp:true,player:'Opposition',zone:null};saveInGoalBox();
}
function startActionHold(e,button,pi,ai){
  if(e.isPrimary===false||(e.button!==undefined&&e.button!==0)||activeHold)return;
  const m=match();if(m.ended)return toast('Match finished. Reopen the match to record more actions.');if(!m.running&&!m.elapsed&&!m.ended)return;
  const h={pointer:e.pointerId,button,pi,ai,x:e.clientX,y:e.clientY,at:elapsed(m),fired:false,match:m};activeHold=h;
  button.classList?.add('holding-action');
  showActionFeedback(gridActions[ai].label,pi===-1?'Opposition':m.lineup[pi],true);
  h.timer=setTimeout(()=>{
    if(activeHold!==h||match()!==h.match||document.hidden)return cancelActionHold();
    h.fired=true;suppressedTap={pi,ai,until:Infinity};
    recordAction(pi,ai,true,h.at);
  },1500);
}
function moveActionHold(e){const h=activeHold;if(h&&e.pointerId===h.pointer&&Math.hypot(e.clientX-h.x,e.clientY-h.y)>14)cancelActionHold()}
function endActionHold(e){
  const h=activeHold;if(!h||e.pointerId!==h.pointer)return;
  clearTimeout(h.timer);h.button.classList?.remove('holding-action');activeHold=null;suppressedTap={pi:h.pi,ai:h.ai,until:Date.now()+900};
  if(!h.fired&&match()===h.match)recordAction(h.pi,h.ai,false,h.at);
}
function cancelActionHold(){const h=activeHold;if(!h)return;clearTimeout(h.timer);h.button.classList?.remove('holding-action');activeHold=null;suppressedTap={pi:h.pi,ai:h.ai,until:Date.now()+900};if(!h.fired)hideHoldFeedback()}
function clickAction(e,pi,ai){
  // Pointer release already recorded the action; keyboard/screen-reader clicks
  // (detail zero) remain a complete accessible alternative to pointer input.
  const fromPointer=e.detail!==0||!!e.pointerType||e.sourceCapabilities?.firesTouchEvents;
  if(fromPointer&&suppressedTap?.pi===pi&&suppressedTap?.ai===ai&&Date.now()<suppressedTap.until)return;
  recordAction(pi,ai);
}
function holdAttributes(pi,ai){return `onpointerdown="startActionHold(event,this,${pi},${ai})" onpointerup="endActionHold(event)" onpointermove="moveActionHold(event)" onpointercancel="cancelActionHold()" oncontextmenu="event.preventDefault()" onclick="clickAction(event,${pi},${ai})"`}
window.addEventListener('pointerup',endActionHold);
window.addEventListener('pointercancel',cancelActionHold);
window.addEventListener('pointermove',moveActionHold);
window.addEventListener('blur',cancelActionHold);
document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelActionHold()});
const previousTouchRender=render;
render=function(){
  previousTouchRender();if(view!=='live'||!match())return;
  const app=$('#app');
  app.innerHTML=app.innerHTML.replace(/<button([^>]*?)onclick="gridEvent\((\d+),(\d+)\)"([^>]*)>([\s\S]*?)<\/button>/g,(whole,before,pi,ai,after,icon)=>{
    pi=+pi;ai=+ai;const n=countAction(match().lineup[pi],gridActions[ai].base),g=countGreatAction(match().lineup[pi],gridActions[ai].base);
    const handler=ai===0?`onclick="gridEvent(${pi},${ai})"`:holdAttributes(pi,ai);
    return `<button${before}${handler}${after} aria-description="${n} recorded this match, ${g} Great${ai===0?'':'. Tap to record; hold 1.5 seconds for Great.'}">${icon}<span class="action-count ${n?'':'zero'}" aria-hidden="true">${n}</span>${g?`<span class="great-count" aria-hidden="true">★${g}</span>`:''}</button>`;
  }).replace(/<th scope="row" title="([^"]*)">([\s\S]*?)<\/th>/g,(whole,title,label)=>{
    const n=match().lineup.find(p=>esc(p)===title);return `<th scope="row" title="${title}">${label}<span class="player-total">${countPlayer(n)} total</span></th>`;
  }).replace('onclick="beginEvent(5,true)"',holdAttributes(-1,4))
    .replace('Pass, tackle, skill and teamwork: one tap. Goal → shot location → assist. Swipe actions sideways.','').replace('<p class="hint"></p>','');
};
render();
