const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
const {c,el,run}=boot();
run(`createDay({preventDefault(){},target:{teamName:'Test United',players:'Alex\\nTaylor\\nSam',date:'2026-10-20',location:'Test field',opponents:'Visitors,10:00\\nRovers,11:00\\nJuniors,12:00',durationMinutes:'30',twoHalves:'on'}})`);
assert(el('#app').innerHTML.includes('Choose your starting team'));assert(!el('#app').innerHTML.includes('startClockHold(event'));assert.equal(run('teamDraft.scope'),'day');
run('teamNext();teamAssign("Alex","GK");teamAssign("Taylor","DF");teamDraft.captain="Taylor";saveTeamSelection()');
assert.equal(run('match().teamReady'),true);assert.equal(run('day().matches[1].teamReady'),false);assert.equal(run('day().matches[2].teamReady'),false);assert(!run('match().running'));assert(el('#app').innerHTML.includes('startClockHold(event'));
run('selectClock("toggle");selectClock("toggle");selectClock("full");changeMatch(1)');
assert(el('#app').innerHTML.includes('Review the starting team'));assert(el('#app').innerHTML.includes('Confirm team &amp; continue')||el('#app').innerHTML.includes('Confirm team & continue'));assert(!el('#app').innerHTML.includes('startClockHold(event'));assert(!run('match().running'));
const untouched=JSON.stringify(run('day().matches[0]'));let hidden=0;c.hiddenSpy=()=>hidden++;run('realHide=hideHoldFeedback;hideHoldFeedback=hiddenSpy');
const modal=el('#modal').innerHTML;run('selectClock("toggle");startClockHold({pointerId:1,isPrimary:true,button:0,clientX:0,clientY:0},{classList:{add(){},remove(){}}},"toggle")');assert.equal(el('#modal').innerHTML,modal);assert.equal(run('clockHold'),null);assert(!run('match().running'));assert(hidden>=2);
run('clockHold={fired:true,timer:0,button:{classList:{remove(){}}}};openTeamSelection("match")');assert.equal(run('clockHold'),null);assert.equal(run('teamDraft.scope'),'match');assert(hidden>=3);run('teamClose()');assert(run('preMatchPending()'));
run('confirmPreMatchTeam()');assert(!run('preMatchPending()'));assert(!run('match().running'));assert.equal(run('match().elapsed'),0);assert(el('#app').innerHTML.includes('startClockHold(event'));assert.equal(run('teamKeeper()'),'Alex');assert.equal(run('teamState(match()).captain'),'Taylor');
// Saving and returning keeps the team ready, but does not start the clock.
run('save()');const restored=boot(c.saved);restored.run('view="live";changeMatch(1)');assert(!restored.run('preMatchPending()'));assert(!restored.run('match().running'));
// The same 1.5-second clock hold now starts this game without a selection modal.
const timers=[];c.setTimeout=fn=>{timers.push(fn);return timers.length};run('startClockHold({pointerId:2,isPrimary:true,button:0,clientX:0,clientY:0},{classList:{add(){},remove(){}}},"toggle")');const fire=timers.at(-1);fire();assert(run('match().running'));assert.equal(run('teamDraft'),null);assert.equal(JSON.stringify(run('day().matches[0]')),untouched);run('releaseClockHold({pointer:2,pointerId:2});selectClock("toggle");selectClock("toggle")');assert(run('match().running'));
run('selectClock("toggle");selectClock("half");selectClock("toggle")');assert.equal(run('match().period'),2);assert(run('match().running'));
run('mi=2;view="live";render()');assert(run('preMatchPending()'));assert(!el('#app').innerHTML.includes('startClockHold(event'));run('lineupModal();teamNext();teamAssign("Sam","GK");teamAssign("Taylor","DF");saveTeamSelection()');assert.equal(run('teamKeeper()'),'Sam');assert(!run('match().running'));assert.equal(run('day().matches[1].goalkeeper'),'Alex');
console.log('PASS: pre-match team confirmation before first and later-game clocks; inherited roles, keeper, captain and bench; hold overlay cancelled before selection; no clock-triggered modal; saved readiness; normal hold/start, tap pause/resume and second-half controls; independent match data.');
