const fs=require('fs'),vm=require('vm'),assert=require('assert');
const c={};vm.createContext(c);
vm.runInContext(fs.readFileSync('pitch.js','utf8'),c);
const source=fs.readFileSync('v02.js','utf8');
vm.runInContext(source.slice(source.indexOf('function v2Zones(){'),source.indexOf('function v2PitchHTML(){')),c);
const run=s=>vm.runInContext(s,c);
const zones=run('v2Zones()');
assert.equal(zones.length,26);
for(let rotation=0;rotation<4;rotation++){
  assert.equal(run('pitchInputAngle()'),rotation*90);
  assert.equal(run('pitchInputScale()'),rotation%2?360/560:1);
  for(const opp of [false,true]){
    for(let i=0;i<zones.length;i++){
      c.i=i;c.opp=opp;
      const loc=run('pitchInputZone(v2Zones()[i],opp)');
      const original=zones[i],x=(original.x+original.w/2)/360,y=(original.y+original.h/2)/560;
      assert(Math.abs(loc.point.x-(opp?1-x:x))<1e-9);
      assert(Math.abs(loc.point.y-(opp?1-y:y))<1e-9);
      assert.equal(loc.zone,run('v2Zones().find(z=>z.label===pitchInputZone(v2Zones()[i],opp).locationLabel).id'));
    }
    c.opp=opp;
    assert.equal(run('replayHalfForGoal({action:"Goal",opp,point:pitchInputPoint(v2Zones()[0],opp)})'),opp?'south':'north');
  }
  run('rotateInputPitch()');
}
assert.equal(run('pitchInputAngle()'),0);
assert.equal(run('replayHalfForGoal({action:"Goal",opp:false,point:{x:.5,y:.2},assist:{point:{x:.5,y:.8}}})'),null);
assert.equal(run('replayHalfForGoal({action:"Goal",opp:true,point:{x:.5,y:.8},assist:{point:{x:.5,y:.7}}})'),'south');
assert.equal(run('replayPitchPoint(1,null,{x:0,y:0,width:1,height:1}).y'),.875);
assert.equal(run('pitchInputZone(null,true).point'),null);
console.log('PASS: four input rotations, both teams, 26 zones, north/south replay framing, mixed-half fallback, legacy numeric zone');
