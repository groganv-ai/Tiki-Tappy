// Expose the current screen for responsive layout rules only.
const renderBeforeViewLayout=render;
render=function(){
  renderBeforeViewLayout();
  const app=$('#app'),m=match();
  if(view==='live'&&m){
    app.innerHTML=app.innerHTML.replace(/<div class="clock" id="clock">[^<]*<\/div>/,matchClockHTML(m));
    app.innerHTML=app.innerHTML.replace(/(class="score"><div class="eyebrow">)[^<]+/,`$1Match ${mi+1} of ${day().matches.length}`);
    const editButton=`<button onclick="view='setup';render()">Edit matchday ↗</button>`;
    app.innerHTML=app.innerHTML.replace(editButton,'')+`<div class="match-bottom-tools">${editButton}</div>`;
  }
  app.setAttribute('data-screen',view);
  app.setAttribute('data-mode',m&&isCoachMode(m)?'coach':'player');
};
render();
