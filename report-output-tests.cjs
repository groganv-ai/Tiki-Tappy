const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
function fixture(){const f=boot();f.run('demo();dayFinishMatch(0);startDayFlow();confirmDayReview();dayStep("output")');let count=0;f.created=[];f.revoked=[];f.c.URL={createObjectURL(){const url='blob:'+ ++count;f.created.push(url);return url},revokeObjectURL:u=>f.revoked.push(u)};return f}
function page(){return {width:1080,height:1920,toBlob(done){this.finish=done}}}
async function tick(){await Promise.resolve();await Promise.resolve()}
(async()=>{
 // Closing during rendering prevents late publication and frees the canvas.
 {const f=fixture(),p=page();f.c.waitingReport=new Promise(resolve=>f.resolve=resolve);f.run('makeDayReportPages=()=>waitingReport');const task=f.run('exportMatchReport()');f.run('closeExport()');f.resolve([p]);await task;assert.equal(p.width,0);assert.equal(f.created.length,0);assert.equal(f.run('matchReportFiles.length'),0);assert.equal(f.el('#modal').innerHTML,'')}
 // Pages remain private until every encoder completes. A late old encoder cannot replace a new export.
 {const f=fixture(),old=page(),next=page();f.c.pages=[old];f.run('makeDayReportPages=async()=>pages');const task=f.run('exportMatchReport()');await tick();assert.equal(f.created.length,0);f.run('closeExport()');f.c.pages=[next];const newer=f.run('exportMatchReport()');await tick();old.finish({});await task;assert(f.run('matchReportBusy'));next.finish({});await newer;assert.equal(f.run('matchReportFiles.length'),1);assert(f.el('#modal').innerHTML.includes('Your Match Report'));assert.equal(f.created.length,1);f.run('closeExport()');assert.deepEqual(f.revoked,f.created);assert.equal(f.run('matchReportFiles.length'),0)}
 // A failure on a later page leaves neither a partial report nor unreleased canvases.
 {const f=fixture(),a=page(),b=page();f.c.pages=[a,b];f.run('makeDayReportPages=async()=>pages');const task=f.run('exportMatchReport()');await tick();a.finish({});await tick();assert.equal(f.run('matchReportFiles.length'),0);b.finish(null);await task;assert.equal(f.created.length,0);assert.equal(a.width,0);assert.equal(b.width,0);assert(!f.run('matchReportBusy'))}
 // Changing report content or matchday during encoding invalidates its result.
 for(const change of ['daySetFilter("goals")','day().summary="Changed after snapshot"','view="live"','day().id="new-day"']){const f=fixture(),p=page();f.c.pages=[p];f.run('makeDayReportPages=async()=>pages');const task=f.run('exportMatchReport()');await tick();f.run(change);p.finish({});await task;assert.equal(f.created.length,0,change);assert.equal(p.height,0)}
 // Recording owns its export; report generation cannot dispose an active recording.
 {const f=fixture();f.run('playback={recording:true};exportMatchReport()');assert(f.run('playback.recording'));assert(!f.run('matchReportBusy'))}
 // Dispatcher snapshots source data independently, including the award reason and player scope.
 {const f=fixture();f.run('chooseDayPlayer(day().squad[0]);setDayAwardReason("Team spirit");snap=reportOutputSnapshot();day().summary="later"');assert.equal(f.run('snap.day.summary.includes("later")'),false);assert.equal(f.run('snap.day.playerOfDayReason'),'Team spirit');f.run('makePlayerSummaryPages=async m=>[m];snap.flow.reportView="players"');const pages=await f.run('makeDayReportPages(snap)');assert(pages[0].rows.length>0)}
 console.log('PASS: snapshot dispatch, cancellation during rendering/encoding, latest export ownership, no partial files, canvas/URL cleanup, changed-context invalidation and recording guard.');
})().catch(e=>{console.error(e);process.exitCode=1});

