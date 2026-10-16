// Coach-selected award, scoped to this match. It is deliberately not inferred
// from event counts, goals or any player ranking.
let awardDraft='',awardMatch=null;
function playerDayModal(){
  const m=match();if(!m?.ended)return toast('Finish the match before choosing Player of the Day.');
  clearTimeout(feedbackTimer);hideHoldFeedback();awardMatch=m;awardDraft=m.playerOfDay||'';drawPlayerDayModal();
}
function drawPlayerDayModal(){
  const m=awardMatch;if(m!==match())return closeModal();
  $('#modal').innerHTML=`<div class="modal"><div class="sheet"><button class="close" aria-label="Choose later" onclick="closeModal()">×</button><div class="eyebrow">Full time · Coach’s choice</div><h2 style="margin-top:12px">Player of the Day</h2><p class="hint">Choose a player from this match’s lineup. Their name will appear at the end of the highlight video and in the report.</p><div class="squad award-choices">${m.lineup.map(n=>`<button data-name="${esc(n)}" aria-pressed="${n===awardDraft}" class="${n===awardDraft?'selected':''}" onclick="chooseAwardDraft(this.dataset.name)">${esc(n)}</button>`).join('')}</div>${!m.lineup.length?'<p class="hint">No players were selected for this match.</p>':''}<div class="links" style="margin-top:20px"><button class="primary" onclick="savePlayerDay()" ${awardDraft?'':'disabled'}>Save selection</button><button onclick="closeModal()">Choose later</button>${m.playerOfDay?'<button class="danger" onclick="clearPlayerDay()">Remove award</button>':''}</div></div></div>`;
}
function chooseAwardDraft(name){if(awardMatch!==match()||!awardMatch.lineup.includes(name))return;awardDraft=name;drawPlayerDayModal()}
function savePlayerDay(){if(awardMatch!==match()||!awardMatch.ended||!awardMatch.lineup.includes(awardDraft))return;awardMatch.playerOfDay=awardDraft;save();closeModal();render();showActionFeedback('Player of the Day',awardDraft)}
function clearPlayerDay(){if(awardMatch!==match())return;delete awardMatch.playerOfDay;save();closeModal();render();toast('Player of the Day removed.')}
const clockBeforeAward=selectClock;
selectClock=function(action){
  clockBeforeAward(action);const m=match();
  if(action==='restart'&&m&&!clockHasStarted(m)&&!m.events.length){delete m.playerOfDay;save();render()}
  if(action==='full'&&m?.ended&&!m.playerOfDay)playerDayModal();
};
function awardControls(m){return `<div class="award-inline"><div class="eyebrow">★ Player of the Day</div><strong>${m.playerOfDay?esc(m.playerOfDay):'Choose your standout player'}</strong><button onclick="playerDayModal()">${m.playerOfDay?'Change selection':'Choose player'}</button></div>`}
const renderBeforeAward=render;
render=function(){renderBeforeAward();if(view!=='live'||!match()?.ended)return;const app=$('#app');app.innerHTML=app.innerHTML.replace('<div class="card" style="margin-top:20px">',`<div class="card award-card" style="margin-top:20px">${awardControls(match())}</div><div class="card" style="margin-top:20px">`)};
const reportBeforeAward=renderReport;
renderReport=function(){
  reportBeforeAward();const m=match();if(!m?.ended)return;
  const app=$('#app');let html=app.innerHTML.replace('<h2>Add the finishing touches</h2>','<h2>Add the finishing touches</h2>'+awardControls(m));
  if(m.playerOfDay)html=html.replace('<div style="font-size:10px;color:#89aaa2;margin-top:25px">',`<div class="award-report"><span>★ PLAYER OF THE DAY</span><strong>${esc(m.playerOfDay)}</strong></div><div style="font-size:10px;color:#89aaa2;margin-top:25px">`);
  app.innerHTML=html;
};
const textBeforeAward=reportText;
reportText=function(all=true){const text=textBeforeAward(all),ms=all?day().matches:[match()],awards=ms.filter(m=>m.ended&&m.playerOfDay);return text+(awards.length?'\n\nPlayer of the Day\n'+awards.map(m=>(all?'vs '+m.opponent+': ':'')+m.playerOfDay).join('\n'):'')};
const imageBeforeAward=reportCanvas;
reportCanvas=async function(events=match().events){
  const original=await imageBeforeAward(events),m=match();if(!m.ended||!m.playerOfDay)return original;
  const c=document.createElement('canvas');c.width=original.width;c.height=original.height+170;const x=c.getContext('2d');x.drawImage(original,0,0);x.fillStyle='#133f36';x.fillRect(0,original.height,c.width,170);x.fillStyle='#f1cd62';x.font='bold 22px sans-serif';x.fillText('★ PLAYER OF THE DAY',45,original.height+58);x.fillStyle='#fff';let size=34;x.font=`bold ${size}px sans-serif`;while(size>14&&x.measureText(m.playerOfDay).width>c.width-90){size--;x.font=`bold ${size}px sans-serif`}x.fillText(m.playerOfDay,45,original.height+116);return c;
};
render();
