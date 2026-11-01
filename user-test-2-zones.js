// Shared age-responsive, non-overlapping pitch location model.
// Coordinates remain 360x560 and are stored independently of UI rotation.
function ttLocationGeometry(){
 const t=ttPitchDimensions(),full=t.format==='11v11',four=t.format==='4v4';
 const x=18,w=324,top=18,bottom=542;
 const length=t.lengthYards||100,width=t.widthYards||64;
 const penalty=full?{depth:18,width:44}:four?null:t.format==='5v5'?{depth:7,width:12}:t.format==='7v7'?{depth:10,width:15}:{depth:12,width:28};
 const six=full?{depth:6,width:20}:null;
 const areaDepth=penalty?Math.min(125,524*penalty.depth/length):0;
 const areaWidth=penalty?Math.min(285,324*penalty.width/width):0;
 const sixDepth=six?524*six.depth/length:0,sixWidth=six?324*six.width/width:0;
 return {t,full,four,x,w,top,bottom,areaDepth,areaWidth,sixDepth,sixWidth};
}
function ttLocationZones(){
 const age=ttCurrentAge(),zones=[];
 const add=(x,y,w,h,label,kind)=>{
  if(w<=0||h<=0)return;
  zones.push({x,y,w,h,label,text:label,kind,id:'tt-zone-'+zones.length});
 };
 const lanes=['left','centre','right'];
 // All geometry uses the same 360 × 560 pitch coordinate system.
 for(const south of [false,true]){
  const side=south?'Defensive':'Attacking';
  const Y=(y,h)=>south?560-y-h:y;
  const cell=(x,y,w,h,label,kind)=>add(x,Y(y,h),w,h,side+' '+label,kind);
  if(age<9){
   // Simplified U6–U8 sketch: three lanes and three horizontal bands per half.
   for(const [y,h,kind,title] of [[18,77,'box','goal third'],[95,80,'outside','outer third'],[175,105,'midfield','midfield']]){
    for(let i=0;i<3;i++){
     if(y===18&&i===1)continue;
     cell(18+i*108,y,108,h,title+', '+lanes[i],kind);
    }
   }
   cell(126,18,108,77,'goal area','six');
  }else if(age<=10){
   // 11 distinct areas per half: 2 wings, 3 goal, 3 outside, 3 midfield.
   // The goal-area edges exactly follow the solid physical markings.
   cell(18,18,70,92,'wing, left','wing');
   cell(272,18,70,92,'wing, right','wing');
   for(let i=0;i<3;i++)cell(88+i*184/3,18,184/3,92,'goal area, '+lanes[i],'box');
   for(let i=0;i<3;i++)cell(18+i*108,110,108,65,'outside, '+lanes[i],'outside');
   for(let i=0;i<3;i++)cell(18+i*108,175,108,105,'midfield, '+lanes[i],'midfield');
  }else{
   // U11–U17: two continuous wings; 3 18-yard areas, one 6-yard,
   // 3 outside and 3 midfield zones in each half.
   const bx=74,bw=212,bh=116,sx=128,sw=104,sh=43;
   cell(18,18,56,183,'wing, left','wing');
   cell(286,18,56,183,'wing, right','wing');
   // Three 18-yard columns cover the whole penalty box. The single
   // 6-yard zone is overlaid last, and takes precedence for hit testing.
   for(let i=0;i<3;i++)
    cell(bx+i*bw/3,18,bw/3,bh,'18 yard, '+lanes[i],'box');
   cell(sx,18,sw,sh,'6 yard','six');
   for(let i=0;i<3;i++)
    cell(bx+i*bw/3,134,bw/3,67,'outside, '+lanes[i],'outside');
   // Three midfield columns span the entire width, without duplicate labels.
   for(let i=0;i<3;i++)
    cell(18+i*108,201,108,79,'midfield, '+lanes[i],'midfield');
  }
  // Corners replace the underlying zones in these small areas.
  for(const right of [false,true]){
   const x=right?318:18;
   // Remove overlapping corner portions by shrinking the corner tap target
   // to the pitch edge and making it the topmost hit region.
   cell(x,18,24,24,(right?'right':'left')+' corner','corner');
  }
 }
 return zones;
}
const TT_ZONE_COLOURS={six:'#b7ed40',box:'#27854d',outside:'#11623f',midfield:'#19894b',wide:'#49aa66',wing:'#05857d',corner:'#6a9035'};
const TT_OPP_ZONE_COLOURS={six:'#e5a0a0',box:'#b94e56',outside:'#8c343f',midfield:'#a43e48',wide:'#c5656c',wing:'#a34b61',corner:'#e09b84'};

// Graduated by distance to the nearest goal: darkest at halfway, lighter near goals.
// Keep a subtle horizontal variation so adjacent zones remain distinguishable.
function ttGraduatedZoneColour(z,opposition=false){
 const centre=z.y+z.h/2;
 const proximity=Math.min(1,Math.abs(centre-280)/262);
 const start=opposition?[93,36,43]:[13,72,48];
 const end=opposition?[225,124,124]:[135,205,126];
 const lateral=Math.abs(z.x+z.w/2-180)/180;
 const mix=Math.min(1,Math.max(0,.07+proximity*.83+lateral*.06));
 const rgb=start.map((n,i)=>Math.round(n+(end[i]-n)*mix));
 return 'rgb('+rgb.join(',')+')';
}
function ttZoneSVG(zones,showLabels=false,opposition=false){
 const rects=zones.map(z=>{
  const fill=ttGraduatedZoneColour(z,opposition);
  if(z.kind==='corner'){
   const cx=z.x<180?18:342,cy=z.y<280?18:542;
   const dx=cx===18?1:-1,dy=cy===18?1:-1,r=24;
   return '<path d="M'+cx+' '+cy+' L'+(cx+dx*r)+' '+cy+' A'+r+' '+r+' 0 0 '+(dx===dy?1:0)+' '+cx+' '+(cy+dy*r)+' Z" fill="'+fill+'" fill-opacity=".95"/>';
  }
  return '<rect x="'+z.x+'" y="'+z.y+'" width="'+z.w+'" height="'+z.h+'" fill="'+fill+'" fill-opacity=".95"/>';
 }).join('');
 const labels=showLabels?zones.filter(z=>z.w>=37&&z.h>=27&&z.kind!=='corner').map(z=>{
  const x=z.x+z.w/2,y=z.y+z.h/2;
  const name=z.kind==='six'?(ttCurrentAge()<9?'Goal':'6 yard'):z.kind==='box'?(ttCurrentAge()<11?'Goal':'18 yard'):z.kind==='outside'?'Outside':z.kind==='midfield'||z.kind==='wide'?'Midfield':'Wing';
  const side=/left$/.test(z.label)?'L':/right$/.test(z.label)?'R':/centre$/.test(z.label)?'C':'';
  return '<text x="'+x+'" y="'+y+'" fill="'+(z.kind==='six'?'#163a2b':'#fff')+'" text-anchor="middle" font-family="sans-serif" font-weight="700" font-size="11">'+name+(side?' '+side:'')+'</text>';
 }).join(''):'';
 const g=ttLocationGeometry(),full=g.full,small=ttCurrentAge()<9;
 const lines=['<rect x="18" y="18" width="324" height="524"/>','<path d="M18 280H342"/>','<circle cx="180" cy="280" r="34"/>'];
 if(small){lines.push('<path d="M126 18V95H234V18 M126 542V465H234V542"/>')}
 if(!small){
  const bx=ttCurrentAge()>=11?74:88,d=ttCurrentAge()>=11?116:92,bw=ttCurrentAge()>=11?212:184;
  lines.push('<path d="M'+bx+' 18V'+(18+d)+'H'+(bx+bw)+'V18 M'+bx+' 542V'+(542-d)+'H'+(bx+bw)+'V542"/>');
 }
 if(ttCurrentAge()>=11){
  const sx=128,d=43,sw=104;
  lines.push('<path d="M'+sx+' 18V'+(18+d)+'H'+(sx+sw)+'V18 M'+sx+' 542V'+(542-d)+'H'+(sx+sw)+'V542"/>');
 }
 const goal='<path d="M149 18V7H211V18 M149 542V553H211V542" stroke="#e5f1df" stroke-width="3" fill="none"/>';
 const separators=zones.filter(z=>z.kind!=='corner'&&z.kind!=='six'&&z.kind!=='box').map(z=>'<rect x="'+z.x+'" y="'+z.y+'" width="'+z.w+'" height="'+z.h+'" fill="none" stroke="#e4f2e1" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="3 5"/>').join('');
 return '<svg viewBox="0 0 360 560" aria-hidden="true"><rect width="360" height="560" fill="'+(opposition?'#713c3f':'#326749')+'"/>'+rects+separators+'<g fill="none" stroke="#e5f1df" stroke-width="2.5">'+lines.join('')+'</g>'+goal+'<circle cx="180" cy="280" r="2.5" fill="#e5f1df"/>'+labels+'</svg>';
}
v2Zones=ttLocationZones;
entryPitchSVG=function(){return ttZoneSVG(ttLocationZones(),true,!!captureV2?.event?.opp)};

// The video/highlight canvas uses the same zones and labels as the selector.
drawMatchPitch=function(ctx,area,half=null,opposition=false,showLabels=false){
 const cropped=half==='north'||half==='south',viewH=cropped?280:560,viewY=half==='south'?280:0;
 const scale=Math.min(area.width/360,area.height/viewH),visibleY=area.y+(area.height-viewH*scale)/2;
 const rect={x:area.x+(area.width-360*scale)/2,y:visibleY-viewY*scale,width:360*scale,height:560*scale};
 const g=ttLocationGeometry(),zones=ttLocationZones();
 ctx.save();if(cropped){ctx.beginPath();ctx.rect(rect.x,visibleY,rect.width,viewH*scale);ctx.clip()}
 ctx.translate(rect.x,rect.y);ctx.scale(scale,scale);
 ctx.fillStyle=opposition?'#713c3f':'#326749';ctx.fillRect(0,0,360,560);
 for(const z of zones){
  ctx.fillStyle=ttGraduatedZoneColour(z,opposition);ctx.globalAlpha=.95;
  if(z.kind==='corner'){
   const cx=z.x<180?18:342,cy=z.y<280?18:542;
   ctx.beginPath();ctx.moveTo(cx,cy);
   ctx.arc(cx,cy,24,cy<280?(cx<180?0:Math.PI/2):(cx<180?-Math.PI/2:Math.PI),cy<280?(cx<180?Math.PI/2:Math.PI):(cx<180?0:Math.PI*1.5),false);
   ctx.closePath();ctx.fill();
  }else ctx.fillRect(z.x,z.y,z.w,z.h);
 }
 ctx.globalAlpha=1;
 ctx.lineWidth=1.3;ctx.strokeStyle='rgba(229,241,223,.7)';ctx.setLineDash([3,5]);
 for(const z of zones.filter(z=>z.kind!=='corner'&&z.kind!=='six'&&z.kind!=='box')){ctx.strokeRect(z.x,z.y,z.w,z.h)}
 ctx.setLineDash([]);ctx.strokeStyle='#e5f1df';ctx.lineWidth=2.4;
 ctx.strokeRect(18,18,324,524);ctx.beginPath();ctx.moveTo(18,280);ctx.lineTo(342,280);ctx.stroke();
 ctx.beginPath();ctx.arc(180,280,34,0,Math.PI*2);ctx.stroke();
 if(ttCurrentAge()<9){ctx.beginPath();ctx.moveTo(126,18);ctx.lineTo(126,95);ctx.lineTo(234,95);ctx.lineTo(234,18);ctx.moveTo(126,542);ctx.lineTo(126,465);ctx.lineTo(234,465);ctx.lineTo(234,542);ctx.stroke()}
 if(ttCurrentAge()>=9){const x=ttCurrentAge()>=11?74:88,d=ttCurrentAge()>=11?116:92,w=ttCurrentAge()>=11?212:184;for(const south of [false,true]){const y=south?542:18;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+(south?-d:d));ctx.lineTo(x+w,y+(south?-d:d));ctx.lineTo(x+w,y);ctx.stroke()}}
 if(ttCurrentAge()>=11){const x=128,d=43,w=104;for(const south of [false,true]){const y=south?542:18;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+(south?-d:d));ctx.lineTo(x+w,y+(south?-d:d));ctx.lineTo(x+w,y);ctx.stroke()}}
 ctx.beginPath();ctx.moveTo(149,18);ctx.lineTo(149,7);ctx.lineTo(211,7);ctx.lineTo(211,18);ctx.moveTo(149,542);ctx.lineTo(149,553);ctx.lineTo(211,553);ctx.lineTo(211,542);ctx.stroke();
 if(showLabels){
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 10px sans-serif';
 for(const z of zones){
  if(z.w<40||z.h<30||z.kind==='corner')continue;
  ctx.fillStyle=z.kind==='six'?'#173b2a':'#fff';
  const title=({six:ttCurrentAge()<9?'Goal':'6 yard',box:ttCurrentAge()<11?'Goal':'18 yard',outside:'Outside',midfield:'Midfield',wide:'Midfield',wing:'Wing'})[z.kind];
  const side=/left$/.test(z.label)?' L':/right$/.test(z.label)?' R':/centre$/.test(z.label)?' C':'';
  ctx.fillText(title+side,z.x+z.w/2,z.y+z.h/2,Math.max(20,z.w-4));
 }
 }
 ctx.restore();return rect;
};

// Add a labelled location map to exported match reports when location data exists.
if(typeof makeMatchReportPages==='function'){
 const ttReportPagesBeforeZones=makeMatchReportPages;
 makeMatchReportPages=async function(snapshot=reportSnapshot()){
  const pages=await ttReportPagesBeforeZones(snapshot);
  const matches=snapshot.day?.matches||[snapshot.match];
  for(const m of matches){
   const located=(m.events||[]).filter(e=>e.point&&Number.isFinite(e.point.x)&&Number.isFinite(e.point.y));
   if(!located.length)continue;
   const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1920;
   const ctx=canvas.getContext('2d');
   ctx.fillStyle='#f7f7f0';ctx.fillRect(0,0,1080,1920);
   ctx.fillStyle='#153e33';ctx.fillRect(0,0,1080,112);
   ctx.fillStyle='#d6ee83';ctx.font='bold 34px sans-serif';ctx.fillText('TikiTapper',45,68);
   ctx.fillStyle='#173e33';ctx.font='bold 42px sans-serif';ctx.fillText('Match location map',45,185);
   ctx.font='26px sans-serif';ctx.fillText(String(m.opponent||'Match'),45,232);
   const pitch=drawMatchPitch(ctx,{x:225,y:280,width:630,height:1400},null,false,true);
   for(const e of located){
    const px=pitch.x+e.point.x*pitch.width,py=pitch.y+e.point.y*pitch.height;
    ctx.beginPath();ctx.arc(px,py,12,0,Math.PI*2);
    ctx.fillStyle=e.opp?'#f07171':'#f9d15b';ctx.fill();
    ctx.lineWidth=3;ctx.strokeStyle='#173e33';ctx.stroke();
   }
   ctx.fillStyle='#173e33';ctx.font='22px sans-serif';
   ctx.fillText('● Our actions     ● Opposition actions',45,1770);
   ctx.fillText('Locations show recorded zones, not exact ball positions.',45,1810);
   ctx.fillText('© 2026 Vincent Grogan. All rights reserved.',45,1885);
   pages.push(canvas);
  }
  return pages;
 };
}
