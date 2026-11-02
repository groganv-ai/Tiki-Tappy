// v3: last-loaded render layer. Later legacy scripts otherwise overwrite Coach Mode.
(function(){
 const previous=render;
 render=function(){
   previous();
   if(view==='live'&&typeof match==='function'&&match()&&typeof isCoachMode==='function'&&isCoachMode(match())){
     const root=document.querySelector('#app');
     if(root)root.innerHTML=coachScreen(match());
   }
 };
})();
