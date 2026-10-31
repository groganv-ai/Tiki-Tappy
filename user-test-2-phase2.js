// User Test 2 — Phase 2: consistent quality and three report/video presets.
// Keep event action/category unchanged so existing reports and stored matches remain readable.
const TT_PHASE2_LEVELS=['Good','Great','Amazing','Worldie'];
for(const action of ['Goal','Shot','Pass','Tackle','Block','Clearance','Save','Skill','Teamwork','Team Values']){
 V2_QUALITY[action]=TT_PHASE2_LEVELS.map(level=>level+' '+(action==='Team Values'?'contribution':action.toLowerCase()));
}
const ttOldQualityHTML=v2QualityHTML;
v2QualityHTML=function(action){
 if(!captureV2)return '';
 return '<section class="v2-quality"><h3>Quality</h3><div class="tt-quality-four">'+TT_PHASE2_LEVELS.map((level,i)=>'<button type="button" class="'+(captureV2.quality===i?'selected':'')+'" aria-pressed="'+(captureV2.quality===i)+'" onclick="captureV2.quality='+i+';drawV2Capture()">'+level+'</button>').join('')+'</div></section>';
};
// Existing highlight selections are still supported when loading older saved matchdays.
HIGHLIGHT_FILTERS.splice(0,HIGHLIGHT_FILTERS.length,
 {id:'goals',label:'Essential',description:'Goals from both teams, including linked assists and replays.'},
 {id:'major',label:'Highlights',description:'Goals, saves, key chances and standout player actions.'},
 {id:'all',label:'Full',description:'Every recorded event, including set pieces and substitutions.'}
);
const ttOldHighlightPresetEvents=highlightPresetEvents;
highlightPresetEvents=function(events,filter){
 if(filter!=='major')return ttOldHighlightPresetEvents(events,filter);
 return events.filter(e=>{
  const category=v2Category(e);
  if(category==='Goal')return true;
  if(e.opp&&category==='Shot'&&e.save)return true;
  if(e.opp)return false;
  const rank=highlightQualityRank(e,category);
  if(category==='Save')return true;
  if(category==='Shot')return rank>=1;
  return ['Pass','Tackle','Block','Clearance','Skill','Teamwork','Team Values'].includes(category)&&rank>=2;
 });
};
const ttPreviousHighlightRank=highlightQualityRank;
highlightQualityRank=function(e,category=v2Category(e)){
 const label=String(e?.qualityLabel||e?.quality||'').toLowerCase();
 const found=TT_PHASE2_LEVELS.findIndex(level=>label.startsWith(level.toLowerCase()+' '));
 if(found>=0)return found;
 // Legacy three-tier events are treated as Great / Amazing / Worldie.
 if(Number.isFinite(e?.qualityRank))return Math.min(3,e.qualityRank+1);
 return ttPreviousHighlightRank(e,category);
};
