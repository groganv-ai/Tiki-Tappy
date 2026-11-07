// One owner for current matchday image output. Renderers receive a saved snapshot;
// asynchronous encoders publish complete files only while their request is current.
let activeReportExport=null;
function reportOutputSnapshot(){return {day:JSON.parse(JSON.stringify(day())),flow:{...dayFlow()},scope:playerSummaryScope(),sort:playerSummarySort}}
function reportOutputKey(snapshot=reportOutputSnapshot()){return JSON.stringify(snapshot)}
async function makeDayReportPages(snapshot=reportOutputSnapshot()){
 return snapshot.flow.reportView==='players'
  ?makePlayerSummaryPages(playerSummaryModel(snapshot.day,snapshot.scope,snapshot.sort))
  :makeCompactReportPages(compactReportModel(snapshot.day,snapshot.flow));
}
function cancelReportExport(){activeReportExport=null;matchReportBusy=false}
function reportExportCurrent(request){return activeReportExport===request&&view==='report'&&day()?.id===request.snapshot.day.id&&dayReviewValid()&&reportOutputKey()===request.key}
async function exportMatchReport(){
 if(!dayReviewValid())return startDayFlow();
 if(matchReportBusy)return;
 if(playback?.recording)return toast('Finish or cancel recording first.');
 dayFlow().output='summary';save();
 disposeExport();
 const snapshot=reportOutputSnapshot(),request={snapshot,key:reportOutputKey(snapshot)};
 activeReportExport=request;matchReportBusy=true;
 const isPlayerSummary=snapshot.flow.reportView==='players';
 const exportScope=isPlayerSummary?playerSummaryModel(snapshot.day,snapshot.scope,snapshot.sort).scopeLabel:'All '+snapshot.day.matches.length+' games';
 const filterLabel=HIGHLIGHT_FILTERS.find(p=>p.id===snapshot.flow.filter)?.label;
 let pages=[],urls=[];
 toast('Creating the whole matchday report…');
 try{
  pages=await makeDayReportPages(snapshot);
  if(!reportExportCurrent(request))return;
  const files=[];
  for(let i=0;i<pages.length;i++){
   const blob=await new Promise(resolve=>pages[i].toBlob(resolve,'image/png'));
   if(!reportExportCurrent(request))return;
   if(!blob)throw Error('Image creation failed');
   files.push({blob,name:`${isPlayerSummary?'player-summary':'matchday-report'}-${i+1}.png`});
  }
  // No partial files or object URLs escape while pages are still encoding.
  for(const file of files)urls.push(URL.createObjectURL(file.blob));
  matchReportFiles=files;matchReportURLs=urls;
  exportPanel(isPlayerSummary?'Your Player Summary':'Your Match Report',`<p>${esc(exportScope)} · ${isPlayerSummary?'All recorded player actions':filterLabel} · ${pages.length} image page(s).</p><div class="links"><button class="primary" onclick="shareMatchReportImages()">${isPlayerSummary?'Share player summary':'Share matchday report'} ↗</button>${files.map((f,i)=>`<a href="${urls[i]}" download="${f.name}">Save page ${i+1}</a>`).join('')}<button onclick="closeExport();leaveDayFlow()">Save for later</button></div><p class="hint" id="matchReportShareStatus">Choose WhatsApp in your phone’s share menu, or save the image pages and attach them together.</p>${urls.map((url,i)=>`<img src="${url}" alt="Combined matchday report page ${i+1}">`).join('')}`);
 }catch(e){
  for(const url of urls)URL.revokeObjectURL(url);
  if(matchReportURLs===urls){matchReportFiles=[];matchReportURLs=[]}
  if(reportExportCurrent(request)){toast('Could not create the report. Try again or download the text log.')}
 }finally{
  for(const page of pages){page.width=0;page.height=0}
  if(activeReportExport===request){activeReportExport=null;matchReportBusy=false}
 }
}
exportImage=exportMatchReport;
