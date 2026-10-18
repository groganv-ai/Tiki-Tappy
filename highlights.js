// Text-led highlights. The timeline is always present; pitch animation is a
// short goal replay, not the default view. Preview and video use one renderer.
const replayModelBeforeTimeline=makeReplayModel;
makeReplayModel=function(){
  const model=replayModelBeforeTimeline(),m=match();
  model.ended=!!m.ended;model.twoHalves=usesHalves(m);model.durationMinutes=durationFor(m);
  model.playerOfDay=m.ended?m.playerOfDay||'':'';
  model.firstHalfElapsed=m.firstHalfElapsed||0;
  const played=(m.period===2?model.firstHalfElapsed:0)+elapsed(m);
  model.timelineEnd=Math.max(1,played,model.events.at(-1)?.at||0);
  return model;
};
function isGreatHighlight(e){return /^great\s/i.test(e?.action||'')||e?.quality==='Great'}
function highlightPlan(model){
  let time=2.5;const plan=[{type:'intro',start:0,end:time,index:-1}];
  model.events.forEach((e,index)=>{
    const parts=e.action==='Goal'?[['goal',1.5],['replay',4],['return',1.5]]:[['event',isGreatHighlight(e)?4:3.4]];
    for(const [type,duration]of parts){plan.push({type,start:time,end:time+duration,index});time+=duration}
  });plan.push({type:'final',start:time,end:time+3.5,index:model.events.length-1});
  if(model.ended&&model.playerOfDay)plan.push({type:'award',start:time+3.5,end:time+8,index:model.events.length-1});
  return plan;
}
replayDuration=function(model){return highlightPlan(model).at(-1).end};
function highlightState(model,seconds){
  const plan=highlightPlan(model),segment=plan.find(p=>seconds>=p.start&&seconds<p.end)||plan.at(-1);
  return {...segment,local:Math.max(0,seconds-segment.start),progress:Math.min(1,Math.max(0,(seconds-segment.start)/(segment.end-segment.start)))};
}
function highlightScore(model,index){return model.events.slice(0,index+1).reduce((s,e)=>{if(e.action==='Goal')s[e.opp?1:0]++;return s},[0,0])}
function highlightGlyph(e){const a=String(e?.action||'').replace(/^(great|good|amazing)\s+/i,'').toLowerCase();return ({goal:'●',pass:'➜',tackle:'⊥',skill:'✧',save:'◇','team work':'∞',teamwork:'∞',sportsmanship:'♡',assist:'↗'})[a]||'✦'}
paintReplay=function(ctx,model,seconds){
  const state=highlightState(model,seconds),e=model.events[state.index],great=isGreatHighlight(e),award=state.type==='award',end=state.type==='final'||award,intro=state.type==='intro';
  const C={paper:'#f5f5ed',ink:'#193e35',green:'#215e49',dark:'#133f36',muted:'#78857a',line:'#dce2d5',lime:'#d6ee83',gold:'#edc551'};
  function box(x,y,w,h,color,r=0){ctx.fillStyle=color;ctx.beginPath();if(r&&ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fill()}
  function text(t,x,y,size=22,color=C.ink,weight='600',maxWidth){ctx.font=`${weight} ${size}px sans-serif`;ctx.fillStyle=color;if(maxWidth&&ctx.measureText){while(size>13&&ctx.measureText(String(t)).width>maxWidth){size--;ctx.font=`${weight} ${size}px sans-serif`}}ctx.fillText(String(t),x,y)}
  function wrap(t,x,y,width,size=23,color=C.ink){ctx.font=`600 ${size}px sans-serif`;ctx.fillStyle=color;const words=String(t).split(' ');let line='',row=0;for(const word of words){const test=line+word+' ';if(line&&ctx.measureText&&ctx.measureText(test).width>width){ctx.fillText(line.trim(),x,y+row*(size+9));row++;line=''}line+=word+' '}ctx.fillText(line.trim(),x,y+row*(size+9));return (row+1)*(size+9)}
  function line(x1,y1,x2,y2,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  function circle(x,y,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}
  function star(x,y,outer,inner,color){ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?inner:outer;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill()}
  function ball(x,y,r=12){circle(x,y,r,'#fff');star(x,y,r*.6,r*.4,C.ink)}
  box(0,0,720,1080,C.paper);box(0,0,720,74,C.dark);
  text('TikiTapper',28,47,30,C.lime,'800');text(model.clubName||'MATCH HIGHLIGHTS',438,44,16,'#d6e3d3','600',254);
  box(24,96,672,159,C.dark,18);
  const runningScore=end?model.score:highlightScore(model,intro?-1:state.index);
  text(model.team,46,143,24,'#fff','700',250);text(model.opponent,432,143,24,'#fff','700',240);
  text(runningScore.join(' – '),293,153,40,C.lime,'800',130);
  text(intro?'KICK-OFF':end?(model.ended?'FULL TIME':'MATCH SO FAR'):eventTimeLabel(e),46,207,21,C.lime,'700',620);
  text(model.date,432,207,16,'#bcd0bf','500',240);
  text(state.type==='replay'?'GOAL REPLAY':award?'PLAYER OF THE DAY':end?'THE MATCHDAY STORY':'MATCH COMMENTARY',32,298,13,C.muted,'800');
  if(state.type==='replay'){
    box(24,316,672,512,'#fff',16);
    const px=112,py=362,pw=496,ph=374;
    box(px,py,pw,ph,'#386b4b');ctx.strokeStyle='#d0e3c3';ctx.lineWidth=3;ctx.strokeRect(px,py,pw,ph);ctx.strokeRect(300,py-18,120,18);ctx.strokeRect(300,py+ph,120,18);
    line(px,py+ph/2,px+pw,py+ph/2,'#b9d2ae',2);ctx.beginPath();ctx.arc(360,py+ph/2,41,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='#d0e3c3';ctx.lineWidth=2;
    ctx.strokeRect(px+pw*.13,py,pw*.74,ph*.25);ctx.strokeRect(px+pw*.13,py+ph*.75,pw*.74,ph*.25);
    ctx.strokeRect(px+pw*.31,py,pw*.38,ph*.1);ctx.strokeRect(px+pw*.31,py+ph*.9,pw*.38,ph*.1);
    circle(px+pw*.5,py+ph*.18,2,'#d0e3c3');circle(px+pw*.5,py+ph*.82,2,'#d0e3c3');
    text('OPPOSITION GOAL',270,340,13,C.muted);text('OUR GOAL',322,773,13,C.muted);
    function point(z,p){if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))return {x:px+p.x*pw,y:py+p.y*ph};if(!z||z<1||z>12)return null;return{x:px+((z-1)%3+.5)*pw/3,y:py+(3-Math.floor((z-1)/3)+.5)*ph/4}}
    const shot=point(e.zone,e.point),assist=point(e.assist?.zone,e.assist?.point),goal={x:360,y:e.opp?py+ph+9:py-9};
    function path(a,b,color){line(a.x,a.y,b.x,b.y,color,4);const angle=Math.atan2(b.y-a.y,b.x-a.x);line(b.x,b.y,b.x-13*Math.cos(angle-.5),b.y-13*Math.sin(angle-.5),color,4);line(b.x,b.y,b.x-13*Math.cos(angle+.5),b.y-13*Math.sin(angle+.5),color,4)}
    function player(p,name,color){if(!p)return;circle(p.x,p.y,9,color);text(name,Math.max(px+4,Math.min(p.x-30,px+pw-120)),p.y+27,17,color,'700',125)}
    if(shot){
      player(shot,e.player,'#fff');if(assist)player(assist,e.assist.player,C.lime);
      const passEnd=.48,shotEnd=.9,p=state.progress;let a=shot,b=goal,t=Math.min(1,p/shotEnd);
      if(assist&&p<passEnd){a=assist;b=shot;t=p/passEnd;path(a,b,C.lime)}
      else {if(assist)path(assist,shot,'#9cba71');t=Math.min(1,(p-(assist?passEnd:0))/(shotEnd-(assist?passEnd:0)));path(shot,goal,'#fff')}
      ball(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,9);
    }else text('Shot location not recorded',198,550,23,'#fff','600',330);
    text(e.assist?e.assist.player+' → '+e.player:e.player+' → Goal',46,806,23,C.ink,'700',628);
    text('Approximate zones · not match footage',46,826,12,C.muted,'500');
  }else{
    box(24,316,672,286,'#fff',16);
    if(intro){
      text('Every little moment',58,415,36,C.ink,'800',600);text('counts.',58,465,36,C.ink,'800');
      text('Follow the story along the timeline.',58,531,23,C.muted,'500',600);
      text(model.events.length+' recorded moments',58,571,18,C.green);
    }else if(award){
      box(42,337,636,245,'#fff5d4',12);
      const pop=state.local<.6?62+14*Math.sin(state.local/.6*Math.PI):62;
      star(126,445,pop,pop*.5,'#f1cd62');text('★',103,462,48,C.green,'800');
      text('PLAYER OF THE DAY',225,384,15,'#987213','800');
      wrap(model.playerOfDay,225,445,420,34,C.ink);
      text(model.team,225,563,20,C.muted,'500',420);
    }else if(end){
      text(model.ended?'FULL TIME':'MATCH SO FAR',58,403,20,C.green,'800');
      text(model.team+' '+model.score.join(' – ')+' '+model.opponent,58,466,34,C.ink,'800',600);
      text('Small moments. Big memories.',58,535,25,C.muted,'500',600);
    }else if(state.type==='goal'){
      const pulse=1+.06*Math.sin(state.progress*Math.PI);
      box(42,337,636,245,e.opp?'#f7e4dc':'#e8f2cf',12);
      text('GOAL!',62,432,Math.round(64*pulse),C.green,'900');
      wrap(e.player+' scores'+(e.opp?' for '+model.opponent:'')+'!',64,489,570,30);
      text(e.assist?'Assist: '+e.assist.player:(e.qualityLabel||'Goal replay coming up…'),64,555,21,C.muted,'500',570);
    }else{
      const cx=126,cy=444;
      if(great){const pop=state.local<.7?58+28*Math.sin(state.local/.7*Math.PI):65;star(cx,cy,pop,pop*.5,'#f7d96d')}
      else circle(cx,cy,50,'#edf2e5');
      if(typeof drawActionIcon!=='function'||!drawActionIcon(ctx,highlightMoment(e).action,cx,cy,56,C.green))text(highlightGlyph(e),cx-27,cy+18,54,C.green,'700');
      text(great?'★ GREAT MOMENT':state.type==='return'?'BACK TO THE TIMELINE':'MOMENT RECORDED',225,375,13,great?'#987213':C.muted,'800');
      text(highlightMoment(e).label,225,430,37,C.ink,'800',430);
      wrap(highlightMoment(e).player,225,478,420,31,C.ink);
      text(highlightMoment(e).detail||(e.opp?model.opponent:model.team),225,566,19,C.muted,'500',420);
    }
    const history=model.events.slice(0,intro?0:state.index+1).slice(-4);
    text('RECENT MOMENTS',32,644,12,C.muted,'800');
    history.forEach((h,j)=>{
      const y=677+j*43;line(32,y+16,688,y+16,C.line,1);
      text(eventTimeLabel(h),34,y,15,C.muted,'600',140);
      if(isGreatHighlight(h))star(193,y-6,12,6,C.gold);
      if(typeof drawActionIcon!=='function'||!drawActionIcon(ctx,highlightMoment(h).action,193,y-7,23,C.green))text(highlightGlyph(h),185,y,20,C.green);
      text(highlightMoment(h).player+' · '+highlightMoment(h).label,217,y,19,C.ink,'600',465);
    });
  }
  // A time-scaled timeline stays visible during goal replays and resumes at
  // the same event afterwards. Added-time events retain chronological order.
  box(24,850,672,206,'#fff',16);text('MATCH TIMELINE',44,881,12,C.muted,'800');
  const left=54,right=666,y=927,total=model.timelineEnd||Math.max(1,model.events.at(-1)?.at||1),position=at=>left+Math.min(1,Math.max(0,at/total))*(right-left);
  let cursor=intro?0:end?total:e?.at||0;
  if((state.type==='event'||state.type==='goal')&&state.local<.6){const previous=model.events[state.index-1]?.at||0;cursor=previous+(cursor-previous)*state.local/.6}
  line(left,y,right,y,C.line,6);line(left,y,position(cursor),y,C.green,6);
  if(model.twoHalves&&model.firstHalfElapsed>0){const hx=position(model.firstHalfElapsed);line(hx,y-17,hx,y+17,'#adb99e',1);text('HT',hx-9,y+39,10,C.muted)}
  model.events.forEach((h,i)=>{const x=position(h.at),active=!intro&&i===state.index,passed=end||i<state.index;
    if(!end&&(intro||i>state.index)){circle(x,y,5,'#cbd3c4');return}
    if(active)circle(x,y,27,'#e8f2cf');
    if(isGreatHighlight(h))star(x,y,active?25:20,active?12:10,C.gold);
    else if(h.action==='Goal'){ball(x,y,active?12:10);return}
    else circle(x,y,active?17:14,'#fff');
    const iconSize=active?24:20;
    if(typeof drawActionIcon!=='function'||!drawActionIcon(ctx,highlightMoment(h).action,x,y,iconSize,C.green))text(highlightGlyph(h),x-iconSize*.45,y+iconSize*.34,iconSize,C.green,'700');
  });
  if(intro||!model.events.length)circle(left,y,7,C.green);
  text('0′',left-5,963,12,C.muted);text(model.ended?'FT':'NOW',right-22,963,12,C.muted);
  const caption=intro?'Kick-off · the match story begins':award?'Player of the Day · '+model.playerOfDay:end?(model.ended?'Full time · all moments recorded':'The story so far'):state.type==='replay'?'Replay · '+(e.assist?e.assist.player+' → ':'')+e.player:eventTimeLabel(e)+' · '+highlightMoment(e).player+' · '+highlightMoment(e).label+(highlightMoment(e).detail?' · '+highlightMoment(e).detail:'');
  wrap(caption,44,1000,632,21,C.ink);
  text('TikiTapper · small moments, big memories',28,1075,11,C.muted,'500');
};
const timelineExportBefore=exportVideo;
exportVideo=function(){timelineExportBefore();const status=$('#recordStatus');status.textContent=String(status.textContent||'').replace('Goals replay the assist pass, then the shot. Pitch zones are approximate, not tracking footage.','Text-led timeline highlights. Goals cut to a short pass → shot replay, then return to the timeline. Great actions have a gold star burst. Pitch locations are approximate.');};
const reportBeforeTimeline=renderReport;
renderReport=function(){reportBeforeTimeline();const app=$('#app');app.innerHTML=app.innerHTML.replace('create a retro image or animated pitch highlights','create a report image or text-led timeline highlights').replace('Preview the linked pass → shot → goal animation, then create a video.','Follow the text-led timeline, with short goal replays and quality labels, then create a video.');};
