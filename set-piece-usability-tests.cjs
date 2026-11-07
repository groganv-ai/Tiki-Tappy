const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
function fixture(){const f=boot();f.run('demo();match().opponent="Visitors & <Rovers>"');return f}
{const f=fixture();f.run('beginV2("Goal")');let html=f.el('#modal').innerHTML;assert(html.includes('Visitors &amp; &lt;Rovers&gt;'));assert(!html.includes('${esc('));f.run('v2ChoosePlayer("Opposition",true)');assert.equal(f.run('captureV2.event.player'),'Opposition')}
for(const type of [0,1,2]){
 const f=fixture();f.run(`spStartSetPiece();spChooseType(${type})`);let html=f.el('#modal').innerHTML;
 assert(html.includes('Visitors &amp; &lt;Rovers&gt;'));assert(!html.includes('<select id="taker"'));
 f.run('stamp=spFlow.draft.at;spFlow.stage="taker";spDrawFlow()');assert(f.el('#modal').innerHTML.includes('Choose player from formation'));f.run('spBackFlow()');assert.equal(f.run('spFlow.stage'),'details');
 f.run('spFlow.stage="taker";spDrawFlow();spChoosePlayer(match().lineup[7])');assert.equal(f.run('spFlow.draft.taker'),f.run('match().lineup[7]'));assert.equal(f.run('spFlow.draft.at'),f.run('stamp'));
 f.run('spSaveRestart();spChooseResult("Goal")');if(type===1)f.run('spChooseFreeKickGoal("indirect")');if(type===2)f.run('spFlow.stage="player";spDrawFlow()');
 assert(f.el('#modal').innerHTML.includes('Choose player from formation'));
 f.run('spChoosePlayer(match().lineup[9]);confirmPrecisePitchPoint(true)');if(type!==2){f.run('spAssistAnswer(true)');assert(f.el('#modal').innerHTML.includes('Choose player from formation'));f.run('spChoosePlayer(match().lineup[7]);confirmPrecisePitchPoint(true)');assert(f.run('match().events.at(-1).assist'))}else assert(!f.run('match().events.at(-1).assist'));assert(f.run('match().events.at(-1).setPiece'));
 // Opposition saved shots retain our keeper picker and nominate an alternative through formation.
 f.run(`spStartSetPiece();spChooseType(${type});spSetTeam(true);spSaveRestart();spChooseResult('Shot');spChooseShotResult(0);confirmPrecisePitchPoint(true);spFlow.chooseKeeper=true;spDrawFlow()`);
 assert(f.el('#modal').innerHTML.includes('Choose player from formation'));f.run('spChoosePlayer(match().lineup[0])');assert.equal(f.run('match().events.at(-1).save.player'),f.run('match().lineup[0]'));
}
// Takers selected from the bench use the existing substitution continuation.
{const f=fixture();f.run('match().lineup.push("Casey");spStartSetPiece();spChooseType(0);spFlow.stage="taker";spDrawFlow();spChoosePlayer("Casey")');assert(f.run('benchSwapDraft'));f.run('chooseBenchSwap(match().lineup[4]);confirmSubstitution()');assert.equal(f.run('spFlow.stage'),'details');assert.equal(f.run('spFlow.draft.taker'),'Casey')}
// Warm just the configured template and reuse the eight cached rotation/team images.
{const f=fixture(),loaded=[];f.c.Image=class {set src(value){loaded.push(value)}decode(){return Promise.resolve()}};f.run('preloadMatchPitch();preloadMatchPitch()');assert.equal(loaded.length,8);assert(loaded.every(p=>p.includes('pitch-full-size')));f.run('beginV2("Goal",match().lineup[9])');assert(f.el('#modal').innerHTML.includes('loading="eager" fetchpriority="high"'));assert(f.el('#modal').innerHTML.includes('<img width='));assert.equal(loaded.length,8)}
// Capture stroke commands: assist has one white segment, goal has a green segment and two arrowhead strokes.
{const f=fixture(),strokes=[];let points=[];const ctx=new Proxy({measureText:t=>({width:String(t).length*8}),beginPath(){points=[]},moveTo(...p){points.push(p)},lineTo(...p){points.push(p)},stroke(){if(this.lineWidth===4)strokes.push({color:this.strokeStyle,points:[...points]})}},{get:(o,k)=>k in o?o[k]:()=>{}});f.c.ctx=ctx;
 f.run('model=makeReplayModel();model.events=[{id:"test-goal",action:"Goal",player:"Scorer",at:60000,point:{x:.5,y:.1},assist:{player:"Assister",point:{x:.25,y:.3}}}];model.allEvents=model.events;model.score=[1,0];replay=highlightPlan(model).find(p=>p.type==="replay");paintReplay(ctx,model,replay.start+(replay.end-replay.start)*.2)');
 assert.equal(strokes.filter(s=>s.color==='#fff').length,1);assert.equal(strokes.filter(s=>s.color==='#d6ee83').length,0);strokes.length=0;
 f.run('paintReplay(ctx,model,replay.start+(replay.end-replay.start)*.75)');assert.equal(strokes.filter(s=>s.color==='#fff').length,1);assert.equal(strokes.filter(s=>s.color==='#d6ee83').length,3);
}
console.log('PASS: escaped opponent names, all restart taker/scorer/assist/keeper formation flows, bench-taker continuation, deduplicated pitch preloading and white assist line/green goal arrow.');
