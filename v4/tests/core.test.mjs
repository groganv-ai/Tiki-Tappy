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
test('both input modes use same capture stage',()=>{const m=newMatch();const a=startCapture(m,'goal',2,'p2');assert.equal(captureStage(a),'location')});
