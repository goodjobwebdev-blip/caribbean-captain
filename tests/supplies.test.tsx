import {legacyVoyage} from './legacy-voyage';
import 'fake-indexeddb/auto';
import {it,expect,describe} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {newGame,act,normalizeGame,hoursTo,type Game} from '../src/game';
import {fruitAfter,spoilCargo,provisionQuote,materialRepairQuote,type FoodGood,type RepairKind} from '../src/operations';
import {settleBasket,quoteBasket,cargoCost,aboard} from '../src/trade';
import {FoodPreparation,MaterialRepairs} from '../src/SupplyServices';
import {saveCheckpoint,restoreCheckpoint,type Profile} from '../src/storage';
const rich=()=>{const g=newGame('Provisioner',42);g.silver=10000;return g;};
function prepare(g:Game,good:FoodGood,quantity:number){return act(g,{type:'prepare-provisions',good,quantity,expected:provisionQuote(g,good,quantity).token});}
function repair(g:Game,kind:RepairKind){return act(g,{type:'material-repair',kind,expected:materialRepairQuote(g,kind).token});}
function buy(g:Game,good:any,quantity:number){settleBasket(g,[{good,quantity,side:'buy'}]);}
describe('perishable cargo',()=>{
 it('loses 5% of fruit per game day with time-splitting equivalence and matching FIFO costs',()=>{
  const a=rich();buy(a,'fruit',100);const originalCost=cargoCost(a,'fruit').total,b=structuredClone(a);
  spoilCargo(a,24);for(let i=0;i<24;i++)spoilCargo(b,1);
  expect(a.cargo.fruit).toBeCloseTo(95);expect(b.cargo.fruit).toBeCloseTo(a.cargo.fruit,9);expect(cargoCost(a,'fruit').total).toBeCloseTo(originalCost*.95);expect(cargoCost(b,'fruit')).toEqual(expect.objectContaining({unknown:0}));expect(a.provisions).toBe(120);
 });
 it('applies during port stays and logs the lost quantity',()=>{
  const g=rich();buy(g,'fruit',10);const next=act(g,{type:'sleep'});
  expect(next.cargo.fruit).toBeCloseTo(fruitAfter(10,8));expect(next.log.some(l=>l.text.startsWith('Cargo spoilage:'))).toBe(true);
 });
 it('counts successful voyage hours and extra encounter delay without changing the departure estimate',()=>{
  const g=rich();buy(g,'fruit',40);const hours=hoursTo(g.port,'saint-pierre',g);
  const atSea=legacyVoyage(g,.85);expect(atSea.voyage).not.toBeNull();const departureHours=atSea.voyage!.hours;
  const arrived=act(atSea,{type:'encounter',choice:'flee'},()=>0);
  expect(arrived.cargo.fruit).toBeCloseTo(fruitAfter(40,departureHours+24));expect(departureHours).toBe(Math.ceil(hours*.85));
 });
 it('ages only elapsed hours if provisions run out, with no retroactive aging on load',()=>{
  const g=rich();buy(g,'fruit',10);g.provisions=1;g.hours=10000;const migrated=normalizeGame(g);expect(migrated.cargo.fruit).toBe(10);
  const failed=act(g,{type:'sleep'});expect(failed.failed).not.toBeNull();expect(failed.hours-g.hours).toBe(2);expect(failed.cargo.fruit).toBeCloseTo(fruitAfter(10,2));
 });
 it('updates whole-quantity sale availability as fruit spoils',()=>{
  const g=rich();buy(g,'fruit',10);spoilCargo(g,24);expect(quoteBasket(g,[{good:'fruit',quantity:10,side:'sell'}]).errors.join()).toContain('Not enough');expect(quoteBasket(g,[{good:'fruit',quantity:9,side:'sell'}]).errors).toEqual([]);
 });
});
describe('food preparation',()=>{
 it('converts owned food, charges the quoted fee/time, and feeds the crew from the output',()=>{
  const g=rich();buy(g,'grain',10);g.provisions=0;g.economy!.lots.provisions=[];const q=provisionQuote(g,'grain',10),next=prepare(g,'grain',10);
  expect(q.output).toBe(40);expect(next.provisions).toBeCloseTo(q.finalProvisions);expect(next.silver).toBeCloseTo(q.finalSilver);expect(next.hours-g.hours).toBe(1);expect(next.cargo.grain).toBe(0);expect(cargoCost(next,'provisions').unknown).toBeCloseTo(0);
 });
 it('retains input costs and preparation fees but awards no learning for resale of converted food',()=>{
  const g=rich();buy(g,'salted-fish',5);const cost=cargoCost(g,'salted-fish').total;const next=prepare(g,'salted-fish',5);
  expect(cargoCost(next,'provisions').total).toBeCloseTo(cost+5);expect(next.skills?.trade?.points??0).toBe(0);
  next.port='saint-pierre';expect(quoteBasket(next,[{good:'provisions',quantity:140,side:'sell'}]).xp).toBe(0);
 });
 it('preserves unknown provenance instead of inventing a zero-cost profit',()=>{
  const g=rich();g.cargo.grain=3;g.economy!.lots.grain=[{quantity:3}];buy(g,'grain',2);const knownCost=cargoCost(g,'grain').total;
  const next=prepare(g,'grain',5);expect(cargoCost(next,'provisions').known).toBeCloseTo(8);expect(cargoCost(next,'provisions').total).toBeCloseTo(knownCost+2);expect(cargoCost(next,'provisions').unknown).toBeGreaterThan(12);
 });
 it('rejects insufficient cargo, fees, capacity, malformed quantities and stale quotes atomically',()=>{
  const g=rich();buy(g,'salted-meat',30);const before=structuredClone(g);
  expect(()=>prepare(g,'salted-meat',30)).toThrow('hold');
  for(const [good,n] of [['grain',1],['fruit',NaN],['fruit',.5],['__proto__',1],['sugar',1]] as [FoodGood,number][])expect(()=>prepare(g,good,n)).toThrow();
  const q=provisionQuote(g,'salted-meat',1);expect(()=>act(g,{type:'prepare-provisions',good:'salted-meat',quantity:2,expected:q.token})).toThrow('changed');expect(g).toEqual(before);
  g.silver=0;expect(()=>prepare(g,'salted-meat',1)).toThrow('silver');
 });
 it('keeps service rounding consistent and rejects services at sea',()=>{
  const g=rich();buy(g,'grain',21);expect(provisionQuote(g,'grain',20).hours).toBe(1);expect(provisionQuote(g,'grain',21).hours).toBe(2);
  g.voyage={to:'saint-pierre',hours:50,remaining:25,weather:'Steady winds',dice:[1,1]};expect(()=>prepare(g,'grain',1)).toThrow('encounter');
 });
});
describe('repairs with owned materials',()=>{
 it('consumes fractional supplies and provenance, repairs fully, and charges the quote',()=>{
  const g=rich();g.ship!.hullPoints=80;buy(g,'planks',2);buy(g,'tools',1);const before=cargoCost(g,'planks').total,q=materialRepairQuote(g,'hull');
  expect(q.full).toBe(40);expect(q.discount).toBe(18);expect(q.hours).toBe(4);const next=repair(g,'hull');
  expect(next.ship!.hullPoints).toBe(100);expect(next.cargo.planks).toBe(1);expect(next.cargo.tools).toBeCloseTo(.8);expect(cargoCost(next,'planks').total).toBeCloseTo(before/2);expect(next.silver).toBeCloseTo(q.finalSilver);
 });
 it('uses sailcloth, rope and tools for sail repairs while full-service repairs require no cargo',()=>{
  const g=rich();g.ship!.sailCondition=60;buy(g,'sailcloth',2);buy(g,'rope',1);buy(g,'tools',1);
  const next=repair(g,'sails');expect(next.ship!.sailCondition).toBe(100);expect(next.cargo.sailcloth).toBe(0);expect(next.cargo.rope).toBe(0);expect(next.cargo.tools).toBeCloseTo(.6);
  const paid=rich();paid.ship!.hullPoints=80;expect(act(paid,{type:'repair'}).ship!.hullPoints).toBe(100);
 });
 it('rejects missing materials, starvation, stale quotes and repeat repairs without changing the captain',()=>{
  const g=rich();g.ship!.hullPoints=80;expect(()=>repair(g,'hull')).toThrow('Planks');buy(g,'planks',2);buy(g,'tools',1);const before=structuredClone(g),q=materialRepairQuote(g,'hull');
  expect(()=>act(g,{type:'material-repair',kind:'sails',expected:q.token})).toThrow('changed');expect(g).toEqual(before);
  g.provisions=0;expect(()=>repair(g,'hull')).toThrow('provisions');g.provisions=120;const next=repair(g,'hull');expect(()=>repair(next,'hull')).toThrow('No repair');
 });
});
it('restores spoiled quantities and material/food provenance exactly from church checkpoints',async()=>{
 const g=rich();buy(g,'fruit',20);buy(g,'grain',10);const p:Profile={id:'supplies-checkpoint',name:'Provisioner',game:g,updated:1};const cp=await saveCheckpoint(p,'Before preparing supplies','Church');
 p.game=prepare(p.game,'grain',10);p.game=act(p.game,{type:'sleep'});const restored=restoreCheckpoint(p,cp);expect(restored.game.cargo).toEqual(cp.game.cargo);expect(restored.game.economy).toEqual(cp.game.economy);
});
it('renders supply quotes with costs, material credit and explicit confirmation actions',()=>{
 const g=rich();expect(renderToStaticMarkup(<FoodPreparation game={g} busy={false} perform={()=>{}}/>)).toContain('Confirm preparation');expect(renderToStaticMarkup(<MaterialRepairs game={g} busy={false} perform={()=>{}}/>)).toContain('Material credit');
});
