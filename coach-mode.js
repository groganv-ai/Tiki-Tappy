// Coach/player modes are views over the same match record and clock. They do
// not create a separate score, timeline or period counter.
function isCoachMode(m){return m.inputMode==='coach'}
function setInputMode(mode){
  if(mode!=='coach'&&mode!=='player')return;
  cancelActionHold();cancelClockHold();undoMode=false;suppressedTap=null;
  match().inputMode=mode;save();render();
}
function inputModeBar(m){return `<div class="input-mode-bar mode-buttons" role="group" aria-label="Match input mode"><button class="${isCoachMode(m)?'active':''}" aria-pressed="${isCoachMode(m)}" onclick="setInputMode('coach')"><span class="mode-mark" aria-hidden="true">${isCoachMode(m)?'✓':''}</span><span>Coach mode</span></button><button class="${!isCoachMode(m)?'active':''}" aria-pressed="${!isCoachMode(m)}" onclick="setInputMode('player')"><span class="mode-mark" aria-hidden="true">${!isCoachMode(m)?'✓':''}</span><span>Player mode</span></button></div>`}
function beginCoachGoal(opposition=false){
  const m=match();if(m.ended)return toast('Match finished. Reopen the match to record more actions.');
  if(!m.running&&!m.elapsed)return toast('Start the match clock first.');
  if(opposition)return beginEvent(0,true);
  if(!m.lineup.length)return lineupModal();
  pending={id:crypto.randomUUID(),action:'Goal',...captureEventTime(m,elapsed(m)),opp:false,player:'',zone:null,stage:'scorer'};
  eventModal();
}
function chooseGoalScorer(name){if(!pending||pending.stage!=='scorer'||!match().lineup.includes(name))return;pending.player=name;pending.stage='shot';eventModal()}
const eventModalBeforeCoach=eventModal;
eventModal=function(){
  if(pending?.stage!=='scorer')return eventModalBeforeCoach();
  $('#modal').innerHTML=`<div class="modal"><div class="sheet"><button class="close" aria-label="Cancel goal" onclick="closeModal()">×</button><div class="eyebrow">${eventTimeLabel(pending)} · Goal</div><h2 style="margin-top:12px">Who scored?</h2><div class="squad">${match().lineup.map(name=>`<button data-name="${esc(name)}" onclick="chooseGoalScorer(this.dataset.name)">${esc(name)}</button>`).join('')}</div><p class="hint">Next: shot location, then an optional assist. Time was captured when you tapped Our goal.</p></div></div>`;
};

let coachDetailsOpen=false,coachClockOpen=false,coachDrag=null;
// Route Coach controls through the same V2 flows as the existing Player UI.
function coachPrepareFlow(){
 if(typeof spCloseFlow==='function'&&typeof spFlow!=='undefined'&&spFlow)spCloseFlow();
 if(typeof captureV2!=='undefined')captureV2=null;
 if(typeof pending!=='undefined')pending=null;
 const modal=document.querySelector('#modal');if(modal)modal.innerHTML='';
}
function coachAction(name,q=0){
 const m=match();
 if(!m||m.ended)return toast('This match has ended.');
 if(!clockHasStarted(m))return toast('Start the match clock first.');
 coachPrepareFlow();
 if(name==='Set Piece')return spStartSetPiece();
 if(name==='Substitute')return openSubstitution();
 const action=({'Def Con':'Defence','Defence':'Defence','Special':'Special'})[name]||name;
 beginV2(action);
 if(captureV2&&['Shot','Pass','Tackle'].includes(action)){
   captureV2.quality=Math.max(0,Math.min(2,q===0?0:q-1));
   drawV2Capture();
 }
}
function coachSpecial(){return coachAction('Special')}
function coachGoalChoice(){return coachAction('Goal')}
function coachExtra(name){return coachAction(name)}
function coachSliderStart(e,name){
 if(e.button!==undefined&&e.button!==0)return;
 const row=e.currentTarget.closest('.v3-action');if(!row)return;
 coachDrag={row,name,id:e.pointerId,q:0,cancel:false};
 e.currentTarget.setPointerCapture(e.pointerId);coachSliderMove(e);
}
function coachSliderMove(e){
 if(!coachDrag||coachDrag.id!==e.pointerId)return;
 const {row,name}=coachDrag,track=row.querySelector('.v3-track'),rect=track.getBoundingClientRect();
 const x=e.clientX-rect.left,y=e.clientY-rect.top;
 coachDrag.cancel=y< -95||y>rect.height+95;
 coachDrag.q=x<0?0:Math.min(3,Math.floor(x/rect.width*3)+1);
 row.querySelectorAll('.v3-zone').forEach((z,i)=>z.classList.toggle('chosen',!coachDrag.cancel&&i+1===coachDrag.q));
 const tip=row.querySelector('.v3-tip');tip.hidden=coachDrag.cancel||coachDrag.q===0;
 if(!tip.hidden){tip.textContent=['Good','Great','Amazing'][coachDrag.q-1]+' '+name;tip.style.left=Math.min(rect.width-45,Math.max(45,x))+'px';}
}
function coachSliderEnd(e){
 if(!coachDrag||coachDrag.id!==e.pointerId)return;
 coachSliderMove(e);const {row,name,q,cancel}=coachDrag;coachDrag=null;
 row.querySelectorAll('.v3-zone').forEach(z=>z.classList.remove('chosen'));row.querySelector('.v3-tip').hidden=true;
 if(!cancel)coachAction(name,q);
}
function coachScreen(m){
 const d=day();
 const sliders=['Shot','Pass','Tackle'].map((name,i)=>'<div class="v3-action"><button class="v3-origin" onpointerdown="coachSliderStart(event,\''+name+'\')" onpointermove="coachSliderMove(event)" onpointerup="coachSliderEnd(event)" onpointercancel="coachDrag=null">'+['⚽','➜','⊥'][i]+' '+name+'</button><div class="v3-track" onpointerdown="coachSliderStart(event,\''+name+'\')" onpointermove="coachSliderMove(event)" onpointerup="coachSliderEnd(event)" onpointercancel="coachDrag=null"><span class="v3-zone">★</span><span class="v3-zone">★★</span><span class="v3-zone">★★★</span><span class="v3-tip" hidden></span></div></div>').join('');

 return "<style>.v3-coach{--v3green:#174f3b;--v3lime:#d5ff6c}.v3-coach .v3-card{background:#fff;border-radius:18px;padding:13px;margin:12px 0}.v3-score{display:flex;align-items:center;justify-content:space-between;gap:9px;text-align:center}.v3-score span{flex:1;min-width:0;font-weight:800}.v3-score strong{background:#174f3b;color:#fff;padding:12px;border-radius:12px;font-size:26px;white-space:nowrap}.v3-details{margin-top:10px}.v3-details summary{cursor:pointer;text-align:center;padding:10px;background:#eaf3ef;border-radius:10px}.v3-clock{display:flex;align-items:center;gap:9px;flex-wrap:wrap}.v3-clock strong{font-size:26px;margin:auto}.v3-clock button{padding:12px}.v3-goal{width:100%;padding:18px!important;background:var(--v3lime)!important;color:#153e30!important;font-size:26px!important;font-weight:900!important}.v3-action{display:flex;gap:7px;margin:12px 0;height:60px}.v3-origin{width:29%;min-width:90px;background:var(--v3lime)!important;color:#153e30!important;font-weight:900;touch-action:none}.v3-track{position:relative;flex:1;display:flex;border-radius:13px;overflow:visible;border:2px solid #7cbea2;touch-action:none;user-select:none}.v3-zone{display:flex;align-items:center;justify-content:center;flex:1;background:#d7eee0;color:#d49c00;border-right:1px dashed #5a9b81;font-size:19px}.v3-zone:nth-child(2){background:#b4e4c9}.v3-zone:nth-child(3){background:#83cba5;border:0}.v3-zone.chosen{background:#d5ff6c}.v3-tip{position:absolute;bottom:calc(100% + 6px);transform:translateX(-50%);white-space:nowrap;background:#174f3b;color:white;padding:5px 8px;border-radius:8px;font-size:12px;z-index:2}.v3-quick{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.v3-quick button{font-size:12px;min-height:64px;padding:6px}.v3-hint{font-size:12px;color:#59796c}.v3-tools{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:400px){.v3-score span{font-size:12px}.v3-origin{min-width:77px;font-size:13px}.v3-quick button{font-size:11px}}</style>"+
 '<div class="v3-coach"><p class="sub v2-match-meta">'+esc(d.date)+' · '+esc(d.location)+'</p>'+tabs()+inputModeBar(m)+
 '<div class="v2-layout"><div>'+v2ScoreHTML(m)+v2Details(m)+'</div><div><div class="card v2-input"><div class="sectionhead moment-heading"><h2>Record a moment</h2></div><button class="v3-goal" onclick="coachGoalChoice()">⚽ GOAL</button><p class="v3-hint">Tap for Basic · slide right for quality</p>'+sliders+
 '<div class="v3-quick"><button onclick="coachExtra(\'Def Con\')">🛡<br>Def Con</button><button onclick="coachExtra(\'Special\')">✧<br>Special</button><button onclick="coachExtra(\'Set Piece\')">⚑<br>Set Piece</button><button onclick="coachExtra(\'Substitute\')">⇄<br>Substitute</button></div><div class="v3-tools"><button onclick="undoLastAction()">↶ Undo</button><button onclick="view=\'report\';render()">Match report ↗</button></div></div></div></div></div>';
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
