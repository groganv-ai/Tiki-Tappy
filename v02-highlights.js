// Choose highlights explicitly; match records are never trimmed for export.
let highlightDraft=null;
function v2HighlightPriority(e){return e.action==='Goal'?100:(e.opp&&e.action==='Shot'&&e.save?e.save.qualityRank??0:e.qualityRank??(/^Great /i.test(e.action)?0:-1))}
function v2HighlightCost(e){return e.action==='Goal'?5:3}
function v2HighlightSeconds(events,model){return 6+(model.ended&&model.playerOfDay?4:0)+events.reduce((n,e)=>n+v2HighlightCost(e),0)}
function v2AutoHighlights(events,budget,model){const selected=new Set(events.filter(e=>e.action==='Goal').map(e=>e.id));let seconds=v2HighlightSeconds(events.filter(e=>selected.has(e.id)),model);[...events].filter(e=>e.action!=='Goal').sort((a,b)=>v2HighlightPriority(b)-v2HighlightPriority(a)||a.at-b.at).forEach(e=>{if(seconds+v2HighlightCost(e)<=budget){selected.add(e.id);seconds+=v2HighlightCost(e)}});return selected}
exportVideo=function(){disposeExport();const model=makeReplayModel();highlightDraft={match:match(),model,budget:60,selected:v2AutoHighlights(model.events,60,model)};drawV2Highlights()};
function drawV2Highlights(){const f=highlightDraft;if(!f||f.match!==match())return closeExport();const selected=f.model.events.filter(e=>f.selected.has(e.id)),seconds=v2HighlightSeconds(selected,f.model),over=seconds>f.budget;
 exportPanel('Choose match highlights',`<p class="hint">Goals are selected first, followed by the highest-quality moments. Linked assists and keeper saves stay together. Your full match remains saved.</p><label for="v2budget">Video length</label><select id="v2budget" onchange="v2SetHighlightBudget(this.value)">${[30,60,90,120,180].map(n=>`<option value="${n}" ${n===f.budget?'selected':''}>Up to ${n} seconds</option>`).join('')}</select><div class="v2-highlight-budget ${over?'over':''}" role="status"><strong>${selected.length} of ${f.model.events.length} moments · ${seconds} seconds</strong>${over?'<p>These moments exceed the selected length. Choose a longer video or deselect moments below.</p>':''}</div><div class="links"><button class="primary" onclick="v2PreviewHighlights()" ${over?'disabled':''}>Preview selected highlights</button><button onclick="highlightDraft.selected=v2AutoHighlights(highlightDraft.model.events,highlightDraft.budget,highlightDraft.model);drawV2Highlights()">Auto-select</button></div><details><summary>Choose individual moments</summary><div class="v2-highlights-list">${f.model.events.map((e,i)=>`<label><input type="checkbox" ${f.selected.has(e.id)?'checked':''} onchange="v2ToggleHighlight(${i},this.checked)"><span>${eventTimeLabel(e)} · ${esc(highlightMoment(e).player)}<br><b>${esc(highlightMoment(e).label)}</b>${e.assist?'<br>+ linked assist':''}${e.save?'<br>'+esc(highlightMoment(e).detail):''}</span></label>`).join('')}</div></details>`)
}
function v2SetHighlightBudget(value){highlightDraft.budget=Number(value);highlightDraft.selected=v2AutoHighlights(highlightDraft.model.events,highlightDraft.budget,highlightDraft.model);drawV2Highlights()}
function v2ToggleHighlight(i,checked){const id=highlightDraft.model.events[i].id;checked?highlightDraft.selected.add(id):highlightDraft.selected.delete(id);drawV2Highlights();$('#modal details').open=true}
function v2PreviewHighlights(){const f=highlightDraft;if(!f||f.match!==match())return;const events=f.model.events.filter(e=>f.selected.has(e.id));if(v2HighlightSeconds(events,f.model)>f.budget)return;const model={...f.model,allEvents:f.model.events,events};exportPanel('Match highlights',`<canvas id="replayCanvas" width="720" height="1080" aria-label="Animated selected match highlights"></canvas><p class="export-status" id="recordStatus">${events.length} highlights · ${Math.ceil(replayDuration(model))} seconds. Goals show a linked pass → shot replay. Pitch locations are approximate.</p><div class="links"><button class="primary" id="recordButton" onclick="recordReplay()">Create video file</button><button onclick="v2ReturnSelection()">Change selection</button></div><p class="hint">Keep this screen open while recording. You’ll get a preview and separate Share and Save buttons.</p>`);startReplay($('#replayCanvas'),model)}
highlightPlan=function(model){let time=2;const plan=[{type:'intro',start:0,end:time,index:-1}];model.events.forEach((e,index)=>{for(const [type,duration] of e.action==='Goal'?[['goal',1],['replay',3],['return',1]]:[['event',3]]){plan.push({type,start:time,end:time+duration,index});time+=duration}});plan.push({type:'final',start:time,end:time+4,index:model.events.length-1});if(model.ended&&model.playerOfDay)plan.push({type:'award',start:time+4,end:time+8,index:model.events.length-1});return plan};
// Running score reflects omitted goals as well as selected highlights.
highlightScore=function(model,index){if(index<0)return [0,0];const active=model.events[index],all=model.allEvents||model.events,position=all.findIndex(e=>e.id===active?.id);return all.slice(0,position+1).reduce((s,e)=>{if(e.action==='Goal')s[e.opp?1:0]++;return s},[0,0])};
// Quality is communicated in words, with the same action icons as capture.
isGreatHighlight=function(){return false};

function v2ReturnSelection(){if(playback?.recording)return toast("Finish or cancel recording first.");stopReplay();drawV2Highlights()}

// Presentation only: the stored shot and linked save remain one undoable event.
function highlightMoment(e){
 if(e?.opp&&e.action==='Shot'&&e.save){
  const shotQuality=({'Good effort':'Good shot','Great strike':'Great shot','Incredible strike':'Incredible shot'})[e.qualityLabel]||e.qualityLabel||'Shot saved';
  return {action:'Save',player:e.save.player,label:(e.save.qualityLabel||'Save').replace(/\bsave\b/i,'Save'),detail:'Opponent · '+shotQuality};
 }
 return {action:e?.action||'',player:e?.player||'',label:e?v2Description(e):'',detail:''};
}
