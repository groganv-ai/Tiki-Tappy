import {ACTIONS} from '../config/actions.js';
import {isEligible} from '../core/team-state.js';
export function startCapture(match,action,quality=1,playerId=null,team='ours'){
 if(!ACTIONS[action])throw Error('Unknown action');
 if(playerId&&team==='ours'&&!isEligible(match,playerId))throw Error('Player is not on the pitch');
 return {action,quality,playerId,team,outcome:null,location:null,assistPlayerId:null,assistLocation:null,savePlayerId:null,setPieceType:null,setPieceChoice:undefined,stage:playerId?'details':'player'};
}
export function captureStage(draft){
 if(!draft.playerId&&draft.team==='ours'&&!ACTIONS[draft.action].special)return 'player';
 if(draft.action==='set-piece'&&!draft.setPieceType)return 'set-piece-type';
 if(['goal','shot'].includes(draft.action)&&draft.setPieceChoice===undefined)return 'set-piece-choice';
 if(['goal','shot'].includes(draft.action)&&draft.setPieceChoice&&!draft.setPieceType)return 'set-piece-type';
 if(draft.action==='shot'&&!draft.outcome)return 'outcome';
 if(ACTIONS[draft.action].location&&!draft.location)return 'location';
 if(draft.action==='goal'&&draft.team==='ours'&&draft.assistChoice===undefined)return 'assist-choice';
 if(draft.action==='goal'&&draft.assistChoice&&!draft.assistPlayerId)return 'assist-player';
 if(draft.action==='goal'&&draft.assistChoice&&!draft.assistLocation)return 'assist-location';
 if(draft.action==='shot'&&draft.team==='opposition'&&draft.outcome==='saved'&&!draft.savePlayerId)return 'keeper';
 return 'confirm';
}
export function choosePlayer(draft,match,playerId){if(!isEligible(match,playerId))throw Error('Player not on pitch');return {...draft,playerId};}
