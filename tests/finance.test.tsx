import {legacyVoyage} from './legacy-voyage';
import 'fake-indexeddb/auto';
import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {act,newGame,normalizeGame,type Game,type Action,offers} from '../src/game';
import {financialSummary} from '../src/finance';
import {quoteBasket,cargoCost,observeMarket} from '../src/trade';
import {provisionQuote,materialRepairQuote} from '../src/operations';
import {departureEstimate,DepartureFinance} from '../src/DepartureFinance';
import {FinanceJournal} from '../src/FinanceJournal';
import {saveCheckpoint,restoreCheckpoint,type Profile} from '../src/storage';
function rich(){const g=newGame('Bookkeeper',11);g.silver=100000;g.finances!.openingSilver=g.silver;return g;}
function step(g:Game,a:Action,rng=()=>.5){const next=act(g,a,rng);expect(financialSummary(next.finances!.entries).cashFlow).toBeCloseTo(next.silver-next.finances!.openingSilver,7);return next;}
function trade(g:Game,good:any,quantity:number,side:'buy'|'sell'='buy',channel:'legal'|'smuggler'='legal',rng=()=>.99){const lines=[{good,quantity,side}];return step(g,{type:'trade',lines,channel,expected:quoteBasket(g,lines,channel).token},rng);}
describe('financial ledger',()=>{
 it('keeps unsold purchases as inventory and recognizes their cost only at sale',()=>{
  let g=rich();g=trade(g,'sugar',30);let s=financialSummary(g.finances!.entries);expect(s.tradingMargin).toBe(0);expect(s.cashFlow).toBeLessThan(0);
  const cost=cargoCost(g,'sugar',10).total;g.port='saint-pierre';g=trade(g,'sugar',10,'sell');const sale=g.finances!.entries.find(e=>e.kind==='sale')!;
  expect(sale.cost).toBeCloseTo(cost);s=financialSummary(g.finances!.entries);expect(s.tradingMargin).toBeCloseTo(sale.cash-cost);expect(g.cargo.sugar).toBe(20);
 });
 it('records operational services and capital ship exchanges without calling them trading losses',()=>{
  let g=rich();g=step(g,{type:'hire'});g=step(g,{type:'sleep'});g=step(g,{type:'buy-permit'});g=step(g,{type:'meet-smuggler'});
  g.ship!.hullPoints-=5;g=step(g,{type:'repair'});g.ship!.sailCondition-=5;g=step(g,{type:'repair-sails'});g.ship!.cannons.port--;g=step(g,{type:'replace-cannons'});
  const before=financialSummary(g.finances!.entries).knownResult;g=step(g,{type:'buy-ship',configurationId:'schooner-merchant'});expect(financialSummary(g.finances!.entries).knownResult).toBeCloseTo(before);expect(g.finances!.entries.some(e=>e.kind==='ship-purchase')).toBe(true);
 });
 it('records food preparation once as inventory cost and records repair materials when used',()=>{
  let g=rich();g=trade(g,'grain',5);const q=provisionQuote(g,'grain',5);g=step(g,{type:'prepare-provisions',good:'grain',quantity:5,expected:q.token});expect(g.finances!.entries.filter(e=>e.kind==='preparation')).toHaveLength(1);
  g=trade(g,'planks',1);g=trade(g,'tools',1);g.ship!.hullPoints=80;const r=materialRepairQuote(g,'hull');g=step(g,{type:'material-repair',kind:'hull',expected:r.token});expect(g.finances!.entries.find(e=>e.kind==='materials-used')?.cost).toBeCloseTo(r.knownCost!);
 });
 it('keeps unknown costs explicit for gifts and legacy inventory',()=>{
  const g=rich();g.cargo.sugar=10;g.economy!.lots.sugar=[{quantity:10}];const next=trade(g,'sugar',5,'sell'),summary=financialSummary(next.finances!.entries);expect(summary.tradingMargin).toBeNull();expect(summary.operatingResult).toBeNull();expect(summary.unknownSales).toBe(true);
 });
 it('records fines and confiscation without double-counting the purchase as a profit expense',()=>{
  let g=step(rich(),{type:'meet-smuggler'});g=trade(g,'weapons',1,'buy','smuggler',()=>0);const purchase=g.finances!.entries.find(e=>e.kind==='purchase')!,loss=g.finances!.entries.find(e=>e.kind==='confiscation')!;
  expect(loss.cash).toBe(0);expect(loss.cost).toBe(-purchase.cash);expect(g.finances!.entries.some(e=>e.kind==='fine')).toBe(true);
 });
 it('records fruit book-cost losses and only actually elapsed wages on failure',()=>{
  let g=trade(rich(),'fruit',10);g.provisions=1;const before=g.hours;g=step(g,{type:'sleep'});expect(g.hours-before).toBe(2);expect(g.failed).not.toBeNull();expect(g.finances!.entries.filter(e=>e.kind==='spoilage').every(e=>e.cost!==null)).toBe(true);
 });
 it('does not create ledger entries for rejected actions',()=>{
  const g=rich(),before=structuredClone(g);expect(()=>act(g,{type:'sell',good:'sugar',quantity:1})).toThrow();expect(g).toEqual(before);
 });
});
describe('automatic port-to-port accounts',()=>{
 it('groups destination business with the arriving leg and closes it at the next departure',()=>{
  let g=trade(rich(),'sugar',20);expect(g.finances!.entries.every(e=>e.account===null)).toBe(true);g=step(g,{type:'sail',to:'saint-pierre'});
  expect(g.finances!.voyages).toHaveLength(1);expect(g.finances!.voyages[0].status).toBe('in-port');g=trade(g,'sugar',20,'sell');
  const first=structuredClone(g.finances!.voyages[0]),firstEntries=g.finances!.entries.filter(e=>e.account===first.id);expect(financialSummary(firstEntries).cashFlow).toBeCloseTo(first.currentSilver-first.openingSilver);expect(firstEntries.some(e=>e.kind==='sale')).toBe(true);
  g=step(g,{type:'sail',to:'bridgetown'});expect(g.finances!.voyages).toHaveLength(2);expect(g.finances!.voyages[0].status).toBe('closed');expect(g.finances!.voyages[0].currentSilver).toBe(first.currentSilver);expect(g.finances!.entries.filter(e=>e.account===1)).toEqual(firstEntries);
 });
 it('records rewards after arrival and correctly reconciles encounter payments',()=>{
  let g=rich();g=step(g,{type:'accept',contract:offers(g).find(c=>c.to==='saint-pierre'&&c.type==='Letter')!});g=legacyVoyage(g,.85);expect(g.finances!.voyages[0].status).toBe('at-sea');g=step(g,{type:'encounter',choice:'negotiate'},()=>0);g=step(g,{type:'deliver'});
  expect(g.finances!.entries.find(e=>e.kind==='ransom')?.cash).toBe(-150);expect(g.finances!.entries.find(e=>e.kind==='quest')?.account).toBe(1);
 });
 it('keeps a failed sea leg and does not invent history for legacy ongoing voyages',()=>{
  let g=rich();g.provisions=1;g=step(g,{type:'sail',to:'saint-pierre'});expect(g.finances!.voyages[0].status).toBe('failed');
  const old=rich();delete old.finances;old.voyage={to:'saint-pierre',hours:50,remaining:25,weather:'Steady winds',dice:[1,1]};old.hours=40;const migrated=normalizeGame(old);expect(migrated.finances!.entries).toEqual([]);expect(migrated.finances!.voyages[0]).toMatchObject({partial:true,departure:40,status:'at-sea'});
 });
 it('restores ledger and voyage grouping from church checkpoints',async()=>{
  const p:Profile={id:'finance-captain',name:'Bookkeeper',game:rich(),updated:1};p.game=step(p.game,{type:'sail',to:'saint-pierre'});const saved=await saveCheckpoint(p,'Before business','Church');p.game=step(p.game,{type:'sleep'});expect(restoreCheckpoint(p,saved).game.finances).toEqual(saved.game.finances);
 });
});
describe('departure financial estimates',()=>{
 it('uses remembered prices, accounts for spoilage and never reads live remote markets',()=>{
  let g=trade(rich(),'fruit',40);g.port='saint-pierre';observeMarket(g);g.port='bridgetown';const before=structuredClone(g),a=departureEstimate(g,'saint-pierre')!;expect(a.lostFruit).toBeGreaterThan(0);expect(a.rows[0].quantity).toBeLessThan(40);expect(g).toEqual(before);
  g.economy!.markets['saint-pierre'].fruit.stock=0;expect(departureEstimate(g,'saint-pierre')).toEqual(a);
 });
 it('keeps unknown destination estimates incomplete and increases expenses for slower scenarios',()=>{
  const g=rich();g.cargo.sugar=10;const normal=departureEstimate(g,'saint-pierre')!,slow=departureEstimate(g,'saint-pierre',1.25,24)!;
  expect(normal.missing).toBe(true);expect(normal.estimatedResult).toBeNull();expect(slow.wages).toBeGreaterThan(normal.wages);g.provisions=0;expect(departureEstimate(g,'saint-pierre')?.canFeed).toBe(false);
 });
 it('renders separate cash and profit measures and explicit estimate limitations',()=>{
  const g=rich();expect(renderToStaticMarkup(<FinanceJournal game={g}/>)).toContain('Unsold cargo is not a loss');expect(renderToStaticMarkup(<DepartureFinance game={g} to="saint-pierre"/>)).toContain('Uses only remembered legal-market prices');
 });
});
