// The report has one event model for grouping, chronology and image export.
// Linked contributions are expanded once, including restarts and goalkeeper saves.
function compactReportItems(m){
 return v2Expanded(m).map((e,index)=>({...e,category:v2Category(e),reportId:String(e.id||e.sourceId||index)})).sort((a,b)=>(a.at||0)-(b.at||0));
}
function compactItemText(e){
 const time=eventTimeLabel(e),category=e.category,name=e.opp?'Opposition':e.player||'Team';
 if(category==='Goal'&&e.opp)return `Goal (${time})`;
 if(category==='Assist')return `${name} · Assist (${time})`;
 return `${name} · ${v2Description(e)} (${time})`;
}
function compactGroups(items){
 const categories=[...new Set([...REPORT_CATEGORIES,...items.map(e=>e.category)])];
 return categories.filter(c=>items.some(e=>e.category===c)).map(category=>{
  const list=items.filter(e=>e.category===category);
  return {category,title:category==='Substitution'?'Substitutions':category==='Set piece'?'Set pieces':reportCategoryTitle(category),ids:list.map(e=>e.reportId),sides:[false,true].map(opp=>{
   const side=list.filter(e=>!!e.opp===opp);
   if(category==='Goal'||category==='Assist')return side.map(e=>({ids:[e.reportId],text:category==='Goal'&&opp?`(${eventTimeLabel(e)})`:compactItemText(e)}));
   const groups=new Map();
   for(const e of side){const name=e.opp?'Opposition':e.player||'Team',label=v2Description(e),key=JSON.stringify([name,label]);if(!groups.has(key))groups.set(key,{name,label,events:[]});groups.get(key).events.push(e)}
   return [...groups.values()].map(g=>({ids:g.events.map(e=>e.reportId),text:`${g.name} · ${g.label}${g.events.length>1?' ×'+g.events.length:''} (${g.events.map(eventTimeLabel).join(', ')})`}));
  })};
 });
}
function compactReportModel(d=day(),flow=dayFlow()){
 const mode=flow.reportView==='timeline'?'timeline':'summary',filter=flow.filter||'major';
 return {team:d.team,date:d.date,location:d.location,mode,filter,filterLabel:HIGHLIGHT_FILTERS.find(p=>p.id===filter)?.label||'All Events',summary:d.summary||'',photo:d.photo||'',playerOfDay:d.matches.every(m=>m.ended)?d.playerOfDay||'':'',games:dayFilteredMatches(d,filter).map((m,index)=>{
  const items=compactReportItems(m),groups=compactGroups(items);
  return {index,opponent:m.opponent,time:m.time,score:score(d.matches[index]),halfTime:halfTimeScore(d.matches[index]),ended:m.ended,items,groups,scoreGroups:groups.filter(g=>['Goal','Assist'].includes(g.category)),actionGroups:groups.filter(g=>!['Goal','Assist'].includes(g.category)),summary:m.summary||''};
 })};
}
function compactGroupHTML(group){
 return `<section class="compact-action-group" data-report-item-ids="${esc(group.ids.join(' '))}"><h4>${v2Icon(group.category)}${esc(group.title)}</h4><div class="compact-report-sides">${group.sides.map(side=>`<div>${side.map(row=>`<p>${esc(row.text)}</p>`).join('')||'<span class="compact-empty">—</span>'}</div>`).join('')}</div></section>`;
}
function compactTimelineHTML(items){
 return `<div class="compact-report-timeline">${items.map(e=>`<div class="compact-timeline-item ${e.opp?'opponent':''}" data-report-item-ids="${esc(e.reportId)}"><time>${eventTimeLabel(e)}</time>${v2Icon(e.category)}<p>${esc((e.opp?'Opposition':e.player||'Team')+' · '+(e.category==='Assist'?'Assist':v2Description(e)))}</p></div>`).join('')}</div>`;
}
daySummaryHTML=function(){
 const model=compactReportModel();
 return `<article class="day-summary compact-matchday-report" aria-label="Shareable matchday report"><header class="compact-report-heading"><h2>${esc(model.team)}</h2><p>${esc(matchDateLabel(model.date))} · ${esc(model.location)}</p><small>${esc(model.filterLabel)} · ${model.mode==='summary'?'By action':'Timeline'} · ${model.games.length} games</small></header>${model.games.map(g=>`<section class="day-report-game"><div class="compact-game-meta">Match ${g.index+1}${g.time?' · '+esc(g.time):''} · ${g.ended?'FT':'Match so far'}${g.halfTime?' · HT '+g.halfTime.join('–'):''}</div><div class="compact-scoreline"><strong>${esc(model.team)}</strong><b>${g.score.join('–')}</b><strong>${esc(g.opponent)}</strong></div>${model.mode==='summary'?g.scoreGroups.map(compactGroupHTML).join('')+g.actionGroups.map(compactGroupHTML).join(''):compactTimelineHTML(g.items)}${!g.items.length?'<p class="compact-empty">No matching moments.</p>':''}${g.summary?`<p class="compact-match-note">${esc(g.summary)}</p>`:''}</section>`).join('')}${model.playerOfDay?`<section class="compact-day-award"><small>Matchday Player of the Day</small><strong>${esc(model.playerOfDay)}</strong></section>`:''}${model.summary?`<p class="compact-day-note">${esc(model.summary)}</p>`:''}${model.photo?`<img class="compact-report-photo" src="${model.photo}" alt="Matchday photo">`:''}<p class="compact-report-copyright">© 2026 Vincent Grogan. All rights reserved.</p></article>`;
};

// Selection choices and navigation have separate, labelled areas.
const compactAwardBefore=dayAwardStepHTML;
dayAwardStepHTML=function(){
 const selected=day().playerOfDay||'No award selected';
 return compactAwardBefore().replace('</div><div class="links"><button onclick="chooseDayPlayer(\'\')">No award</button><button class="primary" onclick="dayStep(\'content\')">Continue →</button></div>',`<button class="${day().playerOfDay?'':'selected'}" aria-pressed="${!day().playerOfDay}" onclick="chooseDayPlayer('')">No award</button></div><div class="day-award-navigation" aria-label="Continue after player selection"><p><small>Selected</small><strong>${esc(selected)}</strong></p><button class="primary" onclick="dayStep('content')">Continue →</button></div>`);
};

// Layout all games as one report, measure before rendering, and use the largest
// readable type size that fits one portrait page. Overflow is paginated safely.
function compactReportBlocks(model){
 const blocks=[];
 for(const game of model.games){
  blocks.push({type:'game',game});
  if(model.mode==='summary'){
   for(const group of [...game.scoreGroups,...game.actionGroups]){
    blocks.push({type:'group',label:group.title,icon:group.category});
    for(let i=0;i<Math.max(...group.sides.map(s=>s.length));i++)blocks.push({type:'sides',left:group.sides[0][i]?.text||'',right:group.sides[1][i]?.text||'',ids:group.sides.flatMap(side=>side[i]?.ids||[])});
   }
  }else{
   for(const e of game.items)blocks.push({type:'timeline',time:eventTimeLabel(e),icon:e.category,text:(e.opp?'Opposition':e.player||'Team')+' · '+(e.category==='Assist'?'Assist':v2Description(e)),ids:[e.reportId],opp:!!e.opp});
  }
  if(!game.items.length)blocks.push({type:'note',text:'No matching moments.'});
  if(game.summary)blocks.push({type:'note',text:game.summary});
 }
 if(model.playerOfDay)blocks.push({type:'award',text:model.playerOfDay});
 if(model.summary)blocks.push({type:'note',text:model.summary});
 if(model.photo)blocks.push({type:'photo',src:model.photo});
 return blocks;
}
async function makeCompactReportPages(model=compactReportModel()){
 const W=1080,H=1920,M=48,limit=1832,C={paper:'#f5f5ed',ink:'#193e35',muted:'#647360',dark:'#143f36',line:'#dce2d5',lime:'#d6ee83'};
 const measure=document.createElement('canvas').getContext('2d'),blocks=compactReportBlocks(model);let photo=null;
 if(model.photo){photo=new Image();photo.src=model.photo;await photo.decode()}
 function wrap(ctx,value,width,size,bold=false){ctx.font=`${bold?'700':'400'} ${size}px sans-serif`;const out=[];for(const p of String(value||'').split('\n')){let row='';for(const word of p.split(/\s+/).filter(Boolean)){if(ctx.measureText((row?row+' ':'')+word).width>width&&row){out.push(row);row=''}if(ctx.measureText(word).width>width){let part='';for(const ch of word){if(ctx.measureText(part+ch).width>width&&part){out.push(part);part=''}part+=ch}row=part}else row+=(row?' ':'')+word}out.push(row)}return out.length?out:['']}
 function layout(size){
  const line=size+8,col=(W-2*M-36)/2;
  const header=118+wrap(measure,model.team,W-2*M,36,true).length*44+wrap(measure,matchDateLabel(model.date)+' · '+model.location,W-2*M,22).length*29+30;
  const rows=blocks.map(b=>{
   if(b.type==='game'){const left=wrap(measure,model.team,370,32,true),right=wrap(measure,b.game.opponent,370,32,true);return {...b,left,right,height:Math.max(left.length,right.length)*40+64}}
   if(b.type==='group')return {...b,height:42};
   if(b.type==='sides'){const left=wrap(measure,b.left||'—',col,size),right=wrap(measure,b.right||'—',col,size);return {...b,left,right,height:Math.max(left.length,right.length)*line+10}}
   if(b.type==='timeline'){const lines=wrap(measure,b.text,W-2*M-155,size);return {...b,lines,height:Math.max(line,lines.length*line)+12}}
   if(b.type==='award')return {...b,lines:wrap(measure,b.text,W-2*M-32,size+4,true),height:wrap(measure,b.text,W-2*M-32,size+4,true).length*(line+4)+62};
   if(b.type==='photo')return {...b,height:Math.min(260,(W-2*M)*photo.height/photo.width)+20};
   const lines=wrap(measure,b.text,W-2*M,size);return {...b,lines,height:lines.length*line+24};
  });
  return {size,line,header,rows,total:header+rows.reduce((n,b)=>n+b.height,0)};
 }
 let fit=layout(30);for(const size of [28,26,24]){if(fit.total<=limit)break;fit=layout(size)}
 // A single item can contain many repeated events. Split its measured lines so
 // even a long all-events report never paints below the page or drops content.
 const rows=[];
 for(const b of fit.rows){
  if(b.type==='sides'&&b.height>440){const count=Math.max(b.left.length,b.right.length);for(let i=0;i<count;i+=8)rows.push({...b,left:b.left.slice(i,i+8),right:b.right.slice(i,i+8),height:Math.min(8,count-i)*fit.line+10})}
  else if(['timeline','note'].includes(b.type)&&b.height>440){for(let i=0;i<b.lines.length;i+=8)rows.push({...b,lines:b.lines.slice(i,i+8),height:Math.min(8,b.lines.length-i)*fit.line+24})}
  else rows.push(b);
 }
 const pages=[];let ctx,y,game=null;
 function text(t,x,at,size=fit.size,color=C.ink,bold=false,align='left'){ctx.font=`${bold?'700':'400'} ${size}px sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(t),x,at);ctx.textAlign='left'}
 function rule(at){ctx.strokeStyle=C.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M,at);ctx.lineTo(W-M,at);ctx.stroke()}
 function page(){const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;canvas.reportItemIds=[];pages.push(canvas);ctx=canvas.getContext('2d');ctx.fillStyle=C.paper;ctx.fillRect(0,0,W,H);ctx.fillStyle=C.dark;ctx.fillRect(0,0,W,76);text('TikiTapper',M,49,30,C.lime,true);text('MATCH REPORT',W-M,47,19,'#fff',true,'right');y=118;for(const line of wrap(ctx,model.team,W-2*M,36,true)){text(line,M,y,36,C.ink,true);y+=44}for(const line of wrap(ctx,matchDateLabel(model.date)+' · '+model.location,W-2*M,22)){text(line,M,y,22,C.muted);y+=29}text(model.filterLabel+' · '+(model.mode==='summary'?'By action':'Timeline')+' · '+model.games.length+' games',M,y,21,C.muted);y+=30;if(pages.length>1&&game){text(`Match ${game.index+1} · ${game.opponent} · continued`,M,y,22,C.ink,true);y+=38}rule(1852);text('© 2026 Vincent Grogan. All rights reserved.',M,1890,17,C.muted);text('Page '+pages.length,W-M,1890,17,C.muted,false,'right')}
 page();
 rows.forEach((b,index)=>{
  const next=rows[index+1],keep=b.type==='game'||b.type==='group'?Math.min(next?.height||0,140):0;
  if(y+b.height+keep>limit&&y>fit.header+45)page();
  if(b.ids)pages.at(-1).reportItemIds.push(...b.ids);
  if(b.type==='game'){game=b.game;ctx.fillStyle=C.dark;ctx.fillRect(M,y,W-2*M,b.height-10);text(`MATCH ${game.index+1} · ${game.time||'Kick-off TBC'} · ${game.ended?'FT':'MATCH SO FAR'}${game.halfTime?' · HT '+game.halfTime.join('–'):''}`,M+18,y+26,18,'#c5d9bd',true);b.left.forEach((t,i)=>text(t,M+18,y+65+i*40,32,'#fff',true));b.right.forEach((t,i)=>text(t,W-M-18,y+65+i*40,32,'#fff',true,'right'));text(game.score.join('–'),W/2,y+65,42,C.lime,true,'center')}
  else if(b.type==='group'){rule(y+4);drawActionIcon(ctx,b.icon,M+14,y+25,22,C.ink);text(b.label,M+36,y+32,25,C.ink,true)}
  else if(b.type==='sides'){b.left.forEach((t,i)=>text(t,M,y+fit.size+i*fit.line));b.right.forEach((t,i)=>text(t,W/2+18,y+fit.size+i*fit.line))}
  else if(b.type==='timeline'){text(b.time,M,y+fit.size,21,C.muted);drawActionIcon(ctx,b.icon,M+109,y+fit.size-8,24,C.ink);b.lines.forEach((t,i)=>text(t,M+150,y+fit.size+i*fit.line,fit.size,b.opp?'#8a4845':C.ink));rule(y+b.height-5)}
  else if(b.type==='award'){ctx.fillStyle='#e7f1cc';ctx.fillRect(M,y+8,W-2*M,b.height-12);text('PLAYER OF THE DAY',M+16,y+34,19,C.muted,true);b.lines.forEach((t,i)=>text(t,M+16,y+70+i*(fit.line+4),fit.size+4,C.ink,true))}
  else if(b.type==='photo'){const height=b.height-20,width=height*photo.width/photo.height;ctx.drawImage(photo,(W-width)/2,y+10,width,height)}
  else b.lines.forEach((t,i)=>text(t,M,y+fit.size+10+i*fit.line,fit.size,C.muted));
  y+=b.height;
 });
 return pages;
}
makeDayReportPages=async function(){return makeCompactReportPages(compactReportModel(JSON.parse(JSON.stringify(day())),{...dayFlow()}))};
render();
