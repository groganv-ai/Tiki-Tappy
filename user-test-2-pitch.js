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
  const anchor=form.querySelector('[name="players"]')?.closest('.field') || form.querySelector('[name="location"]')?.closest('.field');
  if(anchor)anchor.insertAdjacentHTML('afterend',ttAgeField(ttCurrentAge()));
  else form.insertAdjacentHTML('afterbegin',ttAgeField(ttCurrentAge()));
 }
};
let ttPendingAge=null;
const ttBeforeCreateDay=createDay;
createDay=function(e){
 const age=Number(new FormData(e.target).get('ageGroup'));
 ttPendingAge=TT_AGE_GROUPS.includes(age)?age:null;
 ttBeforeCreateDay(e);
 if(freePendingDay&&ttPendingAge)freePendingDay.ageGroup=ttPendingAge;
 if(day()&&ttPendingAge&&day().ageGroup!==ttPendingAge){day().ageGroup=ttPendingAge;save();}
};
const ttBeforeConfirmDay=confirmFreeDay;
confirmFreeDay=function(){
 const selectedAge=freePendingDay?.ageGroup??ttPendingAge;
 ttBeforeConfirmDay();
 if(day()&&TT_AGE_GROUPS.includes(Number(selectedAge))){day().ageGroup=Number(selectedAge);save()}
 ttPendingAge=null;
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
 const goalWidth=Math.min(76,Math.max(46,w*(t.format==='11v11'?8/width:6/width)));
 const goalX=180-goalWidth/2;
 const goals='<path d="M'+goalX.toFixed(1)+' 18V7H'+(goalX+goalWidth).toFixed(1)+'V18 M'+goalX.toFixed(1)+' 542V553H'+(goalX+goalWidth).toFixed(1)+'V542" fill="none" stroke="#e3f0cf" stroke-width="3"/>';
 const arrow=showAttack?'<path d="M180 354V246 M125 288L180 228L235 288" fill="none" stroke="#d6ee83" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity=".72"/>':'';
 return '<svg viewBox="0 0 360 560" aria-hidden="true"><rect width="360" height="560" fill="#326749"/>'+arrow+'<g fill="none" stroke="#e3f0cf" stroke-width="2.4">'+markings+'</g>'+goals+'</svg>';
}
// Compact, age-appropriate hit zones replace the 11v11 six-/18-yard labels.
const ttBeforeZones=v2Zones;
v2Zones=function(){
 const t=ttPitchDimensions();
 if(t.format==='11v11')return ttBeforeZones();
 const result=[],add=(x,y,w,h,label,text)=>result.push({x,y,w,h,label,text,id:'v2-'+result.length});
 const length=t.lengthYards,width=t.widthYards;
 const area=t.format==='4v4'?null:t.format==='5v5'?{depth:7,width:12}:t.format==='7v7'?{depth:10,width:15}:{depth:12,width:28};
 const half=280,margin=18,innerWidth=324,innerHeight=524;
 for(const south of [false,true]){
  const team=south?'Defensive':'Attacking',transform=(y,h)=>south?560-y-h:y;
  const depth=area?Math.min(130,innerHeight*area.depth/length):0;
  const boxWidth=area?Math.min(280,innerWidth*area.width/width):0;
  const bx=180-boxWidth/2;
  if(area){
   for(let i=0;i<3;i++)add(bx+i*boxWidth/3,transform(18,depth),boxWidth/3,depth,team+' goal area, '+['left','centre','right'][i],['GL','GC','GR'][i]);
   add(margin,transform(18,depth),bx-margin,depth,team+' left wing','LW');
   add(bx+boxWidth,transform(18,depth),342-bx-boxWidth,depth,team+' right wing','RW');
  }
  const start=18+depth,remaining=half-start;
  for(let i=0;i<3;i++)add(margin+i*innerWidth/3,transform(start,remaining),innerWidth/3,remaining,team+' '+['left','centre','right'][i]+' field', ['Left','Centre','Right'][i]);
 }
 return result;
};
const ttBeforePitchSVG=entryPitchSVG;
entryPitchSVG=function(showAttack=true){return day()?.ageGroup?ttAgePitchSVG(showAttack):ttBeforePitchSVG(showAttack)};

// All action flows share the same on-pitch formation selector, with a list fallback.
let ttUsePlayerList=false;
function ttTogglePlayerList(){ttUsePlayerList=!ttUsePlayerList;if(captureV2)drawV2Capture();else if(typeof spValid==='function'&&spValid())spDrawFlow();else render()}
const ttExistingTeamChoices=teamChoiceSections;
teamChoiceSections=function(handler,exclude='',m=match()){
 const formation=teamState(m);
 if(!formation||ttUsePlayerList){
  const names=teamPlayers(m).filter(n=>n!==exclude);
  return '<div class="tt-player-list">'+names.map(n=>'<button data-player="'+esc(n)+'" onclick="'+handler+'(this.dataset.player)">'+teamName(n,m)+'</button>').join('')+'</div><button type="button" class="tt-picker-toggle" onclick="ttTogglePlayerList()">Show formation</button>';
 }
 return teamFormationChoices(handler,exclude,m)+'<button type="button" class="tt-picker-toggle" onclick="ttTogglePlayerList()">Show player list</button>';
};
// Make corner locations selectable in the pitch picker, including assist locations.
const ttZonesWithoutCorners=v2Zones;
v2Zones=function(){
 const zones=ttZonesWithoutCorners();
 const size=31;
 for(const south of [false,true]){
  const y=south?542-size:18,side=south?'Defensive':'Attacking';
  zones.push({x:18,y,w:size,h:size,label:side+' left corner',text:'◜',id:'v2-corner-'+(south?'s':'n')+'-l'});
  zones.push({x:342-size,y,w:size,h:size,label:side+' right corner',text:'◝',id:'v2-corner-'+(south?'s':'n')+'-r'});
 }
 return zones;
};

// Refresh the setup screen if the page was opened directly on it.
if(view==='setup')render();
