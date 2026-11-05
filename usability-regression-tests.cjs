const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
const {c,el,run}=boot();
assert.equal(run('compactNames'),false);
run(`createDay({preventDefault(){},target:{teamName:'Test',pitchAgeGroup:'U10',pitchFormat:'7v7',players:'Jim\\nAlex\\nCasey\\nTaylor',date:'2026-11-04',location:'Test pitch',opponents:'Rovers & United'}});closeModal();match().teamStart={onPitch:['Jim','Alex','Casey','Taylor'],roles:{Jim:'GK',Alex:'DF',Casey:'MD',Taylor:'AT'},captain:''};match().clockStarted=true;match().elapsed=60000`);
let next=0;const timers=new Map();c.setTimeout=(fn,ms)=>{const id=++next;if(ms===350)timers.set(id,fn);return id};c.clearTimeout=id=>timers.delete(id);
const advance=()=>{const [id,fn]=timers.entries().next().value;timers.delete(id);fn()};
c.image={getBoundingClientRect:()=>({left:0,top:0,width:644,height:736.1})};
const tap='pitchPointerPoint({button:0,clientX:322,clientY:368.05},image)';
run('beginV2("Goal","Alex")');assert(!el('#modal').innerHTML.includes('Confirm location'));
run(tap);assert.equal(run('match().events.length'),0);assert.equal(run('captureV2.stage'),'location');assert(el('#modal').innerHTML.includes('pitch-action-frame'));assert.equal(run('pitchPick.feedbackIcon'),'Goal');
advance();assert.equal(run('captureV2.stage'),'assist-question');
run('captureV2.stage="assist-player";drawV2Capture()');assert(el('#modal').innerHTML.includes('Choose player from formation'));assert(!el('#modal').innerHTML.includes('team-player-group'));assert(!el('#modal').innerHTML.includes('data-player="Alex"'));
run('v2ChoosePlayer("Casey")');run(tap);assert.equal(run('pitchPick.feedbackIcon'),'Assist');advance();assert.equal(run('match().events.length'),1);assert.equal(run('match().events[0].assist.player'),'Casey');
run('beginV2("Shot");v2ChoosePlayer("Opposition",true);v2Outcome(0)');run(tap);assert.equal(run('pitchPick.feedbackIcon'),'Shot');advance();
assert.equal(run('captureV2.stage'),'keeper');assert(el('#modal').innerHTML.includes('keeper-confirm-row'));assert(el('#modal').innerHTML.includes('>Jim</button>'));assert(!el('#modal').innerHTML.includes('>Record save for Jim'));
run('v2ChoosePlayer("Jim")');assert.equal(run('match().events.at(-1).save.player'),'Jim');
run('beginV2("Goal","Alex")');run(tap);assert.equal(timers.size,1);const late=[...timers.values()][0];run('cancelV2()');assert.equal(timers.size,0);late();assert.equal(run('match().events.length'),2);
run('setInputMode("coach");beginV2("Goal");drawV2Capture()');assert(el('#modal').innerHTML.includes('Choose player from formation'));run('cancelV2()');
assert(run('v2Grid(match()).includes("Rovers &amp; United")'));
const timeline=run('compactTimelineHTML(compactReportItems(match()))');assert(timeline.includes('Rovers &amp; United'));assert(!timeline.includes('Opposition'));assert(timeline.includes('compact-timeline-time'));assert(timeline.includes('compact-timeline-opponent'));
assert(run('JSON.stringify(compactGroups(compactReportItems(match()))).includes("Rovers & United")'));
run('beginV2("Shot","Opposition",true)');assert(el('#modal').innerHTML.includes('Rovers &amp; United'));assert(!el('#modal').innerHTML.includes('Shot by Opposition'));run('cancelV2()');
// Full action tables use one horizontal band; each player's complete row stays
// on one page, even when a genuinely long roster requires vertical pagination.
const canvases=[];c.document.createElement=tag=>{
 assert.equal(tag,'canvas');const canvas={entries:[]};const ctx={font:'24px sans-serif',fillStyle:'',textAlign:'left',fillRect(){},beginPath(){},moveTo(){},lineTo(){},quadraticCurveTo(){},bezierCurveTo(){},arc(){},stroke(){},fill(){},save(){},restore(){},translate(){},scale(){},rect(){},roundRect(){},closePath(){},setLineDash(){},measureText(t){const size=Number(this.font.match(/(\d+)px/)?.[1]||24);return {width:String(t).length*size*.52}},fillText(t,x,y){canvas.entries.push({t:String(t),x,y})}};canvas.getContext=()=>ctx;canvases.push(canvas);return canvas;
};
(async()=>{
 run('summaryDay={team:"Test",date:"2026-11-04",location:"Test pitch",squad:[],matches:[0,1,2].map(i=>({opponent:"Visitors "+i,lineup:[],events:[],ended:true}))};for(let n=0;n<10;n++){const name="Player "+n;summaryDay.squad.push(name);summaryDay.matches[0].lineup.push(name);for(const action of PLAYER_SUMMARY_ACTIONS)summaryDay.matches[0].events.push({id:name+action,action,category:action,player:name,at:60000})}summary=playerSummaryModel(summaryDay,-1,"name")');
 const pages=await run('makePlayerSummaryPages(summary)');assert.equal(pages.length,1,'Typical 12-category summary should fit one page');assert.equal(pages[0].playerSummaryNames.length,10);assert(pages[0].entries.some(e=>e.t==='All players (10)'));
 run('summary.rows=Array.from({length:60},(_,n)=>({...summary.rows[0],name:"Player "+n}));summary.totalMax=summary.rows[0].total');
 const overflow=await run('makePlayerSummaryPages(summary)');const names=overflow.flatMap(p=>p.playerSummaryNames);assert.equal(names.length,60);assert.equal(new Set(names).size,60);assert(overflow.length>1);
 for(const p of overflow)assert(p.entries.every(e=>e.y<1850||e.t.startsWith('©')||e.t.startsWith('Page ')),'No content below footer');
 console.log('PASS: names default; formation assist/scorer; name-only keeper button; 350ms Goal/Shot/Assist icons and automatic progression; cancellation; opponent team names and centred axis; one-page full action table; 60 unsplit complete player rows.');
})().catch(e=>{console.error(e);process.exitCode=1});
