import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {newGame,act,normalizeGame,offers,type Game} from '../src/game';
import {quoteBasket,settleBasket,stockAt,cargoCost,rememberedSale,observeMarket,spread,aboard,type BasketLine} from '../src/trade';
import {localEvent,eventFactor,attitude,reputation,hasPermit,accessProblem,smugglerOpen,type Channel} from '../src/commerce';
import {MarketsJournal} from '../src/MarketsJournal';
import {CargoLedger} from '../src/CargoLedger';
import {TradePermit,SmugglerContact} from '../src/TradeServices';
const buy=(good:BasketLine['good'],quantity:number):BasketLine=>({good,quantity,side:'buy'});
const sell=(good:BasketLine['good'],quantity:number):BasketLine=>({good,quantity,side:'sell'});
function rich(){const g=newGame('Merchant',7);g.silver=100000;return g;}
function deal(g:Game,lines:BasketLine[],channel:Channel='legal',rng=()=>.99){return act(g,{type:'trade',lines,channel,expected:quoteBasket(g,lines,channel).token},rng);}
describe('legal access and standing',()=>{
 it('sells a national permit, checks food and funds, and preserves foreign restrictions',()=>{
  let g=rich();expect(quoteBasket(g,[buy('weapons',1)]).errors.join()).toContain('permit');
  g=act(g,{type:'buy-permit'});expect(hasPermit(g)).toBe(true);expect(g.hours).toBe(9);expect(g.silver).toBeCloseTo(100000-750-20/24);
  expect(quoteBasket(g,[buy('weapons',1)]).errors).toEqual([]);expect(()=>act(g,{type:'buy-permit'})).toThrow('already');
  g.port='saint-pierre';expect(hasPermit(g)).toBe(false);g.provisions=0;expect(()=>act(g,{type:'buy-permit'})).toThrow('provisions');
  g.provisions=10;g.silver=0;expect(()=>act(g,{type:'buy-permit'})).toThrow('silver');
 });
 it('gains bounded trust from delivered commissions without changing accepted rewards',()=>{
  const g=rich();g.contracts=[{...offers(g)[0],to:g.port,reward:333}];g.economy!.commerce!.attitude.England=99;g.economy!.commerce!.reputation=100;
  const next=act(g,{type:'deliver'});expect(attitude(next)).toBe(100);expect(reputation(next)).toBe(100);expect(next.archive![0].reward).toBe(333);expect(()=>act(next,{type:'deliver'})).toThrow();
 });
 it('keeps standing modifiers bounded and always allows provisions',()=>{
  const g=rich();g.economy!.commerce!.attitude.England=-100;g.economy!.commerce!.reputation=-100;
  expect(accessProblem(g,'sugar')).toContain('barred');expect(accessProblem(g,'provisions')).toBeNull();expect(spread(g)).toBeCloseTo(.18);
  g.economy!.commerce!.attitude.England=100;g.economy!.commerce!.reputation=100;g.skills!.trade={tier:10,points:0};expect(spread(g)).toBe(.05);
 });
 it('distinguishes locally unavailable goods from controlled goods and permits',()=>{
  const g=act(rich(),{type:'buy-permit'});expect(accessProblem(g,'jewelry')).toContain('Unavailable');expect(accessProblem(g,'weapons')).toBeNull();
  g.port='willemstad';expect(accessProblem(g,'jewelry')).toBeNull();
 });
});
describe('smuggler deals',()=>{
 it('requires a contact and observes independent, limited stock',()=>{
  let g=rich();expect(quoteBasket(g,[buy('weapons',1)],'smuggler').errors.join()).toContain('contact');expect(g.economy!.blackMemories!.bridgetown).toBeUndefined();
  g=act(g,{type:'meet-smuggler'});expect(g.economy!.blackMemories!.bridgetown).toBeDefined();expect(stockAt(g,'weapons',g.port,'smuggler')).toBe(100);
  const legal=stockAt(g,'weapons');g=deal(g,[buy('weapons',1)],'smuggler');expect(g.cargo.weapons).toBe(1);expect(stockAt(g,'weapons')).toBe(legal);expect(stockAt(g,'weapons',g.port,'smuggler')).toBeLessThan(100);
  expect(quoteBasket(g,[buy('sugar',1)],'smuggler').errors.join()).toContain('do not handle');
 });
 it('rejects unavailable days atomically without updating remembered prices',()=>{
  const g=act(rich(),{type:'meet-smuggler'}),seen=structuredClone(g.economy!.blackMemories);g.hours=24*4;expect(smugglerOpen(g)).toBe(false);
  const before=structuredClone(g);expect(()=>deal(g,[buy('weapons',1)],'smuggler')).toThrow('absent');observeMarket(g,'smuggler');expect(g).toEqual(before);expect(g.economy!.blackMemories).toEqual(seen);
 });
 it('confiscates only newly purchased lots, fines the deal and records the roll',()=>{
  let g=act(act(rich(),{type:'buy-permit'}),{type:'meet-smuggler'});g=deal(g,[buy('weapons',2)]);const cost=cargoCost(g,'weapons');
  const q=quoteBasket(g,[buy('weapons',3)],'smuggler'),next=deal(g,[buy('weapons',3)],'smuggler',()=>0);
  expect(next.cargo.weapons).toBe(2);expect(cargoCost(next,'weapons')).toEqual(cost);expect(next.silver).toBeCloseTo(q.finalSilver-Math.max(50,Math.ceil(q.buys*.25)));expect(attitude(next)).toBe(-10);expect(reputation(next)).toBe(-5);expect(next.lastRoll?.dice).toEqual([1,1]);
 });
 it('keeps purchases on a partial result and applies the disclosed smaller fine',()=>{
  const g=act(rich(),{type:'meet-smuggler'}),q=quoteBasket(g,[buy('weapons',1)],'smuggler');const next=deal(g,[buy('weapons',1)],'smuggler',()=>.5);
  expect(next.cargo.weapons).toBe(1);expect(next.silver).toBeCloseTo(q.finalSilver-Math.max(25,Math.ceil(q.buys*.1)));expect(attitude(next)).toBe(-3);expect(reputation(next)).toBe(-1);
 });
 it('binds stale quotes to their market channel and rejects invalid channels',()=>{
  const g=act(rich(),{type:'meet-smuggler'}),lines=[buy('weapons',1)];
  expect(()=>act(g,{type:'trade',lines,channel:'legal',expected:quoteBasket(g,lines,'smuggler').token})).toThrow('changed');
  expect(quoteBasket(g,lines,'invalid' as Channel).errors.join()).toContain('Unknown market');
 });
});
describe('events and remembered estimates',()=>{
 it('uses a repeatable event timeline with expiration and no voyage RNG changes',()=>{
  const g=rich();expect(localEvent(g)).toBeNull();let found=false;
  for(let day=10;day<100;day+=10){g.hours=8+day*24;const before=structuredClone(g),e=localEvent(g);expect(g).toEqual(before);if(e){found=true;expect(localEvent(structuredClone(g))).toEqual(e);g.seed++;expect(localEvent(g)).toEqual(e);g.hours=e.end;expect(localEvent(g)).toBeNull();break;}}
  expect(found).toBe(true);
 });
 it('changes eligible prices during local events while remote memories stay frozen',()=>{
  const g=rich();observeMarket(g);const seen=structuredClone(g.economy!.memories.bridgetown);g.port='saint-pierre';
  let active=false;for(let day=10;day<100;day+=10){g.hours=8+day*24;if(localEvent(g)){active=true;break;}}
  expect(active).toBe(true);const event=localEvent(g)!;expect(eventFactor(g,'provisions')).toBe(1);observeMarket(g);expect(g.economy!.memories.bridgetown).toEqual(seen);expect(g.economy!.memories['saint-pierre']?.event).toEqual(event);
 });
 it('shows allocated purchase costs and unknown legacy quantities accurately',()=>{
  const g=rich();const quote=settleBasket(g,[buy('sugar',10)]);expect(cargoCost(g,'sugar').total).toBeCloseTo(quote.buys);settleBasket(g,[sell('sugar',4)]);expect(cargoCost(g,'sugar').total).toBeCloseTo(quote.buys*.6);
  expect(cargoCost(g,'provisions').unknown).toBe(120);expect(cargoCost(g,'sugar',20).unknown).toBe(14);
 });
 it('estimates with recorded stock and terms only, including bulk effects',()=>{
  const g=rich();settleBasket(g,[buy('sugar',100)]);g.port='saint-pierre';observeMarket(g);
  const expected=quoteBasket(g,[sell('sugar',100)]),estimate=rememberedSale(g,'sugar',g.port,100)!;expect(estimate.revenue).toBe(expected.sales);expect(estimate.profit).toBeCloseTo(expected.sales-cargoCost(g,'sugar').total);
  g.hours+=300;g.economy!.markets['saint-pierre'].sugar.stock=0;g.skills!.trade={tier:10,points:0};expect(rememberedSale(g,'sugar','saint-pierre',100)).toEqual(estimate);expect(rememberedSale(g,'sugar','willemstad',100)).toBeNull();
 });
 it('migrates existing economy saves without changing stock, lots or observations',()=>{
  const g=rich();settleBasket(g,[buy('sugar',10)]);delete g.economy!.commerce;delete g.economy!.blackMarkets;delete g.economy!.blackMemories;
  const before=structuredClone(g.economy),next=normalizeGame(g);expect(next.economy!.markets).toEqual(before!.markets);expect(next.economy!.lots).toEqual(before!.lots);expect(next.economy!.memories).toEqual(before!.memories);expect(next.economy!.commerce!.started).toBe(g.hours);
 });
 it('renders costs, observation warnings, permits and contact actions',()=>{
  const g=rich();expect(renderToStaticMarkup(<CargoLedger game={g}/>)).toContain('Unknown');expect(renderToStaticMarkup(<MarketsJournal game={g}/>)).toContain('not guaranteed offers');expect(renderToStaticMarkup(<TradePermit game={g} busy={false} perform={()=>{}}/>)).toContain('750 silver');expect(renderToStaticMarkup(<SmugglerContact game={g} busy={false} perform={()=>{}}/>)).toContain('50 silver');
 });
});
