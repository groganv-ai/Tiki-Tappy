export const FORMATIONS=Object.freeze({'5-a-side':['GK','DF','DF','AT','AT'],'7-a-side':['GK','DF','DF','MD','MD','AT','AT'],'9-a-side':['GK','DF','DF','DF','MD','MD','MD','AT','AT']});
export function lineup(match){return match.players.filter(p=>p.onPitch!==false)}
export function selectPlayers(match){return lineup(match).map(p=>({id:p.id,name:p.name,role:p.role||'MD'}))}
export function isEligible(match,playerId){return lineup(match).some(p=>p.id===playerId)}
export function addPlayer(match,name,role='MD'){const trimmed=name.trim();if(!trimmed)throw Error('Player name required');if(match.players.some(p=>p.name.toLowerCase()===trimmed.toLowerCase()))throw Error('Player already exists');return {...match,players:[...match.players,{id:crypto.randomUUID(),name:trimmed,role,onPitch:true}]};}
