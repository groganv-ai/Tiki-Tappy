const fs=require('fs'),assert=require('assert'),cp=require('child_process');
const harness=fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot';
const currentBoot=Function('require',harness)(require);
const baseFiles=new Map();
const base='fe3dc2e83c4e8becf461100c3a9aee119827e5f1';
const baseFs={readFileSync(file){if(!baseFiles.has(file))baseFiles.set(file,cp.execFileSync('git',['show',base+':'+file],{encoding:'utf8'}));return baseFiles.get(file)}};
const baseBoot=Function('require',harness)(name=>name==='fs'?baseFs:require(name));
const seed=currentBoot();seed.run('demo();freeDemoActive=false;freeRealDraft=null;save()');
for(const mode of ['coach','player'])for(const state of ['ready','paused','running','half','second','full']){
 const a=currentBoot(seed.c.saved),b=baseBoot(seed.c.saved);
 const script=`view='live';match().inputMode='${mode}';match().elapsed=120000;match().running=false;match().clockStarted=true;match().period=1;match().ended=false;match().halfTime=false;`+
 ({ready:'match().events=[];match().elapsed=0;match().clockStarted=false;',running:'match().running=true;match().started=Date.now();',half:'match().halfTime=true;',second:'match().period=2;match().firstHalfElapsed=900000;',full:'match().ended=true;'}[state]||'')+'compactNames=false;render()';
 a.run(script);b.run(script);
 const opponent=a.run('esc(match().opponent)');
 const normalize=s=>s.replace(/>Opposition</g,'>'+opponent+'<').replace(/aria-label="Opposition: /g,'aria-label="'+opponent+': ').replace(/<div class="clock" id="clock">[^<]*<\/div>/g,'<clock>');
 assert.equal(normalize(a.el('#app').innerHTML),normalize(b.el('#app').innerHTML),mode+' '+state);
}
console.log('PASS: 12 Match Centre structural comparisons; live clock excluded and requested name/team-label changes normalized.');
