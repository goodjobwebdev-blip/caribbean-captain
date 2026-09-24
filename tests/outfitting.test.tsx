// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import {afterEach,it,expect} from 'vitest';
import {render,screen,fireEvent,cleanup,within,waitFor} from '@testing-library/react';
import {act,newGame,normalizeGame,shipPurchaseQuote,type Game} from '../src/game';
import {refitQuote,type Refit} from '../src/outfitting';
import {BATTERIES,SHIPS,gunFit,gunDamage,gunAccuracy,gunWeight,maxCalibre,sailStats,shipProtection,shipSaleValue,cannonReplacementQuote,createShip} from '../src/ships';
import {shipPerformance,loadBreakdown} from '../src/performance';
import {saveCheckpoint,restoreCheckpoint,saveProfile} from '../src/storage';
import {financialSummary} from '../src/finance';
import {generateNpc} from '../src/battle/encounter';
import {createBattle,preload,schedule,stepNaval} from '../src/battle/naval';
import {crew,roll,finish,type Ammo} from '../src/battle/types';
import {plannerPayload} from '../src/battle/planner';
import {ShipOutfitting} from '../src/ShipOutfitting';
import {App} from '../src/main';
afterEach(cleanup);
const rich=()=>{const g=newGame('Outfitter',42);g.silver=100000;return g;};
const fit=(g:Game,change:Refit)=>act(g,{type:'refit',change,expected:refitQuote(g,change).token});
const guns:Refit={kind:'guns',battery:'port',gunType:'culverin',calibre:12,count:4};

it('preserves old outfits, prices and performance without mutating old saves',()=>{
 const g=newGame('Legacy',1),before=structuredClone(g),s=g.ship!;
 expect(gunFit(s,'port')).toEqual({type:'cannon',calibre:6,fitted:2});expect(gunWeight(s)).toBe(20);expect(shipSaleValue(s)).toBe(8400);
 expect(shipPerformance(g).factors.sailOutfitSpeed).toBe(1);expect(g).toEqual(before);
 const old={...g,version:1 as const,ship:undefined,condition:70};expect(normalizeGame(old).ship!.hullPoints).toBe(70);expect(old.ship).toBeUndefined();
 for(const spec of SHIPS)expect([6,12,18,24,32]).toContain(maxCalibre(spec));
});

it('refits one battery atomically, accounts for buyback and upkeep, and rejects replay',()=>{
 const g=rich(),before=structuredClone(g),q=refitQuote(g,guns);expect(q.errors).toEqual([]);
 const next=fit(g,guns);expect(g).toEqual(before);expect(gunFit(next.ship!,'port')).toEqual({type:'culverin',calibre:12,fitted:4});
 expect(next.ship!.cannons.starboard).toBe(2);expect(next.ship!.cannons.port).toBe(4);
 expect(next.hours-g.hours).toBe(6);expect(next.silver).toBeCloseTo(g.silver-q.balance-q.wages);expect(next.provisions).toBeCloseTo(g.provisions-q.food);
 expect(financialSummary(next.finances!.entries).cashFlow).toBeCloseTo(-q.balance-q.wages);
 expect(loadBreakdown(next).cannons).toBe(38);expect(gunDamage(next.ship!,'port')).toBe(1);expect(gunAccuracy(next.ship!,'port',450)).toBe(2);
 expect(()=>act(next,{type:'refit',change:guns,expected:q.token})).toThrow('quote changed');
});

it('validates calibre, battery mounts, count, money, food, weight, and combat locks',()=>{
 const g=rich(),bad:Refit[]=[{...guns,calibre:32},{...guns,count:5},{...guns,count:-1},{...guns,count:NaN},{...guns,count:1.5},{...guns,battery:'bow',count:1}];
 for(const c of bad){expect(refitQuote(g,c).errors.length).toBeGreaterThan(0);expect(()=>fit(g,c)).toThrow();}
 expect(()=>fit({...g,silver:0},guns)).toThrow('silver');expect(()=>fit({...g,provisions:0},guns)).toThrow('provisions');
 expect(()=>fit({...g,cargo:{iron:1000}},guns)).toThrow('deadweight');
 expect(()=>fit({...g,voyage:{to:'saint-pierre',hours:1,remaining:1,weather:'Calm',dice:[3,3]}},guns)).toThrow();
 g.battle=createBattle(g,generateNpc(g));expect(()=>fit(g,guns)).toThrow('battle');
});

it('repairs selected guns, never restores deliberately removed guns, and sells no destroyed guns',()=>{
 let g=fit(rich(),guns);g.ship!.cannons.port=2;expect(cannonReplacementQuote(g.ship!)).toBe(800);
 const q=refitQuote(g,{...guns,count:0});expect(q.buyback).toBe(480);
 const repaired=act(g,{type:'replace-cannons'});expect(repaired.ship!.cannons.port).toBe(4);expect(gunFit(repaired.ship!,'port').calibre).toBe(12);
 g=fit(g,{...guns,count:0});expect(cannonReplacementQuote(g.ship!)).toBe(0);expect(()=>act(g,{type:'replace-cannons'})).toThrow('No fitted guns');
 expect(gunFit(g.ship!,'port').fitted).toBe(0);
});

it('changes sailing factors, sail durability and repairs; reinforces only once',()=>{
 const g=rich(),cotton=fit(g,{kind:'sails',sailType:'cotton'}),silk=fit(g,{kind:'sails',sailType:'silk'}),strong=fit(g,{kind:'sails',sailType:'reinforced'});
 expect(shipPerformance(cotton).speed).toBeGreaterThan(shipPerformance(g).speed);expect(shipPerformance(silk).speed).toBeGreaterThan(shipPerformance(cotton).speed);
 expect(sailStats(strong.ship!).damage).toBe(.75);expect(sailStats(silk.ship!).damage).toBe(1.25);
 silk.ship!.sailCondition=20;const renewed=fit(silk,{kind:'sails',sailType:'standard'});expect(renewed.ship!.sailCondition).toBe(100);
 const hull=fit(g,{kind:'hull'});expect(shipProtection(hull.ship!)).toBe(shipProtection(g.ship!)+10);expect(loadBreakdown(hull).reinforcement).toBe(25);
 expect(shipSaleValue(hull.ship!)-shipSaleValue(g.ship!)).toBe(1260);expect(()=>fit(hull,{kind:'hull'})).toThrow('already reinforced');
});

it('retains upgrades through checkpoint restore and includes them in sale without transferring them',async()=>{
 let g=fit(fit(fit(rich(),guns),{kind:'sails',sailType:'cotton'}),{kind:'hull'});
 const p={id:'outfit-checkpoint',name:g.captain,game:g,updated:1},cp=await saveCheckpoint(p,'Fitted','Church'),q=shipPurchaseQuote(g,'schooner-universal');
 const next=act(g,{type:'buy-ship',configurationId:'schooner-universal'});expect(next.silver).toBe(g.silver-q.balance);expect(next.ship!.reinforcedHull).toBeUndefined();expect(next.ship!.gunFits).toBeUndefined();expect(next.ship!.sailType).toBeUndefined();
 expect(restoreCheckpoint({...p,game:next},cp).game.ship).toEqual(g.ship);
 // Refitting and stripping must never manufacture value.
 const before=rich(),upgraded=fit(before,guns),stripped=fit(upgraded,{...guns,count:0});
 expect(upgraded.silver+shipSaleValue(upgraded.ship!)).toBeLessThan(before.silver+shipSaleValue(before.ship!));
 expect(stripped.silver+shipSaleValue(stripped.ship!)).toBeLessThan(upgraded.silver+shipSaleValue(upgraded.ship!));
});

function shot(options:{type?:'cannon'|'culverin';calibre?:6|12;ammo?:Ammo;sailType?:'standard'|'reinforced'|'silk';reinforced?:boolean;natural?:number;distance?:number}={}){
 const g=rich();g.ship!.id='player';g.ship!.gunFits={port:{type:options.type??'cannon',calibre:options.calibre??6,fitted:2}};
 const n=generateNpc(g);n.ship=createShip('sloop-universal','Enemy','enemy');n.ship.sailType=options.sailType;n.ship.reinforcedHull=options.reinforced;n.crew=crew(10);
 g.cargo={'chain-shot':20,'round-shot':20,bombs:20,gunpowder:60};const b=createBattle(g,n),p=b.ships.player,e=b.ships.enemy;
 p.sails=0;e.sails=0;p.heading=0;e.x=0;e.y=-(options.distance??450);
 p.skills.aiming=0;
 preload(b,'player','port',options.ammo??'chain-shot');b.plans.player=schedule(b,'player',['fire_port']);b.plans.enemy=[];b.status='playback';
 for(let seed=0;seed<100000;seed++){if(roll({seed},'test',{}).dice.reduce((a,b)=>a+b,0)===(options.natural??10)){g.seed=seed;break;}}
 stepNaval(g,b);return {g,b,p:b.ships.player,e:b.ships.enemy};
}
it('applies calibre damage and culverin accuracy in actual volleys',()=>{
 const small=shot({natural:12}),heavy=shot({calibre:12,natural:12}),culverin=shot({type:'culverin',natural:12});
 expect(heavy.e.ship.sailCondition).toBeLessThan(small.e.ship.sailCondition);expect(culverin.e.ship.sailCondition).toBeGreaterThan(small.e.ship.sailCondition);
 const c=shot({type:'culverin'});expect(c.b.rolls.find(r=>r.label==='Cannon volley')?.parts['Gun accuracy']).toBe(2);
 expect(shot({type:'culverin',distance:200}).b.rolls.find(r=>r.label==='Cannon volley')?.parts['Gun accuracy']).toBe(1);
 const outside=shot({type:'culverin',distance:700});expect(outside.p.batteries.port.loaded).toBe(2);expect(outside.b.status).toBe('replacement');
});
it('uses sail durability and hull protection in actual damage and exposes outfit to the planner',()=>{
 const plain=shot({natural:12}),tough=shot({sailType:'reinforced',natural:12}),fragile=shot({sailType:'silk',natural:12});expect(tough.e.ship.sailCondition).toBeGreaterThan(plain.e.ship.sailCondition);expect(fragile.e.ship.sailCondition).toBeLessThan(plain.e.ship.sailCondition);
 const a=shot({ammo:'bombs',distance:200,natural:12}),b=shot({ammo:'bombs',distance:200,natural:12,reinforced:true});expect(b.e.ship.hullPoints).toBeGreaterThan(a.e.ship.hullPoints);
 expect(plannerPayload(b.b).ownOutfit.protection).toBe(20);
});
it('keeps fittings when taking a captured ship',()=>{
 const g=rich();g.ship!.id='player';const n=generateNpc(g);n.ship=createShip('sloop-universal','Prize','enemy');n.ship.reinforcedHull=true;n.ship.sailType='cotton';n.ship.gunFits={port:{type:'culverin',calibre:12,fitted:2}};n.crew=crew(10);
 g.battle=createBattle(g,n);g.voyage={to:'saint-pierre',hours:49,remaining:20,weather:'Steady',dice:[3,3],contacts:[]};finish(g.battle,'player','Surrender');
 const next=act(g,{type:'battle-settle',choice:{ship:'exchange',captain:'release',cargo:{},route:'continue'}});
 expect(next.ship!.reinforcedHull).toBe(true);expect(next.ship!.sailType).toBe('cotton');expect(gunFit(next.ship!,'port').type).toBe('culverin');
});
it('requires confirmation, supports cancellation, and leaves outfitting usable after a refit',()=>{
 let g=rich();const perform=(a:Parameters<typeof act>[1])=>{g=act(g,a);v.rerender(<ShipOutfitting game={g} busy={false} perform={perform}/>);};
 const v=render(<ShipOutfitting game={g} busy={false} perform={perform}/>);
 fireEvent.change(screen.getByLabelText('port gun type'),{target:{value:'culverin'}});fireEvent.change(screen.getByLabelText('port calibre'),{target:{value:'12'}});
 fireEvent.click(screen.getByRole('button',{name:'Review port refit'}));expect(g.ship!.gunFits).toBeUndefined();fireEvent.click(screen.getByRole('button',{name:'Cancel refit'}));expect(g.ship!.gunFits).toBeUndefined();
 fireEvent.click(screen.getByRole('button',{name:'Review port refit'}));fireEvent.click(screen.getByRole('button',{name:'Confirm refit'}));expect(gunFit(g.ship!,'port').type).toBe('culverin');expect(screen.getByRole('heading',{name:'Armament'})).toBeTruthy();
});
it('opens outfitting from the shipwright dialogue',async()=>{
 const g=rich();await saveProfile({id:'outfit-app',name:'Outfitter integration',game:g,updated:Date.now()});render(<App/>);
 const card=await screen.findByRole('button',{name:/Outfitter integration/});fireEvent.click(card);
 const locations=await screen.findByRole('navigation',{name:'Town locations'});fireEvent.click(within(locations).getByText('Shipyard',{exact:true}));await screen.findByText('Thomas Reed');
 fireEvent.click(screen.getByRole('button',{name:/Let us discuss guns/}));expect(screen.getByLabelText('port calibre')).toBeTruthy();
});
