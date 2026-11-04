// Coach/player modes are views over the same match record and clock. They do
// not create a separate score, timeline or period counter.
function isCoachMode(m){return m.inputMode==='coach'}
function setInputMode(mode){
  if(mode!=='coach'&&mode!=='player')return;
  const m=match();if(!m||m.inputMode===mode)return;
  cancelActionHold();cancelClockHold();undoMode=false;suppressedTap=null;
  if(typeof captureV2!=='undefined'&&captureV2)cancelV2();
  match().inputMode=mode;save();render();
}
function inputModeBar(m){return `<div class="input-mode-bar mode-buttons" role="group" aria-label="Match input mode"><button class="${isCoachMode(m)?'active':''}" aria-pressed="${isCoachMode(m)}" onclick="setInputMode('coach')"><span class="mode-mark" aria-hidden="true">${isCoachMode(m)?'✓':''}</span><span>Coach mode</span></button><button class="${!isCoachMode(m)?'active':''}" aria-pressed="${!isCoachMode(m)}" onclick="setInputMode('player')"><span class="mode-mark" aria-hidden="true">${!isCoachMode(m)?'✓':''}</span><span>Player mode</span></button></div>`}
// Coach and Player goal buttons enter the same maintained capture flow.
// The legacy pending/eventModal scorer wrapper is deliberately retired here.
function beginCoachGoal(opposition=false){
  const m=match();if(!m)return;
  if(m.ended)return toast('Match finished. Reopen the match to record more actions.');
  if(!clockHasStarted(m))return toast('Start the match clock first.');
  if(!opposition&&!m.lineup.length)return lineupModal();
  return beginV2('Goal','',opposition);
}
const createBeforeCoach=createDay;
createDay=function(e){const old=day()?.id;createBeforeCoach(e);if(day()?.id!==old){day().matches.forEach(m=>m.inputMode='player');save();render()}};
// Apply the revised default once to matches created under the previous default.
// Subsequent deliberate mode selections continue to persist.
if(!data.playerModeDefault){
  data.days.forEach(d=>d.matches.forEach(m=>m.inputMode='player'));
  data.playerModeDefault=true;save();
}
render();
