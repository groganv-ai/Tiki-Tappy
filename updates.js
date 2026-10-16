// Linked goal/assist logging. One goal event owns the assist so the score,
// deletion, backups and replay cannot separate the two halves of the move.
gridActions.splice(0,gridActions.length,
  {label:'Goal',icon:'⚽',base:'Goal'},
  {label:'Skill',icon:'✧',base:'Skill',quick:true},
  {label:'Pass',icon:'➜',base:'Pass',quick:true},
  {label:'Tackle',icon:'⊥',base:'Tackle',quick:true},
  {label:'Save',icon:'◇',base:'save',quality:true},
  {label:'Teamwork',icon:'∞',base:'Team work',quick:true},
  {label:'Sport',icon:'♡',base:'Sportsmanship',quick:true});

gridEvent=function(pi,ai){
  const m=match(),a=gridActions[ai];
  if(!m.running&&!m.elapsed&&!m.ended)return toast('Start the match clock first.');
  pending={id:crypto.randomUUID(),action:a.base,...captureEventTime(m,elapsed(m)),opp:false,player:m.lineup[pi],zone:null};
  if(a.quick)return commitMoment();
  pending.stage=a.quality?'quality':'shot';
  eventModal();
};
beginEvent=function(i,opp=false){
  const m=match();
  if(m.ended)return toast('Match finished. Reopen the match to record more actions.');
  if(!m.running&&!m.elapsed&&!m.ended)return toast('Start the match clock first.');
  pending={id:crypto.randomUUID(),action:actions[i],...captureEventTime(m,elapsed(m)),opp,player:opp?'Opposition':'',zone:null,stage:i===0?'shot':'location'};
  if(opp&&/save/i.test(pending.action))return saveInGoalBox();
  eventModal();
};
function pitchPicker(){
  return `<div class="attack-label">NORTH · OPPOSITION GOAL</div><div class="pitch-frame"><div class="goal-mouth north" aria-label="Opposition goal"></div><div class="pitch">${[10,11,12,7,8,9,4,5,6,1,2,3].map(z=>`<button onclick="finishEvent(${z})" aria-label="Zone ${z}, ${zoneName(z)}">${z}<br><small>${zoneName(z)}</small></button>`).join('')}</div><div class="goal-mouth south" aria-label="Our goal"></div></div><div class="attack-label">SOUTH · OUR GOAL</div><p class="pitch-direction">↑ Our attack: south to north. Use this orientation throughout the match.</p>`;
}
eventModal=function(){
  const p=pending;if(!p)return;
  let content='',title=p.action;
  if(p.stage==='quality'){
    title='How was that save?';
    content=`<div class="quality">${['Good','Great','Amazing'].map(q=>`<button onclick="chooseQuality('${q}')">${q}</button>`).join('')}</div>`;
  }else if(p.stage==='assist-question'){
    title='Was there an assist?';
    content=`<p>Shot by <strong>${esc(p.player)}</strong> · ${p.zone?'zone '+p.zone:'location not recorded'}</p><div class="quality" style="grid-template-columns:1fr 1fr"><button onclick="assistAnswer(true)">Yes — add assist</button><button onclick="assistAnswer(false)">No assist</button></div>`;
  }else if(p.stage==='assist-player'){
    title='Who made the assist?';
    const players=match().lineup.filter(n=>n!==p.player);
    content=`<div class="squad">${players.map(n=>`<button data-name="${esc(n)}" onclick="assistPlayer(this.dataset.name)">${esc(n)}</button>`).join('')}</div>${!players.length?'<p>No other players in this lineup.</p>':''}<button style="margin-top:20px" onclick="assistAnswer(false)">Save without assist</button>`;
  }else{
    title=p.stage==='assist-location'?'Where was the assist played?':p.action==='Goal'?'Where was the shot taken?':'Where was the save made?';
    content=`<p><strong>${esc(p.stage==='assist-location'?p.assist.player:p.player)}</strong></p>${pitchPicker()}<button style="width:100%;margin-top:10px" onclick="finishEvent(null)">Location unknown / skip</button>`;
  }
  $('#modal').innerHTML=`<div class="modal"><div class="sheet"><button class="close" aria-label="Cancel moment" onclick="closeModal()">×</button><div class="eyebrow">${eventTimeLabel(p)} · ${esc(p.player)}</div><h2 style="margin-top:12px">${esc(title)}</h2>${content}<p class="hint">${p.stage==='assist-question'||p.stage==='assist-player'||p.stage==='assist-location'?'Goal and assist are saved together when you finish.':'Time was captured on the first tap.'}</p></div></div>`;
};
function saveInGoalBox(){
  pending.zone=pending.opp?11:2;
  pending.assumedLocation=true;
  pending.locationLabel=pending.opp?'Opposition goal box':'Our defensive goal box';
  commitMoment();
}
chooseQuality=function(q){pending.quality=q;pending.action=q+' save';saveInGoalBox()};
finishEvent=function(z){
  if(pending.stage==='assist-location'){pending.assist.zone=z;return commitMoment()}
  pending.zone=z;
  if(pending.action==='Goal'&&!pending.opp){pending.stage='assist-question';return eventModal()}
  commitMoment();
};
function assistAnswer(yes){if(!yes){delete pending.assist;return commitMoment()}pending.stage='assist-player';eventModal()}
function assistPlayer(name){if(name===pending.player)return;pending.assist={player:name,zone:null};pending.stage='assist-location';eventModal()}
function commitMoment(){const p=pending;if(!p)return;delete p.stage;match().events.push(p);save();closeModal();render();toast(p.action+' recorded'+(p.assist?' with assist':''))}

const originalEventHTML=eventHTML;
eventHTML=function(e,remove=false){
  let html=originalEventHTML(e,remove);
  if(e.assumedLocation)html=html.replace(`Zone ${e.zone} · ${zoneName(e.zone)}`,`${esc(e.locationLabel)} (assumed)`);
  if(e.assist)html=html.replace('</strong>',`</strong><span class="assist-note">Assist: ${esc(e.assist.player)}${e.assist.zone?' · zone '+e.assist.zone:''} → ${esc(e.player)}${e.zone?' · shot zone '+e.zone:''}</span>`);
  return html;
};
reportText=function(all=true){
  const d=day(),ms=all?d.matches:[match()];
  return `${d.team} — Matchday report\n${d.date} · ${d.location}\n\n`+ms.map(m=>{
    const s=score(m);
    return `${d.team} ${s[0]}–${s[1]} ${m.opponent}${m.ended?' (FT)':' (in progress)'}\nKick-off: ${m.time||'Not set'}\nLineup: ${m.lineup.join(', ')}\n`+[...m.events].sort((a,b)=>a.at-b.at).map(e=>`${eventTimeLabel(e)} ${e.player}: ${e.action}${e.assumedLocation?' · '+e.locationLabel+' (assumed)':e.zone?' · zone '+e.zone:''}${e.assist?'\n  Assist: '+e.assist.player+(e.assist.zone?' (zone '+e.assist.zone+')':'')+' → '+e.player+(e.zone?' (shot zone '+e.zone+')':''):''}`).join('\n')+(m.summary?'\n'+m.summary:'');
  }).join('\n\n')+(d.summary?'\n\nCoach’s summary\n'+d.summary:'');
};
const originalReportCanvas=reportCanvas;
reportCanvas=async function(events=match().events){return originalReportCanvas(events.map(e=>e.assist?{...e,action:e.action+' · assist: '+e.assist.player+(e.assist.zone?' (zone '+e.assist.zone+')':'')}:e))};

const originalRender=render;
render=function(){originalRender();const app=$('#app');app.innerHTML=app.innerHTML.replace('Tap beside a player → choose quality → pitch zone. Swipe actions sideways. Time captured on your first tap.','Pass, tackle, skill and teamwork: one tap. Goal → shot location → assist. Swipe actions sideways.').replace('9 positive actions','One-tap positive actions').replace('Action → player → pitch zone.','Player + action → saved.');};
const originalRenderReport=renderReport;
renderReport=function(){originalRenderReport();const app=$('#app');app.innerHTML=app.innerHTML.replace('Timeline video','Highlights & video').replace('Video export uses WebM where supported; image and text are the reliable fallbacks.','Preview the linked pass → shot → goal animation, then create a video. MP4 is preferred when your browser supports it. Exported files have their own Share and Save buttons.').replace('create a retro image or short timeline video','create a retro image or animated pitch highlights');};

// Explicit second-tap sharing keeps navigator.share inside a user gesture.
let preparedExport=null,exportURL=null,playback=null;
function disposeExport(){if(exportURL)URL.revokeObjectURL(exportURL);exportURL=null;preparedExport=null;stopReplay()}
function exportPanel(title,content){$('#modal').innerHTML=`<div class="modal"><div class="sheet export-sheet"><button class="close" aria-label="Close export" onclick="closeExport()">×</button><h2>${title}</h2>${content}</div></div>`}
function closeExport(){if(playback?.recording)return toast('Wait for recording to finish or tap Cancel recording.');disposeExport();closeModal()}
function showPrepared(blob,name){
  disposeExport();preparedExport={blob,name};exportURL=URL.createObjectURL(blob);
  exportPanel('Ready to preview & share',`${blob.type.startsWith('video')?`<video controls playsinline src="${exportURL}"></video>`:`<img src="${exportURL}" alt="Exported match report">`}<p class="export-status">${esc(name)} · ${(blob.size/1024/1024).toFixed(2)} MB\nPreview first, then tap Share. Choose WhatsApp and your group.</p><div class="links"><button class="primary" onclick="sharePrepared()">Share file ↗</button><a href="${exportURL}" download="${name}">Save file</a><button onclick="shareReport()">Share text instead</button></div><p class="hint" id="shareStatus">If WhatsApp is missing, save the file and attach it inside WhatsApp.</p>`);
}
async function sharePrepared(){
  if(!preparedExport)return;
  const {blob,name}=preparedExport,f=new File([blob],name,{type:blob.type});
  const status=$('#shareStatus');
  if(!navigator.canShare?.({files:[f]})||!navigator.share){status.textContent='File sharing is unavailable in this browser. Tap Save file, then attach it in WhatsApp.';return}
  try{await navigator.share({files:[f],title:'Touchline match highlights'});status.textContent='Returned from the share menu. Check WhatsApp to confirm it was sent.'}
  catch(e){status.textContent=e.name==='AbortError'?'Sharing cancelled. Your file is still ready.':`Could not open sharing (${e.name}). Tap Save file and attach it in WhatsApp.`}
}
exportImage=async function(){try{const c=await reportCanvas();const b=await new Promise(r=>c.toBlob(r,'image/png'));if(!b)throw Error();showPrepared(b,'match-report.png')}catch{toast('Could not create the image. Use Share text instead.')}};

function pointForZone(z){if(!z||z<1||z>12)return null;return{x:90+((z-1)%3+.5)*180,y:265+(3-Math.floor((z-1)/3)+.5)*135}}
function makeReplayModel(){const m=match(),d=day();return {team:d.team,opponent:m.opponent,date:d.date,location:d.location,events:JSON.parse(JSON.stringify([...m.events].sort((a,b)=>a.at-b.at))),score:score(m)}}
function replayDuration(model){return Math.max(4,2+model.events.length*3)}
function stopReplay(){if(playback){cancelAnimationFrame(playback.raf);playback.stream?.getTracks().forEach(t=>t.stop());playback=null}}
function paintReplay(ctx,model,seconds){
  const W=720,H=1080,events=model.events,idx=Math.min(events.length-1,Math.floor(Math.max(0,seconds-2)/3)),e=seconds<2?null:events[idx],phase=((seconds-2)%3)/3;
  ctx.fillStyle='#122b36';ctx.fillRect(0,0,W,H);ctx.fillStyle='#215c58';ctx.fillRect(0,0,W,88);
  function text(t,x,y,size=22,color='#dfedb5'){ctx.font=`bold ${size}px monospace`;ctx.fillStyle=color;ctx.fillText(String(t).slice(0,48),x,y)}
  text('TOUCHLINE / MATCH HIGHLIGHTS',28,54,26);text(model.team,28,126,25,'#fff');text('vs '+model.opponent,28,163,23,'#fff');text(model.date+' · '+model.score.join('–'),28,201,21);
  const px=90,py=265,pw=540,ph=540;
  ctx.fillStyle='#306347';ctx.fillRect(px,py,pw,ph);ctx.strokeStyle='#c5dfb2';ctx.lineWidth=3;ctx.strokeRect(px,py,pw,ph);
  // Goals at north and south, halfway line, centre circle and 12 zones.
  ctx.strokeRect(280,py-22,160,22);ctx.strokeRect(280,py+ph,160,22);
  ctx.beginPath();ctx.moveTo(px,py+270);ctx.lineTo(px+pw,py+270);ctx.arc(360,py+270,55,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([4,8]);ctx.lineWidth=1;for(let i=1;i<3;i++){ctx.beginPath();ctx.moveTo(px+i*180,py);ctx.lineTo(px+i*180,py+ph);ctx.stroke()}for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(px,py+i*135);ctx.lineTo(px+pw,py+i*135);ctx.stroke()}ctx.setLineDash([]);
  text('OPPOSITION GOAL',251,233,16);text('OUR GOAL',310,854,16);text('↑ ATTACK',34,559,13);
  if(!e){text('Every little moment counts.',40,929,26);text(events.length?`${events.length} moments · chronological replay`:'No moments recorded yet.',40,971,20);return}
  text(eventTimeLabel(e)+' · '+e.action,28,915,28,'#fff');text(e.player,28,957,27);
  const shot=e.assumedLocation?{x:360,y:e.opp?py+35:py+ph-35}:pointForZone(e.zone),assist=pointForZone(e.assist?.zone),goal={x:360,y:e.opp?py+ph+12:py-12};
  function dot(p,label,color){if(!p)return;ctx.fillStyle=color;ctx.beginPath();ctx.arc(p.x,p.y,10,0,Math.PI*2);ctx.fill();text(label,Math.max(92,Math.min(p.x-45,480)),p.y+30,16,color)}
  function path(a,b,color){ctx.strokeStyle=color;ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();const angle=Math.atan2(b.y-a.y,b.x-a.x);ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-16*Math.cos(angle-.45),b.y-16*Math.sin(angle-.45));ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-16*Math.cos(angle+.45),b.y-16*Math.sin(angle+.45));ctx.stroke()}
  if(e.action==='Goal'&&shot){
    dot(shot,e.player,'#fff');if(assist)dot(assist,e.assist.player,'#d6ee83');
    let from=shot,to=goal,t=phase;
    if(assist&&phase<.55){from=assist;to=shot;t=phase/.55;path(from,to,'#d6ee83')}
    else {if(assist)path(assist,shot,'#a0bb70');from=shot;to=goal;t=assist?(phase-.55)/.45:phase;path(from,to,'#fff')}
    const ball={x:from.x+(to.x-from.x)*Math.min(1,t),y:from.y+(to.y-from.y)*Math.min(1,t)};dot(ball,'','#ffe385');
  }else if(shot)dot(shot,e.player,'#d6ee83');
  if(e.assist)text('Assist: '+e.assist.player+' → '+e.player,28,1005,19);
  if(e.action==='Goal'&&(!shot||(e.assist&&!assist)))text('Missing location: path not reconstructed',28,1040,15,'#9eb8b3');
  else if(!shot)text('One-tap moment · location not recorded',28,1040,17,'#9eb8b3');
}
function startReplay(canvas,model){stopReplay();const start=performance.now();playback={raf:null,model,canvas};function frame(now){if(!playback)return;paintReplay(canvas.getContext('2d'),model,((now-start)/1000)%replayDuration(model));playback.raf=requestAnimationFrame(frame)}playback.raf=requestAnimationFrame(frame)}
exportVideo=function(){
  disposeExport();const model=makeReplayModel();
  exportPanel('Match highlights',`<canvas id="replayCanvas" width="720" height="1080" aria-label="Animated match highlights"></canvas><p class="export-status" id="recordStatus">${model.events.length} moments · ${Math.ceil(replayDuration(model))} seconds. Goals replay the assist pass, then the shot. Pitch zones are approximate, not tracking footage.</p><div class="links"><button id="recordButton" class="primary" onclick="recordReplay()">Create video file</button><button onclick="exportImage()">Report image instead</button></div><p class="hint">Keep this screen open while recording. You’ll get a video preview and a separate Share button when it finishes.</p>`);
  startReplay($('#replayCanvas'),model);
};
function cancelRecording(){if(playback?.recorder?.state==='recording'){playback.cancelled=true;playback.recorder.stop()}else closeExport()}
async function recordReplay(){
  const current=playback;if(!current)return;
  const {canvas,model}=current,status=$('#recordStatus');
  if(typeof MediaRecorder==='undefined'||!canvas.captureStream){status.textContent='This browser cannot record a canvas video. The animated preview works; use the Report image fallback or try another browser.';return}
  const mime=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime){status.textContent='No compatible video encoder is available. Use Report image instead.';return}
  const modelCopy=model;stopReplay();
  let stream,rec,timer;
  try{
    stream=canvas.captureStream(30);const chunks=[];
    rec=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:2200000});
    playback={canvas,model:modelCopy,stream,recording:true,recorder:rec,raf:null,cancelled:false};
    const state=playback;
    const done=new Promise((resolve,reject)=>{rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onerror=e=>reject(e.error||new Error('Encoder error'));rec.onstop=resolve});
    $('#recordButton').disabled=true;
    const cancel=document.createElement('button');cancel.textContent='Cancel recording';cancel.onclick=cancelRecording;status.after(cancel);
    const duration=replayDuration(modelCopy),start=performance.now();
    rec.start(250);
    function frame(now){if(playback!==state)return;const sec=Math.min(duration,(now-start)/1000);paintReplay(canvas.getContext('2d'),modelCopy,sec);status.textContent=`Recording ${Math.floor(sec)} / ${Math.ceil(duration)} seconds · ${mime.startsWith('video/mp4')?'MP4':'WebM'}. Keep this tab open.`;if(sec>=duration){if(rec.state==='recording')rec.stop()}else state.raf=requestAnimationFrame(frame)}
    state.raf=requestAnimationFrame(frame);
    timer=setTimeout(()=>{if(rec.state==='recording'){state.cancelled=true;rec.stop()}},duration*1000+20000);
    await done;clearTimeout(timer);const cancelled=state.cancelled;stopReplay();
    if(cancelled){toast('Recording cancelled or interrupted. Try again with this tab in the foreground.');return exportVideo()}
    const type=rec.mimeType.split(';')[0],blob=new Blob(chunks,{type});if(blob.size<1000)throw new Error('The encoder produced an empty video');
    showPrepared(blob,'match-highlights.'+(type.includes('mp4')?'mp4':'webm'));
  }catch(e){clearTimeout(timer);if(rec?.state==='recording')rec.stop();stream?.getTracks().forEach(t=>t.stop());stopReplay();status.textContent='Video could not be created: '+e.message+'. Try another browser, or use Report image.';const b=$('#recordButton');if(b)b.disabled=false}
}
// Demo goals have a linked assist for easy testing without entering a real game.
const originalDemo=demo;
demo=function(){originalDemo();const m=match(),g=m.events.find(e=>e.action==='Goal');if(g&&m.lineup.length>1){g.assist={player:m.lineup[0],zone:7};save();render()}};
render();
