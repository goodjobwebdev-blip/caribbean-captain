import {describe,it,expect} from 'vitest';
import {newGame} from '../src/game';
import {generateNpc} from '../src/battle/encounter';
import {completePreloads,coursePreview,createBattle,schedule,stepNaval} from '../src/battle/naval';
import {maneuverPlans} from '../src/battle/maneuvers';
import {crew,type Battle} from '../src/battle/types';
import {createShip,SHIPS} from '../src/ships';

function fixture(){
 const g=newGame('Anne',42);g.ship!.id='player';
 g.cargo={'round-shot':100,'chain-shot':20,grapeshot:20,bombs:20,gunpowder:150,planks:20,tools:2,rope:20,sailcloth:20,medicine:10};
 const npc=generateNpc(g);npc.ship=createShip('sloop-universal','Enemy','npc');npc.crew=crew(10);
 g.battle=createBattle(g,npc);return g;
}

describe('editable naval maneuver plans',()=>{
 it('suggests a resource-valid broadside and escape without changing the battle',()=>{
  const b=fixture().battle!,before=structuredClone(b),plans=maneuverPlans(b);
  expect(plans.map(p=>p.id)).toContain('broadside');
  expect(plans.map(p=>p.id)).toContain('break-away');
  expect(plans.map(p=>p.id)).not.toContain('damage-control');
  for(const plan of plans){
   expect(plan.title.length).toBeGreaterThan(0);expect(plan.description.length).toBeGreaterThan(0);
   expect(()=>schedule(b,b.playerId,plan.ids)).not.toThrow();
   expect(schedule(b,b.playerId,plan.ids).at(-1)?.end??0).toBeLessThanOrEqual(1000);
  }
  expect(b).toEqual(before);expect(maneuverPlans(b)).toEqual(plans);
 });

 it('fires the suggested broadside with a holding-course opponent, rather than requesting replacement',()=>{
  const g=fixture(),b=g.battle!,plan=maneuverPlans(b).find(p=>p.id==='broadside')!;
  expect(plan.ids.some(id=>id.startsWith('turn_'))).toBe(true);
  b.plans.player=schedule(b,b.playerId,plan.ids);b.plans.npc=[];
  completePreloads(b);b.status='playback';
  const shot=b.plans.player.find(o=>o.kind==='fire')!;
  for(let i=0;i<20&&b.status==='playback'&&b.unit<shot.end;i++)stepNaval(g,b);
  expect(b.status).toBe('playback');expect(b.unit).toBe(shot.end);
  expect(b.rolls.some(r=>r.label==='Cannon volley')).toBe(true);
  expect(b.ships.player.batteries[shot.battery!].loaded).toBe(0);
 });

 it('reloads in later windows and respects free preloads already spent',()=>{
  const b=fixture().battle!;
  for(const firstWindow of [true,false]){
   b.window=firstWindow?1:2;b.preloaded=['player:port','player:starboard'];
   const plan=maneuverPlans(b).find(p=>p.id==='broadside')!;
   expect(plan).toBeDefined();expect(plan.ids.some(id=>id.startsWith('preload_'))).toBe(false);
   expect(plan.ids.some(id=>id.startsWith('reload_'))).toBe(true);
   expect(()=>schedule(b,b.playerId,plan.ids)).not.toThrow();
  }
 });

 it('retains an existing load and never queues unaffordable or unavailable guns',()=>{
  const b=fixture().battle!,p=b.ships.player;p.cargo={};
  expect(maneuverPlans(b).some(p=>p.id==='broadside')).toBe(false);
  p.batteries.port={loaded:2,ammo:'round-shot',power:1};
  const attack=maneuverPlans(b).find(p=>p.id==='broadside')!;
  expect(attack.ids).toContain('fire_port');
  expect(attack.ids.some(id=>/reload|preload|unload/.test(id))).toBe(false);
  p.ship.cannons.port=0;p.ship.cannons.starboard=0;
  expect(maneuverPlans(b).some(p=>p.id==='broadside')).toBe(false);
 });

 it('omits a broadside when the enemy cannot be in ammunition range',()=>{
  const b=fixture().battle!;b.ships.npc.x=2000;b.ships.npc.sails=0;
  expect(maneuverPlans(b).some(p=>p.id==='broadside')).toBe(false);
  b.ships.player.cargo={};b.ships.player.batteries.port={loaded:2,ammo:'grapeshot',power:1};
  b.ships.npc.x=450;
  expect(maneuverPlans(b).some(p=>p.id==='broadside')).toBe(false);
 });

 it('does not suggest point-blank bombs that would damage the firing ship',()=>{
  const b=fixture().battle!,p=b.ships.player,n=b.ships.npc;
  p.cargo={};p.ship.sailCondition=0;p.batteries.starboard={loaded:2,ammo:'bombs',power:1};
  n.x=0;n.y=10;n.sails=0;
  expect(maneuverPlans(b).some(p=>p.id==='broadside')).toBe(false);
 });

 it('unfurls sails before a turn when maneuvering from rest',()=>{
  const b=fixture().battle!;b.ships.player.sails=0;b.ships.npc.sails=0;
  const plans=maneuverPlans(b);expect(plans.some(p=>p.id==='broadside')).toBe(true);
  for(const p of plans){
   const orders=schedule(b,b.playerId,p.ids),turn=orders.findIndex(o=>o.kind==='turn');
   if(turn>=0)expect(orders.slice(0,turn).some(o=>o.kind==='sails'&&o.setting!>0)).toBe(true);
  }
 });

 it('only spends damage-control orders on current conditions and engagement damage',()=>{
  const b=fixture().battle!,p=b.ships.player;
  p.states.fire=1;p.states.flooding=1;p.states.shock=1;
  const plan=maneuverPlans(b).find(p=>p.id==='damage-control')!;
  expect(plan.ids).toEqual(['extinguish','control-flooding','rally']);
  expect(schedule(b,b.playerId,plan.ids).at(-1)!.end).toBeLessThanOrEqual(1000);
  p.states={fire:0,flooding:0,rigging:0,shock:0};p.ship.hullPoints=p.startHull=50;p.ship.sailCondition=p.startSails=40;
  p.crew.injured=3;p.startFit=p.crew.fit;
  expect(maneuverPlans(b).some(p=>p.id==='damage-control')).toBe(false);
 });

 it('reserves scarce repairs and omits tool-dependent actions without tools',()=>{
  const b=fixture().battle!,p=b.ships.player;
  p.ship.hullPoints-=10;p.states.flooding=2;p.ship.sailCondition-=10;p.crew.fit-=2;p.crew.injured=2;
  p.cargo={planks:1,sailcloth:1,rope:1,medicine:1};
  const noTools=maneuverPlans(b).find(p=>p.id==='damage-control')!;
  expect(noTools.ids).toEqual(['doctor']);
  p.cargo.tools=1;
  const limited=maneuverPlans(b).find(p=>p.id==='damage-control')!;
  expect(limited.ids.filter(id=>id==='control-flooding'||id==='patch-hull')).toHaveLength(1);
  expect(()=>schedule(b,b.playerId,limited.ids)).not.toThrow();
 });

 it('offers a grapple for stationary ships already alongside',()=>{
  const b=fixture().battle!;b.ships.player.sails=0;b.ships.npc.sails=0;b.ships.npc.x=10;
  const plan=maneuverPlans(b).find(p=>p.id==='boarding')!;
  expect(plan.ids).toEqual(['grapple']);expect(plan.description).toContain('roll');
 });

 it('does not promise a grapple simply because a target starts close',()=>{
  const b=fixture().battle!,p=b.ships.player,n=b.ships.npc;
  p.sails=0;p.ship.sailCondition=0;n.x=10;n.heading=0;n.sails=2;
  const boarding=maneuverPlans(b).find(p=>p.id==='boarding');
  expect(boarding?.ids??[]).not.toContain('grapple');
 });

 it('chooses a separation course better than idling and agrees with the course preview',()=>{
  const b=fixture().battle!,plan=maneuverPlans(b).find(p=>p.id==='break-away')!;
  const preview=coursePreview(b,b.playerId,plan.ids);
  expect(preview.distance).toBeGreaterThan(coursePreview(b,b.playerId,[]).distance);
  expect(plan.description).toContain(String(Math.round(preview.distance)));
 });

 it('ignores hidden opponent decisions and existing player schedules',()=>{
  const b=fixture().battle!,plans=maneuverPlans(b);
  b.plans={npc:schedule(b,b.npcId,['turn_90']),player:schedule(b,b.playerId,['rally'])};
  b.accepted={assessment:['Secret'],objective:'Attack',risk:'high',intent:'Secret',action_ids:['turn_90']};
  b.committed=['rally'];
  expect(maneuverPlans(b)).toEqual(plans);
 });

 it('returns no presets outside a fresh player naval planning window',()=>{
  const b=fixture().battle!;
  for(const status of ['waiting','reveal','playback','replacement','transition','finished'] as const)expect(maneuverPlans({...b,status})).toEqual([]);
  for(const phase of ['deck','duel','capture','ended'] as const)expect(maneuverPlans({...b,phase})).toEqual([]);
  expect(maneuverPlans({...b,replacement:['player']})).toEqual([]);
  expect(maneuverPlans({...b,unit:1})).toEqual([]);
  b.ships.player.crew.fit=0;expect(maneuverPlans(b)).toEqual([]);
 });

 it('keeps every suggested schedule legal across ship sizes, damage, and resource shortages',()=>{
  const initial=fixture().battle!;
  for(const [i,spec] of SHIPS.entries()){
   const b:Battle=structuredClone(initial),p=b.ships.player;
   p.ship=createShip(spec.id,'Test ship','player');p.crew=crew(spec.minCrew);
   p.startHull=p.ship.hullPoints;p.startFit=p.crew.fit;
   p.ship.hullPoints*=.6;p.ship.sailCondition=40;p.states={fire:i%4,flooding:(i+1)%4,rigging:i%4,shock:i%4};
   p.sails=i%3;p.cargo.gunpowder=i%2?2:100;p.cargo.planks=1;b.window=1+i%2;
   const before=structuredClone(b);
   for(const plan of maneuverPlans(b))expect(()=>schedule(b,b.playerId,plan.ids)).not.toThrow();
   expect(b).toEqual(before);
  }
 });
});
