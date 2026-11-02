// User Test 2: agreed action taxonomy. Pitch renderer and set-piece flow unchanged.
const TT_ACTION_NAMES = {
 Goal:['Goal','Great Goal','Amazing Goal','Worldie Goal'],
 Shot:['Shot','Good Shot','Great Effort','Fantastic Effort'],
 Pass:['Pass','Great Pass','Amazing Pass','Incredible Pass'],
 Tackle:['Tackle','Great Tackle','Big Tackle','Crunching Tackle'],
 Skill:['Great Skill','Brilliant Dribble','Amazing First Touch'],
 Teamwork:['Great Teamwork','Brilliant Support','Great Sportsmanship','Fantastic Improvement']
};
for (const [action,labels] of Object.entries(TT_ACTION_NAMES)) V2_QUALITY[action]=labels.slice();
const TT_SPECIAL_TYPES={Skill:TT_ACTION_NAMES.Skill,Teamwork:TT_ACTION_NAMES.Teamwork};
const ttBaseQualityPanel=v2QualityHTML;
v2QualityHTML=function(action){
 if(action==='Clearance'||action==='Block'||action==='Skill'||action==='Teamwork')return '';
 const html=ttBaseQualityPanel(action);
 if(!TT_ACTION_NAMES[action])return html;
 return html.replace(/<span>(Good|Great|Amazing|Worldie)<\/span>/g,(_,label,offset)=>{const index=['Good','Great','Amazing','Worldie'].indexOf(label);return '<span>'+esc(TT_ACTION_NAMES[action][index])+'</span>'});
};
const ttBaseDraw=drawV2Capture;
drawV2Capture=function(){
 const f=captureV2;
 if(f&&f.stage==='defence'){
  document.getElementById('modal').innerHTML='<div class="modal"><div class="sheet v2-capture"><button class="close" onclick="cancelV2()">×</button><h2>Defence</h2>'+v2Choices(['Tackle','Big Clearance','Crucial Intercept'],'ttChooseDefence')+'</div></div>';
  return;
 }
 if(f&&f.stage==='special'){
  document.getElementById('modal').innerHTML='<div class="modal"><div class="sheet v2-capture"><button class="close" onclick="cancelV2()">×</button><h2>Choose action</h2>'+v2Choices(['Skill','Teamwork'],'ttChooseSpecial')+'</div></div>';
  return;
 }
 if(f&&f.stage==='tt-type'){
  document.getElementById('modal').innerHTML='<div class="modal"><div class="sheet v2-capture"><button class="close" onclick="cancelV2()">×</button><h2>'+esc(f.event.action)+'</h2>'+v2Choices(TT_SPECIAL_TYPES[f.event.action],'ttChooseType')+'</div></div>';
  return;
 }
 if(f&&f.stage==='tt-blocker'){
  document.getElementById('modal').innerHTML='<div class="modal"><div class="sheet v2-capture"><button class="close" onclick="cancelV2()">×</button><h2>Who blocked the shot?</h2>'+v2PlayersHTML()+'</div></div>';
  return;
 }
 if(f&&f.stage==='tt-goal-note'){
  document.getElementById('modal').innerHTML='<div class="modal"><div class="sheet v2-capture"><button class="close" onclick="cancelV2()">×</button><h2>Goal description (optional)</h2><label for="tt-goal-note">Describe the goal</label><textarea id="tt-goal-note" maxlength="240" placeholder="e.g. Header from a corner"></textarea><button class="primary" onclick="ttFinishGoalNote()">Save goal</button><button onclick="ttFinishGoalNote(true)">Skip note</button></div></div>';
  return;
 }
 ttBaseDraw();
 if(f&&f.stage==='location'&&f.event.action==='Goal'&&!f.event.opp){
  const sheet=document.querySelector('#modal .v2-capture');
  const header=sheet?.querySelector('.tt-pitch-header');
  if(header)header.insertAdjacentHTML('beforebegin',v2QualityHTML('Goal'));
 }
 if(f&&(f.event.action==='Skill'||f.event.action==='Teamwork')&&f.stage==='player'){
  const quality=document.querySelector('#modal .v2-quality');if(quality)quality.remove();
 }
};
function ttChooseDefence(i){
 const f=captureV2;if(!f)return;
 f.event.action=['Tackle','Clearance','Block'][i];
 f.event.category=f.event.action;
 f.event.ttDefenceType=i===1?'Big Clearance':i===2?'Crucial Intercept':null;
 f.quality=0;f.stage='player';drawV2Capture();
}
function ttChooseSpecial(i){
 const f=captureV2;if(!f)return;
 f.event.action=['Skill','Teamwork'][i];f.event.category=f.event.action;f.stage='tt-type';drawV2Capture();
}
function ttChooseType(i){
 const f=captureV2,types=TT_SPECIAL_TYPES[f?.event.action];if(!types||!types[i])return;
 f.quality=i;f.event.ttType=types[i];f.stage='player';drawV2Capture();
}
const ttBaseChoosePlayer=v2ChoosePlayer;
v2ChoosePlayer=function(player,opp=false){
 const f=captureV2;
 if(f?.stage==='tt-blocker'){
  if(!match().lineup.includes(player))return;
  f.event.block={player,qualityLabel:'Block',locationLabel:'Our defensive area'};
  return finishV2();
 }
 ttBaseChoosePlayer(player,opp);
 if(!f||captureV2!==f)return;
 if(f.event.ttDefenceType)f.event.qualityLabel=f.event.ttDefenceType;
 if(f.event.ttType)f.event.qualityLabel=f.event.ttType;
};
const ttBaseChooseZone=v2ChooseZone;
v2ChooseZone=function(i){
 const f=captureV2;
 if(f?.stage==='location'&&f.event.action==='Shot'&&f.event.opp&&f.event.outcome==='Blocked'){
  const z=v2Zones()[i];
  f.event.zone=z?.id||null;f.event.locationLabel=z?.label||'Location unknown';
  f.event.point=z?{x:(z.x+z.w/2)/360,y:(z.y+z.h/2)/560}:null;
  f.stage='tt-blocker';return drawV2Capture();
 }
 return ttBaseChooseZone(i);
};
const ttBaseFinish=finishV2;
finishV2=function(){
 const f=captureV2;
 if(f?.event.action==='Goal'&&!f.event.ttGoalNoteDone){
  f.stage='tt-goal-note';return drawV2Capture();
 }
 return ttBaseFinish();
};
function ttFinishGoalNote(skip=false){
 const f=captureV2;if(!f||f.stage!=='tt-goal-note')return;
 const note=skip?'':document.getElementById('tt-goal-note')?.value.trim().slice(0,240);
 if(note)f.event.goalNote=note;
 f.event.ttGoalNoteDone=true;ttBaseFinish();
}
const ttBaseDescription=v2Description;
v2Description=function(e){
 if(e?.ttDefenceType)return e.ttDefenceType;
 if(e?.ttType)return e.ttType;
 return ttBaseDescription(e);
};
const ttBaseExpanded=v2Expanded;
v2Expanded=function(m){
 return ttBaseExpanded(m).flatMap(e=>e.block?[e,{...e.block,...captureFields(e),id:e.id+'-block',sourceId:e.id,category:'Block',action:'Block',opp:false}]:[e]);
};
const ttBasePreset=highlightPresetEvents;
highlightPresetEvents=function(events,filter){
 if(filter!=='major')return ttBasePreset(events,filter);
 return events.filter(e=>{
  const c=v2Category(e);
  if(c==='Goal'||(e.opp&&c==='Shot'&&(e.save||e.block)))return true;
  if(e.opp)return false;
  if(e.ttDefenceType||e.ttType)return true;
  if(c==='Save')return true;
  const rank=highlightQualityRank(e,c);
  if(c==='Shot')return rank>=1;
  return ['Pass','Tackle','Block','Clearance','Skill','Teamwork','Team Values'].includes(c)&&rank>=2;
 });
};
const ttBaseMoment=highlightMoment;
highlightMoment=function(e){
 if(e?.block)return {action:'Block',player:e.block.player,label:'Block',detail:'Opposition shot blocked'};
 return ttBaseMoment(e);
};
const ttBaseTimelineText=v2TimelineText;
v2TimelineText=function(e){
 return ttBaseTimelineText(e)+(e?.goalNote?'<small>'+esc(e.goalNote)+'</small>':'')+(e?.block?'<small>Block: '+esc(e.block.player)+'</small>':'');
};
const ttBaseReportText=reportText;
reportText=function(all=true){
 // Preserve the original report, adding notes to their corresponding goal lines.
 const output=ttBaseReportText(all),d=day();
 let text=output;
 for(const m of (all?d.matches:[match()]))for(const e of m.events){
  if(e.action!=='Goal'||!e.goalNote)continue;
  const prefix=eventTimeLabel(e)+' '+(e.opp?'Opposition':e.player)+': '+v2Description(e);
  text=text.replace(prefix,prefix+' — '+e.goalNote);
 }
 return text;
};
const ttBaseReportCanvas=reportCanvas;
reportCanvas=async function(events=match().events){
 return ttBaseReportCanvas(events.map(e=>e.goalNote?{...e,qualityLabel:(e.qualityLabel||'Goal')+' — '+e.goalNote}:e));
};
const ttBasePaintReplay=paintReplay;
paintReplay=function(ctx,model,seconds){
 ttBasePaintReplay(ctx,model,seconds);
 const state=highlightState(model,seconds),e=model.events[state.index];
 if(e?.action!=='Goal'||!e.goalNote||!['goal','return'].includes(state.type))return;
 ctx.save();ctx.fillStyle='#133f36';ctx.fillRect(32,598,656,48);
 ctx.fillStyle='#fff';ctx.font='600 18px sans-serif';
 const note=e.goalNote.length>68?e.goalNote.slice(0,65)+'…':e.goalNote;
 ctx.fillText(note,45,628,630);ctx.restore();
};
// Keep the existing set-piece flow and pitch untouched.

// Preserve set-piece capture and its atomic linked outcomes; expose the approved fourth type.
SP_TYPES.splice(0,SP_TYPES.length,'Corner','Free kick','Goal kick','Penalty');
const ttOldSpLocation=spApplyAssumedLocation;
spApplyAssumedLocation=function(){
 if(spFlow?.draft?.type==='Goal kick'){
  spFlow.draft.locationLabel=spFlow.draft.opp?'Opposition goal kick':'Our goal kick';
  spFlow.draft.point={x:.5,y:spFlow.draft.opp?.03:.97};
  return;
 }
 ttOldSpLocation();
};
// Make the saved-shot option explicit without changing its stored outcome.
const ttOldCaptureDraw=drawV2Capture;
drawV2Capture=function(){
 ttOldCaptureDraw();
 if(captureV2&&(['outcome','player'].includes(captureV2.stage))&&captureV2.event.action==='Shot'){
  const sheet=document.querySelector('#modal .v2-capture');
  if(sheet)for(const span of sheet.querySelectorAll('button span'))if(span.textContent==='Saved')span.textContent='On Target (Saved)';
 }
};

// New four-level labels use zero-based ranks; legacy events keep their previous interpretation.
const ttOldHighlightRank=highlightQualityRank;
highlightQualityRank=function(e,category=v2Category(e)){
 const labels=TT_ACTION_NAMES[category],label=String(e?.qualityLabel||'').toLowerCase();
 const index=labels?.findIndex(v=>v.toLowerCase()===label)??-1;
 if(index>=0)return index;
 return ttOldHighlightRank(e,category);
};

// A blocked opposition set-piece shot must nominate our defender before saving.
const ttOriginalSetPieceAfterShot=spAfterShotLocation;
spAfterShotLocation=function(){
 if(spFlow?.draft?.opp&&spFlow.outcome?.kind==='Shot'&&spFlow.outcome.result==='Blocked'){
  spFlow.stage='tt-blocker';return spDrawFlow();
 }
 return ttOriginalSetPieceAfterShot();
};
const ttOriginalSetPieceDraw=spDrawFlow;
spDrawFlow=function(){
 if(spFlow?.stage==='tt-blocker'){
  document.getElementById('modal').innerHTML='<div class="modal"><div class="sheet"><button class="close" onclick="spCloseFlow()">×</button><h2>Who blocked the shot?</h2>'+teamChoiceSections('ttSetPieceBlocker')+'</div></div>';
  return;
 }
 ttOriginalSetPieceDraw();
};
function ttSetPieceBlocker(name){
 if(!spFlow||spFlow.stage!=='tt-blocker'||!match().lineup.includes(name))return;
 spFlow.outcome.block={player:name,qualityLabel:'Block',locationLabel:'Our defensive area'};
 spFinishOutcome();
}
const ttOriginalSetPieceFinish=spFinishOutcome;
spFinishOutcome=function(){
 const block=spFlow?.outcome?.block;
 if(!block)return ttOriginalSetPieceFinish();
 const id=spFlow.recordId;
 ttOriginalSetPieceFinish();
 const e=match().events.find(x=>x.id===id);
 if(e){e.block=block;save();render();}
};
// Icons for every new subtype use the shared SVG/canvas vector system.
const ttSubtypeIconKeys={
 'Big Clearance':'clearance','Crucial Intercept':'tackle',
 'Great Skill':'skill','Brilliant Dribble':'skill','Amazing First Touch':'skill',
 'Great Teamwork':'teamwork','Brilliant Support':'teamwork',
 'Great Sportsmanship':'values','Fantastic Improvement':'values',
 'Goal Kick':'setpiece','Goal kick':'setpiece','Free Kick':'freekick'
};
const ttPreviousVectorKey=vectorActionKey;
vectorActionKey=function(action){return ttSubtypeIconKeys[String(action)]||ttPreviousVectorKey(action)};
const ttPreviousEventIcon=gameEventIcon;
gameEventIcon=function(e){if(e?.block)return 'Block';if(e?.ttType)return e.ttType;if(e?.ttDefenceType)return e.ttDefenceType;return ttPreviousEventIcon(e)};
