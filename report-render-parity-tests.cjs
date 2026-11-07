const fs=require('fs'),assert=require('assert'),cp=require('child_process');
const source=fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot';
const baseline='483e6b7e454b2cae84caf67a97186636fa0ac5c4',cache=new Map();
const oldFS={...fs,readFileSync(file,encoding){if(/^(index\.html|[\w-]+\.js)$/.test(file)){if(!cache.has(file))cache.set(file,cp.execFileSync('git',['show',baseline+':'+file],{encoding:'utf8'}));return cache.get(file)}return fs.readFileSync(file,encoding)}};
const boot=Function('require',source)(require),oldBoot=Function('require',source)(name=>name==='fs'?oldFS:require(name));
const seed=boot();seed.run('demo();freeDemoActive=false;freeRealDraft=null;dayFinishMatch(0);startDayFlow();confirmDayReview();chooseDayPlayer(day().squad[0]);setDayAwardReason("Great encouragement");save()');
const current=boot(seed.c.saved),previous=oldBoot(seed.c.saved);let checks=0;
for(const award of ['selected','none'])for(const stage of ['review','award','content','output'])for(const mode of ['summary','timeline','players']){
 for(const f of [current,previous])f.run(`day().playerOfDay=${award==='none'?"''":'day().squad[0]'};dayFlow().stage='${stage}';dayFlow().reportView='${mode}';dayFlow().output='summary';view='report';render()`);
 assert.equal(current.el('#app').innerHTML,previous.el('#app').innerHTML,award+' '+stage+' '+mode);checks++;
}
for(const name of ['matchday-highlights.mp4','match-highlights.webm','match-report.png']){
 for(const f of [current,previous]){f.c.URL={createObjectURL:()=> 'blob:fixture',revokeObjectURL(){}};f.c.blob={type:name.endsWith('png')?'image/png':'video/mp4',size:2097152};f.c.filename=name;f.run('showPrepared(blob,filename)')}
 assert.equal(current.el('#modal').innerHTML,previous.el('#modal').innerHTML,name);checks++;
}
console.log(`PASS: ${checks} exact baseline report-screen and prepared-file markup comparisons against ${baseline.slice(0,7)}, including award reason, no-award navigation and all report views.`);
