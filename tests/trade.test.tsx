import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {newGame,normalizeGame,act,offers,type Game} from '../src/game';
import {ALL_GOODS,CATALOGUE} from '../src/goods';
import {marketRule,stockAt,quoteBasket,settleBasket,observeMarket,consumeLots,integral,spread,type BasketLine} from '../src/trade';
import {tradeProgress} from '../src/skills';
import {Store} from '../src/Store';
import {MarketsJournal} from '../src/MarketsJournal';
import {createShip} from '../src/ships';
const buy=(good:BasketLine['good'],quantity:number):BasketLine=>({good,quantity,side:'buy'});
const sell=(good:BasketLine['good'],quantity:number):BasketLine=>({good,quantity,side:'sell'});
function rich(){const g=newGame('Trader',1);g.silver=1e7;return g;}
function deal(g:Game,lines:BasketLine[]){return act(g,{type:'trade',lines,expected:quoteBasket(g,lines).token});}
describe('finite trade markets',()=>{
 it('defines all 45 goods, three independent markets and abundant finite provisions',()=>{
  expect(ALL_GOODS).toHaveLength(45);const a=rich(),b=rich();
  for(const p of ['bridgetown','saint-pierre','willemstad'] as const){expect(Object.keys(a.economy!.markets[p])).toHaveLength(45);expect(marketRule(p,'provisions')).toMatchObject({target:100000,max:200000,role:'Neutral',controlled:false});}
  expect(marketRule('bridgetown','coffee').role).toBe('Import');expect(marketRule('willemstad','jewelry').target).toBe(80);
  settleBasket(a,[buy('sugar',10)]);expect(stockAt(b,'sugar')).toBe(4000);
 });
 it('integrates across the price floor and is additive',()=>{
  expect(integral(1875,2000,1000)).toBeCloseTo(125*.65);
  expect(integral(1000,2000,1000)).toBeCloseTo(integral(1000,1800,1000)+integral(1800,2000,1000));
 });
 it('allows sales to fund buys and release space regardless of basket order',()=>{
  const g=rich();g.silver=0;g.cargo.sugar=180;
  const lines=[buy('cloth',5),sell('sugar',100)];const q=quoteBasket(g,lines);
  expect(q.errors).toEqual([]);expect(q.balance).toBeGreaterThan(0);
  const reverse=quoteBasket(g,[...lines].reverse());expect(reverse.balance).toBe(q.balance);expect(reverse.space).toBe(q.space);
  const next=deal(g,lines);expect(next.cargo.sugar).toBe(80);expect(next.cargo.cloth).toBe(5);expect(next.hours-g.hours).toBe(1);expect(next.silver).toBeCloseTo(q.finalSilver);
 });
 it('rejects invalid, duplicate, controlled, stale and unaffordable deals without mutation',()=>{
  const g=newGame('Test',1),before=structuredClone(g);
  const cases:BasketLine[][]=[[buy('sugar',NaN)],[buy('sugar',.5)],[buy('sugar',-1)],[buy('sugar',1),sell('sugar',1)],[buy('weapons',1)],[buy('sugar',200000)],[buy('garbage' as any,1)],[sell('sugar',1)]];
  for(const lines of cases)expect(()=>deal(g,lines)).toThrow();
  const lines=[buy('sugar',10)],token=quoteBasket(g,lines).token;g.silver--;
  expect(()=>act(g,{type:'trade',lines,expected:token})).toThrow('changed');g.silver++;
  expect(g).toEqual(before);
 });
 it('enforces stock, market storage, hold and deadweight limits',()=>{
  const g=rich();g.economy!.markets.bridgetown.sugar.stock=0;expect(quoteBasket(g,[buy('sugar',1)]).errors.join()).toContain('stock');
  g.cargo.sugar=1;g.economy!.markets.bridgetown.sugar.stock=8000;expect(quoteBasket(g,[sell('sugar',1)]).errors.join()).toContain('cannot take');
  expect(quoteBasket(g,[buy('cotton',100)]).errors.join()).toContain('hold');
  expect(quoteBasket(g,[buy('iron',160)]).errors.join()).toContain('deadweight');
 });
 it('never makes an immediate same-port round trip profitable',()=>{
  const g=rich(),before=g.silver;settleBasket(g,[buy('sugar',100)]);settleBasket(g,[sell('sugar',100)]);
  expect(g.silver).toBeLessThan(before);expect(tradeProgress(g.skills).points).toBe(0);
 });
 it('recovers stock in game time independently of observation frequency',()=>{
  const g=rich();settleBasket(g,[buy('sugar',100)]);const split=structuredClone(g);g.hours+=240;
  split.hours+=120;observeMarket(split);split.hours+=120;observeMarket(split);
  expect(stockAt(split,'sugar')).toBeCloseTo(stockAt(g,'sugar'),10);expect(stockAt(g,'sugar')).toBeGreaterThan(3900);
 });
 it('remembers visited markets without refreshing distant information',()=>{
  let g=rich();g=deal(g,[buy('sugar',10)]);const memory=structuredClone(g.economy!.memories.bridgetown);
  g=act(g,{type:'sail',to:'saint-pierre'},()=>.5);
  expect(g.economy!.memories.bridgetown).toEqual(memory);expect(g.economy!.memories['saint-pierre']?.hour).toBe(g.hours);expect(g.economy!.memories.willemstad).toBeUndefined();
 });
 it('migrates legacy cargo without invented purchase profit and preserves contract rewards',()=>{
  const old=rich();delete old.economy;old.cargo.sugar=50;old.contracts=[{id:'legacy',from:'saint-pierre',to:'bridgetown',type:'Letter',reward:999,sailingReward:3,amount:0}];
  const g=normalizeGame(old);expect(g.cargo.sugar).toBe(50);expect(quoteBasket(g,[sell('sugar',50)]).xp).toBe(0);
  const next=act(g,{type:'deliver'});expect(next.archive![0].reward).toBe(999);expect(offers(g).find(c=>c.type==='Letter'&&c.to==='saint-pierre')?.reward).toBe(80);
 });
});
describe('trade provenance and learning',()=>{
 it('credits fractional profit points only for goods bought at another port',()=>{
  const g=rich();settleBasket(g,[buy('sugar',20)]);g.port='saint-pierre';const quote=quoteBasket(g,[sell('sugar',20)]);
  expect(quote.xp).toBeGreaterThan(0);expect(quote.xp).toBeLessThan(1);settleBasket(g,[sell('sugar',20)]);expect(tradeProgress(g.skills).points).toBeCloseTo(quote.xp);
 });
 it('matches FIFO lots and removes fractional food provenance when consumed',()=>{
  const g=rich();settleBasket(g,[buy('provisions',10)]);consumeLots(g,'provisions',125.5);g.provisions-=125.5;
  expect(g.economy!.lots.provisions).toHaveLength(1);expect(g.economy!.lots.provisions![0].quantity).toBeCloseTo(4.5);
  expect(g.economy!.lots.provisions![0].stock).toBeCloseTo(99994.5);
  g.port='saint-pierre';expect(quoteBasket(g,[sell('provisions',4)]).xp).toBe(0);
 });
 it('consumes provisions during ordinary game actions as well as travel',()=>{
  const g=rich(),q=g.economy!.lots.provisions![0].quantity;const next=act(g,{type:'sleep'});
  expect(next.economy!.lots.provisions![0].quantity).toBeCloseTo(q-10/3);
 });
 it('makes splitting quantities unable to improve silver or profit learning',()=>{
  const a=rich();a.ship=createShip('galleon-merchant');a.crew=52;
  settleBasket(a,[buy('sugar',700)]);a.port='saint-pierre';a.economy!.markets['saint-pierre'].sugar.stock=1300;
  const b=structuredClone(a);const full=quoteBasket(a,[sell('sugar',700)]);
  const part1=settleBasket(b,[sell('sugar',350)]),part2=settleBasket(b,[sell('sugar',350)]);
  expect(part1.xp+part2.xp).toBeCloseTo(full.xp,8);expect(part1.sales+part2.sales).toBeLessThanOrEqual(full.sales);
  const c=rich(),d=structuredClone(c),bulk=settleBasket(c,[buy('sugar',100)]);const x=settleBasket(d,[buy('sugar',50)]),y=settleBasket(d,[buy('sugar',50)]);expect(x.buys+y.buys).toBeGreaterThanOrEqual(bulk.buys);
 });
 it('freezes basket prices before awarding a new skill tier',()=>{
  const g=rich();settleBasket(g,[buy('sugar',40)]);g.port='saint-pierre';g.skills!.trade={tier:0,points:9.99};
  const q=quoteBasket(g,[sell('sugar',40),buy('coffee',10)]);settleBasket(g,[sell('sugar',40),buy('coffee',10)]);
  expect(g.silver).toBeCloseTo(q.balance);expect(tradeProgress(g.skills).tier).toBe(1);expect(spread(g)).toBeCloseTo(.14);
  const lot=g.economy!.lots.coffee![0];expect(lot.factor).toBeCloseTo(CATALOGUE.coffee.base*.7*1.15);
 });
});
it('renders the basket and remembered market with accessible controls',()=>{
 const g=rich();const store=renderToStaticMarkup(<Store game={g} busy={false} perform={()=>{}}/>);
 expect(store).toContain('Your basket');expect(store).toContain('Provisions quantity');expect(store).toContain('Requires a national trade permit');expect(store).toContain('Jewelry');
 const journal=renderToStaticMarkup(<MarketsJournal game={g}/>);expect(journal).toContain('Remembered markets');expect(journal).toContain('Recorded');
});
