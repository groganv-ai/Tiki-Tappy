const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
function fixture(type,opp=false){const f=boot();f.run(`demo();match().events=[];spStartSetPiece();spChooseType(${type});${opp?'spSetTeam(true);':''}`);return f}
function plain(f,expr){return JSON.parse(f.run('JSON.stringify('+expr+')'))}
for(const opp of [false,true])for(const result of ['Goal','Saved','Missed']){
 const f=fixture(2,opp),html=f.el('#modal').innerHTML;
 assert(!html.includes('Choose pitch location'));if(!opp){assert(html.includes('Choose player from formation'));assert(!html.includes("stage='taker'"));f.run('spChooseTaker(match().lineup[9])');assert.equal(f.run('spFlow.stage'),'details')}
 f.run('spSaveRestart()');const menu=f.el('#modal').innerHTML;for(const word of ['Goal','Saved','Missed'])assert(menu.includes('>'+word+'</span>'));assert(!menu.includes('spChooseResult(\'Shot\')'));
 const spot=plain(f,'spFlow.draft.point');assert.equal(spot.x,.5);const depth=f.run('match().pitchTemplate.penaltySpot/match().pitchTemplate.length');assert(Math.abs(spot.y-(opp?1-depth:depth))<1e-9);
 f.run(`spPenaltyResult('${result}')`);
 assert(!f.el('#modal').innerHTML.includes('precisePitchBoard'));
 if(!opp)f.run('spChoosePlayer(spFlow.draft.taker)');
 if(opp&&result==='Saved'){assert.equal(f.run('spFlow.stage'),'keeper');f.run('spChoosePlayer(match().goalkeeper)')}
 assert.equal(f.run('spFlow'),null);assert.deepEqual(plain(f,'match().events[0].point'),spot);assert.equal(f.run('match().events[0].action'),result==='Goal'?'Goal':'Shot');if(result!=='Goal')assert.equal(f.run('match().events[0].outcome'),result);assert(!f.run('match().events[0].assist'));
}
for(const side of ['Unknown','Left','Right']){
 const f=fixture(0),html=f.el('#modal').innerHTML;assert(!html.includes('Choose pitch location'));assert(!html.includes('spSetCorner(\'Unknown\')'));f.run(`spChooseTaker(match().lineup[7]);${side==='Unknown'?'':`spSetCorner('${side}');`}spSaveRestart()`);const origin=plain(f,'spFlow.draft.point');if(side==='Unknown')assert.equal(origin,null);else assert.deepEqual([origin.x,origin.y],[side==='Left'?0:1,0]);
 f.run('spChooseResult("Goal");spChoosePlayer(match().lineup[9]);confirmPrecisePitchPoint(true);spFlow.stage="assist-player";spChoosePlayer(spFlow.draft.taker)');assert.equal(f.run('spFlow'),null);assert.deepEqual(plain(f,'match().events[0].assist.point'),origin);
}
for(const kind of ['Goal','Shot'])for(const provided of [false,true])for(const opp of [false,true]){
 const f=fixture(1,opp);if(!opp)f.run('spChooseTaker(match().lineup[9])');if(provided)f.run('spFlow.stage="origin";spDrawFlow();pitchPick.point={x:.3,y:.2};confirmPrecisePitchPoint()');f.run(`spSaveRestart();spChooseResult('${kind}')`);assert.equal(f.run('spFlow.stage'),'free-kick-goal');f.run('spChooseFreeKickGoal("direct")');
 if(kind==='Goal'&&!opp)f.run('spFinishDirectFreeKickGoal()');if(kind==='Shot')f.run('spFlow.quality=2;spChooseShotResult(0)');
 if(!provided){assert.equal(f.run('spFlow.stage'),'origin');f.run('pitchPick.point={x:.4,y:.25};confirmPrecisePitchPoint()')}
 if(kind==='Shot'&&opp){assert.equal(f.run('spFlow.stage'),'keeper');f.run('spChoosePlayer(match().goalkeeper)')}
 assert.equal(f.run('spFlow'),null);assert.deepEqual(plain(f,'match().events[0].point'),plain(f,'match().events[0].setPiece.point'));assert(!f.run('match().events[0].assist'));assert.equal(f.run('match().events[0].setPiece.freeKickMode'),'direct');if(kind==='Shot')assert.equal(f.run('match().events[0].qualityLabel'),'Incredible strike');assert.equal(f.run('match().events[0].player'),opp?'Opposition':f.run('match().lineup[9]'));
}
{const f=fixture(1);f.run('spChooseTaker(match().lineup[7]);spFlow.stage="origin";spDrawFlow();pitchPick.point={x:.2,y:.3};confirmPrecisePitchPoint();spSaveRestart();spChooseResult("Goal");spChooseFreeKickGoal("indirect");spChoosePlayer(match().lineup[9]);pitchPick.point={x:.6,y:.1};confirmPrecisePitchPoint();spFlow.stage="assist-player";spChoosePlayer(spFlow.draft.taker)');assert.equal(f.run('spFlow'),null);assert.deepEqual(plain(f,'match().events[0].assist.point'),plain(f,'match().events[0].setPiece.point'))}
{const f=fixture(1);f.run('spChooseTaker(match().lineup[9]);spSaveRestart();spChooseResult("Shot");spChooseFreeKickGoal("direct");spChooseShotResult(1);confirmPrecisePitchPoint(true)');assert.equal(f.run('spFlow'),null);assert.equal(f.run('match().events[0].point'),null)}
{const f=fixture(0);f.run('match().lineup.push("Casey");spChooseTaker("Casey");chooseBenchSwap(match().lineup[4]);confirmSubstitution()');assert.equal(f.run('spFlow.stage'),'details');assert.equal(f.run('spFlow.draft.taker'),'Casey')}
console.log('PASS: automatic penalty spots/results for both teams; inline/bench takers; corner side-only defaults; direct FK goals/shots reuse or request origins; taker assists reuse restart geometry; missing-location Skip stays finite.');

// Indirect free-kick shots still ask for the shooter's distinct location.
{const f=fixture(1);f.run('spChooseTaker(match().lineup[7]);spFlow.stage="origin";spDrawFlow();pitchPick.point={x:.2,y:.3};confirmPrecisePitchPoint();spSaveRestart();spChooseResult("Shot");spChooseFreeKickGoal("indirect");spChoosePlayer(match().lineup[9]);spChooseShotResult(0)');assert.equal(f.run('spFlow.stage'),'shot-location');f.run('pitchPick.point={x:.6,y:.15};confirmPrecisePitchPoint()');assert.equal(f.run('spFlow'),null);assert.equal(f.run('match().events[0].point.x'),.6);assert.equal(f.run('match().events[0].setPiece.point.x'),.2);assert.equal(f.run('match().events[0].setPiece.freeKickMode'),'indirect')}
// Back from a missing direct origin does not commit the unfinished attempt.
{const f=fixture(1);f.run('spChooseTaker(match().lineup[9]);spSaveRestart();spChooseResult("Shot");spChooseFreeKickGoal("direct");spChooseShotResult(0);spBackFlow()');assert.equal(f.run('spFlow.stage'),'details');assert.equal(f.run('spFlow.outcome'),undefined);assert.equal(f.run('match().events[0].action'),'Set piece')}
