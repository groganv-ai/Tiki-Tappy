const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync('index.html','utf8'),scripts=[...html.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"/g)].map(m=>m[1]);
assert.equal(new Set(scripts).size,scripts.length,'No module is loaded twice');
for(const file of scripts)assert(fs.existsSync(file),file+' exists');
for(const [before,after] of [['timing.js','clock.js'],['clock.js','action-recording.js'],['pitch-template-data.js','pitch-selector.js'],['action-recording.js','v02.js'],['free-matchday.js','post-match.js'],['post-match.js','compact-reports.js'],['compact-reports.js','player-summary.js'],['player-summary.js','report-output.js'],['updates.js','media-recording.js']])assert(scripts.includes(before)&&scripts.includes(after)&&scripts.indexOf(before)<scripts.indexOf(after),before+' loads before '+after);
const owners={beginV2:'action-recording.js',selectClock:'clock.js',makeReplayModel:'highlights.js',makeDayReportPages:'report-output.js',exportMatchReport:'report-output.js',startReplay:'media-recording.js',stopReplay:'media-recording.js',recordReplay:'media-recording.js',cancelRecording:'media-recording.js',dayAwardStepHTML:'post-match.js'};
for(const [name,owner] of Object.entries(owners)){
 const declaration=new RegExp('(?:function\\s+'+name+'\\s*\\(|^'+name+'\\s*=\\s*(?:async\\s+)?function\\s*\\()','gm');
 const found=scripts.flatMap(file=>[...fs.readFileSync(file,'utf8').matchAll(declaration)].map(()=>file));
 assert.deepEqual(found,[owner],name+' has one owner');
}
console.log('PASS: runtime modules exist/load once, critical dependency order and ten consolidated lifecycle/model functions have one owner.');
