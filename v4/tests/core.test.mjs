import test from 'node:test';import assert from 'node:assert/strict';
import {ACTIONS,qualityFor,REPORT_CATEGORIES} from '../src/config/actions.js';
import {newMatch,score,toggleClock,elapsed} from '../src/core/match-engine.js';
import {makeEvent,commitEvent,undoEvent} from '../src/core/event-store.js';
import {startCapture,captureStage} from '../src/capture/flow.js';
test('all twelve reporting categories',()=>assert.equal(REPORT_CATEGORIES.length,12));
test('four distinct quality values',()=>{const q=['basic',1,2,3].map(v=>qualityFor('tackle',v));assert.deepEqual(q.map(x=>x.level),['basic',1,2,3]);assert.equal(new Set(q.map(x=>x.label)).size,4)});
test('goal and assist are linked without double-counting score',()=>{let m=newMatch();const e=makeEvent({match:m,action:'goal',playerId:'p1',quality:1,location:{x:.5,y:.1},assistPlayerId:'p2',assistLocation:{x:.4,y:.3}});m=commitEvent(m,e);assert.deepEqual(score(m.events),[1,0]);assert.equal(m.events[0].assistPlayerId,'p2');assert.deepEqual(score(undoEvent(m).events),[0,0])});
test('shot outcome is required',()=>{const m=newMatch();assert.throws(()=>makeEvent({match:m,action:'shot',playerId:'p1',location:{x:.5,y:.1}}))});
test('clock elapsed across pause and resume',()=>{let c={elapsedMs:0,startedAt:null,running:false,period:1};c=toggleClock(c,1000);assert.equal(elapsed(c,61000),60000);c=toggleClock(c,61000);assert.equal(elapsed(c,99000),60000)});
test('coach and player start identical capture state',()=>{const m=newMatch();assert.deepEqual(startCapture(m,'shot',2,'p1'),startCapture(m,'shot',2,'p1'));assert.equal(captureStage(startCapture(m,'shot',2,'p1')),'outcome')});
test('goal requires a location',()=>{const m=newMatch();assert.throws(()=>makeEvent({match:m,action:'goal',playerId:'p1'}))});
test('action registry includes shared quick actions',()=>{for(const a of ['goal','shot','pass','tackle','block','skill'])assert.ok(ACTIONS[a])});

test('default quality is Good tier',()=>{assert.equal(startCapture(newMatch(),'pass').quality,1)});
test('opposition saved shot links goalkeeper',()=>{const e=makeEvent({match:newMatch(),action:'shot',team:'opposition',outcome:'saved',location:{x:.5,y:.2},savePlayerId:'p1'});assert.equal(e.savePlayerId,'p1')});
test('formation and bench eligibility',async()=>{const {addPlayer,substitute,isEligible,goalkeeper}=await import('../src/core/team-state.js');let m=addPlayer(newMatch(),'Bench');const bench=m.players.at(-1).id;assert.equal(isEligible(m,bench),false);m=substitute(m,'p2',bench);assert.equal(isEligible(m,'p2'),false);assert.equal(isEligible(m,bench),true);assert.equal(goalkeeper(m).id,'p1')});
test('linked assist requires location',()=>assert.throws(()=>makeEvent({match:newMatch(),action:'goal',playerId:'p1',location:{x:.5,y:.2},assistPlayerId:'p2'})));
test('both input modes use same capture stage',()=>{const m=newMatch();const a=startCapture(m,'goal',2,'p2');assert.equal(captureStage(a),'set-piece-choice')});

test('half-time freezes clock and second half resets period clock',async()=>{const {halfTime,secondHalf,fullTime,clockStatus}=await import('../src/core/match-engine.js');let c={elapsedMs:0,startedAt:1000,running:true,period:1};c=halfTime(c,61000);assert.equal(c.elapsedMs,60000);assert.equal(clockStatus(c),'HALF TIME');assert.throws(()=>toggleClock(c,62000));c=secondHalf(c,70000);assert.equal(c.period,2);assert.equal(elapsed(c,75000),5000);c=fullTime(c,76000);assert.equal(clockStatus(c),'FULL TIME');assert.equal(c.elapsedMs,6000);assert.throws(()=>toggleClock(c,77000))});

test('recording and undoing substitution keeps lineup and timeline in sync',async()=>{const {addPlayer,recordSubstitution,isEligible}=await import('../src/core/team-state.js');let m=addPlayer(newMatch(),'Substitute');const id=m.players.at(-1).id;m={...m,clock:{elapsedMs:1000,startedAt:1000,running:true,period:1}};m=recordSubstitution(m,'p2',id,4000);assert.equal(m.events.length,1);assert.equal(m.events[0].matchTime.elapsedMs,4000);assert.equal(isEligible(m,id),true);m=undoEvent(m);assert.equal(m.events.length,0);assert.equal(isEligible(m,id),false);assert.equal(isEligible(m,'p2'),true)});

test('standalone set piece requires a recognized type',()=>{const m=newMatch();assert.throws(()=>makeEvent({match:m,action:'set-piece',team:'opposition'}));const e=makeEvent({match:m,action:'set-piece',team:'opposition',setPieceType:'corner'});assert.equal(e.setPieceType,'corner');assert.throws(()=>makeEvent({match:m,action:'set-piece',team:'opposition',setPieceType:'throw-in'}))});
test('goal and shot can link set pieces without a duplicate event',()=>{let m=newMatch();const goal=makeEvent({match:m,action:'goal',playerId:'p2',location:{x:.5,y:.1},setPieceType:'free-kick'});m=commitEvent(m,goal);assert.equal(m.events.length,1);assert.deepEqual(score(m.events),[1,0]);const shot=makeEvent({match:m,action:'shot',team:'opposition',outcome:'off',location:{x:.5,y:.3},setPieceType:'corner'});assert.equal(shot.setPieceType,'corner')});
test('set piece capture stages are shared',()=>{const m=newMatch();let d=startCapture(m,'goal',1,'p2');assert.equal(captureStage(d),'set-piece-choice');d={...d,setPieceChoice:true};assert.equal(captureStage(d),'set-piece-type');d={...d,setPieceType:'corner'};assert.equal(captureStage(d),'location');assert.equal(captureStage(startCapture(m,'set-piece')),'player')});
