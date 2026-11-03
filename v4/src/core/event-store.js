import {ACTIONS,qualityFor,validateSetPiece} from '../config/actions.js';
export function makeEvent({match,action,playerId=null,team='ours',quality=1,outcome=null,location=null,assistPlayerId=null,assistLocation=null,savePlayerId=null,setPieceType=null,now=Date.now()}){
 if(!ACTIONS[action])throw Error('Unsupported action');
 if(!['ours','opposition'].includes(team))throw Error('Invalid team');
 if(team==='ours'&&!playerId&&!ACTIONS[action].special)throw Error('Player required');
 if(playerId&&!match.players.some(p=>p.id===playerId))throw Error('Unknown player');
 if(action==='shot'&&!['saved','off','blocked'].includes(outcome))throw Error('Shot outcome required');
 if(ACTIONS[action].location&&!location)throw Error('Pitch location required');
 if(location&&(!Number.isFinite(location.x)||!Number.isFinite(location.y)||location.x<0||location.x>1||location.y<0||location.y>1))throw Error('Invalid pitch location');
 if(assistPlayerId&&(action!=='goal'||assistPlayerId===playerId||!match.players.some(p=>p.id===assistPlayerId)))throw Error('Invalid assist');
 if(assistPlayerId&&!assistLocation)throw Error('Assist location required');
 if(assistLocation&&(!Number.isFinite(assistLocation.x)||!Number.isFinite(assistLocation.y)||assistLocation.x<0||assistLocation.x>1||assistLocation.y<0||assistLocation.y>1))throw Error('Invalid assist location');
 if(savePlayerId&&(action!=='shot'||team!=='opposition'||outcome!=='saved'||!match.players.some(p=>p.id===savePlayerId)))throw Error('Invalid linked save');
 if(setPieceType){validateSetPiece(setPieceType);if(!['goal','shot','set-piece'].includes(action))throw Error('Set piece cannot be linked to this action');}if(action==='set-piece'&&!setPieceType)throw Error('Set piece type required');
 const q=qualityFor(action,quality);
 return {id:crypto.randomUUID(),matchId:match.id,type:action,team,playerId,quality:q,outcome,location,assistPlayerId,assistLocation,savePlayerId,setPieceType,matchTime:{period:match.clock.period,elapsedMs:match.clock.elapsedMs+(match.clock.running?Math.max(0,now-match.clock.startedAt):0)},createdAt:new Date(now).toISOString()};
}
export function commitEvent(match,event){if(event.matchId!==match.id||match.events.some(e=>e.id===event.id))throw Error('Invalid event');return {...match,events:[...match.events,event]};}
export function undoEvent(match){const last=match.events.at(-1);if(!last)return match;let next={...match,events:match.events.slice(0,-1)};if(last.type==='substitution'){const off=match.players.find(p=>p.id===last.offPlayerId),on=match.players.find(p=>p.id===last.onPlayerId);if(off&&on){next.players=match.players.map(p=>p.id===off.id?{...p,onPitch:true,role:on.role}:p.id===on.id?{...p,onPitch:false}:p)}}return next;}

export function removeEvent(match,eventId){
 const event=match.events.find(e=>e.id===eventId);
 if(!event)throw Error('Event not found');
 if(event.type==='substitution')throw Error('Substitutions must be undone in reverse order');
 return {...match,events:match.events.filter(e=>e.id!==eventId)};
}
export function changeEventQuality(match,eventId,level){
 const event=match.events.find(e=>e.id===eventId);
 if(!event)throw Error('Event not found');
 if(event.type==='substitution')throw Error('Substitution quality cannot be changed');
 const quality=qualityFor(event.type,level);
 return {...match,events:match.events.map(e=>e.id===eventId?{...e,quality}:e)};
}
