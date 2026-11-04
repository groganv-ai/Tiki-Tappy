// Compare complete saved event records with the accepted Part B baseline.
const fs=require('fs'),cp=require('child_process'),assert=require('assert');
const baseline='018ee1e5787fb341f1d7b1fc1a1f9281b9cdf566';
const harness=fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot';
const boot=Function('require',harness)(require),files=new Map();
const baselineFs={readFileSync(file){if(!files.has(file))files.set(file,cp.execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'}));return files.get(file)}};
const oldBoot=Function('require',harness)(name=>name==='fs'?baselineFs:require(name));
const seed=boot();seed.run('demo();freeDemoActive=false;freeRealDraft=null;match().running=false;match().clockStarted=true;match().elapsed=120000;save()');
const cases=[
 'beginV2("Goal",match().lineup[0]);v2ChooseZone(1);finishV2()',
 'beginV2("Goal",match().lineup[0]);v2ChooseZone(1);captureV2.stage="assist-player";v2ChoosePlayer(match().lineup[1]);v2ChooseZone(8)',
 'beginV2("Goal");v2ChoosePlayer("Opposition",true);v2ChooseZone(18)',
 'beginV2("Shot");v2ChoosePlayer("Opposition",true);v2Outcome(0);v2ChooseZone(18);captureV2.quality=2;v2ChoosePlayer(match().lineup[1])',
 ...[0,1,2].map(i=>`beginV2("Shot",match().lineup[0]);v2KnownShotOutcome(${i});v2ChooseZone(1)`),
 ...[0,1,2].map(i=>`beginV2("Defence",match().lineup[0]);v2Subtype(${i});captureV2.quality=2;v2ChoosePlayer(match().lineup[0])`),
 ...[0,1,2].map(i=>`beginV2("Special",match().lineup[0]);v2Subtype(${i});captureV2.quality=1;v2ChoosePlayer(match().lineup[0])`),
 ...[0,1,2].map(i=>`v2QuickGrid("Pass",match().lineup[0],false,${i})`)
];
let comparisons=0;
for(const mode of ['coach','player'])for(const script of cases){
 const current=boot(seed.c.saved),previous=oldBoot(seed.c.saved);
 for(const f of [current,previous]){
  let id=0;f.c.crypto={randomUUID:()=>`parity-event-${++id}`};f.c.Date=class extends Date{static now(){return 1000000}};
  f.run(`view="live";setInputMode('${mode}');${script}`);
 }
 assert.equal(current.run('JSON.stringify(match().events)'),previous.run('JSON.stringify(match().events)'),mode+': '+script);
 assert.equal(current.run('JSON.stringify(score(match()))'),previous.run('JSON.stringify(score(match()))'));
 comparisons++;
}
console.log(`PASS: ${comparisons} saved-event/score comparisons with accepted Part B; both modes, goals/assists, opposition goals/saves, shot outcomes, defence, Special and Pass qualities.`);
