// Adopt the requested club defaults once on existing devices. Matchday snapshots
// stay untouched; later squad edits and imported profiles remain user-controlled.
if(!data.clubDefaultsVersion){
  const defaults=fresh();
  data.clubName=defaults.clubName;data.teams=defaults.teams;
  data.clubDefaultsVersion=defaults.clubDefaultsVersion;save();
}
// Team setup links carry their profile in the URL fragment. The profile is
// reviewed locally and merged without replacing match history.
let teamProfileDraft=null;
function cleanTeamProfile(profile){
  const validText=(s,max)=>typeof s==='string'&&s.trim().length>0&&s.length<=max;
  if(!profile||!validText(profile.clubName,120)||!Array.isArray(profile.teams)||profile.teams.length!==2)throw Error('Invalid club setup');
  const teams=profile.teams.map(t=>{
    if(!validText(t.name,120)||!Array.isArray(t.squad)||t.squad.length<1||t.squad.length>60||t.squad.some(n=>!validText(n,80)))throw Error('Invalid squad');
    return {name:t.name.trim(),squad:t.squad.map(n=>n.trim())};
  });return {clubName:profile.clubName.trim(),teams};
}
function reviewTeamProfile(profile){
  try{teamProfileDraft=cleanTeamProfile(profile)}catch{return toast('This club setup link is invalid.')}
  $('#modal').innerHTML=`<div class="modal"><div class="sheet team-profile-sheet"><div class="eyebrow">Set up your club</div><h2 style="margin-top:12px">${esc(teamProfileDraft.clubName)}</h2>${teamProfileDraft.teams.map(t=>`<div class="team-profile-roster"><strong>${esc(t.name)}</strong><span class="pill">${t.squad.length} players</span><p>${t.squad.map(esc).join(' · ')}</p></div>`).join('')}<p class="hint">This updates your two squads in this browser. Saved matchdays, lineups and actions are kept.</p><div class="links"><button class="primary" onclick="applyTeamProfile()">Use these teams</button><button onclick="dismissTeamProfile()">Cancel</button></div></div></div>`;
}
function clearTeamSetupLink(){if(typeof history!=='undefined'&&typeof location!=='undefined'&&location.hash.startsWith('#setup='))history.replaceState(null,'',location.pathname+location.search)}
function applyTeamProfile(){
  if(!teamProfileDraft)return;const profile=cleanTeamProfile(teamProfileDraft);
  data.clubName=profile.clubName;data.teams=profile.teams;save();teamProfileDraft=null;clearTeamSetupLink();closeModal();view='setup';render();toast('Club and both squads saved in this browser.');
}
function dismissTeamProfile(){teamProfileDraft=null;clearTeamSetupLink();closeModal()}
const setupBeforeClubProfile=renderSetup;
renderSetup=function(){setupBeforeClubProfile();const app=$('#app');app.innerHTML=app.innerHTML.replace('<h2>Your two teams</h2>',`<h2>Your club & teams</h2><div class="field"><label>Club name</label><input name="clubName" value="${esc(data.clubName||'')}" placeholder="Your club and age group"></div>`).replace('Sample names are placeholders. Enter your actual squads below, one player per line.','Enter each squad one player per line. Your saved match history is kept when squads change.')};
const saveTeamsBeforeClubProfile=saveTeams;
saveTeams=function(e){const f=new FormData(e.target);data.clubName=String(f.get('clubName')||'').trim();saveTeamsBeforeClubProfile(e)};
const createDayBeforeClubProfile=createDay;
createDay=function(e){const old=day()?.id;createDayBeforeClubProfile(e);if(day()&&day().id!==old){day().clubName=data.clubName||'';save();render()}};
const renderBeforeClubProfile=render;
render=function(){renderBeforeClubProfile();const tag=$('.tag');if(tag)tag.textContent=data.clubName||'SMALL MOMENTS. BIG MEMORIES.'};
const textBeforeClubProfile=reportText;
reportText=function(all=true){return (day()?.clubName?day().clubName+'\n':'')+textBeforeClubProfile(all)};
const reportBeforeClubProfile=renderReport;
renderReport=function(){reportBeforeClubProfile();if(!day()?.clubName)return;const app=$('#app');app.innerHTML=app.innerHTML.replace('<div class="retrobody">',`<div class="retrobody"><p style="color:#d6ee83;margin-top:0">${esc(day().clubName)}</p>`)};
const modelBeforeClubProfile=makeReplayModel;
makeReplayModel=function(){return {...modelBeforeClubProfile(),clubName:day()?.clubName||''}};
render();
function readTeamSetupLink(){if(typeof location!=='undefined'&&location.hash.startsWith('#setup=')){
  try{const token=location.hash.slice(7);if(token.length>16000)throw Error();const base64=token.replace(/-/g,'+').replace(/_/g,'/');const bytes=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));reviewTeamProfile(JSON.parse(new TextDecoder().decode(bytes)))}catch{toast('This club setup link could not be opened.')}
}}
window.addEventListener('hashchange',readTeamSetupLink);
readTeamSetupLink();
