/* TikiTapper v5.1 — non-destructive Make a change flow.
   Uses match events for replayable changes and stable per-player pitch slots. */
(()=>{
const roles=['AT','MD','DF','GK'],labels={AT:'Attack',MD:'Midfield',DF:'Defence',GK:'Goalkeeper',SUB:'Substitute'};
let chosen=[],panel='main',newRole='DF',draftName='',error='';
const oldState=teamState,oldRender=render,oldOpen=openSubstitution,oldDescription=v2Description;
const slotFor=(role,n)=>({x:(n%5+1)/6,y:{AT:.17,MD:.40,DF:.68,GK:.90}[role]||.5});
function slots(m,s){
 if(!m.v51Slots)m.v51Slots={};
 const map=m.v51Slots;
 for(const role of roles){const group=s.onPitch.filter(n=>s.roles[n]===role);group.forEach((n,i)=>{if(!map[n])map[n]=slotFor(role,i)})}
 return map;
}
teamState=function(m,events=m.events){
 const s=oldState(m,events);if(!s)return s;
 // Reconstruct role edits in event order, respecting substitutions.
 const state={onPitch:m.teamStart.onPitch.filter(n=>m.lineup.includes(n)),roles:{...m.teamStart.roles},captain:m.teamStart.captain||'',valid:true};
 for(const e of events){
  if(e.substitution){const {off,on,role,captain}=e.substitution;
   if(!state.onPitch.includes(off)||state.onPitch.includes(on)){state.valid=false;continue}
   state.onPitch[state.onPitch.indexOf(off)]=on;state.roles[on]=role;
   if(state.captain===off)state.captain=captain||'';
  }
  if(e.v51?.kind==='position')state.roles[e.v51.player]=e.v51.role;
  if(e.v51?.kind==='swap'){
   const a=e.v51.a,b=e.v51.b,ra=state.roles[a],rb=state.roles[b];
   if(ra&&rb){state.roles[a]=rb;state.roles[b]=ra}
  }
  if(e.v51?.kind==='add'){
   if(!state.roles[e.v51.player])state.roles[e.v51.player]=e.v51.role;
   if(e.v51.on&&!state.onPitch.includes(e.v51.player))state.onPitch.push(e.v51.player);
  }
  if(e.v51?.kind==='bench')state.onPitch=state.onPitch.filter(n=>n!==e.v51.player);
 }
 return state;
};
function pitch(m,s,interactive=false){
 const map=slots(m,s),selected=chosen.map(n=>n),a=selected[0],b=selected[1],sub=!!(a&&b&&s.onPitch.includes(a)!==s.onPitch.includes(b));
 const colors=n=>!selected.includes(n)?'':!b?' pending':sub?(s.onPitch.includes(n)?' off':' on'):' swap';
 return '<div class="v51-pitch" role="group" aria-label="Players on pitch">'+s.onPitch.map(n=>{
  const p=map[n]||{x:.5,y:.5};return '<button type="button" class="v51-player'+colors(n)+'" style="left:'+Math.round(p.x*100)+'%;top:'+Math.round(p.y*100)+'%" '+(interactive?'onclick="v51Choose(this.dataset.name)"':'disabled')+' data-name="'+esc(n)+'">'+esc(n)+'</button>';
 }).join('')+'</div>';
}
function open(){const m=match();if(!m||m.ended)return;chosen=[];panel='main';error='';if(!m.teamStart)return openTeamSelection('match');draw()}
window.openSubstitution=open;
window.v51Choose=n=>{if(!match().lineup.includes(n))return;if(chosen[0]===n){chosen=[]}else if(!chosen.length||chosen.length===2){chosen=[n]}else{chosen.push(n)}panel='main';error='';draw()};
window.v51Panel=p=>{panel=p;error='';if(p==='position'&&chosen.length)newRole=teamState(match()).roles[chosen[0]]||'DF';draw()};
window.v51Role=r=>{newRole=r};
window.v51Name=n=>{draftName=n};
window.v51Close=()=>{chosen=[];panel='main';closeModal()};
function draw(){
 const m=match(),s=teamState(m);if(!s)return;
 const a=chosen[0],b=chosen[1],isSub=!!(a&&b&&s.onPitch.includes(a)!==s.onPitch.includes(b));
 const bench=m.lineup.filter(n=>!s.onPitch.includes(n));
 const benchHtml=bench.map(n=>'<button class="v51-bench'+(chosen.includes(n)?(b?' on':' pending'):'')+'" data-name="'+esc(n)+'" onclick="v51Choose(this.dataset.name)">'+esc(n)+'</button>').join('')||'<span class="hint">No substitutes</span>';
 const options=Object.entries(labels).map(([v,l])=>'<option value="'+v+'" '+(v===newRole?'selected':'')+'>'+l+'</option>').join('');
 let actions='';
 if(panel==='add')actions='<label>Player name<input id="v51-name" placeholder="Player name" value="'+esc(draftName)+'" oninput="v51Name(this.value)"></label><label>Position<select onchange="v51Role(this.value)">'+options+'</select></label><button class="primary v2-wide" onclick="v51Add()">Add Player</button><button class="v2-wide" onclick="v51Panel(\'main\')">Cancel</button>';
 else if(panel==='position')actions='<label>New position for '+esc(a||'')+'<select onchange="v51Role(this.value)">'+options+'</select></label><button class="primary v2-wide" onclick="v51Position()">Confirm position</button><button class="v2-wide" onclick="v51Panel(\'main\')">Cancel</button>';
 else actions='<button class="primary v2-wide" '+(b?'':'disabled')+' onclick="v51Confirm()">Confirm</button><div class="v51-actions"><button '+(a&&!b?'':'disabled')+' onclick="v51Panel(\'position\')">Change Position</button><button onclick="v51Panel(\'add\')">Add Player</button></div>';
 const message=!a?'Tap a player to begin':!b?esc(a)+' selected — choose another player':isSub?esc(s.onPitch.includes(a)?a:b)+' OFF · '+esc(s.onPitch.includes(a)?b:a)+' ON':esc(a)+' ↔ '+esc(b)+' — swap';
 $('#modal').innerHTML='<div class="modal input-modal"><section class="sheet team-sheet input-sheet" role="dialog" aria-modal="true" aria-labelledby="v51-title"><div class="input-sheet-content"><header class="v51-head"><h2 id="v51-title">Make a change</h2><button onclick="v51Close()" aria-label="Close">×</button></header><p class="v51-legend"><span>🔴 Off</span><span>🟢 On</span><span>🔵 Swap</span></p><p class="v51-message">'+message+'</p>'+pitch(m,s,true)+'<h3>Substitutes</h3><div class="v51-bench-list">'+benchHtml+'</div>'+(error?'<p role="alert" class="team-error">'+esc(error)+'</p>':'')+actions+'</div></section></div>';
}
function record(event){const m=match();m.events.push({id:crypto.randomUUID(),...captureEventTime(m,elapsed(m)),opp:false,...event});save();chosen=[];panel='main';closeModal();render();showActionFeedback(event.action,event.player||'',false,'clock')}
window.v51Confirm=()=>{
 const m=match(),s=teamState(m),[a,b]=chosen;if(!a||!b)return;
 const sa=s.onPitch.includes(a),sb=s.onPitch.includes(b),map=slots(m,s);
 if(sa!==sb){const off=sa?a:b,on=sa?b:a;map[on]={...map[off]};delete map[off];
  const next=s.onPitch.filter(n=>n!==off).concat(on);
  return record({action:'Substitution',category:'Substitution',player:on,substitution:{off,on,role:s.roles[off],captain:next.includes(s.captain)?s.captain:''}});
 }
 if(!sa)return error='Select at least one player on the pitch.',draw();
 const pa={...map[a]},pb={...map[b]};map[a]=pb;map[b]=pa;
 record({action:'Position swap',category:'Team change',player:a,v51:{kind:'swap',a,b}});
};
window.v51Position=()=>{
 const m=match(),s=teamState(m),n=chosen[0];if(!n)return;
 const role=newRole,map=slots(m,s);
 if(role==='SUB'){delete map[n];return record({action:'Player to bench',category:'Team change',player:n,v51:{kind:'bench',player:n}})}
 if(!s.onPitch.includes(n)){error='Choose an on-pitch player to change position.';return draw()}
 const existing=s.onPitch.filter(p=>p!==n&&s.roles[p]===role);
 const points=existing.map(p=>map[p]).filter(Boolean);
 const candidates=Array.from({length:15},(_,i)=>slotFor(role,i));
 map[n]=candidates.sort((a,b)=>Math.min(...points.map(p=>(p.x-a.x)**2+(p.y-a.y)**2),1)-Math.min(...points.map(p=>(p.x-b.x)**2+(p.y-b.y)**2),1))[0];
 // Prefer the least crowded available location.
 map[n]=candidates.reduce((best,p)=>{const d=q=>Math.min(1,...points.map(x=>(x.x-q.x)**2+(x.y-q.y)**2));return d(p)>d(best)?p:best},candidates[0]);
 record({action:'Position change',category:'Team change',player:n,v51:{kind:'position',player:n,role}});
};
window.v51Add=()=>{
 const m=match(),s=teamState(m),n=draftName.trim(),role=newRole;
 if(!n){error='Enter a player name.';return draw()}
 if(m.lineup.some(p=>p.toLowerCase()===n.toLowerCase())){error='Player already exists.';return draw()}
 m.lineup.push(n);
 const team=data.teams[day().teamIndex||0];if(team&&!team.squad.includes(n))team.squad.push(n);
 if(role!=='SUB'){const map=slots(m,s),points=s.onPitch.filter(p=>s.roles[p]===role).map(p=>map[p]).filter(Boolean);
  const candidates=Array.from({length:20},(_,i)=>slotFor(role,i));map[n]=candidates.reduce((best,p)=>{const d=q=>Math.min(1,...points.map(x=>(x.x-q.x)**2+(x.y-q.y)**2));return d(p)>d(best)?p:best},candidates[0]);
 }
 draftName='';record({action:'Player added',category:'Team change',player:n,v51:{kind:'add',player:n,role:role==='SUB'?'MD':role,on:role!=='SUB'}});
};
const beforePitch=teamPitchHTML;
teamPitchHTML=function(onPitch,roleMap,m=match(),captain){return pitch(m,{onPitch,roles:roleMap},false)};
const beforeDescription=v2Description;
v2Description=function(e){if(e.v51?.kind==='swap')return 'Swapped positions with '+e.v51.b;if(e.v51?.kind==='position')return 'Moved to '+labels[e.v51.role];if(e.v51?.kind==='add')return 'Added to team';return beforeDescription(e)};
render=function(){oldRender();if(view!=='live')return;document.querySelectorAll('.team-sub-shortcut').forEach(b=>{b.textContent='Make a change'})};
render();
})();