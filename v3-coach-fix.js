// Final v3 mode switch and Coach Mode render, after all legacy UI layers.
(function(){
 const prior=render;
 render=function(){
   prior();
   if(view!=='live'||typeof match!=='function'||!match())return;
   const m=match(),root=document.querySelector('#app');
   if(!root)return;
   if(typeof isCoachMode==='function'&&isCoachMode(m)){
     root.innerHTML=coachScreen(m);
   }else{
     // Explicit entry to new UI, even for existing saved Player Mode matchdays.
     const switcher=document.createElement('div');
     switcher.className='v3-switcher';
     switcher.style.cssText='position:sticky;top:0;z-index:30;background:#174f3b;color:white;padding:12px;border-radius:12px;margin:10px 0;text-align:center';
     switcher.innerHTML='<button style="background:#d5ff6c;color:#174f3b;font-weight:900;padding:12px 18px;border-radius:10px" onclick="setInputMode(\'coach\')">Open new Coach Mode ★</button>';
     root.prepend(switcher);
   }
 };
})();
