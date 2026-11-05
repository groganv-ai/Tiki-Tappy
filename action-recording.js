// Shared lifecycle for Coach/Player action capture and held Pass input.
// Loaded before v02.js; rendering and category choices remain in v02.js.
// Team-selection decorators resume this same capture rather than committing
// another copy of a linked goal/assist or opposition shot/save.
let captureV2=null,v2GridHold=null,v2GridQuietUntil=0;
function cancelHeldRecordingActions(){cancelActionHold();v2CancelGridHold()}
function beginV2(action,known='',opposition=false){
 const m=match();if(m.ended)return toast('Match finished. Reopen to add actions.');if(!clockHasStarted(m))return toast('Start the match clock first.');
 if(undoMode){const e=[...v2Expanded(m)].reverse().find(e=>(opposition?e.opp:!e.opp&&(!known||e.player===known))&&(action==='Defence'?['Tackle','Block','Clearance'].includes(e.category):action==='Special'?V2_SPECIAL.includes(e.category):e.category===action));return e?removeUndoEvent(e.sourceId):toast('No matching action to remove.');}
 if(!undoMode&&!opposition&&known&&typeof teamIsSubstitute==='function'&&teamIsSubstitute(known,m))return promptBenchAction(known,action);
 captureV2={match:m,event:{id:crypto.randomUUID(),action,...captureEventTime(m,elapsed(m)),opp:opposition,player:opposition?'Opposition':known},known,stage:action==='Defence'?'defence':action==='Special'?'special':'player',quality:0};
 if(known&&action==='Goal')return v2ChoosePlayer(known,opposition);
 drawV2Capture();
}
function cancelV2(){if(typeof cancelPitchFeedback==='function')cancelPitchFeedback();captureV2=null;closeModal()}
function recordingContextValid(m){return !!m&&m===match()&&view==='live'&&!m.ended&&clockHasStarted(m)}
function cancelStaleV2Input(){
 if(v2GridHold&&!recordingContextValid(v2GridHold.match))v2CancelGridHold();
 if(captureV2&&!recordingContextValid(captureV2.match))cancelV2();
}
function finishV2(){const f=captureV2;if(!f||!recordingContextValid(f.match))return cancelV2();match().events.push(f.event);captureV2=null;save();closeModal();render();showActionFeedback(v2Description(f.event),(f.event.opp?match().opponent:f.event.player)+(f.event.save?' · '+f.event.save.qualityLabel+' by '+f.event.save.player:''))}
function v2StartGridHold(e,button,action,name,opp){if(undoMode||e.button>0||e.isPrimary===false||!recordingContextValid(match()))return;v2CancelGridHold();const h={button,action,name,opp,x:e.clientX,y:e.clientY,match:match(),time:captureEventTime(match(),elapsed(match())),rank:0};v2GridHold=h;button.classList.add('v2-held');showActionFeedback('Great pass',name+' · Keep holding for Brilliant or World-class',false,'clock');h.timer=setTimeout(()=>{if(v2GridHold!==h)return;h.rank=1;button.classList.add('v2-held');showActionFeedback(V2_QUALITY.Pass[1],name+' · Keep holding for World-class',false,'clock');h.timer=setTimeout(()=>{if(v2GridHold!==h)return;h.rank=2;showActionFeedback(V2_QUALITY.Pass[2],name,false,'clock')},1500)},1500)}
function v2CancelGridHold(){if(!v2GridHold)return;clearTimeout(v2GridHold.timer);v2GridHold.button.classList.remove('v2-held');v2GridHold=null;hideHoldFeedback()}
function v2MoveGridHold(e){const h=v2GridHold;if(h&&Math.hypot(e.clientX-h.x,e.clientY-h.y)>14){v2GridQuietUntil=Date.now()+700;v2CancelGridHold()}}
function v2ReleaseGridHold(){const h=v2GridHold;if(!h)return;v2CancelGridHold();v2GridQuietUntil=Date.now()+700;if(!recordingContextValid(h.match))return;v2QuickGrid(h.action,h.name,h.opp,h.rank,h.time)}
function v2QuickGrid(action,name,opp=false,rank=0,time=null){if(undoMode)return beginV2(action,name,opp);if(match().ended||!clockHasStarted(match()))return beginV2(action,name,opp);beginV2(action,name,opp);if(!captureV2)return;if(time)Object.assign(captureV2.event,time);captureV2.quality=rank;if(action==='Pass')v2ChoosePlayer(name,opp);else drawV2Capture()}
function v2GridClick(action,name,opp){if(Date.now()<v2GridQuietUntil)return;v2QuickGrid(action,name,opp)}
