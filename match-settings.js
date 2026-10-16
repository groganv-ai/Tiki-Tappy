function matchLengthChoices(value){return [10,12,15,16,20,24,25,30,40,50,60,70,80,90].map(n=>`<option value="${n}" ${n===value?'selected':''}>${n} minutes</option>`).join('')}
function timingTip(length,halves){return halves?`${length} minutes = two ${length/2}-minute halves. Added time stays with its half.`:`${length} minutes = one continuous period, plus added time. No half-time break.`}
function timingField(lengthName,halvesName,length,halves=true,locked=false,label='Match length'){
  return `<div class="field match-timing-field"><label>${label}</label><select name="${lengthName}" onchange="updateTimingTip(this)" ${locked?'disabled':''}>${matchLengthChoices(length)}</select><div class="halves-row"><label class="halves-toggle"><input type="checkbox" role="switch" name="${halvesName}" ${halves?'checked':''} ${locked?'disabled':''} onchange="updateTimingTip(this)"><span class="switch-track" aria-hidden="true"></span>Two halves</label><details class="timing-tooltip"><summary aria-label="Show match timing explanation">ⓘ</summary><p role="tooltip">${timingTip(length,halves)}</p></details></div>${locked?'<span class="hint">Reset the match to change its timing.</span>':''}</div>`;
}
function updateTimingTip(input){const field=input.closest('.match-timing-field'),length=Number(field.querySelector('select').value),halves=field.querySelector('input[type="checkbox"]').checked;field.querySelector('.timing-tooltip p').textContent=timingTip(length,halves)}
const setupBeforeTiming=renderSetup;
renderSetup=function(){
  setupBeforeTiming();let html=$('#app').innerHTML;
  html=html.replace('<h2>Create a new matchday</h2>',`<h2>Create a new matchday</h2>${timingField('durationMinutes','twoHalves',30)}`);
  if(day())day().matches.forEach((m,i)=>{
    const locked=clockHasStarted(m)||m.events.length>0;
    const field=`<div class="match-length-edit">${timingField('length'+i,'halves'+i,durationFor(m),usesHalves(m),locked,`Match ${i+1} length`)}</div>`;
    html=html.replace(new RegExp(`(<input name="time${i}"[^>]*>)`),'$1'+field);
  });$('#app').innerHTML=html;
};
const createBeforeTiming=createDay;
createDay=function(e){
  const f=new FormData(e.target),length=Number(f.get('durationMinutes'))||30,halves=f.get('twoHalves')!==null,old=day()?.id;
  createBeforeTiming(e);if(day()?.id===old)return;
  day().durationMinutes=length;day().twoHalves=halves;day().matches.forEach(m=>{m.durationMinutes=length;m.twoHalves=halves;m.period=1;m.firstHalfElapsed=0});save();render();
};
const updateBeforeTiming=updateDay;
updateDay=function(e){
  const f=new FormData(e.target);updateBeforeTiming(e);
  day().matches.forEach((m,i)=>{const n=Number(f.get('length'+i));if(!clockHasStarted(m)&&!m.events.length&&n>=2&&n<=180){m.durationMinutes=n;m.twoHalves=f.get('halves'+i)!==null}});save();render();
};
render();
