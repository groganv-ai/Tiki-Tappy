const fs=require('fs'),assert=require('assert');
const boot=Function('require',fs.readFileSync('free-matchday-tests.cjs','utf8').split('const {c,el,run}=boot();')[0]+';return boot')(require);
function fixture(){
 const f=boot();f.run('demo()');const raf=new Map(),timers=new Map();let id=0;f.frames=raf;f.timers=timers;f.encoders=[];f.streams=[];f.prepared=[];f.retries=[];
 Object.assign(f.c,{Blob,performance:{now:()=>0},requestAnimationFrame:fn=>{raf.set(++id,fn);return id},cancelAnimationFrame:key=>raf.delete(key),setTimeout:fn=>{timers.set(++id,fn);return id},clearTimeout:key=>timers.delete(key)});
 f.c.document.createElement=()=>({remove(){this.removed=true}});f.el('#recordStatus').after=()=>{};
 f.c.MediaRecorder=class {static isTypeSupported(t){return t==='video/mp4'}constructor(stream,options){this.state='inactive';this.mimeType=options.mimeType;this.stream=stream;f.encoders.push(this)}start(){this.state='recording'}stop(){this.state='inactive';this.stops=(this.stops||0)+1}finish(size=2000){this.ondataavailable({data:new Blob([new Uint8Array(size)])});this.onstop()}fail(){this.onerror({error:Error('Encoder failed')})}};
 f.c.canvas={getContext:()=>({}),captureStream(){const track={stops:0,stop(){this.stops++}},stream={track,getTracks:()=>[track]};f.streams.push(stream);return stream}};
 f.c.prepared=f.prepared;f.c.retries=f.retries;
 f.run('paintReplay=()=>{};replayDuration=()=>2;showPrepared=(blob,name)=>prepared.push({blob,name});exportVideo=filter=>retries.push(filter);startReplay(canvas,{isMatchday:true,highlightFilter:"all",events:[]})');return f;
}
(async()=>{
 // A cancelled old animation cannot paint or schedule into its replacement.
 {const f=fixture(),old=[...f.frames.values()][0];f.run('painted=0;paintReplay=()=>painted++;startReplay(canvas,{events:[]})');const count=f.frames.size;old(1000);assert.equal(f.run('painted'),0);assert.equal(f.frames.size,count)}
 // Normal encoding keeps file naming/format and frees encoder resources once.
 {const f=fixture(),task=f.run('recordReplay()');f.run('recordReplay()');assert.equal(f.encoders.length,1);[...f.frames.values()][0](3000);f.encoders[0].finish();await task;assert.equal(f.prepared[0].name,'matchday-highlights.mp4');assert.equal(f.prepared[0].blob.type,'video/mp4');assert.equal(f.streams[0].track.stops,1);assert.equal(f.timers.size,0);assert.equal(f.run('playback'),null)}
 // Cancel restores the preview once, without emitting a file.
 {const f=fixture(),task=f.run('recordReplay()');f.run('cancelRecording()');f.encoders[0].finish();await task;assert.equal(f.prepared.length,0);assert.deepEqual(f.retries,['all']);assert.equal(f.streams[0].track.stops,1)}
 // Disposing a recording must stop its encoder and ignore late completion.
 {const f=fixture(),task=f.run('recordReplay()');f.run('stopReplay();startReplay(canvas,{events:[],isMatchday:true});recordReplay()');const newer=f.run('playback');assert.equal(f.encoders[0].stops,1);f.encoders[0].finish();await task;assert.equal(f.run('playback'),newer);assert.equal(f.prepared.length,0);assert.equal(f.streams[1].track.stops,0);f.run('stopReplay()');f.encoders[1].finish();await Promise.resolve();assert.equal(f.streams[1].track.stops,1)}
 // Detached previews, navigation and changed matchdays cannot publish late video.
 for(const change of ['canvas.isConnected=false','view="setup"','data.selected="another-day"']){const f=fixture(),task=f.run('recordReplay()');f.run(change);f.encoders[0].finish();await task;assert.equal(f.prepared.length,0);assert.equal(f.streams[0].track.stops,1);assert.equal(f.run('playback'),null)}
 // Encoder failure releases tracks, stops the recorder and permits retry.
 {const f=fixture(),task=f.run('recordReplay()');f.encoders[0].fail();await task;assert.equal(f.streams[0].track.stops,1);assert.equal(f.encoders[0].stops,1);assert.equal(f.el('#recordButton').disabled,false);assert(f.el('#recordStatus').textContent.includes('Encoder failed'));assert.equal(f.timers.size,0)}
 // Empty output is not published; watchdog cancellation returns to preview.
 {const f=fixture(),task=f.run('recordReplay()');f.encoders[0].finish(10);await task;assert.equal(f.prepared.length,0);assert.equal(f.streams[0].track.stops,1)}
 {const f=fixture(),task=f.run('recordReplay()');[...f.timers.values()][0]();f.encoders[0].finish();await task;assert.deepEqual(f.retries,['all']);assert.equal(f.prepared.length,0)}
 // Unsupported browsers retain the animated preview and receive the existing fallback.
 {const f=fixture();delete f.c.MediaRecorder;await f.run('recordReplay()');assert(f.run('playback'));assert(f.el('#recordStatus').textContent.includes('cannot record'));assert.equal(f.streams.length,0)}
 console.log('PASS: preview identity, encoder success/cancel/error/empty/watchdog/unsupported paths, duplicate-start guard, stale callback isolation, stream/timeout cleanup and preserved MP4 filenames.');
})().catch(e=>{console.error(e);process.exitCode=1});


