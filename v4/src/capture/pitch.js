// Normalized coordinates: (0,0) is the goal being attacked, for both teams.
export function pitchPicker(onSelect,{flipped=false}={}){
 const wrap=document.createElement('div');wrap.className='pitch-picker';
 const caption=document.createElement('p');caption.textContent='Tap the pitch to record the location · attacking ↑';wrap.append(caption);
 const field=document.createElement('div');field.className='pitch-field';field.setAttribute('role','group');field.setAttribute('aria-label','Football pitch location');
 field.innerHTML='<div class="pitch-halfway"></div><div class="pitch-circle"></div><div class="pitch-box top"></div><div class="pitch-six top"></div><div class="pitch-box bottom"></div><div class="pitch-six bottom"></div><div class="pitch-spot top"></div><div class="pitch-spot bottom"></div>';
 const marker=document.createElement('span');marker.className='pitch-marker';field.append(marker);
 function choose(x,y){marker.style.left=(x*100)+'%';marker.style.top=(y*100)+'%';marker.hidden=false;onSelect({x:+x.toFixed(4),y:+y.toFixed(4)})}
 field.addEventListener('click',e=>{const r=field.getBoundingClientRect();let x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));if(flipped){x=1-x;y=1-y}choose(x,y)});
 // Keyboard-accessible fixed pitch zones complement precise pointer selection.
 const zones=document.createElement('div');zones.className='pitch-zones';for(const [label,x,y] of [['Left wing',.15,.25],['Centre attack',.5,.18],['Right wing',.85,.25],['Left midfield',.15,.5],['Centre midfield',.5,.5],['Right midfield',.85,.5],['Left defence',.15,.8],['Centre defence',.5,.8],['Right defence',.85,.8]]){const b=document.createElement('button');b.textContent=label;b.addEventListener('click',()=>choose(x,y));zones.append(b)}wrap.append(field,zones);return wrap;
}
