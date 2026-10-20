const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
const {c,el,run}=boot();run('demo();day().matches.forEach(m=>m.ended=true);startDayFlow();confirmDayReview();daySetFilter("all")');
c.fixtures=[
 {id:'goal',action:'Goal',player:'Alex',qualityLabel:'Amazing goal',at:60000,assist:{player:'Taylor'}},
 {id:'shot',action:'Shot',opp:true,player:'Opposition',qualityLabel:'Good effort',at:120000,save:{player:'Keeper',qualityLabel:'Great save'}},
 {id:'restart',action:'Goal',player:'Sam',at:180000,setPiece:{id:'fk',type:'Free kick',taker:'Taylor',at:170000,time:{at:170000},status:'Goal',freeKickGoal:'Indirect'},assist:{player:'Taylor'}},
 {id:'sub',action:'Substitution',player:'Casey',at:240000,substitution:{off:'Alex',on:'Casey',role:'MD'}},
 {id:'legacy',action:'Great Pass',player:'Taylor',at:300000},
 {id:'unknown',action:'Custom contribution',player:'Sam',at:360000}
];run('match().events=fixtures');
for(const mode of ['summary','timeline']){
 run(`dayFlow().reportView='${mode}';model=compactReportModel();blocks=compactReportBlocks(model)`);
 const ids=Array.from(run('blocks.flatMap(b=>b.ids||[])'));assert.deepEqual([...new Set(ids)].sort(),Array.from(run('model.games.flatMap(g=>g.items.map(e=>e.reportId))')).sort());assert.equal(ids.length,new Set(ids).size);
 assert(ids.includes('goal-assist'));assert(ids.includes('shot-save'));assert(ids.includes('restart-restart'));assert(ids.includes('sub'));assert(ids.includes('unknown'));
 const html=run('daySummaryHTML()');assert(html.includes('Amazing goal'));assert(html.includes('Great save'));assert(html.includes('Free kick'));assert(html.includes('Custom contribution'));
 if(mode==='summary'){assert.equal((html.match(/<h4>.*?Goals<\/h4>/g)||[]).length,1);assert.equal((html.match(/<h4>.*?Assists<\/h4>/g)||[]).length,1)}else{assert(!html.includes('compact-action-group'));assert(html.includes('compact-report-timeline'))}
}
const award=run('dayAwardStepHTML()');assert(award.indexOf('class="day-award-navigation"')>award.indexOf('class="squad award-choices"'));assert(award.indexOf('Continue →')>award.indexOf('class="day-award-navigation"'));assert(award.includes('aria-label="Continue after player selection"'));
// Check one-page packing, required overflow, complete event coverage and page bounds.
(async()=>{
 c.document.createElement=()=>{const page={width:0,height:0,entries:[],positions:[]};const ctx=new Proxy({measureText:t=>({width:String(t).length*13}),fillText:(t,x,y)=>{page.entries.push(String(t));page.positions.push(y)}},{get:(o,k)=>k in o?o[k]:()=>{}});page.getContext=()=>ctx;return page};
 run('dayFlow().reportView="summary";day().matches.forEach(m=>m.events=fixtures.slice(0,1));day().summary="A compact report";day().playerOfDay="Alex"');
 let pages=await run('makeDayReportPages()');assert.equal(pages.length,1);assert.equal(pages.flatMap(p=>p.entries).filter(t=>t==='PLAYER OF THE DAY').length,1);assert.equal(pages.flatMap(p=>p.entries).filter(t=>t==='Goals').length,3);
 run('dayFlow().reportView="timeline";day().matches=day().matches.slice(0,1);day().matches[0].events=Array.from({length:321},(_,i)=>({id:"long-"+i,action:"Pass",player:"PLAYER"+i,qualityLabel:"Brilliant pass",at:i*60000}))');
 pages=await run('makeDayReportPages()');assert(pages.length>1);const ids=pages.flatMap(p=>p.reportItemIds);assert.equal(new Set(ids).size,321);for(let i=0;i<321;i++)assert(ids.includes('long-'+i));assert(pages.every(p=>p.positions.every(y=>y<=1890)));
 console.log('PASS: action/timeline parity for assists, saves, restarts, substitutions, legacy and custom actions; goals/assists shown once; separate award navigation; three games on one page; 321 moments paginated without dropping events or drawing past the footer.');
})().catch(e=>{console.error(e);process.exitCode=1});
