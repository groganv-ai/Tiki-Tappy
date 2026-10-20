// Filter complete parent events; linked assists, saves and set pieces stay atomic.
let highlightDraft=null;
const HIGHLIGHT_FILTERS=[
 {id:'goals',label:'Goals',description:'Every goal from both teams, with linked assists and goal replays.'},
 {id:'goals-saves',label:'Goals & Saves',description:'Every goal, plus all saves by our goalkeeper.'},
 {id:'key',label:'Key Events',description:'Goals, our saves, great shots and all recorded positive team contributions.'},
 {id:'major',label:'Major Events',description:'Goals, great or incredible saves, and our highest-quality shots, passes and defensive actions.'},
 {id:'all',label:'All Events',description:'Everything recorded, including missed shots, set pieces and substitutions.'}
];
function highlightDurationLabel(seconds){const n=Math.ceil(seconds),m=Math.floor(n/60),s=n%60;return m?m+' min'+(s?' '+s+' sec':''):n+' sec'}
function highlightQualityRank(e,category=v2Category(e)){
 if(Number.isFinite(e.qualityRank))return e.qualityRank;
 const label=String(e.qualityLabel||e.quality||e.action||'').toLowerCase(),known=(V2_QUALITY[category]||[]).findIndex(q=>q.toLowerCase()===label);
 if(known>=0)return known;
 return /incredible|outstanding|world.class|worldie/.test(label)?2:/brilliant|amazing|great save|great strike/.test(label)?1:0;
}
function highlightPresetEvents(events,filter){
 return events.filter(e=>{
  if(filter==='all')return true;
  const category=v2Category(e),goal=category==='Goal',save=!!(e.opp&&category==='Shot'&&e.save)||(!e.opp&&category==='Save');
  if(goal)return true;
  if(filter==='goals')return false;
  if(filter==='goals-saves')return save;
  if(save)return filter==='key'||highlightQualityRank(e.save||e,'Save')>=1;
  if(e.opp)return false;
  const rank=highlightQualityRank(e,category);
  if(filter==='major')return ['Shot','Pass','Tackle','Block','Clearance'].includes(category)&&rank>=2;
  if(filter==='key')return category==='Shot'?rank>=1:['Pass','Tackle','Block','Clearance','Skill','Teamwork','Team Values'].includes(category);
  return false;
 });
}
function v2HighlightPriority(e){return e.action==='Goal'?100:(e.opp&&e.action==='Shot'&&e.save?e.save.qualityRank??0:e.qualityRank??(/^Great /i.test(e.action)?0:-1))}
function v2HighlightCost(e){return e.action==='Goal'?5:3}
function v2HighlightSeconds(events,model){return 6+(model.ended&&model.playerOfDay?4:0)+events.reduce((n,e)=>n+v2HighlightCost(e),0)}
function v2AutoHighlights(events,budget,model){const selected=new Set(events.filter(e=>e.action==='Goal').map(e=>e.id));let seconds=v2HighlightSeconds(events.filter(e=>selected.has(e.id)),model);[...events].filter(e=>e.action!=='Goal').sort((a,b)=>v2HighlightPriority(b)-v2HighlightPriority(a)||a.at-b.at).forEach(e=>{if(seconds+v2HighlightCost(e)<=budget){selected.add(e.id);seconds+=v2HighlightCost(e)}});return selected}

exportVideo=function(filter='major'){
 if(playback?.recording)return toast('Finish or cancel the current recording first.');
 disposeExport();const model=makeReplayModel(),preset=HIGHLIGHT_FILTERS.some(p=>p.id===filter)?filter:'major';highlightDraft={match:match(),model,filter:preset,selected:new Set()};v2SetHighlightFilter(preset);
};
function v2SetHighlightFilter(filter){
 const f=highlightDraft;if(!f||f.match!==match()||!HIGHLIGHT_FILTERS.some(p=>p.id===filter))return;
 f.filter=filter;f.selected=new Set(highlightPresetEvents(f.model.events,filter).map(e=>e.id));drawV2Highlights();
}
function drawV2Highlights(){
 const f=highlightDraft;if(!f||f.match!==match())return closeExport();
 const preset=HIGHLIGHT_FILTERS.find(p=>p.id===f.filter),events=f.model.events.filter(e=>f.selected.has(e.id)),seconds=v2HighlightSeconds(events,f.model);
 exportPanel('Create match highlights',`<p>Choose what to include. We’ll build the video automatically.</p><div class="highlight-filter-list" role="group" aria-label="Highlight filters">${HIGHLIGHT_FILTERS.map(p=>{const count=highlightPresetEvents(f.model.events,p.id).length;return `<button aria-pressed="${p.id===f.filter}" onclick="v2SetHighlightFilter('${p.id}')"><strong>${p.label}${p.id==='major'?' · Recommended':''}</strong><small>${p.description}</small><span>${count} moments</span></button>`}).join('')}</div><div class="highlight-selection-summary" role="status"><strong>${preset.label} · ${events.length} moments · about ${highlightDurationLabel(seconds)}</strong><p>Every matching moment is included. Linked assists and saves stay together. The video length follows your filter.</p>${seconds>180?'<p>This is a longer video. Choose a narrower filter for a shorter share.</p>':''}</div>${!events.length?'<p class="highlight-filter-empty">No moments match this filter yet. Try Key Events or All Events.</p>':''}<div class="links"><button class="primary" onclick="v2PreviewHighlights()" ${events.length?'':'disabled'}>Preview highlights</button><button onclick="closeExport()">Back to report</button></div>`);
}
function v2PreviewHighlights(){
 const f=highlightDraft;if(!f||f.match!==match())return;
 const events=f.model.events.filter(e=>f.selected.has(e.id));if(!events.length)return;
 const model={...f.model,allEvents:f.model.events,events,highlightFilter:f.filter},preset=HIGHLIGHT_FILTERS.find(p=>p.id===f.filter);
 exportPanel('Match highlights',`<canvas id="replayCanvas" width="720" height="1080" aria-label="Animated filtered match highlights"></canvas><p class="export-status" id="recordStatus">${preset.label} · ${events.length} moments · about ${highlightDurationLabel(replayDuration(model))}. Goals replay the linked assist and shot.</p><div class="highlight-preview-actions"><button class="primary" id="recordButton" onclick="recordReplay()">Create video file</button><button onclick="v2ReturnSelection()">Change filter</button><button onclick="closeExport()">Back to report</button></div><p class="hint">Keep this screen open while the video is created. Preview, then save or share the finished file.</p>`);
 startReplay($('#replayCanvas'),model);
}
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
 return {action:e?gameEventIcon(e):'',player:e?.player||'',label:e?v2Description(e):'',detail:''};
}
