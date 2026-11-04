// Precise points are relative to the approved template's PLAYING rectangle.
// No opposition flip: its SVG already points towards the bottom goal.
const TEMPLATE_POINT_SPACE='tikitapper-template-v2';
let pitchPick=null;
function pitchPresetFor(age,format){return PITCH_TEMPLATES.find(p=>p.ages.includes(age)&&p.format===format)||(age==='U13'&&format==='11v11'?PITCH_TEMPLATES.find(p=>p.id==='full-size'):null)}
function matchdayPitchSettings(age,format){return {pitchAgeGroup:age,pitchTemplate:templateGeometry(pitchPresetFor(age,format))}}
function matchdayPitchLocked(d){return d.matches.some(m=>(m.pitchTemplate&&(clockHasStarted(m)||m.events.length))||m.events.some(e=>isTemplatePoint(e.point)||isTemplatePoint(e.assist?.point)||isTemplatePoint(e.setPiece?.point)))}
function pitchFormatOptions(age,selected=''){
 const base=PITCH_TEMPLATES.find(t=>t.ages.includes(age));
 const formats=base?[...new Set([base.format,...(age==='U13'?['11v11']:[])])]:[];
 return !base?'<option value="">Choose age first</option>':formats.map(f=>`<option value="${f}" ${selected===f?'selected':''}>${f}</option>`).join('');
}
function pitchSetupSummary(age,format){const p=pitchPresetFor(age,format);return p?`${age} · ${format} · ${Number(p.length.toFixed(2))} × ${Number(p.width.toFixed(2))} m${p.id==='full-size'?' · illustrative full-size pitch; enlarged selection boxes':''}`:'Choose the age group and actual playing format.'}
function pitchMatchdayFields(prefix,d=null,locked=false){
 const age=d?.pitchAgeGroup||'',format=d?.pitchTemplate?.format||'',disabled=locked?'disabled':'';
 return `<section class="matchday-pitch-settings"><h3>Pitch for today’s matches</h3><div class="precise-pitch-fields"><label for="${prefix}Age">Age group</label><select id="${prefix}Age" name="pitchAgeGroup" required ${disabled} onchange="changeMatchdayPitch(this,'${prefix}')"><option value="">Choose age group</option>${PITCH_TEMPLATES.flatMap(p=>p.ages).map(a=>`<option value="${a}" ${a===age?'selected':''}>${a.startsWith('U')?'Under '+a.slice(1):a}</option>`).join('')}</select><label for="${prefix}Format">Playing format</label><select id="${prefix}Format" name="pitchFormat" required ${disabled} onchange="refreshMatchdayPitch('${prefix}')">${pitchFormatOptions(age,format)}</select></div><p class="hint" role="status" id="${prefix}Summary">${esc(pitchSetupSummary(age,format))}</p>${locked?'<p class="hint">Pitch settings are locked for recorded matches.</p>':''}</section>`;
}
function changeMatchdayPitch(select,prefix){$('#'+prefix+'Format').innerHTML=pitchFormatOptions(select.value);refreshMatchdayPitch(prefix)}
function refreshMatchdayPitch(prefix){$('#'+prefix+'Summary').textContent=pitchSetupSummary($('#'+prefix+'Age').value,$('#'+prefix+'Format').value)}
function templateGeometry(p){return {id:p.id,version:p.version,coordinateSpace:TEMPLATE_POINT_SPACE,format:p.format,length:p.length,width:p.width,rect:{...p.rect},viewBox:{...p.viewBox},drawing:JSON.parse(JSON.stringify(p.drawing)),displayProjection:p.displayProjection||'regulation-scale',penaltySpot:p.penaltySpot||null}}
function pitchCaptureContext(){
 if(typeof spFlow!=='undefined'&&spFlow&&['origin','shot-location','assist-location'].includes(spFlow.stage))return {owner:spFlow,stage:spFlow.stage,opp:!!spFlow.draft.opp};
 if(typeof captureV2!=='undefined'&&captureV2&&['location','assist-location'].includes(captureV2.stage))return {owner:captureV2,stage:captureV2.stage,opp:!!captureV2.event.opp};
 return null;
}
function ensurePitchPick(){
 const c=pitchCaptureContext();if(!c)return null;
 if(!pitchPick||pitchPick.owner!==c.owner||pitchPick.stage!==c.stage){
  const anchor=c.owner.event?.point||c.owner.outcome?.point||c.owner.draft?.point;
  const g=isTemplatePoint(anchor)?anchor.geometry:match().pitchTemplate,base=PITCH_TEMPLATES.find(p=>p.id===g?.id);
  const preset=base&&g?{...base,...g,rotations:base.rotations}:null;
  pitchPick={...c,age:match().pitchAgeGroup||'',preset,point:null,locked:isTemplatePoint(anchor)};
 }
 return pitchPick;
}
function redrawPitchCapture(){
 const scroll=$('#modal .sheet')?.scrollTop||0;
 if(typeof spFlow!=='undefined'&&spFlow&&pitchCaptureContext()?.owner===spFlow)spDrawFlow();else drawV2Capture();
 const sheet=$('#modal .sheet');if(sheet)sheet.scrollTop=scroll;
}
function templateVariant(p,rotation=pitchInputRotation){return p.rotations[((rotation%4)+4)%4]}
function templatePointFromDisplay(sx,sy,p,angle){
 const a=angle*Math.PI/180,dx=sx-360,dy=sy-540;
 const x=(360+dx*Math.cos(a)+dy*Math.sin(a)-p.rect.x)/p.rect.width,y=(540-dx*Math.sin(a)+dy*Math.cos(a)-p.rect.y)/p.rect.height;
 if(x< -1e-9||x>1+1e-9||y< -1e-9||y>1+1e-9)return null;
 return {x:Math.max(0,Math.min(1,x)),y:Math.max(0,Math.min(1,y))};
}
function templatePointToDisplay(point,p,angle){
 const a=angle*Math.PI/180,dx=p.rect.x+point.x*p.rect.width-360,dy=p.rect.y+point.y*p.rect.height-540;
 return {x:360+dx*Math.cos(a)-dy*Math.sin(a),y:540+dx*Math.sin(a)+dy*Math.cos(a)};
}
function pitchPointerPoint(event,image){
 // This is a click handler, not pointerdown. Accessibility-generated clicks
 // may report isPrimary=false; the button check still excludes right clicks.
 if(event.button>0)return;
 const p=ensurePitchPick();if(!p?.preset)return;
 const b=image.getBoundingClientRect(),v=templateVariant(p.preset);if(!b.width||!b.height)return;
 const point=templatePointFromDisplay(v.viewBox.x+(event.clientX-b.left)/b.width*v.viewBox.width,v.viewBox.y+(event.clientY-b.top)/b.height*v.viewBox.height,p.preset,v.angle);
 if(!point){$('#pitchPointStatus').textContent='Choose a point inside the touchlines.';return}
 p.point=point;redrawPitchCapture();
}
function pitchKeyboardPoint(event){
 const d={ArrowLeft:[-.01,0],ArrowRight:[.01,0],ArrowUp:[0,-.01],ArrowDown:[0,.01]}[event.key];if(!d)return;
 event.preventDefault();const p=ensurePitchPick();if(!p?.preset)return;
 const v=templateVariant(p.preset),point=templatePointToDisplay(p.point||{x:.5,y:.5},p.preset,v.angle);
 const step=Math.min(p.preset.rect.width,p.preset.rect.height)*(event.shiftKey?.05:.01);
 p.point=templatePointFromDisplay(point.x+d[0]*100*step,point.y+d[1]*100*step,p.preset,v.angle)||p.point||{x:.5,y:.5};redrawPitchCapture();$('#precisePitchBoard')?.focus?.();
}
function precisePitchHTML(){
 const p=ensurePitchPick();if(!p)return '';
 const v=p.preset&&templateVariant(p.preset),point=v&&p.point?templatePointToDisplay(p.point,p.preset,v.angle):null;
 const marker=point?`<span class="precise-pitch-marker" style="left:${(point.x-v.viewBox.x)/v.viewBox.width*100}%;top:${(point.y-v.viewBox.y)/v.viewBox.height*100}%" aria-hidden="true"></span>`:'';
 return `<div class="v2-pitch-label"><span>${p.opp?'OPPOSITION':'OUR'} ATTACK · INPUT VIEW</span><button type="button" onclick="rotateInputPitch()" aria-label="Rotate pitch">Rotate ${pitchInputDirection()}</button></div>${v?`<div id="precisePitchBoard" class="precise-pitch-board" tabindex="0" role="group" aria-label="Select pitch location. Tap or use arrow keys, then confirm." onkeydown="pitchKeyboardPoint(event)" onclick="pitchPointerPoint(event,this.querySelector('img'))"><img src="${p.opp?v.oppositionImage:v.image}" alt="${p.opp?'Opposition':'Our team'} ${p.preset.format} pitch, rotated ${v.angle} degrees" draggable="false">${marker}</div><p class="precise-pitch-help">${esc(p.age||p.preset.ages.join(' / '))} · ${p.preset.format} · ${Number(p.preset.length.toFixed(2))} × ${Number(p.preset.width.toFixed(2))} m${p.preset.id==='full-size'?' · enlarged selection boxes':''}<br>Tap inside the pitch. Tap again to adjust, or use arrow keys. Pitch configured in Matchday setup.</p>`:'<p class="precise-pitch-help">Set the age group and playing format in Matchday setup before choosing a location.</p>'}<p id="pitchPointStatus" class="precise-pitch-status" role="status">${p.point?'Location selected. Adjust it or confirm below.':'No location selected.'}</p><div class="precise-pitch-actions"><button type="button" class="primary" onclick="confirmPrecisePitchPoint()" ${!p.point?'disabled':''}>Confirm location</button><button type="button" onclick="confirmPrecisePitchPoint(true)">Location unknown</button></div>`;
}
function confirmPrecisePitchPoint(unknown=false){
 const p=ensurePitchPick(),c=pitchCaptureContext();if(!p||!c||p.owner!==c.owner||!recordingContextValid(match())||(!unknown&&!p.point))return;
 const geometry=!unknown&&p.preset?templateGeometry(p.preset):null;
 const location={zone:null,point:geometry?{...p.point,coordinateSpace:TEMPLATE_POINT_SPACE,geometry}:null,locationLabel:geometry?'Precise pitch location':'Location unknown'};
 if(geometry){match().pitchTemplate=geometry;match().pitchAgeGroup=p.age;save()}
 pitchPick=null;
 if(typeof spFlow!=='undefined'&&c.owner===spFlow)return spChoosePrecisePoint(location);
 return v2ChoosePrecisePoint(location);
}
function isTemplatePoint(p){return p?.coordinateSpace===TEMPLATE_POINT_SPACE&&p.geometry?.coordinateSpace===TEMPLATE_POINT_SPACE&&Number.isFinite(p.x)&&Number.isFinite(p.y)}
function templateSetPiecePoint(d,recordId,previousPoint=null){
 const prior=isTemplatePoint(previousPoint)?previousPoint:d.point;
 const g=isTemplatePoint(prior)?prior.geometry:match().pitchTemplate;if(!g||d.preciseOrigin||(recordId&&!isTemplatePoint(prior)))return;
 let point=null;
 if(d.type==='Corner'&&d.cornerSide!=='Unknown')point={x:(d.cornerSide==='Left')!==d.opp?0:1,y:d.opp?1:0};
 if(d.type==='Penalty'&&g.penaltySpot){const depth=g.penaltySpot/g.length;point={x:.5,y:d.opp?1-depth:depth}}
 if(d.type==='Corner'||d.type==='Penalty')d.point=point?{...point,coordinateSpace:TEMPLATE_POINT_SPACE,geometry:JSON.parse(JSON.stringify(g))}:null;
}
function drawTemplateReplayPitch(ctx,area,half,geometry){
 const r=geometry.rect,v={...geometry.viewBox};if(half==='north')v.height=540-v.y;else if(half==='south'){v.height=v.y+v.height-540;v.y=540}
 const scale=Math.min(area.width/v.width,area.height/v.height),x=area.x+(area.width-v.width*scale)/2,y=area.y+(area.height-v.height*scale)/2;
 ctx.save();ctx.beginPath();ctx.rect(x,y,v.width*scale,v.height*scale);ctx.clip();ctx.translate(x-v.x*scale,y-v.y*scale);ctx.scale(scale,scale);
 ctx.fillStyle='#326749';ctx.fillRect(v.x,v.y,v.width,v.height);ctx.strokeStyle='#edf5df';ctx.lineWidth=2.5;
 for(const d of geometry.drawing.paths)ctx.stroke(new Path2D(d));
 for(const a of geometry.drawing.rects)ctx.strokeRect(...a);
 for(const [cx,cy,rad]of geometry.drawing.circles){ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.stroke()}
 ctx.fillStyle='#edf5df';for(const [cx,cy,rad]of geometry.drawing.spots){ctx.beginPath();ctx.arc(cx,cy,rad,0,Math.PI*2);ctx.fill()}
 ctx.restore();return {x:x+(r.x-v.x)*scale,y:y+(r.y-v.y)*scale,width:r.width*scale,height:r.height*scale,geometry};
}
