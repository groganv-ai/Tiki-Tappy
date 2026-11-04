const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
function fixture(){const f=boot();f.run('demo();freeDemoActive=false;match().running=false;match().clockStarted=true;setInputMode("player")');f.c.button={classList:{add(){},remove(){}}};return f}
// A pointer release after leaving Match Centre must not save an invisible Pass.
{
 const {run}=fixture();const before=run('match().events.length');
 run('v2StartGridHold({button:0,isPrimary:true,clientX:0,clientY:0},button,"Pass",match().lineup[0],false);view="report";render();v2ReleaseGridHold()');
 assert.equal(run('match().events.length'),before,'Navigation must cancel held actions');
}
// An unfinished goal cannot be committed later from a stale callback after navigation.
{
 const {run}=fixture();const before=run('match().events.length');
 run('beginV2("Goal",match().lineup[0]);view="report";render();finishV2()');
 assert.equal(run('match().events.length'),before,'Navigation must invalidate unfinished capture');
}
for(const transition of ['changeMatch(1)','selectClock("restart")','selectClock("full")']){
 const {run}=fixture();
 run('beginV2("Goal",match().lineup[0]);'+transition);
 const before=run('match().events.length');run('finishV2()');assert.equal(run('match().events.length'),before,transition);
 assert.equal(run('captureV2'),null);
}
// Pausing is valid during capture: retain the first-tap timestamp and atomic assist.
{
 const {run}=fixture();const before=run('match().events.length');
 run('beginV2("Goal",match().lineup[0]);stamp=captureV2.event.at;v2ChooseZone(1);captureV2.stage="assist-player";v2ChoosePlayer(match().lineup[1]);match().elapsed+=60000;v2ChooseZone(8)');
 assert.equal(run('match().events.length'),before+1);assert.equal(run('match().events.at(-1).at'),run('stamp'));
 assert(run('match().events.at(-1).assist'));run('undoLastAction()');assert.equal(run('match().events.length'),before);
}
console.log('PASS: navigation, match switching, reset and full-time invalidate capture; held Pass cancellation; original timestamp and atomic assist/undo preserved.');
// Undo and mode buttons cancel the current hold; late timers cannot save it.
for(const action of ['undoLastAction()','toggleUndoMode()','setInputMode("coach")','setInputMode("player")']){
 const {c,run}=fixture(),timers=[];c.setTimeout=(fn,ms)=>{if(ms===1500)timers.push(fn);return timers.length};
 const before=run('match().events.length');
 run('v2StartGridHold({button:0,isPrimary:true,clientX:0,clientY:0},button,"Pass",match().lineup[0],false);'+action);
 assert.equal(run('v2GridHold'),null,action);
 for(const fn of timers)fn();run('v2ReleaseGridHold()');
 assert.equal(run('match().events.length'),before-(action==='undoLastAction()'?1:0),action);
}
// Starting or moving a hold never commits; release commits once at its first-tap time.
for(const rank of [0,1,2]){
 const {c,run}=fixture(),timers=[];c.setTimeout=(fn,ms)=>{if(ms===1500)timers.push(fn);return timers.length};
 run('match().elapsed=120000;v2StartGridHold({button:0,isPrimary:true,clientX:0,clientY:0},button,"Pass",match().lineup[0],false)');
 const before=run('match().events.length');for(let i=0;i<rank;i++)timers.shift()();
 run('match().elapsed=240000;v2ReleaseGridHold();v2ReleaseGridHold();v2GridClick("Pass",match().lineup[0],false)');
 assert.equal(run('match().events.length'),before+1);assert.equal(run('match().events.at(-1).qualityRank'),rank);
 assert.equal(run('match().events.at(-1).periodAt'),120000);
}
{
 const {run}=fixture(),before=run('match().events.length');
 run('v2StartGridHold({button:0,isPrimary:true,clientX:0,clientY:0},button,"Pass",match().lineup[0],false);v2MoveGridHold({clientX:20,clientY:0});v2ReleaseGridHold();v2GridClick("Pass",match().lineup[0],false)');
 assert.equal(run('match().events.length'),before);
}
console.log('PASS: Undo/mode hold cancellation; late timers; tap/1.5s/3s Pass quality; first-tap time; duplicate release/click suppression; movement cancellation.');
// Set-piece commits obey the same live-match boundary, keeping a saved restart.
{
 const {run}=fixture(),before=run('match().events.length');
 run('spStartSetPiece();spChooseType(0);view="report";spSaveRestart()');
 assert.equal(run('match().events.length'),before,'No hidden set-piece restart');
 run('view="live";spStartSetPiece();spChooseType(0);spSaveRestart();spFlow.outcome={kind:"Cleared",at:120000,time:spTime()};view="report";spFinishOutcome()');
 assert.equal(run('match().events.length'),before+1);assert.equal(run('match().events.at(-1).setPiece.status'),undefined);
}
// Substitution continuation cannot record after leaving the live match either.
{
 const {c,run}=fixture();
 run('match().teamStart={onPitch:match().lineup.slice(0,2),roles:{[match().lineup[0]]:"GK",[match().lineup[1]]:"DF"},captain:""};openSubstitution();subDraft.off=match().lineup[1];subDraft.on=match().lineup[2];view="report"');
 const before=run('match().events.length');run('confirmSubstitution()');
 assert.equal(run('match().events.length'),before,'No hidden substitution');
}
console.log('PASS: set-piece restart/result and substitution commits reject stale navigation; already-saved restarts remain intact.');
