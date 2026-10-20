// Entry and replay share a 360 × 560 pitch and normalized event coordinates.
const MATCH_PITCH={
  width:360,height:560,
  paths:[
    [['M',18,18],['L',342,18],['L',342,542],['L',18,542],['Z']],
    [['M',18,280],['L',342,280]],
    [['M',60,18],['L',60,156],['L',300,156],['L',300,18]],
    [['M',117,18],['L',117,72],['L',243,72],['L',243,18]],
    [['M',60,542],['L',60,404],['L',300,404],['L',300,542]],
    [['M',117,542],['L',117,488],['L',243,488],['L',243,542]],
    [['M',145,18],['L',145,6],['L',215,6],['L',215,18]],
    [['M',145,542],['L',145,554],['L',215,554],['L',215,542]],
    [['M',147,156],['Q',180,186,213,156]],
    [['M',147,404],['Q',180,374,213,404]],
    [['M',18,30],['C',24.6274,30,30,24.6274,30,18]],
    [['M',330,18],['C',330,24.6274,335.3726,30,342,30]],
    [['M',18,530],['C',24.6274,530,30,535.3726,30,542]],
    [['M',330,542],['C',330,535.3726,335.3726,530,342,530]]
  ],
  circles:[[180,280,40]],spots:[[180,112,2.5],[180,448,2.5],[180,280,2.5]],
  goals:{north:{x:180,y:9},south:{x:180,y:551}}
};
function entryPitchSVG(showAttack=true){
  const paths=MATCH_PITCH.paths.map(p=>`<path d="${p.map(c=>c.join(' ')).join(' ')}"/>`).join('');
  const circles=MATCH_PITCH.circles.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  const spots=MATCH_PITCH.spots.map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  return `<svg viewBox="0 0 360 560" aria-hidden="true"><defs><pattern id="v2grass" width="360" height="80" patternUnits="userSpaceOnUse"><rect width="360" height="40" fill="#fff" opacity=".04"/></pattern></defs><rect width="360" height="560" fill="url(#v2grass)"/><g fill="none" stroke="#e3f0cf" stroke-width="1.7">${paths}${circles}</g><g fill="#e3f0cf">${spots}</g>${showAttack?'<path d="M320 340v-70l-7 12m7-12 7 12" fill="none" stroke="#d6ee83" stroke-width="3"/>':''}</svg>`;
}
function drawMatchPitch(ctx,area,half=null){
  const cropped=half==='north'||half==='south',viewHeight=cropped?280:560,viewY=half==='south'?280:0;
  const scale=Math.min(area.width/MATCH_PITCH.width,area.height/viewHeight);
  const visibleY=area.y+(area.height-viewHeight*scale)/2;
  const rect={x:area.x+(area.width-MATCH_PITCH.width*scale)/2,y:visibleY-viewY*scale,width:MATCH_PITCH.width*scale,height:MATCH_PITCH.height*scale};
  ctx.save();if(cropped){ctx.beginPath();ctx.rect(rect.x,visibleY,rect.width,viewHeight*scale);ctx.clip()}
  ctx.save();ctx.translate(rect.x,rect.y);ctx.scale(scale,scale);
  ctx.fillStyle='#326749';ctx.fillRect(0,0,360,560);
  ctx.fillStyle='#fff';ctx.globalAlpha=.04;for(let y=0;y<560;y+=80)ctx.fillRect(0,y,360,40);ctx.globalAlpha=1;
  ctx.strokeStyle='#e3f0cf';ctx.lineWidth=1.7;
  for(const p of MATCH_PITCH.paths){ctx.beginPath();for(const [op,...n] of p){if(op==='M')ctx.moveTo(...n);else if(op==='L')ctx.lineTo(...n);else if(op==='Q')ctx.quadraticCurveTo(...n);else if(op==='C')ctx.bezierCurveTo(...n);else if(op==='Z')ctx.closePath()}ctx.stroke()}
  for(const [x,y,r] of MATCH_PITCH.circles){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke()}
  ctx.fillStyle='#e3f0cf';for(const [x,y,r] of MATCH_PITCH.spots){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
  ctx.restore();ctx.restore();return rect;
}
function replayHalfForGoal(e){
  if(e?.action!=='Goal'||e.opp||!e.assist)return null;
  const rect={x:0,y:0,width:1,height:1},shot=replayPitchPoint(e.zone,e.point,rect),assist=replayPitchPoint(e.assist.zone,e.assist.point,rect);
  return shot&&assist&&shot.y>=0&&shot.y<=.5&&assist.y>=0&&assist.y<=.5?'north':null;
}
function replayPitchPoint(zone,point,rect){
  if(point&&Number.isFinite(point.x)&&Number.isFinite(point.y))return {x:rect.x+point.x*rect.width,y:rect.y+point.y*rect.height};
  if(!Number.isInteger(zone)||zone<1||zone>12)return null;
  return {x:rect.x+((zone-1)%3+.5)*rect.width/3,y:rect.y+(3-Math.floor((zone-1)/3)+.5)*rect.height/4};
}
