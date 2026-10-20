const fs=require('fs'),vm=require('vm'),assert=require('assert');
function boot(saved){const els=new Map();function el(s){if(!els.has(s))els.set(s,{innerHTML:'',textContent:'',classList:{add(){},remove(){}},setAttribute(){}});return els.get(s)}class FormData{constructor(t){this.fields=t}get(k){return this.fields[k]??null}}
const c={window:{addEventListener(){}},document:{querySelector:el,addEventListener(){}},localStorage:{getItem(){return saved},setItem(k,v){c.saved=v}},setTimeout(){},clearTimeout(){},setInterval(){},Date,FormData,atob,TextDecoder,crypto:require('crypto').webcrypto,location:{hash:'',pathname:'/',search:''},history:{replaceState(){}}};vm.createContext(c);const html=fs.readFileSync('index.html','utf8');vm.runInContext(fs.readFileSync('timing.js','utf8'),c);vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1],c);for(const file of [...html.matchAll(/<script src="([^"?]+)(?:\?[^\"]*)?"/g)].map(m=>m[1]).filter(x=>x!=='timing.js'))vm.runInContext(fs.readFileSync(file,'utf8'),c,{filename:file});return {c,el,run:s=>vm.runInContext(s,c)}}

const {c,el,run}=boot();run('demo()');
const fixtures=[
 {id:'own-goal',action:'Goal',player:'A',at:60000,assist:{player:'B',point:{x:.2,y:.3}},point:{x:.5,y:.1}},
 {id:'opp-goal',action:'Goal',player:'Opposition',opp:true,at:120000},
 {id:'good-save',action:'Shot',opp:true,at:180000,qualityRank:2,save:{player:'Keeper',qualityLabel:'Good save',qualityRank:0}},
 {id:'great-save',action:'Shot',opp:true,at:240000,save:{player:'Keeper',qualityLabel:'Great save',qualityRank:1}},
 {id:'top-shot',action:'Shot',at:300000,qualityRank:2},
 {id:'great-shot',action:'Shot',at:360000,qualityRank:1},
 {id:'missed-shot',action:'Shot',at:420000,qualityRank:0,outcome:'Off target'},
 {id:'top-pass',action:'Pass',at:480000,qualityRank:2},
 {id:'pass',action:'Pass',at:540000,qualityRank:0},
 {id:'top-block',action:'Block',at:600000,qualityRank:2},
 {id:'defence',action:'Tackle',at:660000,qualityRank:0},
 {id:'skill',action:'Skill',at:720000,qualityLabel:'Beat a player'},
 {id:'teamwork',action:'Teamwork',at:780000,qualityLabel:'Supporting run'},
 {id:'values',action:'Team Values',at:840000,qualityLabel:'Applied coaching'},
 {id:'corner',action:'Set piece',at:900000,setPiece:{type:'Corner'}},
 {id:'sub',action:'Substitution',at:960000},
 {id:'legacy-save',action:'Great Save',at:1020000},
 {id:'opponent-shot',action:'Shot',opp:true,at:1080000,qualityRank:2}
];c.fixtures=fixtures;const ids=filter=>Array.from(run('highlightPresetEvents(fixtures,'+JSON.stringify(filter)+').map(e=>e.id)'));
assert.deepEqual(ids('goals'),['own-goal','opp-goal']);
assert.deepEqual(ids('goals-saves'),['own-goal','opp-goal','good-save','great-save','legacy-save']);
assert.deepEqual(ids('major'),['own-goal','opp-goal','great-save','top-shot','top-pass','top-block','legacy-save']);
assert.deepEqual(ids('key'),fixtures.filter(e=>!['missed-shot','corner','sub','opponent-shot'].includes(e.id)).map(e=>e.id));
assert.equal(ids('all').length,fixtures.length);assert.equal(run('highlightQualityRank({action:"Pass",qualityLabel:"World-class pass"})'),2);
run('exportVideo()');assert.equal(run('dayFlow().stage'),'review');assert(!run('highlightDraft'));assert(!el('#modal').innerHTML.includes('type="checkbox"'));
run('largeEvents=Array.from({length:321},(_,i)=>({id:String(i),action:"Pass",at:i*1000,qualityRank:0}))');assert.equal(run('highlightPresetEvents(largeEvents,"all").length'),321);assert.equal(run('highlightPresetEvents(largeEvents,"major").length'),0);
assert.equal(run('replayHalfForGoal(fixtures[0])'),'north');run('fixtures[0].assist.point.y=.7');assert.equal(run('replayHalfForGoal(fixtures[0])'),null);assert.equal(run('replayHalfForGoal(fixtures[1])'),null);
run('view="live";match().ended=false;match().running=false;match().clockStarted=true;selectClock("full")');assert.equal(run('view'),'live');assert(el('#app').innerHTML.includes('Next match'));assert(!el('#modal').innerHTML.includes('Player of the Day'));
console.log('PASS: exact presets; save-first linked events; legacy qualities; 321-event All keeps every event; attacking-half detection; full time ends one game without an award or final report.');
