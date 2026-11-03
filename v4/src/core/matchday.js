import {newMatch} from './match-engine.js';
export function createMatchday({team='Our Team',venue='',date=new Date().toISOString().slice(0,10),players=null,matchMinutes=30,twoHalves=true}={}){
 if(!Number.isInteger(matchMinutes)||matchMinutes<2||matchMinutes>120)throw Error('Match length must be 2–120 minutes');
 const first=newMatch();first.team=team.trim()||'Our Team';first.players=players?structuredClone(players):first.players;first.venue=venue;first.date=date;first.matchMinutes=matchMinutes;first.twoHalves=twoHalves;
 return {id:crypto.randomUUID(),team:first.team,venue,date,matchMinutes,twoHalves,players:structuredClone(first.players),matches:[first],activeMatchId:first.id};
}
export function activeMatch(day){return day.matches.find(m=>m.id===day.activeMatchId)||null}
export function updateMatch(day,match){if(!day.matches.some(m=>m.id===match.id))throw Error('Match not in matchday');return {...day,matches:day.matches.map(m=>m.id===match.id?match:m)}}
export function addFixture(day,{opponent='Opposition',time='',venue=day.venue}={}){
 const current=activeMatch(day);if(current?.clock.running)throw Error('Pause the clock before adding a fixture');
 const match=newMatch();match.team=day.team;match.opponent=opponent.trim()||'Opposition';match.players=structuredClone(day.players);match.venue=venue;match.date=day.date;match.scheduledTime=time;match.matchMinutes=day.matchMinutes;match.twoHalves=day.twoHalves;
 return {...day,matches:[...day.matches,match],activeMatchId:match.id};
}
export function switchFixture(day,id){if(!day.matches.some(m=>m.id===id))throw Error('Unknown fixture');const current=activeMatch(day);if(current?.clock.running)throw Error('Pause the clock before switching fixtures');return {...day,activeMatchId:id}}
export function matchdayEvents(day){return day.matches.flatMap(m=>m.events.map(e=>({...e,fixtureId:m.id,opponent:m.opponent})))}

export function fromLegacyMatch(match){const day=createMatchday({team:match.team,venue:match.venue||'',date:match.date||new Date().toISOString().slice(0,10),players:match.players,matchMinutes:match.matchMinutes||30,twoHalves:match.twoHalves!==false});const fixture={...match,matchMinutes:match.matchMinutes||30,twoHalves:match.twoHalves!==false};return {...day,matches:[fixture],activeMatchId:fixture.id};}
export function setMatchdayDetails(day,{team=day.team,venue=day.venue,date=day.date,matchMinutes=day.matchMinutes,twoHalves=day.twoHalves}={}){
 if(!Number.isInteger(matchMinutes)||matchMinutes<2||matchMinutes>120)throw Error('Match length must be 2–120 minutes');
 if(day.matches.some(m=>m.clock.running))throw Error('Pause all clocks before changing matchday setup');
 return {...day,team:team.trim()||'Our Team',venue,date,matchMinutes,twoHalves,matches:day.matches.map(m=>({...m,team:team.trim()||'Our Team',matchMinutes,twoHalves,venue:m.venue===day.venue?venue:m.venue,date:m.date===day.date?date:m.date}))};
}
