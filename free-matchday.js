// Free matchdays have one temporary draft, not a reusable club or squad archive.
let freeDemoActive=false,freeRealDraft=null,freePendingDay=null;
function freeSave(){
  if(freeDemoActive)return; // Never replace a real draft with demo fixtures or names.
  try{localStorage.setItem(KEY,JSON.stringify(data))}catch{toast('Draft could not be saved. Download your reports before leaving this page.')}
}
function initialiseFreeMatchday(){
  if(data.freeVersion===1)return;
  const current=day(),older=(data.days||[]).filter(d=>d!==current);
  // Preserve previous local match records until the owner explicitly clears them.
  // Do not preserve the reusable club/team profile.
  data={...fresh(),legacyDays:older,days:current?[current]:[],selected:current?.id||null};
  if(current){current.squad=[...new Set(current.squad||current.matches.flatMap(m=>m.lineup))];current.teamIndex=0;data.teams=[{name:current.team,squad:[...current.squad]}]}
  save();
}
initialiseFreeMatchday();
function leaveFreeDemo(){if(!freeDemoActive)return;data=freeRealDraft||fresh();freeRealDraft=null;freeDemoActive=false;mi=0}
function startFreeSetup(){
 if(!freeDemoActive&&day()){$('#modal').innerHTML=`<div class="modal"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="new-day-warning"><h2 id="new-day-warning">Start a new matchday?</h2><p>Creating a new matchday will delete the current matchday’s team, players, results, actions, photo and saved report progress from this device. Save or share anything you want to keep first.</p><p>Your current draft stays intact until you confirm replacement on the setup screen.</p><div class="links"><button onclick="closeModal()">Keep current matchday</button><button class="danger" onclick="openFreeSetup()">Continue to new matchday</button></div></section></div>`;return}
 openFreeSetup();
}
function openFreeSetup(){leaveFreeDemo();closeModal();view='setup';render()}
function returnToFreeDraft(){leaveFreeDemo();mi=0;view=day()?'live':'home';render()}
function freeLegacyHTML(){return data.legacyDays?.length?`<section class="card free-legacy"><h2>Previous local match records</h2><p class="hint">${data.legacyDays.length} older matchday(s) from the previous version remain on this device. They are not reusable squads. Download a copy if needed, then clear them.</p><div class="links"><button onclick="exportPreviousRecords()">Download previous records</button><button class="danger" onclick="askClearPreviousRecords()">Clear previous records</button></div></section>`:''}
function exportPreviousRecords(){download(new Blob([JSON.stringify({days:data.legacyDays||[]})],{type:'application/json'}),'tikitapper-previous-matchdays.json')}
function askClearPreviousRecords(){$('#modal').innerHTML=`<div class="modal"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="clear-previous-title"><h2 id="clear-previous-title">Clear previous records?</h2><p>This removes older matchdays from this device. Download them first if you want a copy. Your current matchday is kept.</p><div class="links"><button onclick="closeModal()">Cancel</button><button class="danger" onclick="data.legacyDays=[];save();closeModal();render()">Clear previous records</button></div></section></div>`}
welcome=function(){
  $('#app').innerHTML=`<div class="layout home-layout"><section class="card"><div class="eyebrow">Free matchday</div><h2>A whole matchday, in your pocket.</h2><p>Enter your team and players for today. Capture every match in Coach or Player mode, then download or share your reports.</p><div class="home-actions"><button class="primary" onclick="startFreeSetup()">New Matchday</button>${day()?`<button onclick="view='live';render()">${freeDemoActive?'Return to demo':'Resume matchday'} ↗</button>`:''}${freeDemoActive&&freeRealDraft?.selected?'<button onclick="returnToFreeDraft()">Return to your matchday</button>':''}</div><p class="hint">No account needed. One temporary draft on this device; no saved squads. Finish matchday clears the draft.</p></section><section class="score home-toolkit"><div class="eyebrow">Your matchday toolkit</div><h2>Watch. Tap. Remember.</h2><p>Coach & Player modes<br>Precise pitch locations<br>Reports & video highlights</p><div class="clock">00:00</div></section></div>${freeLegacyHTML()}<footer class="home-footer"><h2>Little players. Big moments.</h2><p>Less typing. More watching the game.</p></footer>`;
};
renderSetup=function(){
  const d=freeDemoActive?null:day();
  $('#app').innerHTML=`<div class="top"><div><div class="eyebrow">Free matchday</div><h1>Set up today’s team.</h1><p class="sub">Enter once for all matches today. Start fresh next matchday.</p></div></div><div class="layout"><form class="card" onsubmit="createDay(event)"><h2>New matchday</h2><div class="field"><label for="free-team-name">Team name</label><input id="free-team-name" name="teamName" maxlength="120" required autocomplete="off" placeholder="Your team name"></div><div class="field"><label for="free-players">Players · one per line</label><textarea id="free-players" name="players" required maxlength="5000" autocomplete="off" placeholder="First names or nicknames only"></textarea><small class="hint">Use only the details you need. Avoid full surnames or contact details. Choose positions, goalkeeper, captain and substitutes next.</small></div>${timingField('durationMinutes','twoHalves',30)}<div class="field"><label for="free-date">Date</label><input id="free-date" name="date" type="date" required value="${new Date().toLocaleDateString('en-CA')}"></div><div class="field"><label for="free-venue">Location / venue</label><input id="free-venue" name="location" maxlength="180" required placeholder="Today’s venue"></div><div class="field"><label for="free-opponents">Opponents · one per line (name, kick-off time)</label><textarea id="free-opponents" name="opponents" maxlength="5000" required placeholder="Riverside Juniors, 10:00&#10;Parkside FC, 10:30"></textarea></div><button class="primary">Create matchday →</button><p class="hint">Your squad is used only for this matchday. Coach and Player modes are both available.</p></form><aside>${d?`<section class="card"><h2>Current matchday</h2><p><strong>${esc(d.team)}</strong><br>${esc(d.date)} · ${d.matches.length} matches</p><button class="v2-wide" onclick="view='live';render()">Resume matchday ↗</button><p class="hint">Creating a new matchday replaces this draft only after you confirm.</p></section><form class="card" onsubmit="updateDay(event)"><h2>Edit current matchday details</h2><div class="field"><label>Date</label><input name="date" type="date" required value="${esc(d.date)}"></div><div class="field"><label>Venue</label><input name="location" required maxlength="180" value="${esc(d.location)}"></div>${d.matches.map((m,i)=>`<div class="field"><label>Match ${i+1} opponent</label><input name="opp${i}" required value="${esc(m.opponent)}"><label>Kick-off</label><input name="time${i}" type="time" value="${esc(m.time)}"></div>${timingField('length'+i,'halves'+i,durationFor(m),usesHalves(m),clockHasStarted(m)||m.events.length>0,'Match '+(i+1)+' length')}`).join('')}<button>Save details</button></form>`:`<section class="card"><h2>Just today. All the moments.</h2><p>Enter a fresh team name and squad for each new matchday. You won’t need to re-enter players between its matches.</p><p class="hint">The temporary draft helps you recover after a refresh. Download or share anything you want to keep before finishing the matchday.</p></section>`}${freeLegacyHTML()}</aside></div>`;
};
function freeDayValues(form){
  const f=new FormData(form),text=k=>String(f.get(k)||'').trim();
  return {team:text('teamName'),squad:[...new Set(text('players').split('\n').map(n=>n.trim()).filter(Boolean))],date:text('date'),location:text('location'),opponents:text('opponents').split('\n').map(n=>n.trim()).filter(Boolean),durationMinutes:Number(f.get('durationMinutes'))||30,twoHalves:f.get('twoHalves')!==null};
}
createDay=function(e){
  e.preventDefault();const f=freeDayValues(e.target);
  if(!f.team||f.team.length>120||f.squad.length<2||f.squad.length>60||f.squad.some(n=>n.length>80)||!f.date||!f.location||!f.opponents.length||f.opponents.length>20||f.opponents.some(x=>!x.split(',')[0].trim()))return toast('Enter a team name, 2–60 players, date, venue and at least one opponent.');
  if(f.durationMinutes<2||f.durationMinutes>180)return toast('Choose a match length between 2 and 180 minutes.');
  leaveFreeDemo();freePendingDay=f;
  if(day()){$('#modal').innerHTML=`<div class="modal"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="replace-title"><h2 id="replace-title">Replace your current matchday?</h2><p>Download or share your current reports first. Continuing permanently deletes this matchday’s team, players, results, actions, photo and saved report progress from this device.</p><div class="links"><button onclick="freePendingDay=null;closeModal()">Cancel</button><button class="primary" onclick="confirmFreeDay()">Delete current & create new</button></div></section></div>`;return}
  confirmFreeDay();
};
function confirmFreeDay(){
  const f=freePendingDay;if(!f)return;freePendingDay=null;
  const d={id:crypto.randomUUID(),team:f.team,teamIndex:0,squad:[...f.squad],date:f.date,location:f.location,summary:'',photo:'',durationMinutes:f.durationMinutes,twoHalves:f.twoHalves,matches:f.opponents.map(x=>{const [opponent,time='']=x.split(',');return {opponent:opponent.trim(),time:time.trim(),lineup:[...f.squad],events:[],elapsed:0,running:false,ended:false,summary:'',durationMinutes:f.durationMinutes,twoHalves:f.twoHalves,period:1,firstHalfElapsed:0,inputMode:'player'}})};
  data={...fresh(),legacyDays:data.legacyDays||[],teams:[{name:f.team,squad:[...f.squad]}],days:[d],selected:d.id};mi=0;save();closeModal();view='live';render();lineupModal();
}
function askFinishFreeDay(){
  if(freeDemoActive){leaveFreeDemo();closeModal();view='home';render();return}
  $('#modal').innerHTML=`<div class="modal"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="finish-title"><h2 id="finish-title">Finish matchday & clear draft?</h2><p>Make sure you’ve downloaded or shared every report and video you want to keep.</p><p>This clears today’s team, players, actions, summaries and photo from this device. Full time ends only a match; this ends the whole matchday.</p><div class="links"><button onclick="closeModal()">Keep matchday</button><button class="primary" onclick="confirmFinishFreeDay()">Finish & clear matchday</button></div></section></div>`;
}
function confirmFinishFreeDay(){
  if(typeof playback!=='undefined'&&playback?.recording)return toast('Finish creating the video before clearing this matchday.');
  disposeExport();clearMatchReportFiles();freeRealDraft=null;
  cancelActionHold();cancelClockHold();captureV2=null;spFlow=null;teamDraft=null;subDraft=null;freePendingDay=null;pending=null;undoMode=false;
  data={...fresh(),legacyDays:data.legacyDays||[]};mi=0;save();closeModal();view='home';render();toast('Matchday finished. The team and draft have been cleared.');
}
// Disable the retired reusable-squad flows, including direct calls from old links.
saveTeams=function(e){e?.preventDefault();toast('Enter your team and players when creating a new matchday.')};
importBackup=async function(){toast('Squad and archive imports are not available in the free matchday experience.')};
const FREE_DEMO_BOYS=['Alfie','Arthur','Ethan','Freddie','Harry','Henry','Jack','Leo','Noah','Oscar','Theo','William'];
const FREE_DEMO_GIRLS=['Amelia','Ava','Charlotte','Ella','Emily','Evie','Grace','Isla','Lily','Mia','Olivia','Sophie'];
function freeRandomIndex(n){const a=new Uint32Array(1),limit=Math.floor(4294967296/n)*n;do{crypto.getRandomValues(a)}while(a[0]>=limit);return a[0]%n}
function freeShuffle(values){const a=[...values];for(let i=a.length-1;i>0;i--){const j=freeRandomIndex(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function freeDemoNames(){return freeShuffle([...freeShuffle(FREE_DEMO_BOYS).slice(0,5),...freeShuffle(FREE_DEMO_GIRLS).slice(0,5)])}
const freeOriginalDemo=demo;
demo=function(){
  if(!freeDemoActive)freeRealDraft=data;
  freeDemoActive=true;data={...fresh(),teams:[{name:'Meadow United',squad:freeDemoNames()}]};
  freeOriginalDemo();day().isDemo=true;day().squad=[...data.teams[0].squad];day().clubName='Fictional demo team';render();
};
const freeRenderBefore=render;
render=function(){
  freeRenderBefore();
  const tag=$('.tag');if(tag&&(view==='setup'||view==='home'))tag.textContent='SMALL MOMENTS. BIG MEMORIES.';
  $('#app').innerHTML=$('#app').innerHTML.replace('Saved on this device · v0.2 · Backup in Manage','Temporary draft on this device · v0.2');
  const nav=$('#nav');nav.innerHTML=nav.innerHTML.replace('>Manage<','>Matchday setup<');
  if(day()&&(view==='live'||view==='report'))$('#app').innerHTML+=`<div class="free-finish-tools">${freeDemoActive?'<p class="hint">Fictional demo · names are randomised each time. Your real draft is untouched.</p>':'<p class="hint">Temporary matchday draft on this device · no reusable saved squad.</p>'}<button class="${freeDemoActive?'':'danger'}" onclick="askFinishFreeDay()">${freeDemoActive?'Exit demo':'Finish matchday & clear draft'}</button></div>`;
};
render();
