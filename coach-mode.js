// Coach/player modes are views over the same match record and clock. They do
// not create a separate score, timeline or period counter.
function isCoachMode(m){return m.inputMode==='coach'}
function setInputMode(mode){
  if(mode!=='coach'&&mode!=='player')return;
  cancelActionHold();cancelClockHold();undoMode=false;suppressedTap=null;
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
function coachScreen(m){
  const d=day(),s=score(m),status=m.ended?'Full time':m.halfTime?'Half time':m.running?'● Match in progress':clockHasStarted(m)?'Clock paused':'Ready when you are';
  return `<div class="top"><div><p class="sub">${esc(d.date)} · ${esc(d.location)}</p></div><button onclick="view='setup';render()">Edit matchday ↗</button></div>${tabs()}${inputModeBar(m)}<div class="coach-match"><div class="score"><div class="eyebrow">${status} · Match ${mi+1} of ${d.matches.length}</div><div class="scoreline"><div>${esc(d.team)}</div><strong>${s[0]}–${s[1]}</strong><div>${esc(m.opponent)}</div></div><div class="clock" id="clock">${clockText(m)}</div>${clockControlsHTML(m)}</div><div class="coach-goals"><button class="coach-goal-button coach-our-goal" onclick="beginCoachGoal(false)" ${m.ended?'disabled':''}><span class="coach-goal-icon" aria-hidden="true">${gridActions[0].icon}</span><strong>Our goal</strong><small>${esc(d.team)}</small></button><button class="coach-goal-button coach-opposition-goal" onclick="beginCoachGoal(true)" ${m.ended?'disabled':''}><span class="coach-goal-icon" aria-hidden="true">${gridActions[0].icon}</span><strong>Opposition goal</strong><small>${esc(m.opponent)}</small></button></div><p class="coach-hint">${m.ended?'Match finished · your report is ready.':'Tap a goal to record its scorer, location and optional assist.'}</p><div class="coach-tools"><button onclick="undoLastAction()" ${m.events.length?'':'disabled'}>↶ Undo last action</button><button onclick="view='report';render()">View report ↗</button></div>${m.ended?`<div class="card award-card" style="margin-top:20px">${awardControls(m)}</div>`:''}</div>`;
}
const renderBeforeCoach=render;
render=function(){
  renderBeforeCoach();if(view!=='live'||!match())return;
  const m=match(),app=$('#app');
  if(isCoachMode(m))app.innerHTML=coachScreen(m);
  else app.innerHTML=app.innerHTML.replace('<div class="layout">',inputModeBar(m)+'<div class="layout">');
};
const createBeforeCoach=createDay;
createDay=function(e){const old=day()?.id;createBeforeCoach(e);if(day()?.id!==old){day().matches.forEach(m=>m.inputMode='player');save();render()}};
const clockBeforeCoach=selectClock;
selectClock=function(action){clockBeforeCoach(action);if(action==='restart'&&!clockHasStarted(match())){match().inputMode='player';save();render()}};
// Apply the revised default once to matches created under the previous default.
// Subsequent deliberate mode selections continue to persist.
if(!data.playerModeDefault){
  data.days.forEach(d=>d.matches.forEach(m=>m.inputMode='player'));
  data.playerModeDefault=true;save();
}
render();
