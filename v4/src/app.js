import {ACTIONS} from './config/actions.js';
import {load,persist} from './core/storage.js';
import {newMatch,toggleClock,elapsed,score,formatClock} from './core/match-engine.js';
import {makeEvent,commitEvent,undoEvent} from './core/event-store.js';
import {pitchPicker} from './capture/pitch.js';
import {startCapture,captureStage,choosePlayer} from './capture/flow.js';
import {selectPlayers,addPlayer} from './core/team-state.js';
let state=load()||{schemaVersion:4,match:newMatch()};
const app=document.querySelector('#app');
let draft=null,clockTicker=null,playerView='formation';
function save(){persist(state)}
function setMatch(match){state={...state,match};save();render()}
function btn(label,handler,cls=''){const b=document.createElement('button');b.textContent=label;b.className=cls;b.addEventListener('click',handler);return b}
function el(tag,cls='',text=''){const e=document.createElement(tag);e.className=cls;e.textContent=text;return e}
function row(parent){const r=el('div','row');parent.append(r);return r}
function render(){
 app.replaceChildren();const m=state.match;const title=el('h1','','Match centre');app.append(title);
 const scoreCard=el('section','card');const sc=el('div','score');const [a,b]=score(m.events);sc.append(el('span','',m.team),el('strong','',a+' – '+b),el('span','',m.opponent));scoreCard.append(sc);const clock=el('h2','',formatClock(elapsed(m.clock)));clock.id='match-clock';scoreCard.append(clock);const cr=row(scoreCard);cr.append(btn(m.clock.running?'Pause':'Start / Resume',()=>setMatch({...m,clock:toggleClock(m.clock)}),'primary'));app.append(scoreCard);
 const setup=el('section','card');setup.append(el('h2','','Team selection'));const setupRow=row(setup);const nameInput=document.createElement('input');nameInput.placeholder='Add player name';nameInput.setAttribute('aria-label','New player name');setupRow.append(nameInput,btn('Add player',()=>{try{setMatch(addPlayer(state.match,nameInput.value))}catch(e){alert(e.message)}}));app.append(setup);
 const card=el('section','card');card.append(el('h2','','Record a moment'));const modes=row(card);for(const mode of ['coach','player'])modes.append(btn(mode==='coach'?'Coach Mode':'Player Mode',()=>setMatch({...m,mode}),m.mode===mode?'active':''));
 if(m.mode==='coach'){card.append(btn('⚽ GOAL',()=>begin('goal','basic'),'primary'));for(const action of ['shot','pass','tackle']){const line=el('div','action');for(const [level,label] of [['basic',ACTIONS[action].label],[1,'★'],[2,'★★'],[3,'★★★']])line.append(btn(label,()=>begin(action,level)));card.append(line)}const extras=row(card);for(const [action,label] of [['block','Def Con'],['skill','Special'],['set-piece','Set Piece'],['substitution','Substitute']])extras.append(btn(label,()=>begin(action,'basic')))}
 else {for(const p of selectPlayers(m)){const section=el('section','card');section.append(el('h3','',p.name));const actions=row(section);for(const action of ['goal','shot','pass','tackle'])actions.append(btn(ACTIONS[action].label,()=>begin(action,1,p.id)));card.append(section)}}
 app.append(card);const actions=el('section','card');actions.append(el('h2','','Recorded events'));const ur=row(actions);ur.append(btn('Undo last',()=>setMatch(undoEvent(state.match)),m.events.length?'':'muted'));const list=el('ul');for(const e of [...m.events].reverse()){const name=m.players.find(p=>p.id===e.playerId)?.name||'Opposition';const extras=[e.outcome,e.assistPlayerId?'Assist: '+m.players.find(p=>p.id===e.assistPlayerId)?.name:null,e.savePlayerId?'Save: '+m.players.find(p=>p.id===e.savePlayerId)?.name:null].filter(Boolean).join(' · ');list.append(el('li','',formatClock(e.matchTime.elapsedMs)+' · '+name+' · '+ACTIONS[e.type].label+' · '+e.quality.label+(extras?' · '+extras:'')))}actions.append(list);app.append(actions);
}
function begin(action,quality,playerId=null,team='ours'){const m=state.match;if(!m.clock.running){alert('Start the match clock first.');return}if(['set-piece','substitution'].includes(action)){alert('This action will be connected in the next milestone.');return}try{draft=startCapture(m,action,quality,playerId,team);showDraft()}catch(e){alert(e.message)}}
function showDraft(){
 document.querySelector('dialog')?.remove();const d=document.createElement('dialog');const m=state.match;const stage=captureStage(draft);
 d.append(el('h2','','Record '+ACTIONS[draft.action].label));
 const pick=(label,fn)=>d.append(btn(label,()=>{fn();showDraft()}));
 if(stage==='player'){
   const header=row(d);header.append(btn('Formation',()=>{playerView='formation';showDraft()},playerView==='formation'?'active':''),btn('List',()=>{playerView='list';showDraft()},playerView==='list'?'active':''));
   const players=el('div',playerView==='formation'?'formation-grid':'grid');
   for(const p of selectPlayers(m)){const b=btn((playerView==='formation'?p.role+' · ':'')+p.name,()=>{draft=choosePlayer(draft,m,p.id);showDraft()});players.append(b)}d.append(players);
   if(['goal','shot'].includes(draft.action))pick('Opposition',()=>{draft.team='opposition';draft.playerId=null});
 }else if(stage==='outcome'){
   d.append(el('p','','Shot outcome'));for(const [o,label] of [['saved','On target · saved'],['off','Off target'],['blocked','Blocked']])pick(label,()=>draft.outcome=o);
 }else if(stage==='location'||stage==='assist-location'){
   d.append(pitchPicker(location=>{if(stage==='location')draft.location=location;else draft.assistLocation=location;showDraft()}));
 }else if(stage==='assist-choice'){
   d.append(el('p','','Was there an assist?'));pick('Yes',()=>draft.assistChoice=true);pick('No',()=>draft.assistChoice=false);
 }else if(stage==='assist-player'||stage==='keeper'){
   d.append(el('p','',stage==='keeper'?'Choose our goalkeeper':'Choose assisting player'));
   const players=el('div','grid');
   for(const p of selectPlayers(m).filter(p=>stage==='keeper'||p.id!==draft.playerId))players.append(btn(p.name,()=>{if(stage==='keeper')draft.savePlayerId=p.id;else draft.assistPlayerId=p.id;showDraft()}));d.append(players);
 }else{
   d.append(el('p','','Confirm '+ACTIONS[draft.action].label+' · '+(draft.quality==='basic'?'Basic':ACTIONS[draft.action].labels[draft.quality-1])));
   d.append(btn('Save event',()=>{try{const event=makeEvent({match:state.match,...draft});d.close();d.remove();draft=null;setMatch(commitEvent(state.match,event))}catch(e){alert(e.message)}},'primary'));
 }
 d.append(btn('Cancel',()=>{draft=null;d.close();d.remove()}));document.body.append(d);d.showModal();
}
function tick(){const clock=document.querySelector('#match-clock');if(clock)clock.textContent=formatClock(elapsed(state.match.clock))}
render();clockTicker=setInterval(tick,250);
