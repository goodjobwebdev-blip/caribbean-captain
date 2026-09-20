import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {createElement} from 'react';
import {newGame,act,hoursTo,offers,currentShip,shipPurchaseQuote,contractProblems,normalizeGame,type Game} from '../src/game';
import {shipPerformance,loadBreakdown,sailingProblems,GOODS_LOAD} from '../src/performance';
import {createShip} from '../src/ships';
import {PerformanceBreakdown,LoadBreakdown} from '../src/Performance';
const rng=(...values:number[])=>{let i=0;return()=>values[i++]??.5;};
const rich=()=>{const g=newGame('Mary',123);g.silver=1000000;return g;};
describe('ship performance',()=>{
 it('preserves the healthy starting sloop pace with all starting weights accounted for',()=>{
  const g=newGame('Mary',123),w=loadBreakdown(g),p=shipPerformance(g);
  expect(w).toEqual({trade:0,freight:0,provisions:30,crew:10,passengers:0,captain:1,cannons:20,total:61});
  expect(p.speed).toBe(1.2);expect(p.maneuverability).toBe(80);expect(hoursTo('bridgetown','saint-pierre',g)).toBe(49);
  expect(act(g,{type:'sail',to:'saint-pierre'},rng(.5,.5,.5)).hours-g.hours).toBe(49);
 });
 it('distinguishes hold space from weight and penalizes heavy goods more than light goods',()=>{
  const sugar=rich(),cloth=rich();sugar.cargo.sugar=100;cloth.cargo.cloth=100;
  expect(loadBreakdown(sugar).total).toBe(261);expect(loadBreakdown(cloth).total).toBe(111);
  expect(shipPerformance(sugar).speed).toBeLessThan(shipPerformance(cloth).speed);
  expect(shipPerformance(sugar).maneuverability).toBeLessThan(shipPerformance(cloth).maneuverability);
 });
 it('has continuous load penalties after 20%, with bounded performance at the safe maximum',()=>{
  const g=rich();g.provisions=0;g.ship!.cannons={port:0,starboard:0,bow:0,stern:0};
  g.cargo.sugar=44.5;expect(loadBreakdown(g).total).toBe(100);expect(shipPerformance(g).factors.loadSpeed).toBe(1);
  g.cargo.sugar=244.5;const full=shipPerformance(g);expect(full.loadRatio).toBe(1);expect(full.factors.loadSpeed).toBe(.75);expect(full.factors.loadManeuver).toBe(.65);expect(full.overloaded).toBe(false);
  g.cargo.sugar+=.01;expect(shipPerformance(g).overloaded).toBe(true);
 });
 it('multiplies load, hull, sails, crew and mastery once, with no duplicate cannon penalty',()=>{
  const g=rich();g.cargo.sugar=100;g.crew=7;g.ship!.hullPoints=50;g.ship!.sailCondition=50;g.skills={sailing:{tier:2,points:0}};
  const p=shipPerformance(g);
  // 258 weight, 51.6% load; crew 2/5 of the way from minimum to optimal.
  expect(p.weight.total).toBe(258);expect(p.factors.crew).toBeCloseTo(.76);
  expect(p.speed).toBeCloseTo(1.2*.90125*.75*.6*.76*1.1);
  const withGun=rich(),withGoods=rich();withGun.ship!.cannons.port++;withGoods.cargo.sugar=5/GOODS_LOAD.sugar.weight;
  expect(shipPerformance(withGun).speed).toBe(shipPerformance(withGoods).speed);
 });
 it('caps crew benefit at optimal and makes additional crew count toward load and upkeep',()=>{
  const g=rich();g.crew=5;expect(shipPerformance(g).factors.crew).toBe(.6);
  g.crew=10;const optimal=shipPerformance(g);expect(optimal.factors.crew).toBe(1);
  g.crew=20;const extra=shipPerformance(g);expect(extra.factors.crew).toBe(1);expect(extra.weight.total-optimal.weight.total).toBe(10);expect(extra.speed).toBeLessThanOrEqual(optimal.speed);
 });
 it('blocks zero sails, zero hull, and insufficient crew without infinite game time',()=>{
  for(const modify of [(g:Game)=>g.ship!.sailCondition=0,(g:Game)=>g.ship!.hullPoints=0,(g:Game)=>g.crew=4]){
   const g=rich();modify(g);const before=structuredClone(g);
   expect(shipPerformance(g).speed).toBe(0);expect(hoursTo('bridgetown','saint-pierre',g)).toBe(Infinity);
   expect(()=>act(g,{type:'sail',to:'saint-pierre'})).toThrow();expect(g).toEqual(before);
  }
 });
 it('uses the departure snapshot through encounters, weather, and later skill changes',()=>{
  const g=rich();g.cargo.sugar=120;
  const expected=Math.ceil(hoursTo(g.port,'saint-pierre',g)*1.25);
  const encounter=act(g,{type:'sail',to:'saint-pierre'},rng(.99,0,0));
  expect(encounter.voyage!.hours).toBe(expected);expect(encounter.voyage!.departureSpeed).toBe(shipPerformance(g).speed);
  encounter.skills={sailing:{tier:10,points:0}};
  const next=act(encounter,{type:'encounter',choice:'flee'},rng(0,0));
  expect(next.hours-g.hours).toBe(expected+24);expect(next.ship!.hullPoints).toBe(75);
 });
 it('preserves old voyages and lets legacy overweight cargo be sold before departure',()=>{
  const old=rich();old.version=1;delete old.ship;old.condition=70;old.provisions=30;old.cargo.sugar=250;
  old.voyage={to:'saint-pierre',hours:49,remaining:25,weather:'Steady winds',dice:[1,1]};
  const modern=normalizeGame(old);expect(modern.voyage).toEqual(old.voyage);
  const arrived=act(modern,{type:'encounter',choice:'flee'},rng(.99,.99));expect(arrived.port).toBe('saint-pierre');expect(arrived.hours-old.hours).toBe(25);
  expect(sailingProblems(arrived).join()).toContain('Overloaded');
  const before=structuredClone(arrived);expect(()=>act(arrived,{type:'sail',to:'bridgetown'})).toThrow('Overloaded');expect(arrived).toEqual(before);
  const unloaded=act(arrived,{type:'sell',good:'sugar',quantity:50});expect(shipPerformance(unloaded).overloaded).toBe(false);expect(unloaded.ship!.hullPoints).toBe(70);
 });
 it('checks weight before buying, hiring, accepting contracts and replacing cannons',()=>{
  const g=rich();g.cargo.sugar=239;g.provisions=4; // 510 total, legacy-style overloaded state.
  const snapshot=structuredClone(g);
  expect(()=>act(g,{type:'buy',good:'cloth',quantity:1})).toThrow('deadweight');
  expect(()=>act(g,{type:'hire'})).toThrow('deadweight');
  expect(()=>act(g,{type:'accept',contract:offers(g).find(c=>c.type==='Passengers')!})).toThrow('weight');
  g.ship!.cannons.port=1;expect(()=>act(g,{type:'replace-cannons'})).toThrow('deadweight');
  g.ship!.cannons.port=2;expect(g).toEqual(snapshot);
 });
 it('previews the exact transferred load with offered default cannons and fully repaired condition',()=>{
  const g=rich();g.cargo.sugar=70;g.ship!.hullPoints=30;g.ship!.sailCondition=50;g.ship!.cannons.port=0;
  const q=shipPurchaseQuote(g,'schooner-universal');expect(q.problems).toEqual([]);
  const next=act(g,{type:'buy-ship',configurationId:q.target.id});
  expect(shipPerformance(next)).toEqual(q.offeredPerformance);expect(next.ship!.hullPoints).toBe(currentShip(next).maxHull);expect(next.ship!.sailCondition).toBe(100);
  expect(q.offeredPerformance.weight.total-loadBreakdown(g).total).toBe(10);
  const heavy=rich();heavy.ship=createShip('sloop-merchant');heavy.cargo.sugar=240;heavy.provisions=10;
  expect(shipPerformance(heavy).overloaded).toBe(false);
  const overweightQuote=shipPurchaseQuote(heavy,'sloop-universal');
  expect(overweightQuote.problems).toHaveLength(1);expect(overweightQuote.problems[0]).toContain('overloaded');
  const before=structuredClone(heavy);expect(()=>act(heavy,{type:'buy-ship',configurationId:'sloop-universal'})).toThrow('overloaded');expect(heavy).toEqual(before);
 });
 it('renders current factors and weight contributors without hiding deferred combat',()=>{
  const g=rich();g.cargo.sugar=100;g.ship!.sailCondition=50;
  const html=renderToStaticMarkup(createElement(PerformanceBreakdown,{game:g}));
  expect(html).toContain('Sail condition');expect(html).toContain('−40.0%');expect(html).toContain('Modifiers multiply');expect(html).toContain('battle effects');
  const load=renderToStaticMarkup(createElement(LoadBreakdown,{game:g}));expect(load).toContain('Installed cannons');expect(load).toContain('261.0 / 500');
 });
});
describe('larger freight',()=>{
 it('offers distinct 40/200/800-unit jobs with rebalanced new-job rewards',()=>{
  const g=rich(),jobs=offers(g).filter(c=>c.type==='Freight'&&c.to==='saint-pierre');
  expect(jobs.map(c=>c.amount)).toEqual([40,200,800]);expect(jobs.map(c=>c.reward)).toEqual([120,519,2018]);
  expect(jobs[0].id).toBe('bridgetown:saint-pierre:0:Freight');expect(new Set(jobs.map(c=>c.id)).size).toBe(3);
  g.ship=createShip('fluyt-merchant');g.crew=16;g.skills={sailing:{tier:10,points:0}};expect(offers(g).filter(c=>c.type==='Freight'&&c.to==='saint-pierre')).toEqual(jobs);
 });
 it('checks both capacities and delivers the accepted larger terms exactly once',()=>{
  let g=rich();const tooBig=offers(g).find(c=>c.amount===800)!;expect(contractProblems(g,tooBig).join()).toContain('800 free hold units');
  expect(()=>act(g,{type:'accept',contract:tooBig})).toThrow();
  g.ship=createShip('fluyt-merchant');g.crew=16;g.provisions=90;
  const job=offers(g).find(c=>c.amount===800&&c.to==='saint-pierre')!;
  g=act(g,{type:'accept',contract:{...job,reward:999999,amount:1}});
  expect(g.contracts[0].amount).toBe(800);expect(g.contracts[0].reward).toBe(2018);
  g=act(g,{type:'sail',to:'saint-pierre'},rng(.5,.5,.5));expect(g.failed).toBeNull();
  const before=g.silver;g=act(g,{type:'deliver'});expect(g.silver).toBeCloseTo(before+2018-32/24);expect(g.archive![0].amount).toBe(800);
  expect(()=>act(g,{type:'deliver'})).toThrow();
 });
});
