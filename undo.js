// Undo follows insertion order, independent of recorded match timestamps.
// A linked goal/assist remains one event and is removed as one operation.
let undoMode=false,undoContext=null;
function undoLastAction(){
  cancelActionHold();const m=match();if(!m?.events.length)return toast('No actions to undo.');
  removeUndoEvent(m.events[m.events.length-1].id);
}
function toggleUndoMode(){
  cancelActionHold();suppressedTap=null;undoMode=!undoMode;undoContext=match();render();
}
function removeUndoEvent(id){
  const m=match(),index=m?.events.findIndex(e=>e.id===id);if(index===undefined||index<0)return;
  const [e]=m.events.splice(index,1);save();render();
  showActionFeedback('Removed '+e.action,e.player+(e.assist?' · linked assist removed':''));
}
function removeMatchingAction(pi,ai){
  const m=match(),a=gridActions[ai],player=pi===-1?'Opposition':m.lineup[pi];
  const e=[...m.events].reverse().find(e=>(pi===-1?!!e.opp:!e.opp&&e.player===player)&&actionKey(e.action)===actionKey(a.base));
  if(!e)return toast('No '+a.label.toLowerCase()+' recorded for '+player+'.');
  removeUndoEvent(e.id);
}
const recordingGridEvent=gridEvent;
gridEvent=function(pi,ai,...args){if(undoMode)return removeMatchingAction(pi,ai);return recordingGridEvent(pi,ai,...args)};
const recordingRecordAction=recordAction;
recordAction=function(pi,ai,...args){if(undoMode)return removeMatchingAction(pi,ai);return recordingRecordAction(pi,ai,...args)};
const recordingStartHold=startActionHold;
startActionHold=function(...args){if(undoMode)return;return recordingStartHold(...args)};
const recordingBeginEvent=beginEvent;
beginEvent=function(i,opp=false){
  if(undoMode&&opp){
    const m=match(),e=[...m.events].reverse().find(e=>e.opp&&actionKey(e.action)===actionKey(actions[i]));
    if(e)return removeUndoEvent(e.id);return toast('No opposition '+actions[i].toLowerCase()+' to remove.');
  }
  return recordingBeginEvent(i,opp);
};
const uneditedEventHTML=eventHTML;
eventHTML=function(e,remove=false){
  let html=uneditedEventHTML(e,remove);
  if(!remove)return html;
  // Timeline deletions are available through the explicit mode, rather than
  // a small cross that is easy to hit while checking an entry.
  html=html.replace(/<button[^>]*onclick="delEvent\([^>]*>[\s\S]*?<\/button>/,'');
  if(undoMode)html=html.replace('<div class="event"',`<div class="event undo-target" role="button" tabindex="0" data-event-id="${esc(e.id)}" aria-label="Remove ${esc(e.player)} ${esc(e.action)} at ${eventTimeLabel(e)}" onclick="removeUndoEvent(this.dataset.eventId)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();removeUndoEvent(this.dataset.eventId)}"`);
  return html;
};
const preUndoRender=render;
render=function(){
  const m=match();if(view!=='live'||undoContext!==m){undoMode=false;undoContext=m}
  const gridScroll=$('.matrixwrap')?.scrollLeft||0,timelineScroll=$('.timeline')?.scrollTop||0;
  preUndoRender();if(view!=='live'||!m)return;
  const bar=`<div class="undo-toolbar"><button onclick="undoLastAction()" ${m.events.length?'':'disabled'}>↶ Undo last action</button><button class="${undoMode?'undo-on':''}" aria-pressed="${undoMode}" onclick="toggleUndoMode()">${undoMode?'✓ Done removing':'Edit actions'}</button>${undoMode?'<p class="undo-notice"><strong>UNDO MODE ON</strong> · Tap an action button to remove the latest matching action, or tap a timeline entry to remove that exact event. A goal and its assist are removed together. Tap <strong>Done removing</strong> to record again.</p>':''}</div>`;
  const guide=undoMode?'':'<details class="action-info"><summary aria-label="Action information"><span aria-hidden="true">ⓘ</span> Action info</summary><div class="action-info-body"><p><strong>Tap</strong> to record an action. <strong>Hold</strong> for a Great action ★ (1.5 seconds). Goals open shot location and optional assist.</p><p>Top count = all actions · Gold ★ count = Great actions. Player totals include assists.</p></div></details>';
  const app=$('#app');app.innerHTML=app.innerHTML.replace(/<div class="opponents">[\s\S]*?<\/div>/,whole=>whole+bar);
  if(guide)app.innerHTML=app.innerHTML.replace('<div class="sectionhead"><h2>Record a moment</h2>','<div class="sectionhead moment-heading"><h2>Record a moment</h2>'+guide);
  if(undoMode)app.innerHTML=app.innerHTML.replace('<div class="matrixwrap">','<div class="matrixwrap undo-grid">').replace('Tap any action to record. Hold 1.5 seconds for Great! Goal opens shot + assist. Badges count this match; player totals include assists.','UNDO MODE · Tap an action to remove its latest entry. Tap Done removing to record again.');
  const grid=$('.matrixwrap'),timeline=$('.timeline');if(grid)grid.scrollLeft=gridScroll;if(timeline)timeline.scrollTop=timelineScroll;
};
render();
