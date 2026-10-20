// Full time leads to the two things people want to keep and share.
function postMatchOutputsHTML(m){
 const model=makeReplayModel(),events=highlightPresetEvents(model.events,'major'),seconds=v2HighlightSeconds(events,model);
 return `<section class="post-match-outputs" aria-label="Share your match"><article class="post-match-output report-output"><span class="eyebrow">Your match report</span><h2>The score. The moments. The story.</h2><p>Share a report image with scorers, assists and key actions. Choose By action or Timeline below.</p><button class="primary" onclick="exportMatchReport()">Share match report ↗</button></article><article class="post-match-output video-output"><span class="eyebrow">Video highlights</span><h2>Bring the match to life.</h2><p>Choose a filter. We’ll assemble the timeline, goals and linked replays automatically.</p><p class="hint">Major Events · ${highlightCountLabel(events.length)} · about ${highlightDurationLabel(seconds)}</p><button onclick="exportVideo()">Create highlights →</button></article></section>${m.ended?`<section class="post-match-finishing"><strong>Optional finishing touches</strong><span>${m.summary?'✓ Match summary':'Add a match summary'} · ${day().photo?'✓ Photo':'Add a permitted photo'} · ${m.playerOfDay?'✓ Player of the Day':'Choose Player of the Day'}</span><div class="links"><button onclick="document.getElementById('matchsummary').focus()">Summary</button><button onclick="document.getElementById('photo-permission').focus()">Photo</button><button onclick="playerDayModal()">${m.playerOfDay?'Change':'Choose'} Player of the Day</button></div></section>`:''}`;
}
const postMatchReportBefore=renderReport;
renderReport=function(){
 postMatchReportBefore();const app=$('#app'),m=match();
 app.innerHTML=app.innerHTML.replace('<h1>Match report</h1>',`<h1>${m.ended?'Full time. Share your match.':'Your match story.'}</h1>`).replace('<div class="report-layout">',postMatchOutputsHTML(m)+'<div class="report-layout">').replace(/Choose highlights (?:&amp;|&) create video/g,'Create highlights').replace('your selected highlights','automatically chosen highlights');
};
const postMatchClockBefore=selectClock;
selectClock=function(action){
 const m=match(),wasEnded=!!m?.ended;postMatchClockBefore(action);
 if(action==='full'&&m===match()&&m.ended&&!wasEnded){closeModal();view='report';render()}
};
render();
