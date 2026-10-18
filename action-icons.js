// One set of outline geometry powers both SVG buttons and canvas video icons.
// Keeping the geometry shared avoids platform-dependent emoji rendering.
const actionVectors={
  setpiece:{circles:[[17,6.5,2],[6,17.5,2]],paths:[[['M',4.5,1.5],['L',19.5,1.5],['Q',22.5,1.5,22.5,4.5],['L',22.5,19.5],['Q',22.5,22.5,19.5,22.5],['L',4.5,22.5],['Q',1.5,22.5,1.5,19.5],['L',1.5,4.5],['Q',1.5,1.5,4.5,1.5]],[['M',4.5,5],['L',8.5,9]],[['M',8.5,5],['L',4.5,9]],[['M',15,17],['L',19,21]],[['M',19,17],['L',15,21]],[['M',15,13],['L',17,11],['L',19,13]]],dashedPaths:[[['M',10,6.5],['L',13,6.5]],[['M',9,17.5],['Q',17,17.5,17,11.5]]]},
  save:{paths:[[['M',7,18],['L',5,16],['L',2.5,11],['Q',1.5,9,3,8.5],['Q',4,8,5,10],['L',6.5,12],['L',6.5,4],['Q',6.5,2.5,8,2.5],['Q',9.5,2.5,9.5,4],['L',9.5,9],['L',9.5,2.5],['Q',9.5,1,11,1],['Q',12.5,1,12.5,2.5],['L',12.5,9],['L',12.5,3.2],['Q',12.5,1.7,14,1.7],['Q',15.5,1.7,15.5,3.2],['L',15.5,9],['L',15.5,5],['Q',15.5,3.5,17,3.5],['Q',18.5,3.5,18.5,5],['L',18.5,12],['Q',18.5,16,17,18],['Z']],[['M',7,18],['L',17,18],['L',17,22],['L',7,22],['Z']],[['M',7,20],['L',17,20]],[['M',9,12],['Q',12.5,10.5,16,12],['L',15,15.5],['L',10,15.5],['Z']]]},
  skill:{paths:[[['M',3,18],['L',13,8],['L',16,11],['L',6,21],['Z']],[['M',10,11],['L',13,14]],[['M',18,2],['L',19,5],['L',22,6],['L',19,7],['L',18,10],['L',17,7],['L',14,6],['L',17,5],['Z']],[['M',5,3],['L',5,7]],[['M',3,5],['L',7,5]]]},
  // A simplified angled kicking boot, short ankle and football; no brand marks.
  pass:{circles:[[18,6,4.5]],paths:[[['M',4,8],['Q',6,12,9,10],['L',12,14],['Q',14,16,17,17],['Q',20,18,20,20],['Q',20,21.5,17.5,21],['L',3,15.5],['Q',1.5,15,2,12.5],['Z']],[['M',4,8],['L',6,2]],[['M',9,10],['L',11,4]],[['M',5.5,4],['L',10.3,5.7]],[['M',3,13.5],['Q',10,17.5,19.5,19]],[['M',9,12],['L',11.5,11]],[['M',11,14],['L',13.5,13]],[['M',4,16],['L',3.5,18]],[['M',10,18.5],['L',9.5,20.5]],[['M',16,20.5],['L',15.5,22.5]],[['M',18,4],['L',20,5.5],['L',19.2,7.7],['L',16.8,7.7],['L',16,5.5],['Z']],[['M',18,4],['L',18,1.5]],[['M',20,5.5],['L',22.3,5]],[['M',16,5.5],['L',13.7,5]],[['M',19.2,7.7],['L',20.5,9.7]],[['M',16.8,7.7],['L',15.5,9.7]]]},
  shot:{circles:[[12,12,8]],paths:[[['M',12,1],['L',12,7]],[['M',12,17],['L',12,23]],[['M',1,12],['L',7,12]],[['M',17,12],['L',23,12]]]},
  tackle:{paths:[[['M',12,2],['L',20,5],['L',20,11],['Q',20,17,12,22],['Q',4,17,4,11],['L',4,5],['Z']]]},
  teamwork:{circles:[[12,6,2.7],[5,9,2.2],[19,9,2.2]],paths:[[['M',6,21],['L',6,19],['Q',6,14,12,14],['Q',18,14,18,19],['L',18,21]],[['M',1,20],['L',1,17],['Q',1,14,5,14],['L',6,14]],[['M',23,20],['L',23,17],['Q',23,14,19,14],['L',18,14]]]}
};
function vectorActionKey(action){return String(action).replace(/^(great|good|amazing)\s+/i,'').replace(/\s/g,'').toLowerCase()}
function actionIconSVG(action){
  const v=actionVectors[vectorActionKey(action)];if(!v)return '';
  const paths=(v.paths||[]).map(commands=>`<path d="${commands.map(c=>c.join(' ')).join(' ')}"/>`).join('');
  const dashed=(v.dashedPaths||[]).map(commands=>`<path stroke-dasharray="1 2.5" d="${commands.map(c=>c.join(' ')).join(' ')}"/>`).join('');
  const circles=(v.circles||[]).map(([cx,cy,r])=>`<circle cx="${cx}" cy="${cy}" r="${r}"/>`).join('');
  return `<svg class="action-line-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths}${dashed}${circles}</svg>`;
}
function drawActionIcon(ctx,action,cx,cy,size,color){
  const v=actionVectors[vectorActionKey(action)];if(!v)return false;
  ctx.save();ctx.translate(cx-size/2,cy-size/2);ctx.scale(size/24,size/24);ctx.strokeStyle=color;ctx.lineWidth=1.7;ctx.lineCap='round';ctx.lineJoin='round';
  for(const path of [...(v.paths||[]),...(v.dashedPaths||[])]){ctx.setLineDash((v.dashedPaths||[]).includes(path)?[1,2.5]:[]);ctx.beginPath();for(const [op,...n]of path){if(op==='M')ctx.moveTo(...n);if(op==='L')ctx.lineTo(...n);if(op==='Q')ctx.quadraticCurveTo(...n);if(op==='C')ctx.bezierCurveTo(...n);if(op==='Z')ctx.closePath()}ctx.stroke()}
  ctx.setLineDash([]);
  for(const [x,y,r]of v.circles||[]){ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);ctx.stroke()}
  ctx.restore();return true;
}
for(const action of gridActions){const svg=actionIconSVG(action.base);if(svg)action.icon=svg}
const renderBeforeLineIcons=render;
render=function(){renderBeforeLineIcons();if(view!=='live'||!match())return;const app=$('#app');app.innerHTML=app.innerHTML.replace('onclick="beginEvent(0,true)"','class="opposition-goal" onclick="beginEvent(0,true)"').replace('>+ Opposition goal</button>',`><span class="goal-ball" aria-hidden="true">${gridActions[0].icon}</span><span>Opposition goal</span></button>`).replace('>+ Opposition save</button>',`>${actionIconSVG('Save')}<span>Opposition save</span></button>`)};
render();
