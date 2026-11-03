import {matchdayStatistics,actionLeaders} from './report-stats.js';
export const REPORT_PRESETS=Object.freeze(['essential','highlights','full']);
const HIGHLIGHT_TYPES=new Set(['goal','shot','save','block','skill','team-values']);
export function reportEvents(day,{preset='full',fixtureId=null}={}){
 if(!REPORT_PRESETS.includes(preset))throw Error('Unknown report preset');
 const matches=fixtureId?day.matches.filter(m=>m.id===fixtureId):day.matches;
 if(fixtureId&&!matches.length)throw Error('Unknown fixture');
 return matches.flatMap(m=>m.events.filter(e=>preset==='full'||(preset==='essential'?e.type==='goal':HIGHLIGHT_TYPES.has(e.type)||e.quality?.level===3))
  .map(e=>({...e,fixtureId:m.id,opponent:m.opponent})))
  .sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
}
export function buildReport(day,{preset='essential',fixtureId=null}={}){
 const matches=fixtureId?day.matches.filter(m=>m.id===fixtureId):day.matches;
 if(fixtureId&&!matches.length)throw Error('Unknown fixture');
 if(!REPORT_PRESETS.includes(preset))throw Error('Unknown report preset');
 const scoped={...day,matches};
 const stats=matchdayStatistics(scoped);
 return {preset,scope:fixtureId?'fixture':'matchday',team:day.team,date:day.date,venue:day.venue,fixtures:stats.fixtures,events:reportEvents(day,{preset,fixtureId}),statistics:stats,leaders:actionLeaders(scoped)};
}
export function reportAsText(report){
 const lines=['TikiTapper Match Report',report.team+' · '+report.date,report.scope==='matchday'?'Whole matchday':'Single fixture','Preset: '+report.preset.toUpperCase(),''];
 for(const f of report.fixtures)lines.push(f.opponent+' · '+f.goalsFor+'–'+f.goalsAgainst);
 lines.push('','Player Summary');
 for(const p of report.statistics.players)lines.push(p.name+' · '+p.total+' actions · '+Object.entries(p.counts).filter(([,n])=>n).map(([k,n])=>k+': '+n).join(', '));
 lines.push('','Action Leaders');
 for(const item of report.leaders)lines.push(item.category+': '+item.count+' · '+item.leaders.map(p=>p.name+' ('+p.count+')').join(', '));
 lines.push('','Timeline');
 for(const e of report.events)lines.push(e.opponent+' · '+e.type+' · '+(e.matchTime?.period||1)+'H '+Math.floor((e.matchTime?.elapsedMs||0)/60000)+"'");
 return lines.join('\n');
}
