import 'fake-indexeddb/auto';
import {describe,it,expect} from 'vitest';
import {act,newGame,normalizeGame,ownedShip,currentShip,shipPurchaseQuote,hoursTo,offers,cargoUsed,hullPercent,type Game} from '../src/game';
import {SHIPS,STARTER_ID,BATTERIES,createShip,shipDefinition,shipSaleValue,hullRepairQuote,sailRepairQuote,cannonReplacementQuote} from '../src/ships';
import {saveProfile,profiles,saveCheckpoint,restoreCheckpoint,checkpoints,type Profile} from '../src/storage';
const rich=()=>{const g=newGame('Mary',42);g.silver=1000000;return g;};
const buy=(g:Game,id:string)=>act(g,{type:'buy-ship',configurationId:id});
describe('ship catalogue and replacement',()=>{
 it('has six tiers and valid variants, crew limits, and per-battery loadouts',()=>{
  expect(SHIPS).toHaveLength(28);expect(new Set(SHIPS.map(s=>s.id)).size).toBe(SHIPS.length);
  expect([...new Set(SHIPS.map(s=>s.tier))]).toEqual([1,2,3,4,5,6]);
  expect(new Set(SHIPS.map(s=>s.shipClass)).size).toBe(3);
  for(const s of SHIPS){
   expect(s.minCrew).toBeGreaterThan(0);expect(s.optimalCrew).toBeGreaterThanOrEqual(s.minCrew);expect(s.maxCrew).toBeGreaterThanOrEqual(s.optimalCrew);
   expect(s.price).toBeGreaterThan(0);expect(s.capacity).toBeGreaterThan(0);expect(s.maxHull).toBeGreaterThan(0);expect(s.speed).toBeGreaterThan(0);
   for(const b of BATTERIES){expect(Number.isInteger(s.cannonCapacity[b])).toBe(true);expect(s.defaultCannons[b]).toBeGreaterThanOrEqual(0);expect(s.defaultCannons[b]).toBeLessThanOrEqual(s.cannonCapacity[b]);}
  }
  expect(SHIPS.filter(s=>s.hullType==='Fluyt').map(s=>s.shipClass)).toEqual(['Merchant']);
 });
 it('starts with an owned Universal Sloop, 800 silver and independent ship state',()=>{
  const a=newGame('A',1),b=newGame('B',2);expect(a.ship?.configurationId).toBe(STARTER_ID);expect(a.silver).toBe(800);
  a.ship!.cannons.port=0;expect(b.ship!.cannons.port).toBe(2);expect(shipDefinition(STARTER_ID).defaultCannons.port).toBe(2);
 });
 it('quotes and exchanges exactly once, retaining people, goods, provisions and quests',()=>{
  let g=rich();g=act(g,{type:'accept',contract:offers(g).find(c=>c.type==='Freight')!});g=act(g,{type:'accept',contract:offers(g).find(c=>c.type==='Passengers')!});g.cargo.sugar=40;
  const before=structuredClone(g),q=shipPurchaseQuote(g,'schooner-universal');
  expect(q.sale).toBe(8400);expect(q.balance).toBe(5600);expect(q.problems).toEqual([]);
  const next=buy(g,q.target.id);expect(next.ship?.configurationId).toBe('schooner-universal');expect(next.silver).toBe(g.silver-5600);
  expect(next.crew).toBe(g.crew);expect(next.provisions).toBe(g.provisions);expect(next.cargo).toEqual(g.cargo);expect(next.contracts).toEqual(g.contracts);expect(next.hours).toBe(g.hours);expect(g).toEqual(before);
  expect(()=>buy(next,q.target.id)).toThrow('already command');
 });
 it('rejects insufficient silver and invalid configurations without mutation',()=>{
  const g=newGame('A',1),snapshot=structuredClone(g);
  expect(()=>buy(g,'schooner-universal')).toThrow('silver');expect(()=>buy(g,'forged-ship')).toThrow('Unknown');expect(g).toEqual(snapshot);
 });
 it('checks hold space, passengers, excess crew, and minimum crew separately',()=>{
  const g=rich();g.cargo.sugar=130;expect(()=>buy(g,'schooner-universal')).toThrow('hold load');
  g.cargo.sugar=0;g.provisions=20;g.crew=13;expect(()=>buy(g,'cutter-universal')).toThrow('Release crew');
  g.crew=10;g.contracts=[{id:'p',type:'Passengers',from:'bridgetown',to:'saint-pierre',amount:6,reward:1}];expect(()=>buy(g,'tartana-universal')).toThrow('berths');
  g.contracts=[];expect(()=>buy(g,'brig-universal')).toThrow('Hire at least 16');
 });
 it('returns cash on a downgrade without permitting profitable trade-in cycles',()=>{
  const g=rich();const small=buy(g,'tartana-universal');expect(small.silver).toBe(g.silver+4400);
  expect(buy(small,STARTER_ID).silver).toBeLessThan(g.silver);
 });
 it('permits a path from the sloop to every configuration using intermediate ships',()=>{
  const reached=new Set([STARTER_ID]);let previous=0;
  while(previous!==reached.size){previous=reached.size;for(const id of [...reached])for(const target of SHIPS){const current=shipDefinition(id);if(target.minCrew<=current.maxCrew)reached.add(target.id);}}
  expect(reached.size).toBe(SHIPS.length);
 });
 it('uses owned ship speed, cargo, crew and berths while keeping quest pricing fixed',()=>{
  const g=rich(),schooner=buy(g,'schooner-universal');
  expect(hoursTo('bridgetown','saint-pierre',schooner)).toBe(40);expect(offers(schooner)).toEqual(offers(g));
  const merchant=buy(g,'sloop-merchant');const loaded=act(merchant,{type:'buy',good:'provisions',quantity:250});expect(cargoUsed(loaded)).toBeGreaterThan(300);
  schooner.crew=24;expect(()=>act(schooner,{type:'hire'})).toThrow('full');
  const small=buy(g,'tartana-universal');const passage=offers(small).find(c=>c.type==='Passengers')!;
  const full=act(small,{type:'accept',contract:passage});const other=offers(full).find(c=>c.type==='Passengers')!;expect(()=>act(full,{type:'accept',contract:other})).toThrow('3 passenger berths');
 });
 it('releases crew at the tavern but preserves minimum operating crew',()=>{
  const g=rich(),next=act(g,{type:'dismiss'});expect(next.crew).toBe(9);expect(next.hours).toBe(g.hours+1);
  next.crew=5;expect(()=>act(next,{type:'dismiss'})).toThrow('at least 5');
 });
});
describe('condition and ship saves',()=>{
 it('values damage and missing cannons, with independent repair services',()=>{
  const g=rich();g.ship!.hullPoints=60;g.ship!.sailCondition=80;g.ship!.cannons.port=1;
  expect(hullRepairQuote(g.ship!)).toBe(80);expect(sailRepairQuote(g.ship!)).toBe(40);expect(cannonReplacementQuote(g.ship!)).toBe(200);expect(shipSaleValue(g.ship!)).toBe(8080);
  const hull=act(g,{type:'repair'});expect(hull.ship!.hullPoints).toBe(100);expect(hull.ship!.sailCondition).toBe(80);expect(hull.ship!.cannons.port).toBe(1);
  const sails=act(hull,{type:'repair-sails'});expect(sails.ship!.sailCondition).toBe(100);
  const guns=act(sails,{type:'replace-cannons'});expect(guns.ship!.cannons.port).toBe(2);expect(shipSaleValue(guns.ship!)).toBe(8400);
  expect(guns.silver).toBeLessThan(g.silver-319);
 });
 it('keeps prototype encounter hull damage proportional and respects each crew minimum',()=>{
  const g=rich();g.ship=createShip('brig-universal');g.crew=16;g.provisions=200;
  let calls=0;const encounter=act(g,{type:'sail',to:'saint-pierre'},()=>calls++===0?.5:0);
  const next=act(encounter,{type:'encounter',choice:'fight'},()=>.5);
  expect(next.ship!.hullPoints).toBe(240);expect(hullPercent(next)).toBe(80);expect(next.failed).toContain('Too few');
  expect(()=>buy(encounter,STARTER_ID)).toThrow('encounter');expect(()=>buy(next,STARTER_ID)).toThrow('checkpoint');
 });
 it('migrates legacy condition without resetting damage, progress, failure or a pending voyage',()=>{
  const legacy=rich();legacy.version=1;delete legacy.ship;legacy.condition=37;legacy.voyage={to:'saint-pierre',hours:49,remaining:25,weather:'Steady winds',dice:[1,1]};
  legacy.skills={sailing:{tier:2,points:8,sailingHours:12}};
  const before=structuredClone(legacy),g=normalizeGame(legacy);
  expect(g.version).toBe(2);expect(ownedShip(g).hullPoints).toBe(37);expect(g.condition).toBeUndefined();expect(g.voyage).toEqual(legacy.voyage);expect(g.skills).toEqual(legacy.skills);expect(g.seed).toBe(legacy.seed);expect(legacy).toEqual(before);
  legacy.failed='Already lost';expect(normalizeGame(legacy).failed).toBe('Already lost');
 });
 it('loads old profiles and restores both old and new church ship records',async()=>{
  const legacy=rich();legacy.version=1;delete legacy.ship;legacy.condition=61;
  const p:Profile={id:'ship-migration',name:'Mary',game:legacy,updated:1};await saveProfile(p);
  const old=await saveCheckpoint(p,'Old sloop','Church');
  const read=(await profiles()).find(x=>x.id===p.id)!;expect(read.game.ship!.hullPoints).toBe(61);
  const upgraded={...read,game:buy(read.game,'schooner-universal')};await saveProfile(upgraded);
  const modern=await saveCheckpoint(upgraded,'New schooner','Church');
  const restored=restoreCheckpoint(upgraded,old);expect(restored.game.ship!.configurationId).toBe(STARTER_ID);expect(restored.game.ship!.hullPoints).toBe(61);expect(restored.game.silver).toBe(legacy.silver);
  expect(restoreCheckpoint(restored,modern).game.ship).toEqual(upgraded.game.ship);
  expect((await checkpoints(p.id)).find(c=>c.id===old.id)!.game.ship).toBeUndefined();
 });
});
