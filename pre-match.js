// Team confirmation is a pre-kick-off step, separate from operating the clock.
function validStartingTeam(m=match()){
 const state=m&&teamState(m);
 return !!state&&state.valid&&state.onPitch.length>=2&&state.onPitch.filter(n=>state.roles[n]==='GK').length===1&&(!state.captain||state.onPitch.includes(state.captain));
}
function preMatchPending(m=match()){
 return !!m&&!clockHasStarted(m)&&!m.events.length&&!(m.teamReady===true&&validStartingTeam(m));
}
function clearPreMatchFeedback(){
 cancelClockHold();cancelActionHold();clearTimeout(feedbackTimer);hideHoldFeedback();
}
function confirmPreMatchTeam(){
 const m=match();if(!m||clockHasStarted(m)||m.events.length)return;
 if(!validStartingTeam(m))return toast('Choose one goalkeeper and at least one outfield player before continuing.');
 clearPreMatchFeedback();m.teamReady=true;save();render();
}
function preMatchHTML(){
 const d=day(),m=match(),state=teamState(m),valid=validStartingTeam(m),bench=state?m.lineup.filter(n=>!state.onPitch.includes(n)):[];
 return `<div class="top"><div><div class="eyebrow">Before kick-off · Match ${mi+1} of ${d.matches.length}</div><h1>Confirm your team.</h1><p class="sub">${esc(d.team)} vs ${esc(m.opponent)} · ${esc(m.time||'Kick-off TBC')}</p></div></div>${tabs()}<section class="card pre-match-card" aria-labelledby="prematch-title"><div class="pre-match-steps" aria-label="Before kick-off steps"><strong>1. Team selection</strong><span>2. Start the clock</span></div><h2 id="prematch-title">${state?'Review the starting team':'Choose your starting team'}</h2><p>Confirm the starters, goalkeeper, captain and substitutes for this game. The clock will be ready on the next screen.</p>${state?`${teamPitchHTML(state.onPitch,state.roles,m,state.captain)}<p class="team-count">${state.onPitch.length} starting · ${bench.length} substitutes${state.captain?' · Captain: '+esc(state.captain):''}</p><div class="team-bench"><h3>Substitutes</h3>${bench.map(n=>`<span class="pill">${esc(n)}</span>`).join('')||'<span class="hint">None</span>'}</div>`:'<p class="pre-match-empty">Choose player positions and your goalkeeper before kick-off.</p>'}<div class="pre-match-actions">${valid?'<button onclick="lineupModal()">Edit team</button><button class="primary" onclick="confirmPreMatchTeam()">Confirm team & continue →</button>':'<button class="primary" onclick="lineupModal()">Choose team →</button>'}</div><p class="hint">${durationFor(m)} minute match${usesHalves(m)?' · 2 × '+durationFor(m)/2+' minute halves':''}</p></section><div class="match-bottom-tools"><button onclick="view='setup';render()">Edit matchday ↗</button></div>`;
}
const preMatchSelectionBefore=openTeamSelection;
openTeamSelection=function(...args){clearPreMatchFeedback();return preMatchSelectionBefore(...args)};
const preMatchClockBefore=selectClock;
selectClock=function(action){
 if(action==='toggle'&&preMatchPending()){clearPreMatchFeedback();return toast('Confirm your team before starting the clock.');}
 return preMatchClockBefore(action);
};
const preMatchHoldBefore=startClockHold;
startClockHold=function(event,button,action){
 if(action==='toggle'&&preMatchPending()){clearPreMatchFeedback();return toast('Confirm your team before starting the clock.');}
 return preMatchHoldBefore(event,button,action);
};
const preMatchRenderBefore=render;
render=function(){
 preMatchRenderBefore();
 if(view!=='live'||!preMatchPending())return;
 clearPreMatchFeedback();$('#app').innerHTML=preMatchHTML();$('#app').setAttribute('data-screen','prematch');
};
render();
