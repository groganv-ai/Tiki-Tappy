// A playback session owns its animation, encoder, timeout and captured tracks.
// Stale callbacks may release their own resources, never publish into a newer UI.
function releasePlayback(state){
 if(!state||state.released)return;state.released=true;
 cancelAnimationFrame(state.raf);clearTimeout(state.timer);
 state.stream?.getTracks().forEach(track=>track.stop());
}
function stopReplay(){
 const state=playback;if(!state)return;
 playback=null;state.cancelled=true;releasePlayback(state);
 if(state.recorder?.state==='recording')state.recorder.stop();
}
function playbackCurrent(state){
 if(playback!==state)return false;
 if(state.canvas.isConnected===false||day()?.id!==state.dayId||view!==state.view){stopReplay();return false}
 return true;
}
function startReplay(canvas,model){
 stopReplay();const start=performance.now(),state={raf:null,model,canvas,dayId:day()?.id,view};playback=state;
 function frame(now){
  if(!playbackCurrent(state))return;
  paintReplay(canvas.getContext('2d'),model,((now-start)/1000)%replayDuration(model));
  state.raf=requestAnimationFrame(frame);
 }
 state.raf=requestAnimationFrame(frame);
}
function cancelRecording(){
 const state=playback;
 if(!state?.recording)return closeExport();
 state.cancelled=true;
 if(state.recorder?.state==='recording')state.recorder.stop();
}
async function recordReplay(){
 const current=playback;if(!current||current.recording)return;
 const {canvas,model}=current,status=$('#recordStatus');
 if(typeof MediaRecorder==='undefined'||!canvas.captureStream){status.textContent='This browser cannot record a canvas video. The animated preview works; use the Report image fallback or try another browser.';return}
 const mime=['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
 if(!mime){status.textContent='No compatible video encoder is available. Use Report image instead.';return}
 const modelCopy=JSON.parse(JSON.stringify(model));stopReplay();
 const state={canvas,model:modelCopy,dayId:day()?.id,view,recording:true,raf:null,cancelled:false};playback=state;
 let cancel;
 try{
  paintReplay(canvas.getContext('2d'),modelCopy,0);
  state.stream=canvas.captureStream(24);
  const rec=state.recorder=new MediaRecorder(state.stream,{mimeType:mime,videoBitsPerSecond:2200000}),chunks=[];
  const done=new Promise((resolve,reject)=>{rec.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};rec.onerror=e=>reject(e.error||new Error('Encoder error'));rec.onstop=resolve});
  $('#recordButton').disabled=true;
  cancel=document.createElement('button');cancel.textContent='Cancel recording';cancel.onclick=cancelRecording;status.after(cancel);
  const duration=replayDuration(modelCopy),start=performance.now();rec.start(250);
  function frame(now){
   if(!playbackCurrent(state))return;
   try{
    const sec=Math.min(duration,(now-start)/1000);paintReplay(canvas.getContext('2d'),modelCopy,sec);
    status.textContent=`Recording ${Math.floor(sec)} / ${Math.ceil(duration)} seconds · ${mime.startsWith('video/mp4')?'MP4':'WebM'}. Keep this tab open.`;
    if(sec>=duration){if(rec.state==='recording')rec.stop()}else state.raf=requestAnimationFrame(frame);
   }catch(error){state.failure=error;if(rec.state==='recording')rec.stop()}
  }
  state.raf=requestAnimationFrame(frame);
  state.timer=setTimeout(()=>{if(playback===state&&rec.state==='recording'){state.cancelled=true;rec.stop()}},duration*1000+20000);
  await done;
  if(!playbackCurrent(state))return;
  if(state.failure)throw state.failure;
  if(state.cancelled){stopReplay();toast('Recording cancelled or interrupted. Try again with this tab in the foreground.');return exportVideo(modelCopy.highlightFilter||'major')}
  const type=rec.mimeType.split(';')[0],blob=new Blob(chunks,{type});if(blob.size<1000)throw Error('The encoder produced an empty video');
  stopReplay();showPrepared(blob,(modelCopy.isMatchday?'matchday-highlights.':'match-highlights.')+(type.includes('mp4')?'mp4':'webm'));
 }catch(error){
  if(playbackCurrent(state)){stopReplay();status.textContent='Video could not be created: '+error.message+'. Try another browser, or use Report image.';const button=$('#recordButton');if(button)button.disabled=false}
 }finally{releasePlayback(state);cancel?.remove()}
}

