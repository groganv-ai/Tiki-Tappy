export const FORMATIONS=Object.freeze({'5-a-side':['GK','DF','DF','AT','AT'],'7-a-side':['GK','DF','DF','MD','MD','AT','AT'],'9-a-side':['GK','DF','DF','DF','MD','MD','MD','AT','AT']});
export function lineup(match){return match.players.filter(p=>p.onPitch!==false)}
export function selectPlayers(match){return lineup(match).map(p=>({id:p.id,name:p.name,role:p.role||'MD'}))}
export function isEligible(match,playerId){return lineup(match).some(p=>p.id===playerId)}
export function goalkeeper(match){return lineup(match).find(p=>p.role==='GK')||null}
export function addPlayer(match,name,role='MD'){const trimmed=name.trim();if(!trimmed)throw Error('Player name required');if(match.players.some(p=>p.name.toLowerCase()===trimmed.toLowerCase()))throw Error('Player already exists');return {...match,players:[...match.players,{id:crypto.randomUUID(),name:trimmed,role,onPitch:false}]};}
export function assignFormation(match,formation){const slots=FORMATIONS[formation];if(!slots)throw Error('Unknown formation');const ids=match.players.slice(0,slots.length).map(p=>p.id);return {...match,formation,players:match.players.map(p=>{const index=ids.indexOf(p.id);return {...p,onPitch:index>=0,role:index>=0?slots[index]:p.role}})}}
export function substitute(match,offId,onId){if(offId===onId||!isEligible(match,offId)||isEligible(match,onId)||!match.players.some(p=>p.id===onId))throw Error('Invalid substitution');const role=match.players.find(p=>p.id===offId).role;return {...match,players:match.players.map(p=>p.id===offId?{...p,onPitch:false}:p.id===onId?{...p,onPitch:true,role}:p)}}
