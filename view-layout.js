// Screen metadata only; Match Centre markup is owned by v02.js.
const renderBeforeViewLayout=render;
render=function(){
  if(clockHold&&(clockHold.match!==match()||view!=='live'))cancelClockHold();
  renderBeforeViewLayout();
  const app=$('#app'),m=match();
  app.setAttribute('data-screen',view);
  app.setAttribute('data-mode',m&&isCoachMode(m)?'coach':'player');
};
render();
