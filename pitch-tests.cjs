const fs=require('fs'),vm=require('vm'),assert=require('assert');
function boot(saved){const els=new Map();function el(s){if(!els.has(s))els.set(s,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},setAttribute(){}});return els.get(s)}class FormData{constructor(t){this.fields=t}get(k){return this.fields[k]??null}}
const c={window:{addEventListener(){}},document:{querySelector:el,addEventListener(){}},localStorage:{getItem(){return saved},setItem(k,v){c.saved=v}},setTimeout(){},clearTimeout(){},setInterval(){},Date,FormData,atob,TextDecoder,crypto:require('crypto').webcrypto,location:{hash:'',pathname:'/',search:''},history:{replaceState(){}}};vm.createContext(c);const html=fs.readFileSync('index.html','utf8');vm.runInContext(fs.readFileSync('timing.js','utf8'),c);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],c);for(const file of [...html.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"/g)].map(m=>m[1]).filter(x=>x!=='timing.js'))vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});return {c,el,run:s=>vm.runInContext(s,c)}}
const {c,run}=boot();run('demo()');
assert(run('v2PitchHTML().includes(entryPitchSVG())'));
assert(!run('entryPitchSVG(false).includes("v2ChooseZone")'));
assert(!run('entryPitchSVG(false).includes("320 340")'));
const calls=[];c.calls=calls;
c.pitchContext={save(){},restore(){},translate(...n){calls.push(['translate',...n])},scale(...n){calls.push(['scale',...n])},fillRect(...n){calls.push(['fillRect',...n])},beginPath(){},moveTo(...n){calls.push(['M',...n])},lineTo(...n){calls.push(['L',...n])},quadraticCurveTo(...n){calls.push(['Q',...n])},bezierCurveTo(...n){calls.push(['C',...n])},closePath(){},stroke(){},arc(...n){calls.push(['arc',...n])},fill(){}};
run('pitchRect=drawMatchPitch(pitchContext,{x:80,y:350,width:560,height:420})');
assert.equal(run('pitchRect.width/pitchRect.height'),360/560);
assert.deepEqual(calls.find(x=>x[0]==='scale'),['scale',.75,.75]);
assert(calls.some(x=>x[0]==='arc'&&x[1]===180&&x[2]===280&&x[3]===40));
assert(calls.some(x=>x[0]==='Q'&&x[2]===186));
assert.equal(calls.filter(x=>x[0]==='C').length,4);
for(const z of run('v2Zones()')){c.zone=z;run('p=replayPitchPoint(null,{x:(zone.x+zone.w/2)/360,y:(zone.y+zone.h/2)/560},pitchRect)');assert.equal(c.p.x,225+(z.x+z.w/2)*.75);assert.equal(c.p.y,350+(z.y+z.h/2)*.75)}
assert.equal(run('replayPitchPoint(1,null,pitchRect).y'),717.5);
assert.equal(run('replayPitchPoint("v2-1",null,pitchRect)'),null);
assert.equal(run('MATCH_PITCH.goals.north.y'),9);assert.equal(run('MATCH_PITCH.goals.south.y'),551);
c.pitchContext.rect=(...n)=>calls.push(['rect',...n]);c.pitchContext.clip=()=>calls.push(['clip']);
run('halfRect=drawMatchPitch(pitchContext,{x:80,y:350,width:560,height:420},"north")');assert.equal(run('halfRect.width'),540);assert.equal(run('halfRect.height'),840);assert(calls.some(x=>x[0]==='clip'));assert.deepEqual(calls.find(x=>x[0]==='rect'),['rect',90,350,540,420]);
console.log('PASS: shared entry/replay geometry; portrait aspect ratio; unwarped centre circle; penalty arcs and four corners; all 26 captured zone centres aligned; legacy numeric locations preserved; no replay grid or attack arrow.');
