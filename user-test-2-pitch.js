// User Test 2: age-group pitch presets. Loaded after existing matchday modules.
// These settings belong to the matchday, not to an individual event.
const TT_AGE_GROUPS=Object.freeze(Array.from({length:12},(_,i)=>i+6));
function ttCurrentAge(){return day()?.ageGroup||14}
function ttAgeOptions(selected){return TT_AGE_GROUPS.map(n=>'<option value="'+n+'" '+(n===Number(selected)?'selected':'')+'>Under '+n+'</option>').join('')}
function ttAgeField(selected){
 return '<div class="field tt-age-field"><label for="tt-age">Age group · FAW Wales</label><select id="tt-age" name="ageGroup">'+ttAgeOptions(selected)+'</select><small class="hint">Select the team age group to use age-appropriate pitch markings. Smaller-sided formats may be used where permitted.</small></div>';
}
const ttBeforeSetup=renderSetup;
renderSetup=function(){
 ttBeforeSetup();
 const form=document.querySelector('#app form');
 if(form&&!form.querySelector('[name="ageGroup"]')){
  const players=form.querySelector('[name="players"]')?.closest('.field');
  if(players)players.insertAdjacentHTML('afterend',ttAgeField(ttCurrentAge()));
 }
};
const ttBeforeCreateDay=createDay;
createDay=function(e){
 const age=Number(new FormData(e.target).get('ageGroup'));
 ttBeforeCreateDay(e);
 if(freePendingDay&&TT_AGE_GROUPS.includes(age))freePendingDay.ageGroup=age;
};
const ttBeforeConfirmDay=confirmFreeDay;
confirmFreeDay=function(){
 const selectedAge=freePendingDay?.ageGroup;
 ttBeforeConfirmDay();
 if(day()&&TT_AGE_GROUPS.includes(Number(selectedAge))){day().ageGroup=Number(selectedAge);save()}
};
function ttPitchDimensions(){
 const t=ttPitchTemplate(ttCurrentAge());
 return {...t,age:ttCurrentAge()};
}
function ttAgePitchSVG(showAttack=true){
 const t=ttPitchDimensions();
 const length=t.lengthYards||100,width=t.widthYards||64;
 const x=18,y=18,w=324,h=524;
 const area=t.markings==='small-sided'?(t.format==='4v4'?null:{depth:7,width:12}):
  t.markings==='junior-7v7'?{depth:10,width:15}:
  t.markings==='junior-9v9'?{depth:12,width:28}:
  {depth:18,width:44};
 const rect=(ax,ay,aw,ah)=>'<rect x="'+ax.toFixed(2)+'" y="'+ay.toFixed(2)+'" width="'+aw.toFixed(2)+'" height="'+ah.toFixed(2)+'"/>';
 let markings=rect(x,y,w,h)+'<path d="M18 280H342"/><circle cx="180" cy="280" r="'+(t.format==='4v4'?20:35)+'"/><circle cx="180" cy="280" r="2" fill="#e3f0cf"/>';
 if(area){
  const aw=Math.min(w*.88,w*area.width/width),ah=Math.min(h*.35,h*area.depth/length),ax=180-aw/2;
  markings+=rect(ax,y,aw,ah)+rect(ax,y+h-ah,aw,ah);
  if(t.format==='9v9'||t.format==='11v11'){
   markings+='<circle cx="180" cy="'+(y+Math.min(h*.25,ah+25))+'" r="2" fill="#e3f0cf"/>';
   markings+='<circle cx="180" cy="'+(y+h-Math.min(h*.25,ah+25))+'" r="2" fill="#e3f0cf"/>';
  }
 }
 const arrow=showAttack?'<path d="M320 340v-70l-7 12m7-12 7 12" fill="none" stroke="#d6ee83" stroke-width="3"/>':'';
 return '<svg viewBox="0 0 360 560" aria-hidden="true"><rect width="360" height="560" fill="#326749"/><g fill="none" stroke="#e3f0cf" stroke-width="1.7">'+markings+'</g>'+arrow+'</svg>';
}
const ttBeforePitchSVG=entryPitchSVG;
entryPitchSVG=function(showAttack=true){return day()?.ageGroup?ttAgePitchSVG(showAttack):ttBeforePitchSVG(showAttack)};
