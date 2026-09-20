import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {newGame,act,normalizeGame} from '../src/game';
import {crew,crewExperience,captain,finish,strength} from '../src/battle/types';
import {ensureCrew,crewServiceQuote,crewWages,resolveCrewBattle,sailingCrewPractice} from '../src/crew';
import {shipPerformance} from '../src/performance';
import {createBattle,orderCatalogue,mergeCompletions,performance} from '../src/battle/naval';
import {generateNpc} from '../src/battle/encounter';
import {practice} from '../src/battle/progression';
import {CrewServices} from '../src/CrewServices';
import {financialSummary} from '../src/finance';
function battle(g=newGame('Anne',42)){g.ship!.id='player';const n=generateNpc(g);n.ship.id='enemy';g.battle=createBattle(g,n);g.voyage={to:'saint-pierre',hours:48,remaining:20,weather:'Steady',dice:[3,3]};return g;}
it('migrates legacy expertise without resetting people, quality or existing specialties',()=>{
 const g=newGame('A',1);g.crewState={...crew(8,72),injured:2,dead:3,expertise:{gunnery:90}};const next=normalizeGame(g);expect(next.crewState).toMatchObject({fit:8,injured:2,dead:3,morale:72,expertise:{sailing:72,gunnery:90,fighting:72}});expect(g.crewState.expertise).toEqual({gunnery:90});
 const old=battle();finish(old.battle!,'player','Old result');const migrated=normalizeGame(old);resolveCrewBattle(migrated);expect(migrated.battle!.ships.player.crew.morale).toBe(50);
});
it('uses each specialty in its own performance calculations with a neutral starting baseline',()=>{
 const g=newGame('A',1),base=shipPerformance(g);const c=ensureCrew(g);c.expertise!.sailing=100;expect(shipPerformance(g).speed/base.speed).toBeCloseTo(1.1);expect(shipPerformance(g).maneuverability/base.maneuverability).toBeCloseTo(1.1);
 const b=battle(g).battle!,p=b.ships.player,normal=orderCatalogue(b,'player').find(o=>o.id==='reload_port_round-shot')!.cost,boarding=strength(p);p.crew.expertise!.gunnery=100;expect(orderCatalogue(b,'player').find(o=>o.id==='reload_port_round-shot')!.cost).toBeLessThan(normal);expect(strength(p)).toBe(boarding);p.crew.expertise!.fighting=100;expect(strength(p)).toBeGreaterThan(boarding);
 p.crew.fit=8;p.crew.injured=2;expect(performance(p).weight.crew).toBe(10);
});
it('awards bounded sailing practice only on arrival and retains the departure duration',()=>{
 const g=newGame('A',42);g.pirateDanger=0;const arrived=act(g,{type:'sail',to:'saint-pierre'},()=>.5);expect(arrived.voyage).toBeNull();expect(crewExperience(arrived.crewState!,'sailing')).toBeGreaterThan(50);expect(g.crewState).toBeUndefined();const before=crewExperience(arrived.crewState!,'sailing');const rested=act(arrived,{type:'sleep'});expect(crewExperience(rested.crewState!,'sailing')).toBe(before);
 sailingCrewPractice(rested,1000);expect(crewExperience(rested.crewState!,'sailing')).toBe(before+3);
});
it('awards crew practice beyond the captain point cap and merges simultaneous events once',()=>{
 const g=battle(),b=g.battle!;b.practice={deception:3,leadership:3,carpentry:3,doctoring:1};const pre=structuredClone(b),one=structuredClone(b),two=structuredClone(b);practice(one,'player','aiming');practice(two,'player','reloading');mergeCompletions(b,pre,[one,two]);expect(b.crewPractice).toEqual({gunnery:1});expect(b.practice?.aiming).toBeUndefined();finish(b,'player','Victory');resolveCrewBattle(g);expect(crewExperience(g.crewState!,'gunnery')).toBe(51);expect(g.crewState!.morale).toBe(54);expect(g.crewState!.discipline).toBe(51);const after=structuredClone(g);resolveCrewBattle(g);expect(g).toEqual(after);
});
it('applies defeat and casualty morale once through the public reducer',()=>{
 let g=battle();const c=g.battle!.ships.player.crew;c.fit-=2;c.injured=1;c.dead=1;practice(g.battle!,'player','boarding',.5);g=act(g,{type:'battle-surrender'});expect(g.crewState!.morale).toBe(42);expect(g.crewState!.discipline).toBe(48);expect(crewExperience(g.crewState!,'fighting')).toBe(50.5);expect(g.battle!.crewResolved).toBe(true);const restored=normalizeGame(JSON.parse(JSON.stringify(g)));resolveCrewBattle(restored);expect(restored.crewState).toEqual(g.crewState);
});
it('training charges the quoted fee, wages and provisions and improves only the selected specialty',()=>{
 const g=newGame('A',1),q=crewServiceQuote(g,{type:'train-crew',domain:'gunnery'}),next=act(g,{type:'train-crew',domain:'gunnery'});expect(q.errors).toEqual([]);expect(next.silver).toBeCloseTo(g.silver-q.fee-q.wages);expect(next.provisions).toBeCloseTo(g.provisions-q.food);expect(next.hours).toBe(g.hours+8);expect(next.crewState!.expertise).toEqual({sailing:50,gunnery:52,fighting:50});expect(next.skills!.training).toEqual({tier:0,points:.5});expect(financialSummary(next.finances!.entries).cashExpenses).toBeCloseTo(q.fee+q.wages);
});
it('training uses fit-crew participation, captain Training mastery and the 75 cap',()=>{
 const g=newGame('A',1);g.crewState={...crew(5),injured:5};g.skills!.training={tier:10,points:0};expect(crewServiceQuote(g,{type:'train-crew',domain:'sailing'}).gain).toBe(2);ensureCrew(g).expertise!.sailing=74.9;const next=act(g,{type:'train-crew',domain:'sailing'});expect(crewExperience(next.crewState!,'sailing')).toBe(75);expect(()=>act(next,{type:'train-crew',domain:'sailing'})).toThrow('capped');
});
it('rejects unaffordable, underprovisioned, unfit, unknown or at-sea services without mutation',()=>{
 for(const g of [{...newGame('A',1),silver:20},{...newGame('A',1),provisions:0},{...newGame('A',1),crewState:{...crew(0),injured:10}},battle()]){const before=structuredClone(g);expect(()=>act(g,{type:'train-crew',domain:'sailing'})).toThrow();expect(g).toEqual(before);}
 expect(()=>act(newGame('A',1),{type:'train-crew',domain:'unknown' as 'sailing'})).toThrow('Unknown');
});
it('medical care heals the quoted living crew and captain without resurrecting sailors',()=>{
 const g=newGame('A',1);g.crewState={...crew(5),injured:5,dead:4};g.captainState={...captain(),injury:3,fatigue:2};const q=crewServiceQuote(g,{type:'medical-care'}),next=act(g,{type:'medical-care'});expect(q.healed).toBe(3);expect(q.fee).toBe(80);expect(next.crewState).toMatchObject({fit:8,injured:2,dead:4});expect(next.crew).toBe(10);expect(next.captainState).toMatchObject({injury:2,fatigue:2});expect(next.hours-g.hours).toBe(4);expect(next.silver).toBeCloseTo(g.silver-q.fee-q.wages);expect(()=>act(newGame('A',1),{type:'medical-care'})).toThrow('No injuries');g.captainState.injury=6;expect(()=>act(g,{type:'medical-care'})).toThrow('checkpoint');
});
it('Doctoring mastery improves paid crew treatment',()=>{
 const g=newGame('A',1);g.crewState={...crew(2),injured:8};g.skills!.doctoring={tier:10,points:0};expect(crewServiceQuote(g,{type:'medical-care'}).healed).toBe(4);
});
it('weights recruits by living crew and does not refund experience when sailors leave',()=>{
 const g=newGame('A',1);g.crewState={...crew(8,90),injured:2,dead:100};const hired=act(g,{type:'hire'});expect(crewExperience(hired.crewState!,'fighting')).toBeCloseTo(950/11);expect(hired.crewState).toMatchObject({fit:9,injured:2,dead:100});const dismissed=act(hired,{type:'dismiss'});expect(crewExperience(dismissed.crewState!,'fighting')).toBeCloseTo(950/11);expect(dismissed.crewState!.injured).toBe(1);
});
it('unpaid wage consequences are fractional, bounded and independent of time chunking',()=>{
 const one=newGame('A',1),split=newGame('A',1);one.silver=-10;crewWages(one,24,20);split.silver=0;crewWages(split,12,10);split.silver=-10;crewWages(split,12,10);expect(one.crewState).toEqual(split.crewState);expect(one.crewState).toMatchObject({morale:48,discipline:49,unpaidWageHours:12});one.silver=-10000;crewWages(one,10000,10000);expect(one.crewState).toMatchObject({morale:0,discipline:0});
});
it('time advancement applies wage effects and incoming cash stops further penalties',()=>{
 const g=newGame('A',1);g.silver=8;const next=act(g,{type:'sleep'});expect(next.silver).toBeLessThan(0);expect(next.crewState!.morale).toBeCloseTo(50-4/3);expect(next.crewState!.discipline).toBeCloseTo(50-2/3);next.silver=100;const paid=act(next,{type:'sleep'});expect(paid.crewState!.morale).toBe(next.crewState!.morale);
});
it('paid shore leave recovers morale up to 80 and cannot be used in debt',()=>{
 const g=newGame('A',1);g.crewState=crew(10);g.crewState.morale=77;const next=act(g,{type:'shore-leave'});expect(next.crewState!.morale).toBe(80);expect(next.silver).toBeCloseTo(800-50-20/3);expect(()=>act(next,{type:'shore-leave'})).toThrow('up to 80');expect(()=>act({...g,silver:-1},{type:'shore-leave'})).toThrow('silver');
});
it('renders all service costs, specialty values and blockers',()=>{
 const g=newGame('A',1);const html=renderToStaticMarkup(<CrewServices game={g} busy={false} perform={()=>{}}/>);expect(html).toContain('Train gunnery');expect(html).toContain('Medical care');expect(html).toContain('Shore leave');expect(html).toContain('No injuries need treatment');expect(html).toContain('6.67 wages');expect(html).toContain('50.00 / 100');
});
