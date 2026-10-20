const fs=require('fs'),vm=require('vm'),assert=require('assert');
function boot(saved){const els=new Map();function el(s){if(!els.has(s))els.set(s,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},setAttribute(){}});return els.get(s)}class FormData{constructor(t){this.fields=t}get(k){return this.fields[k]??null}}
const c={window:{addEventListener(){}},document:{querySelector:el,addEventListener(){}},localStorage:{getItem(){return saved},setItem(k,v){c.saved=v}},setTimeout(){},clearTimeout(){},setInterval(){},Date,FormData,atob,TextDecoder,crypto:require('crypto').webcrypto,location:{hash:'',pathname:'/',search:''},history:{replaceState(){}}};vm.createContext(c);const html=fs.readFileSync('index.html','utf8');vm.runInContext(fs.readFileSync('timing.js','utf8'),c);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],c);for(const file of [...html.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"/g)].map(m=>m[1]).filter(x=>x!=='timing.js'))vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});return {c,el,run:s=>vm.runInContext(s,c)}}

function fixture(){const f=boot();f.run("createDay({preventDefault(){},target:{teamName:'Test United',players:['Avery','Jordan','Casey','Taylor'].join(String.fromCharCode(10)),date:'2026-10-20',location:'Test pitch',opponents:'Visitors'}});teamNext();teamAssign('Avery','GK');teamAssign('Jordan','DF');saveTeamSelection();match().elapsed=60000;match().clockStarted=true");return f}
{
 const {run,el}=fixture();run("promptBenchAction('Casey','Pass');chooseBenchSwap('Jordan')");assert.equal(run('match().events.length'),0);run('confirmSubstitution()');assert.deepEqual(Array.from(run('match().events.map(e=>e.action)')),['Substitution','Pass']);assert.equal(run('match().events[1].player'),'Casey');assert.equal(run('match().events[1].at'),run('match().events[0].at'));run('undoLastAction();undoLastAction()');assert(run('teamIsSubstitute("Casey")'));assert.equal(run('match().events.length'),0);
 run("promptBenchAction('Casey','Pass');chooseBenchSwap('Jordan');closeSubstitution()");assert.equal(run('match().events.length'),0);
}
{
 const {run}=fixture();run("setInputMode('coach');beginV2('Goal');captureV2.quality=1;v2ChoosePlayer('Casey');chooseBenchSwap('Jordan');confirmSubstitution()");assert.equal(run('captureV2.stage'),'location');assert.equal(run('captureV2.quality'),1);assert.equal(run('match().events[0].action'),'Substitution');run('v2ChooseZone(1);finishV2()');assert.equal(run('score(match())[0]'),1);assert.equal(run('match().events[1].player'),'Casey');assert.equal(run('match().events[1].qualityLabel'),'Amazing goal');
}
{
 const {run}=fixture();run("setInputMode('coach');beginV2('Goal');v2ChoosePlayer('Jordan');v2ChooseZone(1);captureV2.stage='assist-player';v2ChoosePlayer('Casey');chooseBenchSwap('Avery');confirmSubstitution()");assert.equal(run('captureV2.stage'),'assist-location');run('v2ChooseZone(8)');assert.equal(run('match().events[1].assist.player'),'Casey');assert.equal(run('teamKeeper()'),'Casey');
}
{
 const {run}=fixture();run("setInputMode('coach');beginV2('Shot');v2ChoosePlayer('Opposition',true);v2Outcome(0);v2ChooseZone(18);captureV2.quality=2;v2ChoosePlayer('Casey');chooseBenchSwap('Avery');confirmSubstitution()");assert.deepEqual(Array.from(run('match().events.map(e=>e.action)')),['Substitution','Shot']);assert.equal(run('match().events[1].save.player'),'Casey');assert.equal(run('match().events[1].save.qualityRank'),2);
}
{
 const {run}=fixture();run("setInputMode('coach');spStartSetPiece();spChooseType(0);spSaveRestart();spChooseResult('Goal');spChoosePlayer('Casey');chooseBenchSwap('Jordan');confirmSubstitution()");assert.equal(run('spFlow.stage'),'shot-location');run('spChooseDemoZone(1);spAssistAnswer(false)');assert.equal(run('score(match())[0]'),1);assert.equal(run('match().events.filter(e=>e.action==="Substitution").length'),1);assert.equal(run('match().events.find(e=>e.action==="Goal").player'),'Casey');assert(run('match().events.find(e=>e.action==="Goal").setPiece'));
}
console.log('PASS: substitution and initiating action both recorded; Coach goal quality/assist/save continuation; linked set-piece result continuation; original timestamps; cancellation adds neither; Undo restores bench.');
