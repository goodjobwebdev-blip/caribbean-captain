import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {PORTS,ISLANDS,port} from '../src/world';
import {act,newGame,normalizeGame,offers,distance,hoursTo} from '../src/game';
import {ensureEconomy,marketRule,quoteBasket,settleBasket} from '../src/trade';
import {nationOf,hasPermit,localEvent} from '../src/commerce';
import {generateNpc,rewardSafePassengers,resolveEncounter} from '../src/battle/encounter';
import {createShip} from '../src/ships';
import {saveCheckpoint,restoreCheckpoint} from '../src/storage';
import {Routes} from '../src/Routes';

it('sails to every colonial port and delivers each kind of contract',()=>{
 expect(PORTS).toHaveLength(15);expect(ISLANDS).toHaveLength(13);
 for(const destination of PORTS.filter(p=>p.id!=='bridgetown'))for(const type of ['Letter','Freight','Passengers'] as const){
  let g=newGame('Explorer',7);g.ship=createShip('brigantine-merchant');g.crew=16;g.provisions=590;g.silver=10000;g.pirateDanger=0;
  const job=offers(g).find(c=>c.to===destination.id&&c.type===type)!;
  g=act(g,{type:'accept',contract:job});g=act(g,{type:'sail',to:destination.id},()=>.5);
  expect(g.failed,`${destination.name}: ${type}`).toBeNull();expect(g.port).toBe(destination.id);
  g=act(g,{type:'deliver'});expect(g.archive![0].id).toBe(job.id);expect(g.contracts).toHaveLength(0);
  expect(g.economy!.commerce!.attitude[destination.nation]).toBe(2);
 }
});

it('adds missing markets to old saves without altering old stock, memories, lots or contracts',()=>{
 const old=newGame('Trader',12);settleBasket(old,[{good:'sugar',side:'buy',quantity:10}]);
 old.contracts=[offers(old)[0]];old.accepted=[old.contracts[0].id];old.hours=83;
 for(const p of PORTS.slice(3)) {delete (old.economy!.markets as any)[p.id];delete (old.economy!.blackMarkets as any)[p.id];}
 const before=structuredClone(old),g=normalizeGame(old);
 expect(old).toEqual(before);expect(g.economy!.markets.bridgetown).toEqual(before.economy!.markets.bridgetown);
 expect(g.economy!.blackMarkets!.bridgetown).toEqual(before.economy!.blackMarkets!.bridgetown);
 expect(g.economy!.memories).toEqual(before.economy!.memories);expect(g.economy!.lots).toEqual(before.economy!.lots);
 expect(g.seed).toBe(before.seed);expect(g.contracts).toEqual(before.contracts);expect(g.accepted).toEqual(before.accepted);
 expect(g.economy!.markets.havana.coffee).toEqual({stock:marketRule('havana','coffee').target,hour:83});
 expect(g.economy!.memories.havana).toBeUndefined();
 const again=structuredClone(g);ensureEconomy(g);expect(g).toEqual(again);
});

it('shares permits across Spanish ports but not other nations, and accounts for Spanish passengers',()=>{
 let g=newGame('Permit',4);g.port='san-juan';g.silver=2000;g=act(g,{type:'buy-permit'});
 expect(hasPermit(g,'havana')).toBe(true);expect(hasPermit(g,'santo-domingo')).toBe(true);expect(hasPermit(g,'port-au-prince')).toBe(false);
 expect(nationOf('san-jose')).toBe('Spain');
 g.contracts=[offers(g).find(c=>c.type==='Passengers')!];rewardSafePassengers(g);
 expect(g.economy!.commerce!.attitude.Spain).toBe(2);
 g.encounter={stage:'response',npc:generateNpc(g),posture:'Demand',demand:{kind:'passengers',value:100,fraction:1},responses:0,early:false,movementUsed:false,message:''};
 resolveEncounter(g,{choice:'comply'});expect(g.contracts).toHaveLength(0);expect(g.economy!.commerce!.attitude.Spain).toBe(-8);
 expect(g.economy!.commerce!.attitude).not.toHaveProperty('undefined');
});

it('keeps old event seeds and gives new towns independent deterministic event schedules',()=>{
 const g=newGame('Weather',31);const histories=PORTS.map(p=>Array.from({length:15},(_,i)=>{g.hours=8+(i+1)*240;return localEvent(g,p.id)?.title??'-';}).join(','));
 expect(new Set(histories).size).toBe(PORTS.length);
 g.hours=248;const period=1;
 for(const [i,p] of PORTS.slice(0,3).entries()){
  let hash=(31^Math.imul(period,2654435761)^Math.imul(i+1,1597334677))>>>0;hash=Math.imul(hash^(hash>>>16),2246822507)>>>0;
  expect(localEvent(g,p.id)?.title??null).toBe(hash%4===0?null:['Poor harvest','Bountiful harvest','Shipyard orders','Festival demand','Merchant convoy'][(hash>>>3)%5]);
 }
});

it('uses new ports for encounter origins and preserves their market intelligence',()=>{
 const g=newGame('Lookout',17),origins=new Set<string>();
 for(let i=0;i<150;i++){const npc=generateNpc(g);origins.add(npc.origin);expect(npc.market.goods.coffee.role).toBe(marketRule(npc.origin,'coffee').role);}
 expect(origins.size).toBe(15);
});

it('keeps same-island towns independent and supports checkpoints there',async()=>{
 let g=newGame('Island trader',7);g.port='santo-domingo';g.silver=5000;
 const other=structuredClone(g.economy!.markets['port-au-prince']);
 g=act(g,{type:'buy',good:'hides',quantity:10});expect(g.economy!.markets['port-au-prince']).toEqual(other);
 expect(distance('santo-domingo','port-au-prince')).toBeGreaterThan(90);expect(hoursTo('havana','santiago',g)).toBeGreaterThan(0);
 const profile={id:'new-world',name:g.captain,game:g,updated:1},saved=await saveCheckpoint(profile,'Hispaniola','Church');
 expect(restoreCheckpoint(profile,saved).game).toEqual(normalizeGame(saved.game));
});

it('groups routes by island, names every destination, and disables departure when unsailable',()=>{
 const g=newGame('Routes',2);g.port='havana';const html=renderToStaticMarkup(<Routes game={g} busy={false} onSelect={()=>{}}/>);
 expect(html).toContain('Find a destination');expect(html).toContain('aria-label="Hispaniola"');
 for(const p of PORTS.filter(p=>p.id!==g.port))expect(html).toContain(`Plan voyage to ${p.name.replaceAll("'",'&#x27;')}`);
 expect(html).not.toContain('Plan voyage to Havana');
 g.ship!.sailCondition=0;const blocked=renderToStaticMarkup(<Routes game={g} busy={false} onSelect={()=>{}}/>);
 expect((blocked.match(/disabled=""/g)??[]).length).toBe(14);
});

it('provides distinct economic profiles and valid quotes in every new market',()=>{
 const signatures=new Set<string>();
 for(const p of PORTS){const g=newGame('Markets',1);g.port=p.id;const quote=quoteBasket(g,[{good:'provisions',side:'buy',quantity:1}]);expect(quote.errors).toEqual([]);
 signatures.add(['coffee','cocoa','tobacco','cotton','sugar','cloth','rum','hides','tools','timber','salt','spices','sailcloth','medicine','silverware','grain','paper','iron'].map(id=>marketRule(p.id,id as any).role).join(','));}
 expect(signatures.size).toBe(15);
});
