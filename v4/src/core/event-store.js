import {ACTIONS,qualityFor} from '../config/actions.js';
export function makeEvent({match,action,playerId=null,team='ours',quality='basic',outcome=null,location=null,assistPlayerId=null,assistLocation=null,savePlayerId=null,now=Date.now()}){
 if(!ACTIONS[action])throw Error('Unsupported action');
 if(!['ours','opposition'].includes(team))throw Error('Invalid team');
 if(team==='ours'&&!playerId&&!ACTIONS[action].special)throw Error('Player required');
 if(playerId&&!match.players.some(p=>p.id===playerId))throw Error('Unknown player');
 if(action==='shot'&&!['saved','off','blocked'].includes(outcome))throw Error('Shot outcome required');
 if(ACTIONS[action].location&&!location)throw Error('Pitch location required');
 if(location&&(!Number.isFinite(location.x)||!Number.isFinite(location.y)||location.x<0||location.x>1||location.y<0||location.y>1))throw Error('Invalid pitch location');
 if(assistPlayerId&&(action!=='goal'||assistPlayerId===playerId||!match.players.some(p=>p.id===assistPlayerId)))throw Error('Invalid assist');
 if(assistPlayerId&&!assistLocation)throw Error('Assist location required');
 if(savePlayerId&&(action!=='shot'||team!=='opposition'||outcome!=='saved'||!match.players.some(p=>p.id===savePlayerId)))throw Error('Invalid linked save');
 const q=qualityFor(action,quality);
 return {id:crypto.randomUUID(),matchId:match.id,type:action,team,playerId,quality:q,outcome,location,assistPlayerId,assistLocation,savePlayerId,matchTime:{period:match.clock.period,elapsedMs:match.clock.elapsedMs+(match.clock.running?Math.max(0,now-match.clock.startedAt):0)},createdAt:new Date(now).toISOString()};
}
export function commitEvent(match,event){if(event.matchId!==match.id||match.events.some(e=>e.id===event.id))throw Error('Invalid event');return {...match,events:[...match.events,event]};}
export function undoEvent(match){return {...match,events:match.events.slice(0,-1)};}
