const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
const {c,el,run}=boot();
run('demo();match().halfTime=false;freeDemoActive=false;match().running=false;match().clockStarted=true');
const snapshot=run('JSON.stringify({...match(),inputMode:null})');
for(const mode of ['coach','player']){
 run(`setInputMode('${mode}')`);
 const html=el('#app').innerHTML;
 assert.equal((html.match(/id="clock"/g)||[]).length,1);
 assert.equal((html.match(/class="timer-status"/g)||[]).length,1);
 assert.equal((html.match(/aria-label="Match input mode"/g)||[]).length,1);
 assert.equal((html.match(/class="score match-score-panel/g)||[]).length,1);
 assert.equal(run('JSON.stringify({...match(),inputMode:null})'),snapshot);
 assert(html.includes(mode==='coach'?'v2-actions':'v2-matrix'));
}
run('beginV2("Goal",match().lineup[0]);setInputMode("coach")');
assert.equal(run('captureV2'),null);assert.equal(el('#modal').innerHTML,'');
let now=1000000;c.Date=class extends Date{static now(){return now}};
run('match().elapsed=120000;selectClock("toggle")');now+=7000;
run('setInputMode("player");selectClock("toggle")');assert.equal(run('match().elapsed'),127000);
run('selectClock("half")');assert.equal(run('matchStatus(match())'),'Half time');
run('selectClock("toggle")');assert.equal(run('match().period'),2);assert.equal(run('match().elapsed'),0);
run('selectClock("toggle");selectClock("full")');assert.equal(run('matchStatus(match())'),'Full time');
run('selectClock("toggle")');assert.equal(run('match().ended'),false);assert.equal(run('match().period'),2);
// Switching matches cancels an in-flight hold before it can act on the new game.
run('clockHold={match:match(),timer:0,fired:false,button:{classList:{remove(){}}}};mi=1;render()');assert.equal(run('clockHold'),null);
// A reset applies every lifecycle side effect in the same saved transition.
run('mi=0;selectClock("toggle");match().playerOfDay=match().lineup[0];day().endFlow={stage:"output",reviewKey:"old"};selectClock("restart")');
assert.equal(run('match().inputMode'),'player');assert.equal(run('match().playerOfDay'),undefined);
assert.equal(run('match().events.length'),0);assert.equal(run('clockHasStarted(match())'),false);
assert.equal(run('day().endFlow.stage'),'review');assert.equal(run('day().endFlow.reviewKey'),undefined);
const restored=boot(c.saved);assert.equal(restored.run('match().events.length'),0);assert.equal(restored.run('match().inputMode'),'player');
console.log('PASS: one scoreboard/timer/mode bar; mode state preservation and capture cancellation; deterministic pause/resume; halves/full-time/reopen; hold cancellation across games; atomic reset and persistence.');
