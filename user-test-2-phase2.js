// User Test 2 — Phase 2: consistent quality and three report/video presets.
// Keep event action/category unchanged so existing reports and stored matches remain readable.
const TT_PHASE2_LEVELS=['Good','Great','Amazing','Worldie'];
for(const action of ['Goal','Shot','Pass','Tackle','Block','Clearance','Save','Skill','Teamwork','Team Values']){
 V2_QUALITY[action]=TT_PHASE2_LEVELS.map(level=>level+' '+(action==='Team Values'?'contribution':action.toLowerCase()));
}
const ttOldQualityHTML=v2QualityHTML;
const TT_QUALITY_ICONS=[
 '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16 9"/>',
 '<path d="m12 2 3.1 6.3 7 .9-5.1 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-5 7-.9z"/>',
 '<path d="m12 2 3.1 6.3 7 .9-5.1 5 1.2 7-6.2-3.3-6.2 3.3 1.2-7-5.1-5 7-.9z"/>',
 '<path d="M7 3h10v7a5 5 0 0 1-10 0V3z"/><path d="M7 5H4v3a4 4 0 0 0 4 4M17 5h3v3a4 4 0 0 1-4 4M12 15v4m-4 2h8m-8-2h8"/>'
];
v2QualityHTML=function(action){
 if(!captureV2)return '';
 return '<section class="v2-quality"><h3>Quality</h3><div class="tt-quality-four">'+TT_PHASE2_LEVELS.map((level,i)=>'<button type="button" class="tt-quality-level tt-quality-level-'+i+' '+(captureV2.quality===i?'selected':'')+'" aria-pressed="'+(captureV2.quality===i)+'" onclick="captureV2.quality='+i+';drawV2Capture()"><svg class="tt-quality-icon" viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+TT_QUALITY_ICONS[i]+'</svg><span>'+level+'</span></button>').join('')+'</div><p class="tt-quality-help">Default: Good. Tap a higher quality only when the action deserves it.</p></section>';
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

// Keep opposition immediately above the formation and quality beneath it.
const ttPhase2OriginalDraw=drawV2Capture;
drawV2Capture=function(){
 ttPhase2OriginalDraw();
 const f=captureV2;
 if(!f||!['player','keeper'].includes(f.stage)||f.known)return;
 const sheet=document.querySelector('#modal .v2-capture');
 const picker=sheet?.querySelector('.team-player-picker');
 const quality=sheet?.querySelector('.v2-quality');
 if(picker&&quality)picker.insertAdjacentElement('afterend',quality);
};
