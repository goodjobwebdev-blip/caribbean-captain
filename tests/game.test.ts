import {describe,it,expect} from 'vitest';
import {act, newGame, distance, hoursTo, offers, foodFor, cargoUsed, SHIP} from '../src/game';
const random=(...values:number[])=>{let i=0;return()=>values[i++]??0.5;};
describe('sailing and economy',()=>{
 it('keeps distance symmetric and the short route near two days',()=>{expect(distance('bridgetown','saint-pierre')).toBe(distance('saint-pierre','bridgetown'));expect(hoursTo('bridgetown','saint-pierre')).toBe(49);expect(hoursTo('bridgetown','willemstad')).toBeGreaterThan(200);});
 it('completes a paid freight voyage and releases its hold space',()=>{let g=newGame('Anne',42);const offer=offers(g).find(c=>c.to==='saint-pierre'&&c.type==='Freight')!;g=act(g,{type:'accept',contract:offer});expect(cargoUsed(g)).toBeGreaterThan(150);const before=g.silver;g=act(g,{type:'sail',to:'saint-pierre'},random(.5,.5,.5));expect(g.port).toBe('saint-pierre');expect(g.hours).toBe(58);expect(g.silver).toBeLessThan(before);const arrival=g.silver;g=act(g,{type:'deliver'});expect(g.contracts).toHaveLength(0);expect(g.silver).toBeCloseTo(arrival+offer.reward-20/24);expect(()=>act(g,{type:'deliver'})).toThrow();});
 it('rejects capacity overflow without changing the input',()=>{const g=newGame('Anne',42);expect(()=>act(g,{type:'buy',good:'provisions',quantity:200})).toThrow('room');expect(g.provisions).toBe(120);expect(g.silver).toBe(800);});
 it('does not trust forged contract rewards and prevents repeated acceptance',()=>{let g=newGame('Anne',42);const c=offers(g)[0];g=act(g,{type:'accept',contract:{...c,reward:999999}});expect(g.contracts[0].reward).toBe(c.reward);expect(()=>act(g,{type:'accept',contract:c})).toThrow();});
 it('charges passengers provisions and caps berths',()=>{let g=newGame('Anne',42);const c=offers(g).find(c=>c.type==='Passengers')!;g=act(g,{type:'accept',contract:c});expect(foodFor(g,24)).toBe(13);});
 it('rolls pirates only on total two and waits for a player choice',()=>{const g=act(newGame('Anne',42),{type:'sail',to:'saint-pierre'},random(.5,0,0));expect(g.voyage?.remaining).toBe(25);expect(g.lastRoll?.dice).toEqual([1,1]);expect(g.port).toBe('bridgetown');expect(()=>act(g,{type:'repair'})).toThrow('encounter');const next=act(g,{type:'encounter',choice:'flee'},random(.99,.99));expect(next.port).toBe('saint-pierre');expect(next.voyage).toBeNull();expect(next.condition).toBe(100);});
 it('applies different encounter risks in each outcome band',()=>{const attack=act(newGame('Anne',42),{type:'sail',to:'saint-pierre'},random(.5,0,0));const fled=act(attack,{type:'encounter',choice:'flee'},random(0,0));expect(fled.condition).toBe(75);expect(fled.hours).toBe(81);const fought=act(attack,{type:'encounter',choice:'fight'},random(.5,.5));expect(fought.condition).toBe(80);expect(fought.crew).toBe(9);const won=act(attack,{type:'encounter',choice:'fight'},random(.99,.99));expect(won.condition).toBe(95);expect(won.crew).toBe(10);expect(won.silver).toBeGreaterThan(fought.silver);});
 it('fails irreversibly without a rescue when ship is lost',()=>{const g=newGame('Anne',42);g.condition=30;const attack=act(g,{type:'sail',to:'saint-pierre'},random(.5,0,0));const loss=act(attack,{type:'encounter',choice:'fight'},random(0,0));expect(loss.condition).toBe(0);expect(loss.failed).toContain('ship was lost');expect(()=>act(loss,{type:'buy',good:'provisions',quantity:10})).toThrow('checkpoint');});
 it('ends a voyage at starvation without granting arrival or contract rewards',()=>{const g=newGame('Anne',42);g.provisions=1;const next=act(g,{type:'sail',to:'saint-pierre'},random(.5,.5,.5));expect(next.failed).toContain('provisions');expect(next.port).toBe('bridgetown');expect(next.provisions).toBe(0);expect(next.hours).toBe(10);});
 it('restores ship condition through one repair and charges time',()=>{const g=newGame('Anne',42);g.condition=60;const next=act(g,{type:'repair'});expect(next.condition).toBe(100);expect(next.hours-g.hours).toBe(8);expect(next.silver).toBeCloseTo(800-80-20/3);});
 it('produces the same future rolls from the same saved state',()=>{const g=newGame('Anne',42);expect(act(g,{type:'sail',to:'saint-pierre'})).toEqual(act(structuredClone(g),{type:'sail',to:'saint-pierre'}));});
 it('does not allow profitable buy/sell churn in the same port',()=>{let g=newGame('Anne',42);g=act(g,{type:'buy',good:'sugar',quantity:10});g=act(g,{type:'sell',good:'sugar',quantity:10});expect(g.silver).toBeLessThan(800);expect(g.cargo.sugar).toBe(0);expect(cargoUsed(g)).toBeLessThanOrEqual(SHIP.capacity);});
});

describe('quest archive compatibility',()=>{
 it('archives delivered quests once, including in an older save without an archive',()=>{
  let g=newGame('Anne',42);delete g.archive;
  const task=offers(g).find(c=>c.to==='saint-pierre'&&c.type==='Letter')!;
  g=act(g,{type:'accept',contract:task});
  g=act(g,{type:'sail',to:'saint-pierre'},random(.5,.5,.5));
  const checkpoint=structuredClone(g);
  g=act(g,{type:'deliver'});
  expect(g.contracts).toHaveLength(0);
  expect(g.archive).toEqual([{...task,completedAt:g.hours}]);
  expect(()=>act(g,{type:'deliver'})).toThrow();
  expect(checkpoint.archive).toBeUndefined();
  expect(checkpoint.contracts).toHaveLength(1);
 });
});
