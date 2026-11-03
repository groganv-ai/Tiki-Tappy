import {REPORT_CATEGORIES} from '../config/actions.js';
const CATEGORIES=REPORT_CATEGORIES;
export function eventCounts(events){
 const totals=Object.fromEntries(CATEGORIES.map(c=>[c,0]));
 for(const e of events){
  if(e.team!=='ours')continue;
  if(e.type==='substitution')continue;
  if(e.type in totals)totals[e.type]++;
  if(e.type==='goal'&&e.assistPlayerId)totals.assist++;
  if(e.type==='shot'&&e.outcome==='saved'&&e.savePlayerId)totals.save++;
  if(e.setPieceType&&e.type!=='set-piece')totals['set-piece']++;
 }
 return totals;
}
export function playerStatistics(day){
 const players=day.players.map(p=>({id:p.id,name:p.name,counts:Object.fromEntries(CATEGORIES.map(c=>[c,0])),total:0}));
 const byId=new Map(players.map(p=>[p.id,p]));
 const count=(id,category)=>{const p=byId.get(id);if(p){p.counts[category]++;p.total++}};
 for(const match of day.matches)for(const e of match.events){
  if(e.team==='ours'&&CATEGORIES.includes(e.type))count(e.playerId,e.type);
  if(e.team==='ours'&&e.type==='goal'&&e.assistPlayerId)count(e.assistPlayerId,'assist');
  if(e.type==='shot'&&e.team==='opposition'&&e.outcome==='saved'&&e.savePlayerId)count(e.savePlayerId,'save');
  if(e.team==='ours'&&e.setPieceType&&e.type!=='set-piece')count(e.playerId,'set-piece');
 }
 return players;
}
export function matchdayStatistics(day){
 const categories=Object.fromEntries(CATEGORIES.map(c=>[c,0]));
 const fixtures=day.matches.map(m=>({id:m.id,opponent:m.opponent,events:m.events.length,goalsFor:m.events.filter(e=>e.type==='goal'&&e.team==='ours').length,goalsAgainst:m.events.filter(e=>e.type==='goal'&&e.team==='opposition').length}));
 for(const p of playerStatistics(day))for(const c of CATEGORIES)categories[c]+=p.counts[c];
 const unassigned=day.matches.flatMap(m=>m.events).filter(e=>e.team==='ours'&&e.type==='set-piece'&&!e.playerId).length;
 categories['set-piece']+=unassigned;
 return {fixtures,categories,players:playerStatistics(day),totalEvents:day.matches.reduce((n,m)=>n+m.events.length,0)};
}
export function actionLeaders(day,limit=8){
 const stats=matchdayStatistics(day);
 return CATEGORIES.map((category,index)=>({category,count:stats.categories[category],index}))
  .sort((a,b)=>b.count-a.count||a.index-b.index).slice(0,limit)
  .map(({category,count})=>({category,count,leaders:stats.players.filter(p=>p.counts[category]>0).sort((a,b)=>b.counts[category]-a.counts[category]||a.name.localeCompare(b.name)).map(p=>({id:p.id,name:p.name,count:p.counts[category]}))}));
}
