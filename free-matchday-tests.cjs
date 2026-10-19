const fs=require('fs'),vm=require('vm'),assert=require('assert');
function boot(saved){const els=new Map();function el(s){if(!els.has(s))els.set(s,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},setAttribute(){}});return els.get(s)}class FormData{constructor(t){this.fields=t}get(k){return this.fields[k]??null}}
const c={window:{addEventListener(){}},document:{querySelector:el,addEventListener(){}},localStorage:{getItem(){return saved},setItem(k,v){c.saved=v}},setTimeout(){},clearTimeout(){},setInterval(){},Date,FormData,atob,TextDecoder,crypto:require('crypto').webcrypto,location:{hash:'',pathname:'/',search:''},history:{replaceState(){}}};vm.createContext(c);const html=fs.readFileSync('index.html','utf8');vm.runInContext(fs.readFileSync('timing.js','utf8'),c);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],c);for(const file of [...html.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"/g)].map(m=>m[1]).filter(x=>x!=='timing.js'))vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});return {c,el,run:s=>vm.runInContext(s,c)}}

const {c,el,run}=boot();
assert.equal(run('data.teams[0].name'),'');assert.equal(run('data.teams[0].squad.length'),0);
run('view="setup";render()');assert(el('#app').innerHTML.includes('name="teamName"'));assert(el('#app').innerHTML.includes('name="players"'));assert(!el('#app').innerHTML.includes('Save teams'));assert(!el('#app').innerHTML.includes('Matchday archive'));
run("createDay({preventDefault(){},target:{teamName:'Test United',players:['Avery','Jordan','Sam'].join(String.fromCharCode(10)),date:'2026-10-20',location:'Test field',opponents:['Visitors, 10:00','Other team, 11:00'].join(String.fromCharCode(10)),durationMinutes:'30',twoHalves:'on'}})");
assert.equal(run('teamDraft.stage'),'available');assert.equal(run('day().matches.length'),2);assert.equal(run('day().matches[1].lineup.join(",")'),'Avery,Jordan,Sam');
run("teamNext();teamAssign('Avery','GK');teamAssign('Jordan','DF');saveTeamSelection();setInputMode('coach');setInputMode('player')");
assert.equal(run('match().inputMode'),'player');const originalID=run('day().id');run('save()');const draft=c.saved;
const restored=boot(draft);assert.equal(restored.run('day().id'),originalID);assert.equal(restored.run('teamKeeper()'),'Avery');
run('setInputMode("coach");save()');assert.equal(boot(c.saved).run('match().inputMode'),'coach');run('setInputMode("player");save()');
run('demo()');assert.equal(c.saved,draft);assert(run('day().isDemo'));assert(!run('day().team.includes("Test")'));assert(run('match().lineup.some(n=>FREE_DEMO_BOYS.includes(n))'));assert(run('match().lineup.some(n=>FREE_DEMO_GIRLS.includes(n))'));
for(let i=0;i<10;i++){run('demo()');assert.equal(c.saved,draft);assert.equal(run('new Set(data.teams[0].squad).size'),10)}
run('setInputMode("player");returnToFreeDraft()');assert.equal(run('day().id'),originalID);assert.equal(run('match().inputMode'),'player');
run('startFreeSetup()');assert(!el('#app').innerHTML.includes('value="Test United"'));assert(!el('#app').innerHTML.includes('>Avery'));
run("createDay({preventDefault(){},target:{teamName:'Next team',players:['Casey','Taylor'].join(String.fromCharCode(10)),date:'2026-10-21',location:'New field',opponents:'Visitors'}})");
assert.equal(run('day().id'),originalID);assert(el('#modal').innerHTML.includes('Replace your current matchday?'));run('freePendingDay=null;closeModal()');
run('view="report";render()');assert(el('#app').innerHTML.includes('Check permission before adding a photo'));assert(el('#app').innerHTML.includes('image/webp" disabled'));assert(el('#app').innerHTML.includes('not consent itself'));
run("addPhoto({files:[{type:'image/png',size:100}],value:'x'})");assert(!run('day().photo'));assert(el('#toast').textContent.includes('Confirm'));
run('confirmPhotoPermission(true)');assert.equal(run('photoPermissionDay'),originalID);assert.equal(el('#reportphoto').disabled,false);
run('askFinishFreeDay()');assert(el('#modal').innerHTML.includes('Download')||el('#modal').innerHTML.includes('download'));assert.equal(run('day().id'),originalID);
run('confirmFinishFreeDay()');assert.equal(run('data.days.length'),0);assert.equal(run('data.teams[0].squad.length'),0);assert(!c.saved.includes('Avery'));assert.equal(run('view'),'home');
const cleared=boot(c.saved);assert.equal(cleared.run('data.selected'),null);
const legacy=JSON.stringify({clubName:'Old club',teams:[{name:'Old reusable squad',squad:['Unused name']}],selected:'active',days:[{id:'active',team:'Current team',date:'2026-10-20',location:'Field',matches:[{opponent:'Visitors',time:'',lineup:['Casey','Taylor'],events:[],elapsed:0}]},{id:'older',team:'Older team',matches:[{lineup:['Historic player'],events:[]}]}]});
const migrated=boot(legacy);assert.equal(migrated.run('data.days.length'),1);assert.equal(migrated.run('data.legacyDays.length'),1);assert(!migrated.c.saved.includes('Unused name'));assert.equal(migrated.run('data.teams[0].squad.join(",")'),'Casey,Taylor');
console.log('PASS: blank free setup; shared squad across matches; both modes; refresh recovery; isolated mixed-name demo; replacement confirmation; finish clears draft; local legacy preservation; required photo acknowledgement.');
// Exercise actual async photo processing and guard against a late upload crossing days.
(async()=>{
  const p=boot(draft);let encoded=false,closed=false;
  p.c.createImageBitmap=async()=>({width:2400,height:1200,close(){closed=true}});
  p.c.document.createElement=()=>({width:0,height:0,getContext:()=>({drawImage(){}}),toDataURL(type,quality){assert.equal(type,'image/jpeg');assert.equal(quality,.75);encoded=true;return 'data:image/jpeg;base64,SAFE_PIXELS'}});
  p.run('confirmPhotoPermission(true)');await p.run("addPhoto({files:[{type:'image/png',size:100}],value:'test'})");
  assert(encoded&&closed);assert(p.run('day().photoAcknowledgement.confirmedAt'));assert.equal(p.run('day().photo'),'data:image/jpeg;base64,SAFE_PIXELS');
  let resolveImage;p.c.createImageBitmap=()=>new Promise(resolve=>{resolveImage=resolve});p.run('confirmPhotoPermission(true)');const pending=p.run("addPhoto({files:[{type:'image/png',size:100}],value:'test'})");p.run('data=fresh()');resolveImage({width:100,height:100,close(){}});await pending;assert.equal(p.run('data.days.length'),0);
  console.log('PASS: acknowledged photos re-encoded to JPEG; confirmation recorded; late photo cannot attach after matchday changes.');
})().catch(e=>{console.error(e);process.exitCode=1});
