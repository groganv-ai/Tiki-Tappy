// Numerical player contributions: one full-event model for the table and image export.
const PLAYER_SUMMARY_ACTIONS=['Goal','Assist','Shot','Save','Tackle','Block','Clearance','Pass','Skill','Teamwork','Team Values','Set piece'];
const PLAYER_SUMMARY_ALWAYS=['Goal','Assist','Save','Tackle','Pass','Skill','Teamwork'];
let playerSummarySort='total';
function playerSummaryLeaderNames(leader,model){return leader.names.length===model.rows.length&&model.rows.length>1?'All players ('+model.rows.length+')':leader.names.join(' · ')}
function playerSummaryTitle(category){return ({Goal:'Goals',Assist:'Assists',Shot:'Shots',Save:'Saves',Tackle:'Tackles',Block:'Blocks',Clearance:'Clearances',Pass:'Passes',Skill:'Skills',Teamwork:'Teamwork','Team Values':'Team values','Set piece':'Set pieces'})[category]||category}
function playerSummaryModel(d,scope=-1,sort=playerSummarySort){
 const selected=Number.isInteger(scope)&&scope>=0&&scope<d.matches.length?scope:-1;
 const games=selected<0?d.matches:[d.matches[selected]],names=new Set(games.flatMap(m=>m.lineup||[]));
 if(selected<0)for(const name of d.squad||[])names.add(name);
 const counts=new Map(),categories=new Set(PLAYER_SUMMARY_ALWAYS);
 const isPlayer=name=>typeof name==='string'&&name.trim()&&!['Opposition','Our team','Team','Unknown'].includes(name);
 function player(name){if(!counts.has(name))counts.set(name,{name,counts:Object.create(null),total:0});return counts.get(name)}
 for(const name of names)if(isPlayer(name))player(name);
 let contributions=0,linked=0;
 for(const m of games){
  // Expansion includes linked assists, linked saves and named set-piece takers once.
  for(const e of v2Expanded(m)){
   const category=v2Category(e);
   if(e.opp||category==='Substitution'||!isPlayer(e.player))continue;
   const row=player(e.player);row.counts[category]=(row.counts[category]||0)+1;row.total++;contributions++;
   if(e.sourceId&&e.id!==e.sourceId)linked++;
   categories.add(category);
  }
 }
 const actions=[...PLAYER_SUMMARY_ACTIONS,...[...categories].filter(c=>!PLAYER_SUMMARY_ACTIONS.includes(c))].filter(c=>categories.has(c));
 const rows=[...counts.values()],maxima=Object.fromEntries(actions.map(c=>[c,Math.max(0,...rows.map(r=>r.counts[c]||0))]));
 const totalMax=Math.max(0,...rows.map(r=>r.total));
 const leaders=[{category:'total',title:'Total contributions',count:totalMax,names:rows.filter(r=>r.total===totalMax&&totalMax>0).map(r=>r.name)},...actions.map(c=>({category:c,title:playerSummaryTitle(c),count:maxima[c],names:rows.filter(r=>r.counts[c]===maxima[c]&&maxima[c]>0).map(r=>r.name)}))].filter(l=>l.count>0);
 rows.sort((a,b)=>sort==='name'?a.name.localeCompare(b.name):(sort==='total'?b.total-a.total:(b.counts[sort]||0)-(a.counts[sort]||0))||b.total-a.total||a.name.localeCompare(b.name));
 return {team:d.team,clubName:d.clubName||'',date:d.date,location:d.location,scope:selected,scopeLabel:selected<0?'Whole matchday · '+games.length+' '+(games.length===1?'game':'games'):'Match '+(selected+1)+' · vs '+games[0].opponent,games:games.map(m=>({opponent:m.opponent,score:score(m),ended:!!m.ended})),playerOfDay:selected<0&&d.matches.every(m=>m.ended)?d.playerOfDay||'':'',actions,rows,maxima,totalMax,leaders,contributions,linked,sort};
}
function playerSummaryScope(){const value=dayFlow()?.playerSummaryScope;return Number.isInteger(value)&&value>=0&&value<day().matches.length?value:-1}
function setPlayerSummaryScope(value){const scope=Number(value);if(!Number.isInteger(scope)||scope< -1||scope>=day().matches.length)return;dayFlow().playerSummaryScope=scope;save();render()}
function sortPlayerSummary(category){if(category!=='name'&&category!=='total'&&!playerSummaryModel(day()).actions.includes(category))return;playerSummarySort=category;render()}
function playerSummaryHTML(model){
 const icon=category=>v2Icon(category==='total'?'Moment':category),win=(row,c)=>c==='total'?row.total===model.totalMax&&model.totalMax>0:(row.counts[c]||0)===model.maxima[c]&&model.maxima[c]>0;
 const headers=[{key:'name',title:'Player'},...model.actions.map(c=>({key:c,title:playerSummaryTitle(c)})),{key:'total',title:'Total'}];
 const scope=day().matches.length>1?`<div class="field ps-scope"><label for="player-summary-scope">Player summary for</label><select id="player-summary-scope" onchange="setPlayerSummaryScope(this.value)"><option value="-1" ${model.scope<0?'selected':''}>Whole matchday</option>${day().matches.map((m,i)=>`<option value="${i}" ${model.scope===i?'selected':''}>Match ${i+1} · vs ${esc(m.opponent)}</option>`).join('')}</select></div>`:'';
 return `${scope}<article class="player-summary-report" aria-label="Player summary"><div class="ps-heading"><div class="eyebrow">${esc(model.clubName||model.team)}</div><h2>Player summary</h2><p>${esc(matchDateLabel(model.date))} · ${esc(model.location)}</p><small>${esc(model.scopeLabel)} · All recorded player actions</small></div><div class="ps-results">${model.games.map(g=>`<div><strong>${esc(model.team)}</strong><b>${g.score.join('–')}</b><strong>${esc(g.opponent)}</strong></div>`).join('')}</div>${model.playerOfDay?`<div class="ps-award">${v2Icon('Player of the Day')}<span>Player of the Day <strong>${esc(model.playerOfDay)}</strong></span></div>`:''}<h3>Action leaders</h3><div class="ps-leaders">${model.leaders.map(l=>`<div class="ps-leader ${l.category==='total'?'ps-total-leader':''}"><span>${l.category==='total'?'<span aria-hidden="true">★</span>':icon(l.category)}${esc(l.title)}</span><b>${l.count}</b><small>${esc(playerSummaryLeaderNames(l,model))}</small></div>`).join('')||'<p class="hint">No player actions recorded.</p>'}</div><div class="ps-table-heading"><h3>All players</h3><small>${model.rows.length} players · Sorted by ${esc(model.sort==='name'?'name':model.sort==='total'?'total':playerSummaryTitle(model.sort).toLowerCase())}</small></div><div class="ps-table-scroll" role="region" aria-label="Player action counts; scroll sideways for all actions" tabindex="0"><table class="ps-table"><thead><tr>${headers.map(h=>`<th scope="col" aria-sort="${h.key===model.sort?(h.key==='name'?'ascending':'descending'):'none'}"><button data-category="${esc(h.key)}" onclick="sortPlayerSummary(this.dataset.category)" aria-label="Sort by ${esc(h.title)}">${h.key==='name'?'':h.key==='total'?'<span aria-hidden="true">★</span>':icon(h.key)}<span>${esc(h.title)}${h.key===model.sort?(h.key==='name'?' ↑':' ↓'):''}</span></button></th>`).join('')}</tr></thead><tbody>${model.rows.map(row=>`<tr><th scope="row">${esc(row.name)}${win(row,'total')?'<span class="ps-star" aria-label="Highest total">★</span>':''}</th>${[...model.actions,'total'].map(c=>{const n=c==='total'?row.total:row.counts[c]||0;return `<td class="${c==='total'?'ps-total-cell ':''}${c==='total'&&win(row,c)?'ps-gold':''}"><span class="ps-count ${win(row,c)&&c!=='total'?'ps-top-count':''} ${!n?'ps-zero':''}" ${win(row,c)?'aria-label="'+n+', highest '+esc(c==='total'?'total':playerSummaryTitle(c).toLowerCase())+'; includes ties"':''}>${n}</span></td>`}).join('')}</tr>`).join('')||`<tr><td colspan="${headers.length}">No players recorded.</td></tr>`}</tbody></table></div><div class="ps-legend"><span><i></i> Highest action count · includes ties</span><span><b>★</b> Highest total</span></div><p class="ps-count-note">${model.contributions} contributions${model.linked?' · Includes '+model.linked+' linked '+(model.linked===1?'action':'actions'):''}<br>All recorded player actions, including assists and saves. Substitutions excluded. Counts are not player ratings.</p><p class="ps-copyright">© 2026 Vincent Grogan. All rights reserved.</p></article>`;
}
const playerSummaryBefore=daySummaryHTML;
daySummaryHTML=function(){return dayFlow().reportView==='players'?playerSummaryHTML(playerSummaryModel(day(),playerSummaryScope())):playerSummaryBefore()};

// Image pages use the same counts, leaders, ties and order as the on-screen table.
async function makePlayerSummaryPages(model){
 const W=1080,H=1920,M=48,bottom=1810,colors={paper:'#f5f5ed',ink:'#193e35',muted:'#5c7064',line:'#dce2d5',dark:'#133f36',lime:'#e7f1cc',gold:'#fff0ba',goldInk:'#705017'};
 const pages=[],bands=[model.actions];
 let canvas,ctx,y;
 function text(value,x,at,size=24,color=colors.ink,bold=false,align='left'){ctx.font=`${bold?'700':'400'} ${size}px sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(String(value),x,at);ctx.textAlign='left'}
 function wrap(value,width,size=24,bold=false){ctx.font=`${bold?'700':'400'} ${size}px sans-serif`;const lines=[];let line='';for(const word of String(value).split(/\s+/)){if(ctx.measureText(word).width>width){if(line){lines.push(line);line=''}let part='';for(const ch of word){if(ctx.measureText(part+ch).width>width&&part){lines.push(part);part=''}part+=ch}line=part}else if(ctx.measureText((line?line+' ':'')+word).width>width&&line){lines.push(line);line=word}else line+=(line?' ':'')+word}if(line)lines.push(line);return lines.length?lines:['']}
 function rule(at){ctx.strokeStyle=colors.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(M,at);ctx.lineTo(W-M,at);ctx.stroke()}
 function newPage(band,continued=false){canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;canvas.playerSummaryNames=[];pages.push(canvas);ctx=canvas.getContext('2d');ctx.fillStyle=colors.paper;ctx.fillRect(0,0,W,H);ctx.fillStyle=colors.dark;ctx.fillRect(0,0,W,86);text('TikiTapper',M,55,32,'#d6ee83',true);text('PLAYER SUMMARY',W-M,52,21,'#fff',true,'right');y=136;for(const line of wrap(model.clubName||model.team,W-2*M,32,true)){text(line,M,y,32,colors.ink,true);y+=41}for(const line of wrap(matchDateLabel(model.date)+' · '+model.location,W-2*M,21)){text(line,M,y,21,colors.muted);y+=29}for(const line of wrap(model.scopeLabel+' · All recorded player actions'+(continued?' · continued':''),W-2*M,21)){text(line,M,y,21,colors.muted);y+=29}if(bands.length>1){text('Action columns '+(model.actions.indexOf(band[0])+1)+'–'+(model.actions.indexOf(band.at(-1))+1)+' of '+model.actions.length,M,y,19,colors.muted);y+=27}y+=14;rule(1850);text('© 2026 Vincent Grogan. All rights reserved.',M,1890,17,colors.muted);text('Page '+pages.length,W-M,1890,17,colors.muted,false,'right')}
 function ensure(height,band){if(y+height>bottom)newPage(band,true)}
 for(const band of bands){
  newPage(band);
  for(const g of model.games){const rows=wrap(model.team+' '+g.score.join('–')+' '+g.opponent,W-2*M-28,26,true);ensure(rows.length*35+22,band);ctx.fillStyle=colors.dark;ctx.fillRect(M,y,W-2*M,rows.length*35+15);rows.forEach((t,i)=>text(t,M+14,y+32+i*35,26,'#fff',true));y+=rows.length*35+27}
  if(model.playerOfDay){const lines=wrap('Player of the Day · '+model.playerOfDay,W-2*M-30,24,true);ensure(lines.length*33+24,band);ctx.fillStyle=colors.gold;ctx.fillRect(M,y,W-2*M,lines.length*33+20);lines.forEach((t,i)=>text(t,M+15,y+32+i*33,24,colors.goldInk,true));y+=lines.length*33+36}
  ensure(70,band);text('ACTION LEADERS',M,y+28,22,colors.ink,true);y+=45;
  const leaders=model.leaders.filter(l=>l.category==='total'||band.includes(l.category));
  for(let start=0;start<leaders.length;start+=3){
   const group=leaders.slice(start,start+3),gap=12,cw=(W-2*M-gap*2)/3;
   const layouts=group.map(l=>({l,title:wrap(l.title,cw-80,17,true),names:wrap(playerSummaryLeaderNames(l,model),cw-24,18)}));
   for(let offset=0;offset<Math.max(...layouts.map(v=>v.names.length));offset+=12){
    const chunk=layouts.map(v=>({...v,names:v.names.slice(offset,offset+12)}));
    const height=Math.max(...chunk.map(v=>Math.max(70,v.title.length*23+v.names.length*24+22)));
    ensure(height+10,band);
    chunk.forEach(({l,title,names},i)=>{
     if(!names.length)return;const x=M+i*(cw+gap);
     ctx.fillStyle=l.category==='total'?colors.gold:'#fff';ctx.fillRect(x,y,cw,height);
     title.forEach((t,j)=>text(t,x+12,y+23+j*23,17,colors.muted,true));
     text(l.count,x+cw-12,y+30,27,colors.ink,true,'right');
     if(l.category!=='total')drawActionIcon(ctx,l.category,x+cw-50,y+23,20,colors.ink);
     names.forEach((t,j)=>text(t,x+12,y+title.length*23+23+j*24,18));
    });y+=height+10;
   }
  }
  if(!leaders.length){text('No player actions recorded.',M,y+26,24,colors.muted);y+=45}
  const nameWidth=200,totalWidth=80,countWidth=(W-2*M-nameWidth-totalWidth)/Math.max(1,band.length),rowLine=32;
  const headerHeight=Math.max(80,...band.map(c=>wrap(c==='Teamwork'?'Team work':playerSummaryTitle(c),countWidth-6,16,true).length*23+38));
  function tableHead(){text('ALL PLAYERS',M,y+30,22,colors.ink,true);y+=44;ctx.fillStyle='#eaf0e2';ctx.fillRect(M,y,W-2*M,headerHeight);text('Player',M+12,y+headerHeight/2+8,22,colors.ink,true);band.forEach((c,i)=>{const x=M+nameWidth+(i+.5)*countWidth;drawActionIcon(ctx,c,x,y+22,25,colors.ink);wrap(c==='Teamwork'?'Team work':playerSummaryTitle(c),countWidth-6,16,true).forEach((t,j)=>text(t,x,y+51+j*23,16,colors.ink,true,'center'))});text('Total',W-M-totalWidth/2,y+headerHeight/2+8,21,colors.ink,true,'center');y+=headerHeight}
  ensure(44+headerHeight+70,band);tableHead();
  for(const row of model.rows){const names=wrap(row.name,nameWidth-35,24,true),height=Math.max(52,names.length*rowLine+16);if(y+height>bottom){newPage(band,true);tableHead()}canvas.playerSummaryNames.push(row.name);ctx.fillStyle='#fff';ctx.fillRect(M,y,W-2*M,height);names.forEach((t,i)=>text(t,M+12,y+33+i*rowLine,24,colors.ink,true));band.forEach((c,i)=>{const n=row.counts[c]||0,x=M+nameWidth+i*countWidth;if(n>0&&n===model.maxima[c]){ctx.fillStyle=colors.lime;ctx.fillRect(x+4,y+6,countWidth-8,height-12)}text(n,x+countWidth/2,y+height/2+9,26,n?colors.ink:colors.muted,n===model.maxima[c]&&n>0,'center')});const best=row.total===model.totalMax&&model.totalMax>0;ctx.fillStyle=best?colors.gold:'#f0f4e8';ctx.fillRect(W-M-totalWidth,y,totalWidth,height);text(row.total,W-M-totalWidth/2,y+height/2+9,26,colors.ink,true,'center');if(best)text('★',M+nameWidth-15,y+height/2+7,20,colors.goldInk,true,'center');rule(y+height);y+=height}
  const notes=['Green: highest action count, including ties. ★ Gold: highest total.',model.contributions+' contributions'+(model.linked?' · Includes '+model.linked+' linked actions':''),'All recorded player actions, including assists and saves. Substitutions excluded.','Counts are not player ratings.'];
  y+=14;for(const note of notes){const lines=wrap(note,W-2*M,20);ensure(lines.length*28,band);for(const line of lines){text(line,M,y+24,20,colors.muted);y+=28}}
 }
 return pages;
}
render();
