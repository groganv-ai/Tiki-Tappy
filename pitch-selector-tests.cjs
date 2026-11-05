const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
const {c,el,run}=boot();run('demo();freeDemoActive=false;freeRealDraft=null;match().running=false;match().clockStarted=true;save()');
const presets=run('PITCH_TEMPLATES'),eps=1e-8;let assertions=0;
const near=(a,b)=>{assert(Math.abs(a-b)<eps,`${a} != ${b}`);assertions++};
const points=[{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1},{x:.5,y:.5},{x:.37182,y:.21846},{x:.5,y:.1382857142857143}];
for(const p of presets)for(const rotation of [0,1,2,3])for(const opposition of [false,true])for(const width of [320,768,1280]){
 c.p=p;c.rotation=rotation;
 const variant=run('templateVariant(p,rotation)');
 assert(fs.existsSync(variant.image));assert(fs.existsSync(variant.oppositionImage));
 const height=width*variant.viewBox.height/variant.viewBox.width;
 const landmarks=[...points,...p.drawing.spots.map(([x,y])=>({x:(x-p.rect.x)/p.rect.width,y:(y-p.rect.y)/p.rect.height}))];
 if(p.areaWidth&&p.areaDepth)landmarks.push({x:(p.width-p.areaWidth)/2/p.width,y:p.areaDepth/p.length},{x:1-(p.width-p.areaWidth)/2/p.width,y:1-p.areaDepth/p.length});
 if(p.sixWidth&&p.sixDepth)landmarks.push({x:(p.width-p.sixWidth)/2/p.width,y:p.sixDepth/p.length});
 for(const point of landmarks){
  c.point=point;const displayed=run('templatePointToDisplay(point,p,rotation*90)');
  // Simulate client pixels on the intrinsic image bounds (including padding).
  const clientX=(displayed.x-variant.viewBox.x)/variant.viewBox.width*width+31;
  const clientY=(displayed.y-variant.viewBox.y)/variant.viewBox.height*height+47;
  c.sx=variant.viewBox.x+(clientX-31)/width*variant.viewBox.width;c.sy=variant.viewBox.y+(clientY-47)/height*variant.viewBox.height;
  const restored=run('templatePointFromDisplay(sx,sy,p,rotation*90)');assert(restored);near(restored.x,point.x);near(restored.y,point.y);
 }
 assert.equal(run('templatePointFromDisplay(-9999,-9999,p,rotation*90)'),null);
}
// A point is a draft until confirmed. Rotation does not change it, including opposition.
const original=run('match().events.length');
run('Object.assign(match(),matchdayPitchSettings("U14","11v11"));beginV2("Goal");v2ChoosePlayer("Opposition",true);pitchPick.point={x:.37182,y:.21846};rotateInputPitch()');
assert.equal(run('match().events.length'),original);near(run('pitchPick.point.x'),.37182);
assert(el('#modal').innerHTML.includes('opposition-r90.svg'));assert(!el('#modal').innerHTML.includes('transform:rotate'));
run('confirmPrecisePitchPoint()');assert.equal(run('match().events.length'),original+1);
near(run('match().events.at(-1).point.y'),.21846);assert.equal(run('match().events.at(-1).point.coordinateSpace'),'tikitapper-template-v2');
assert.equal(run('match().pitchTemplate.displayProjection'),'schematic-enlarged-boxes');
run('snapshot=JSON.stringify(match().events.at(-1).point.geometry);selectClock("toggle");selectClock("toggle");save()');
assert.equal(boot(c.saved).run('JSON.stringify(match().events.at(-1).point.geometry)'),c.snapshot);
// Scorer and assist retain separate exact points and a single atomic event.
run('pitchInputRotation=0;Object.assign(match(),matchdayPitchSettings("U10","7v7"));beginV2("Goal",match().lineup[0]);pitchPick.point={x:.23,y:.12};confirmPrecisePitchPoint();captureV2.stage="assist-player";v2ChoosePlayer(match().lineup[1]);pitchPick.point={x:.73,y:.27};confirmPrecisePitchPoint()');
assert.equal(run('match().events.length'),original+2);near(run('match().events.at(-1).point.x'),.23);near(run('match().events.at(-1).assist.point.x'),.73);
assert.equal(run('match().events.at(-1).point.zone'),undefined);assert.equal(run('match().events.at(-1).zone'),null);
run('undoLastAction()');assert.equal(run('match().events.length'),original+1);
// New geometry does not overwrite previously recorded legacy points.
run('legacyBefore=JSON.stringify(match().events[0]);Object.assign(match(),matchdayPitchSettings("U13","11v11"));beginV2("Goal",match().lineup[0]);pitchPick.point={x:.25,y:.2};cancelV2()');
assert.equal(run('JSON.stringify(match().events[0])'),c.legacyBefore);assert.equal(run('match().events.length'),original+1);
// Set-piece origin, shot and assist use the same selector/confirmation pipeline.
run('Object.assign(match(),matchdayPitchSettings("U12","9v9"));spStartSetPiece();spChooseType(1);spFlow.stage="origin";spDrawFlow();pitchPick.point={x:.17,y:.31};confirmPrecisePitchPoint();spSaveRestart();spChooseResult("Goal");spChooseFreeKickGoal("direct");spFlow.draft.taker=match().lineup[0];spFlow.outcome.player=match().lineup[0];spFinishDirectFreeKickGoal()');
near(run('match().events.at(-1).point.x'),.17);near(run('match().events.at(-1).setPiece.point.x'),.17);
assert.equal(run('match().events.at(-1).point.geometry.id'),'u12');
// Clean replay is drawn from the same snapshotted paths and playing rectangle.
c.Path2D=class{constructor(d){this.d=d}};const paths=[];c.paths=paths;
c.ctx={save(){},restore(){},beginPath(){},rect(){},clip(){},translate(){},scale(){},fillRect(){},strokeRect(){},arc(){},fill(){},stroke(p){if(p)paths.push(p.d)}};
run('g=match().events.at(-1).point.geometry;replayRect=drawMatchPitch(ctx,{x:0,y:0,width:600,height:400},null,match().events.at(-1).point);projected=replayPitchPoint(null,match().events.at(-1).point,replayRect)');
for(const d of run('g.drawing.paths'))assert(paths.includes(d));near(run('projected.x'),run('replayRect.x+.17*replayRect.width'));
near(run('projected.y'),run('replayRect.y+.31*replayRect.height'));
assert.equal(run('replayPitchPoint(null,{x:.5,y:.5},replayRect)'),null,'Do not project legacy coordinates onto a template');
// Click events from accessibility may have isPrimary=false; coordinates still work.
run('Object.assign(match(),matchdayPitchSettings("U14","11v11"));pitchInputRotation=0;beginV2("Goal",match().lineup[0])');
c.image={getBoundingClientRect:()=>({left:0,top:0,width:644,height:1004.70588})};
const feedbackTimers=[];c.setTimeout=(fn,ms)=>{if(ms===350)feedbackTimers.push(fn)};run('pitchPointerPoint({button:0,isPrimary:false,clientX:322,clientY:502.35294},image)');assert.equal(run('captureV2.stage'),'location');assert(el('#modal').innerHTML.includes('pitch-action-frame'));feedbackTimers.shift()();near(run('captureV2.event.point.x'),.5);near(run('captureV2.event.point.y'),.5);assert.equal(run('captureV2.stage'),'assist-question');
run('cancelV2();spStartSetPiece();spChooseType(2);assumed=JSON.stringify(spFlow.draft.point);spSaveRestart();spCloseFlow();spOpenResult(match().events.at(-1).id);spApplyAssumedLocation()');
assert.equal(run('JSON.stringify(spFlow.draft.point)'),c.assumed,'Editing a saved penalty retains the same schematic snapshot');
console.log(`PASS: ${assertions} coordinate round-trip assertions; all six presets, four rotations, both teams and three viewport widths; exact draft/confirm/cancel; persisted schematic snapshots; goal/assist/undo; set-piece origin/direct goal; clean replay alignment; legacy separation.`);
