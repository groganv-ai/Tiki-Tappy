const fs=require('fs'),assert=require('assert'),cp=require('child_process');
const source=fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot';
const baseline='c56a4ea3d6de6095306244dc6c6547bb59ac331b',cache=new Map();
const oldFS={...fs,readFileSync(file,encoding){if(/^(index\.html|[\w-]+\.js)$/.test(file)){if(!cache.has(file))cache.set(file,cp.execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'}));return cache.get(file)}return fs.readFileSync(file,encoding)}};
const boot=Function('require',source)(require),oldBoot=Function('require',source)(name=>name==='fs'?oldFS:require(name));
const seed=boot();seed.run('demo();freeDemoActive=false;freeRealDraft=null;day().matches=Array.from({length:3},(_,i)=>({...JSON.parse(JSON.stringify(match())),opponent:"Visitors "+i,ended:true,halfTime:false,events:match().events.map(e=>({...e,id:e.id+"-"+i}))}));startDayFlow();confirmDayReview();chooseDayPlayer(day().squad[0]);setDayAwardReason("Encouraged everyone");save()');
const current=boot(seed.c.saved),previous=oldBoot(seed.c.saved);
function json(f,expr){return JSON.parse(f.run('JSON.stringify('+expr+')'))}
function canvas(f){f.c.document.createElement=()=>{const page={width:0,height:0,draws:[]};page.getContext=()=>new Proxy({measureText:t=>({width:String(t).length*12}),fillText:(...a)=>page.draws.push(a)},{get:(o,k)=>k in o?o[k]:()=>{}});return page}}
(async()=>{let models=0,pages=0;for(const filter of ['goals','goals-saves','key','major','all']){
 for(const f of [current,previous])f.run(`daySetFilter('${filter}');mi=1`);
 assert.deepStrictEqual(json(current,'makeDayReplayModel()'),json(previous,'makeDayReplayModel()'));assert.equal(current.run('mi'),1);models++;
 assert.deepStrictEqual(json(current,'highlightPlan(makeDayReplayModel())'),json(previous,'highlightPlan(makeDayReplayModel())'));models++;
 for(const mode of ['summary','timeline','players']){
  for(const f of [current,previous]){f.run(`dayFlow().reportView='${mode}'`);canvas(f)}
  assert.deepStrictEqual(json(current,'compactReportModel()'),json(previous,'compactReportModel()'));models++;
  const a=await current.run('makeDayReportPages()'),b=await previous.run('makeDayReportPages()');
  assert.deepStrictEqual(JSON.parse(JSON.stringify(a)),JSON.parse(JSON.stringify(b)),(filter+' '+mode));pages++;
 }
}
console.log(`PASS: ${models} baseline model/plan comparisons and ${pages} exact canvas text/position/page-metadata comparisons against ${baseline.slice(0,7)}; no selected-match mutation.`);
})().catch(e=>{console.error(e);process.exitCode=1});
