// Fictional examples reuse the report renderer and approved action icons.
const HOME_MOMENTS=[
 {action:'Goal',player:'Osian',qualityLabel:'Great goal',at:3*60000},
 {action:'Save',player:'Ava',qualityLabel:'Great save',at:5*60000},
 {action:'Tackle',player:'Leo',qualityLabel:'Brilliant tackle',at:7*60000},
 {action:'Skill',player:'Mia',qualityLabel:'Trick or turn',at:9*60000},
 {action:'Teamwork',player:'Sam',qualityLabel:'Supporting run',at:12*60000}
];
function homeMomentsHTML(){
 const description=HOME_MOMENTS.map(e=>e.player+' · '+e.qualityLabel).join('; ');
 return `<section class="home-moments" aria-label="Examples of tracked moments"><div class="home-moment-screen" role="img" aria-label="Example match report moments: ${esc(description)}">${HOME_MOMENTS.map((e,i)=>`<div class="home-moment-slide moment-${e.action.toLowerCase()}" style="--moment-delay:${i*4}s" aria-hidden="true"><div class="home-moment-meta"><span>Match Report</span><span>${esc(e.action)}</span></div>${compactTimelineHTML([{...e,category:e.action,reportId:'home-example-'+i}])}</div>`).join('')}</div><div class="home-moment-controls"><span>Example moments</span><button type="button" aria-pressed="false" onclick="toggleHomeMoments(this)">Pause examples</button></div></section>`;
}
function toggleHomeMoments(button){
 const showcase=button.closest('.home-moments'),paused=showcase.classList.toggle('is-paused');
 button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Play examples':'Pause examples';
}
const homeMomentsWelcomeBefore=welcome;
welcome=function(){
 homeMomentsWelcomeBefore();
 $('#app').innerHTML=$('#app').innerHTML.replace('<div class="clock">00:00</div>',homeMomentsHTML());
};
render();
