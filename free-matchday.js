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
  $('#app').innerHTML=`<div class="layout home-layout"><section class="card"><h2>A whole matchday, in your pocket.</h2><p>Set up a matchday – add your team, opponent, venue and match length.<br>Quickly and easily capture the key moments from the game.<br>Create &amp; share a match report or highlights video of the moments that mattered most!</p><div class="home-actions"><button class="primary" onclick="startFreeSetup()">New Matchday</button>${day()?`<button onclick="view='live';render()">${freeDemoActive?'Return to demo':day()?.endFlow?'Return to match':'Resume matchday'} ↗</button>`:''}${freeDemoActive&&freeRealDraft?.selected?'<button onclick="returnToFreeDraft()">Return to your matchday</button>':''}${day()?.endFlow?'<button onclick="startDayFlow()">Resume matchday report →</button>':''}</div><p class="hint">No account needed.<br>Your matchday and reports stay until you explicitly clear them or start a new matchday.<br>Data is stored on your device only.</p></section><section class="score home-toolkit"><div class="eyebrow">Your matchday toolkit</div><h2>Watch. Tap. Remember.</h2><p>Coach & Player modes<br>Precise pitch locations<br>Reports & video highlights</p>${typeof homeMomentsHTML==='function'?homeMomentsHTML():'<div class="clock">00:00</div>'}</section></div>${freeLegacyHTML()}<footer class="home-footer"><h2>Little players. Big moments.</h2><p>Less typing. More watching the game.</p></footer>`;
};
renderSetup=function(){
  const d=day();
  $('#app').innerHTML=`<div class="top"><div><div class="eyebrow">Free matchday</div><h1>Set up today’s team.</h1><p class="sub">Enter once for all matches today. Start fresh next matchday.</p></div></div><div class="layout"><form class="card" onsubmit="createDay(event)"><h2>New matchday</h2><div class="field"><label for="free-team-name">Team name</label><input id="free-team-name" name="teamName" maxlength="120" required autocomplete="off" placeholder="Your team name"></div>${pitchMatchdayFields('newPitch')}<div class="field"><label for="free-players">Players · one per line</label><textarea id="free-players" name="players" required maxlength="5000" autocomplete="off" placeholder="First names or nicknames only"></textarea><small class="hint">Use only the details you need. Avoid full surnames or contact details. Choose positions, goalkeeper, captain and substitutes next.</small></div>${timingField('durationMinutes','twoHalves',30)}<div class="field"><label for="free-date">Date</label><input id="free-date" name="date" type="date" required value="${new Date().toLocaleDateString('en-CA')}"></div><div class="field"><label for="free-venue">Location / venue</label><input id="free-venue" name="location" maxlength="180" required placeholder="Today’s venue"></div><div class="field"><label for="free-opponents">Opponents · one per line (name, kick-off time)</label><textarea id="free-opponents" name="opponents" maxlength="5000" required placeholder="Riverside Juniors, 10:00&#10;Parkside FC, 10:30"></textarea></div><button class="primary">Create matchday →</button><p class="hint">Your squad is used only for this matchday. Coach and Player modes are both available.</p></form><aside>${d?`<section class="card"><h2>Current matchday</h2><p><strong>${esc(d.team)}</strong><br>${esc(d.date)} · ${d.matches.length} matches</p><button class="v2-wide" onclick="view='live';render()">Resume matchday ↗</button><p class="hint">Creating a new matchday replaces this draft only after you confirm.</p></section><form class="card" onsubmit="updateDay(event)"><h2>Edit current matchday details</h2>${pitchMatchdayFields('editPitch',d,matchdayPitchLocked(d))}<div class="field"><label>Date</label><input name="date" type="date" required value="${esc(d.date)}"></div><div class="field"><label>Venue</label><input name="location" required maxlength="180" value="${esc(d.location)}"></div>${d.matches.map((m,i)=>`<div class="field"><label>Match ${i+1} opponent</label><input name="opp${i}" required value="${esc(m.opponent)}"><label>Kick-off</label><input name="time${i}" type="time" value="${esc(m.time)}"></div>${timingField('length'+i,'halves'+i,durationFor(m),usesHalves(m),clockHasStarted(m)||m.events.length>0,'Match '+(i+1)+' length')}`).join('')}<button>Save details</button></form>`:`<section class="card"><h2>Just today. All the moments.</h2><p>Enter a fresh team name and squad for each new matchday. You won’t need to re-enter players between its matches.</p><p class="hint">The temporary draft helps you recover after a refresh. Download or share anything you want to keep before finishing the matchday.</p></section>`}${freeLegacyHTML()}</aside></div>`;
};
function freeDayValues(form){
  const f=new FormData(form),text=k=>String(f.get(k)||'').trim();
  return {pitchAgeGroup:text('pitchAgeGroup'),pitchFormat:text('pitchFormat'),team:text('teamName'),squad:[...new Set(text('players').split('\n').map(n=>n.trim()).filter(Boolean))],date:text('date'),location:text('location'),opponents:text('opponents').split('\n').map(n=>n.trim()).filter(Boolean),durationMinutes:Number(f.get('durationMinutes'))||30,twoHalves:f.get('twoHalves')!==null};
}
function freeDayValidationError(f){
  if(!pitchPresetFor(f.pitchAgeGroup,f.pitchFormat))return 'Choose the age group and playing format for this matchday.';
  if(!f.team||f.team.length>120||f.squad.length<2||f.squad.length>60||f.squad.some(n=>n.length>80)||!f.date||!f.location||!f.opponents.length||f.opponents.length>20||f.opponents.some(x=>!x.split(',')[0].trim()))return 'Enter a team name, 2–60 players, date, venue and at least one opponent.';
  if(f.durationMinutes<2||f.durationMinutes>180)return 'Choose a match length between 2 and 180 minutes.';
  return '';
}
createDay=function(e){
  e.preventDefault();const f=freeDayValues(e.target),error=freeDayValidationError(f);
  if(error)return toast(error);
  leaveFreeDemo();freePendingDay=f;
  if(day()){$('#modal').innerHTML=`<div class="modal"><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="replace-title"><h2 id="replace-title">Replace your current matchday?</h2><p>Download or share your current reports first. Continuing permanently deletes this matchday’s team, players, results, actions, photo and saved report progress from this device.</p><div class="links"><button onclick="freePendingDay=null;closeModal()">Cancel</button><button class="primary" onclick="confirmFreeDay()">Delete current & create new</button></div></section></div>`;return}
  confirmFreeDay();
};
// Matchday details and timing are updated together, without a late wrapper.
updateDay=function(e){
  e.preventDefault();
  const f=new FormData(e.target),d=day();if(!d)return;
  if(!matchdayPitchLocked(d)&&f.get('pitchAgeGroup')!==null){
    const age=f.get('pitchAgeGroup'),format=f.get('pitchFormat'),preset=pitchPresetFor(age,format);
    if(!preset)return toast('Choose the age group and playing format for this matchday.');
    Object.assign(d,matchdayPitchSettings(age,format));
    d.matches.forEach(m=>Object.assign(m,matchdayPitchSettings(age,format)));
  }
  d.date=f.get('date');d.location=f.get('location');
  d.matches.forEach((m,i)=>{
    m.opponent=f.get('opp'+i);m.time=f.get('time'+i);
    const n=Number(f.get('length'+i));
    if(!clockHasStarted(m)&&!m.events.length&&n>=2&&n<=180){
      m.durationMinutes=n;m.twoHalves=f.get('halves'+i)!==null;
    }
  });
  save();toast('Matchday updated');render();
};
function confirmFreeDay(){
  const f=freePendingDay;if(!f)return;freePendingDay=null;
  const d={id:crypto.randomUUID(),team:f.team,...matchdayPitchSettings(f.pitchAgeGroup,f.pitchFormat),teamIndex:0,squad:[...f.squad],date:f.date,location:f.location,summary:'',photo:'',durationMinutes:f.durationMinutes,twoHalves:f.twoHalves,matches:f.opponents.map(x=>{const [opponent,time='']=x.split(',');return {...matchdayPitchSettings(f.pitchAgeGroup,f.pitchFormat),opponent:opponent.trim(),time:time.trim(),lineup:[...f.squad],events:[],elapsed:0,running:false,ended:false,summary:'',durationMinutes:f.durationMinutes,twoHalves:f.twoHalves,period:1,firstHalfElapsed:0,inputMode:'player'}})};
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
function freeDemoNames(){return freeShuffle([...freeShuffle(FREE_DEMO_BOYS).slice(0,6),...freeShuffle(FREE_DEMO_GIRLS).slice(0,5)])}

function configureFreeDemo(){
 const d=day(),m=match(),names=[...d.squad],pitch=matchdayPitchSettings('U14','11v11');
 Object.assign(d,pitch,{durationMinutes:70,twoHalves:true});
 Object.assign(m,matchdayPitchSettings('U14','11v11'),{lineup:names,durationMinutes:70,twoHalves:true,period:1,elapsed:35*60000,firstHalfElapsed:35*60000,halfTime:true,clockStarted:true,running:false,started:null,ended:false,teamReady:true});
 const roles=Object.fromEntries(names.map((n,i)=>[n,i===0?'GK':i<=4?'DF':i<=8?'MD':'AT']));
 m.teamStart={onPitch:[...names],roles,captain:names[5]};m.goalkeeper=names[0];
 d.teamSelection={...JSON.parse(JSON.stringify(m.teamStart)),roster:[...names]};
 const point=(x,y)=>({x,y,coordinateSpace:TEMPLATE_POINT_SPACE,geometry:JSON.parse(JSON.stringify(pitch.pitchTemplate))});
 const event=(action,player,minute,rank=0,extra={})=>({id:crypto.randomUUID(),action,category:action,player,...captureEventTime(m,minute*60000),qualityRank:rank,qualityLabel:V2_QUALITY[action][rank],...extra});
 m.events=[
  event('Goal',names[9],6,0,{point:point(.5,.1),assist:{player:names[7],point:point(.25,.25),locationLabel:'Left attacking channel'}}),
  event('Shot','Opposition',10,0,{opp:true,outcome:'Saved',point:point(.4,.2),save:{player:names[0],qualityLabel:'Great save',qualityRank:1,assumedLocation:true,locationLabel:'Our defensive goal box'}}),
  event('Goal','Opposition',14,0,{opp:true,point:point(.5,.1)}),
  event('Shot',names[10],18,0,{outcome:'Saved',point:point(.65,.2)}),
  event('Pass',names[5],22,1),
  event('Skill',names[8],25,1),
  event('Goal',names[10],29,1,{point:point(.6,.12)}),
  event('Shot','Opposition',33,1,{opp:true,outcome:'Saved',point:point(.6,.18),save:{player:names[0],qualityLabel:'Incredible save',qualityRank:2,assumedLocation:true,locationLabel:'Our defensive goal box'}})
 ];
 save();
}

const freeOriginalDemo=demo;
demo=function(){
  if(!freeDemoActive)freeRealDraft=data;
  freeDemoActive=true;data={...fresh(),teams:[{name:'Meadow United',squad:freeDemoNames()}]};
  freeOriginalDemo();day().matches=day().matches.slice(0,1);day().isDemo=true;day().squad=[...data.teams[0].squad];day().clubName='Fictional demo team';configureFreeDemo();render();
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
