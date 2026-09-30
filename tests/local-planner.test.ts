import {describe,it,expect,vi,afterEach} from 'vitest';
import {newGame} from '../src/game';
import {createShip,SHIPS} from '../src/ships';
import {generateNpc} from '../src/battle/encounter';
import {createBattle,coursePreview,schedule,replaceOrder,stepNaval,completePreloads} from '../src/battle/naval';
import {enterBoarding} from '../src/battle/boarding';
import {localBattleDecision,localDecisionKey} from '../src/battle/local-planner';
import {validateDecision} from '../src/battle/planner';
import {crew,type Battle,type Role,type Temperament} from '../src/battle/types';

function fixture(role:Role='Navy',temperament:Temperament='Bold',configuration='sloop-universal'){
 const g=newGame('Anne',42);g.ship!.id='player';
 const npc=generateNpc(g);npc.ship=createShip(configuration,'Enemy','npc');
 npc.crew=crew(SHIPS.find(s=>s.id===configuration)!.optimalCrew);npc.level=8;npc.role=role;npc.temperament=temperament;
 g.battle=createBattle(g,npc);return g;
}
function duel(b:Battle,initiative=b.npcId){enterBoarding(b,b.playerId);b.phase='duel';b.status='planning';b.duel={initiative,exchange:0,control:0,firstRoll:true,demandedAt:[]};}
afterEach(()=>vi.unstubAllGlobals());
describe('local captain planner',()=>{
 it('is deterministic, offline, engine-validated, and does not mutate its input',()=>{
  const b=fixture().battle!,before=structuredClone(b),fetch=vi.fn(()=>{throw Error('Network forbidden');});vi.stubGlobal('fetch',fetch);
  const decision=localBattleDecision(b);expect(validateDecision(b,decision)).toEqual(decision);
  expect(localBattleDecision(JSON.parse(JSON.stringify(b)))).toEqual(decision);expect(b).toEqual(before);expect(fetch).not.toHaveBeenCalled();
  expect(decision.action_ids.some(id=>id.startsWith('fire_'))).toBe(true);
 });
 it('never reads private player cargo, skills, batteries, plans, or undeclared orders',()=>{
  const b=fixture().battle!,expected=localBattleDecision(b),key=localDecisionKey(b);
  for(const field of ['cargo','skills','batteries','provisions','freight','passengers'])Object.defineProperty(b.ships.player,field,{get(){throw Error(`Private ${field}`);}});
  Object.defineProperty(b,'committed',{get(){throw Error('Private committed orders');}});
  Object.defineProperty(b.plans,'player',{get(){throw Error('Private schedule');}});
  expect(localDecisionKey(b)).toBe(key);expect(localBattleDecision(b)).toEqual(expected);
 });
 it('invalidates cached choices for observations but not UI state or secret plans',()=>{
  const b=fixture().battle!,key=localDecisionKey(b);b.status='waiting';b.decisionKey++;b.committed=['turn_90'];b.plans.player=[];b.ships.player.skills.sailing=10;b.ships.player.cargo.gold=1000;
  expect(localDecisionKey(b)).toBe(key);b.ships.player.heading+=45;expect(localDecisionKey(b)).not.toBe(key);
  const next=localDecisionKey(b);b.ships.npc.cargo.gunpowder=0;expect(localDecisionKey(b)).not.toBe(next);
 });
 it('makes cargo carriers flee and fighting ships maneuver to fire',()=>{
  const merchant=fixture('Merchant').battle!,navy=fixture('Navy').battle!;
  const flee=localBattleDecision(merchant),fight=localBattleDecision(navy);
  expect(coursePreview(merchant,'npc',flee.action_ids).distance).toBeGreaterThan(coursePreview(merchant,'npc',[]).distance);
  expect(flee.action_ids).not.toEqual(fight.action_ids);expect(flee.intent).toContain('retreat');expect(flee.action_ids).toContain('sails_2');
  expect(fight.action_ids.some(id=>id.startsWith('turn_'))).toBe(true);expect(fight.action_ids.some(id=>id.startsWith('fire_'))).toBe(true);
 });
 it('reserves only ammunition and powder it actually possesses',()=>{
  const b=fixture('Pirate').battle!,s=b.ships.npc;s.cargo={'round-shot':2,gunpowder:2};
  const decision=localBattleDecision(b);const plan=schedule(b,b.npcId,decision.action_ids);
  expect(plan.reduce((sum,o)=>sum+(o.resources.gunpowder??0),0)).toBeLessThanOrEqual(2);
  expect(plan.at(-1)!.end).toBeLessThanOrEqual(1000);
 });
 it('prioritizes serious fire and flooding and does not reload an occupied battery',()=>{
  const b=fixture().battle!,s=b.ships.npc;s.states.fire=3;s.states.flooding=2;
  s.batteries.port={loaded:2,ammo:'round-shot',power:1};
  const decision=localBattleDecision(b),timed=decision.action_ids.filter(id=>!id.startsWith('preload_'));
  expect(timed.slice(0,2)).toEqual(['extinguish','control-flooding']);expect(()=>validateDecision(b,decision)).not.toThrow();
 });
 it('uses role-specific disablement ammunition and grapples an attainable prize',()=>{
  const b=fixture('Pirate').battle!;let d=localBattleDecision(b);expect(d.action_ids.some(id=>id.includes('chain-shot'))).toBe(true);
  b.window=2;b.ships.npc.sails=0;b.ships.player.sails=0;b.ships.npc.x=10;b.ships.npc.crew.fit=20;
  d=localBattleDecision(b);expect(d.action_ids).toContain('grapple');
 });
 it('surrenders a doomed cautious captain but never a fanatic with fit crew',()=>{
  const b=fixture('Local','Cautious').battle!;b.ships.npc.ship.hullPoints=5;b.ships.npc.states.fire=3;
  expect(localBattleDecision(b).action_ids).toEqual(['surrender']);b.npc.temperament='Fanatical';expect(localBattleDecision(b).action_ids).not.toContain('surrender');
 });
 it('chooses deck orders by temperament and public control, not the player commitment',()=>{
  const b=fixture('Navy','Cautious').battle!;enterBoarding(b,b.playerId);b.committed=['breakthrough'];
  const d=localBattleDecision(b);expect(d.action_ids).toEqual(['guard']);b.committed=['guard'];expect(localBattleDecision(b)).toEqual(d);
  b.npc.temperament='Aggressive';expect(localBattleDecision(b).action_ids).toEqual(['breakthrough']);
 });
 it('uses only a declared duel attack for defense and reacts legally to a pistol',()=>{
  const b=fixture().battle!;duel(b,b.playerId);b.committed=['quick'];const key=localDecisionKey(b);expect(localBattleDecision(b).action_ids).toEqual(['parry']);
  b.committed=['pistol'];expect(localDecisionKey(b)).not.toBe(key);expect(localBattleDecision(b).action_ids).toEqual(['dodge']);
  duel(b);b.npc.temperament='Aggressive';b.ships.npc.captain.pistol=true;expect(localBattleDecision(b).action_ids).toEqual(['pistol']);
  b.npc.temperament='Honorable';expect(localBattleDecision(b).action_ids).toEqual(['standard']);
 });
 it('validates replacement against the retained tail and the remaining time',()=>{
  const b=fixture().battle!;b.window=2;b.plans.npc=schedule(b,'npc',['turn_45','rally']);b.ships.npc.sails=0;b.replacement=['npc'];b.status='replacement';
  const d=localBattleDecision(b);expect(d.action_ids).toHaveLength(1);expect(()=>replaceOrder(structuredClone(b),'npc',d.action_ids[0])).not.toThrow();expect(d.action_ids[0]).not.toBe('surrender');
 });
 it('cancels an impossible dependent replacement tail rather than forcing a surrender',()=>{
  const b=fixture('Pirate','Fanatical').battle!;b.window=2;b.plans.npc=schedule(b,'npc',['reload_port_round-shot','fire_port']);b.ships.npc.cargo={};b.replacement=['npc'];b.status='replacement';
  expect(localBattleDecision(b).action_ids).toEqual(['cancel-remaining-orders']);
 });
 it('keeps opening schedules legal across every ship class',()=>{
  for(const ship of SHIPS){const b=fixture('Navy','Bold',ship.id).battle!;expect(()=>validateDecision(b,localBattleDecision(b)),ship.id).not.toThrow();}
 });
 it('remains legal with scarce supplies, damaged ships, and all captain personalities',()=>{
  const roles:Role[]=['Merchant','Local','Courier','Navy','Privateer','Pirate','Bounty Hunter'];
  const temperaments:Temperament[]=['Cautious','Bold','Aggressive','Fanatical','Honorable'];
  for(let i=0;i<70;i++){
   const b=fixture(roles[i%roles.length],temperaments[i%temperaments.length],SHIPS[i%SHIPS.length].id).battle!,s=b.ships.npc;
   b.window=i%2+1;s.sails=i%3;s.heading=i*45%360;b.wind=i*90%360;b.windStrength=i%4;
   s.crew.fit=Math.max(1,Math.round(s.crew.fit*(i%4+1)/4));s.ship.hullPoints=Math.max(1,s.ship.hullPoints*(i%5+1)/5);
   s.ship.sailCondition=i%5*25;s.states.fire=i%4;s.states.flooding=(i+1)%4;s.states.shock=(i+2)%4;
   s.cargo={'round-shot':i%8,gunpowder:i%12,grapeshot:i%10};
   const d=localBattleDecision(b);expect(()=>validateDecision(b,d),`${roles[i%7]} / ${temperaments[i%5]} / ${i}`).not.toThrow();
  }
 });
 it('tries boarding or escape instead of circling with destroyed guns',()=>{
  const b=fixture('Navy').battle!;b.ships.npc.ship.cannons={port:0,starboard:0,bow:0,stern:0};
  b.ships.npc.sails=0;b.ships.player.sails=0;b.ships.npc.x=10;
  expect(localBattleDecision(b).action_ids).toContain('grapple');
  b.ships.npc.crew.fit=2;expect(localBattleDecision(b).objective).toContain('Disengage');
 });
 it('plays legal tactical choices through repeated naval windows and save resumes',()=>{
  let g=fixture('Navy','Bold');
  for(let i=0;i<5&&g.battle!.phase==='naval';i++){
   let b=g.battle!;b.committed=[];b.accepted=localBattleDecision(b);b.plans.player=[];b.plans.npc=schedule(b,'npc',b.accepted.action_ids);completePreloads(b);b.status='playback';
   for(let steps=0;steps<50&&b.phase==='naval'&&b.window===i+1;steps++){
    if((b as Battle).status==='replacement'){
     if(b.replacement?.includes('npc')){const d=localBattleDecision(b);replaceOrder(b,'npc',d.action_ids[0]);}
     delete b.replacement;b.status='playback';
    }
    if(b.status==='playback')stepNaval(g,b);
   }
   if(b.phase==='naval'){expect(b.status).toBe('planning');expect(localBattleDecision(JSON.parse(JSON.stringify(b)))).toEqual(localBattleDecision(b));}
  }
  expect(g.battle!.log.some(line=>line.includes('port:')||line.includes('starboard:'))).toBe(true);
 });
 it('benchmarks a bounded opening planner',()=>{
  const b=fixture().battle!;localBattleDecision(b);const samples:number[]=[];
  for(let i=0;i<5;i++){const start=performance.now();localBattleDecision(b);samples.push(performance.now()-start);}
  console.info(`local planner opening: median ${[...samples].sort((a,z)=>a-z)[2].toFixed(1)} ms; max ${Math.max(...samples).toFixed(1)} ms`);
  expect(Math.max(...samples)).toBeLessThan(2000);
  for(const id of ['frigate-warship','man-of-war-warship']){const large=fixture('Navy','Bold',id).battle!;localBattleDecision(large);const start=performance.now();localBattleDecision(large);console.info(`${id}: ${(performance.now()-start).toFixed(1)} ms`);}
 });
});
