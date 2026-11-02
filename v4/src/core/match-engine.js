export function newMatch(){return {id:crypto.randomUUID(),team:'Our Team',opponent:'Opposition',players:[{id:'p1',name:'Player 1',role:'GK',onPitch:true},{id:'p2',name:'Player 2',role:'DF',onPitch:true},{id:'p3',name:'Player 3',role:'AT',onPitch:true}],mode:'coach',formation:'5-a-side',clock:{elapsedMs:0,startedAt:null,running:false,period:1},events:[]};}
export function elapsed(clock,now=Date.now()){return clock.elapsedMs+(clock.running?Math.max(0,now-clock.startedAt):0)}
export function toggleClock(clock,now=Date.now()){if(clock.finished||clock.halfTime)throw Error('Clock cannot toggle at half/full time');const ms=elapsed(clock,now);return {...clock,elapsedMs:ms,running:!clock.running,startedAt:clock.running?null:now};}
export function score(events){return events.reduce((s,e)=>{if(e.type==='goal')s[e.team==='opposition'?1:0]++;return s},[0,0]);}
export function formatClock(ms){const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}

export function clockStatus(clock){return clock.finished?'FULL TIME':clock.halfTime?'HALF TIME':clock.running?'IN PLAY':'PAUSED'}
export function halfTime(clock,now=Date.now()){if(clock.finished||clock.period!==1)throw Error('Half time unavailable');return {...clock,elapsedMs:elapsed(clock,now),startedAt:null,running:false,halfTime:true}}
export function secondHalf(clock,now=Date.now()){if(!clock.halfTime||clock.period!==1)throw Error('Not at half time');return {...clock,period:2,elapsedMs:0,startedAt:now,running:true,halfTime:false}}
export function fullTime(clock,now=Date.now()){if(clock.finished)throw Error('Already finished');return {...clock,elapsedMs:elapsed(clock,now),startedAt:null,running:false,halfTime:false,finished:true}}
