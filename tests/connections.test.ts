import 'fake-indexeddb/auto';
import {describe,expect,it} from 'vitest';
import {act,foodFor,newGame,normalizeGame,type Game} from '../src/game';
import {PORTS,port,type PortId} from '../src/world';
import {attitude,reputation} from '../src/commerce';
import {consumeLots} from '../src/trade';
import {connectionsView,connectionObjective,connectionQuote,completeConnection,type ConnectionAction,type ConnectionChoice} from '../src/connections';
import {profiles,saveProfile,saveCheckpoint,restoreCheckpoint,type Profile} from '../src/storage';

function ready(origin:'aid'|'paid'='aid',source:PortId='bridgetown'):Game{
 const g=newGame('The Ledger',81);g.port=source;return act(g,{type:'harbour-story',port:source,choice:origin});
}
function option(g:Game,choice:ConnectionChoice){const o=connectionsView(g)?.options.find(o=>o.id===choice);if(!o)throw Error(`Missing ${choice} option`);return o;}
function choose(g:Game,choice:ConnectionChoice){return act(g,option(g,choice).action);}
function nextPort(g:Game):Game{return {...g,port:connectionObjective(g)!.destination};}
function middle(origin:'aid'|'paid'='aid'){return nextPort(choose(ready(origin),'accept'));}
function end(origin:'aid'|'paid'='aid',choice:'witness'|'bargain'='witness'){return nextPort(choose(middle(origin),choice));}
function afterUpkeep(g:Game,choice:ConnectionChoice){
 const q=connectionQuote(g,option(g,choice).action),next=structuredClone(g);
 next.hours+=q.hours;next.silver-=q.wages;const food=foodFor(g,q.hours);consumeLots(next,'provisions',food);next.provisions-=food;
 return {q,next};
}

describe('connected Lantern Ledger journey',()=>{
 it('unlocks only after durable local harbour work, without changing old saves',()=>{
  const old=newGame('Old captain',2),before=structuredClone(old);
  expect(connectionsView(old)).toBeNull();expect(connectionObjective(old)).toBeNull();expect(old).toEqual(before);
  expect(connectionsView(normalizeGame(old))).toBeNull();expect(old.connections).toBeUndefined();
  const unlocked=ready();expect(connectionsView(unlocked)?.status).toBe('offer');expect(unlocked.connections).toBeUndefined();
  expect(connectionsView({...unlocked,port:'havana'})).toBeNull();
 });
 it('makes acceptance explicit and charges normal time, wages and provisions through the public reducer',()=>{
  const g=ready(),before=structuredClone(g),o=option(g,'accept');
  expect(o.quote.hours).toBe(1);expect(o.quote.reward).toBe(0);
  const accepted=act(g,o.action);
  expect(g).toEqual(before);expect(accepted.hours).toBe(g.hours+1);
  expect(accepted.silver).toBeCloseTo(g.silver-o.quote.wages);expect(accepted.provisions).toBeCloseTo(g.provisions-o.quote.provisions);
  expect(accepted.connections?.stage).toBe('crossroads');expect(accepted.seed).toBe(g.seed);
  expect(accepted.log[0].text).toBe(accepted.connections?.outcome);
  expect(accepted.finances?.entries.at(-2)?.kind).toBe('wages');
 });
 it('has three distinct real ports and two nearby deterministic legs from every starting port',()=>{
  for(const p of PORTS){
   const g=choose(ready('aid',p.id),'accept'),route=g.connections!.route;
   expect(route[0]).toBe(p.id);expect(new Set(route).size).toBe(3);
   for(const id of route)expect(PORTS.some(p=>p.id===id)).toBe(true);
   for(let i=1;i<route.length;i++)expect(Math.hypot(port(route[i]).x-port(route[i-1]).x,port(route[i]).y-port(route[i-1]).y)).toBeLessThan(300);
   expect(choose(ready('aid',p.id),'accept').connections?.route).toEqual(route);
  }
 });
 it('reveals the current destination without leaking unreached dialogue, choices or final reward',()=>{
  const source=ready(),opening=connectionsView(source)!;
  expect(opening.scene).toContain('Inés Duarte');expect(opening.scene).toContain('Silas Rook');
  const travelling=choose(source,'accept'),v=connectionsView(travelling)!;
  expect(v.status).toBe('travel');expect(v.scene).toBeNull();expect(v.options).toEqual([]);
  expect(v.objective?.destination).toBe(travelling.connections!.route[1]);
  expect(JSON.stringify(v)).not.toContain(port(travelling.connections!.route[2]).name);
  const reached=connectionsView(nextPort(travelling))!;
  expect(reached.status).toBe('scene');expect(reached.chapter).toBe(2);expect(reached.options.map(o=>o.id)).toEqual(['witness','bargain']);
  expect(reached.options.every(o=>o.quote.reward===0)).toBe(true);
 });
 it('quotes and renders read-only and returns detached memories and character objects',()=>{
  const g=middle(),before=structuredClone(g),v=connectionsView(g)!;
  v.memory[0].text='Changed outside the game';v.contact.name='Fake name';connectionQuote(g,v.options[0].action);connectionObjective(g);
  expect(g).toEqual(before);expect(connectionsView(g)?.contact.name).toBe('Inés Duarte');
 });
 it('remembers paid versus aid origins in dialogue and mechanically different midpoint terms',()=>{
  const aid=middle('aid'),paid=middle('paid');
  expect(option(aid,'witness').quote.supplies).toBe(2);expect(option(paid,'witness').quote.supplies).toBe(4);
  expect(option(aid,'bargain').quote.fee).toBe(24);expect(option(paid,'bargain').quote.fee).toBe(36);
  expect(connectionsView(aid)?.scene).toContain('remember your help');expect(connectionsView(paid)?.scene).toContain('value of paid work');
 });
 it('consumes gifted provisions with FIFO provenance and records upkeep separately',()=>{
  const g=middle(),q=option(g,'witness').quote,n=choose(g,'witness');
  expect(n.hours).toBe(g.hours+4);expect(n.provisions).toBeCloseTo(g.provisions-q.provisions);expect(n.silver).toBeCloseTo(g.silver-q.wages);
  expect(n.economy?.lots.provisions?.reduce((sum,l)=>sum+l.quantity,0)).toBeCloseTo(n.provisions);
  const used=n.finances!.entries.slice(g.finances!.entries.length).filter(e=>e.kind==='provisions-used');
  expect(used).toHaveLength(2);expect(used.reduce((sum,e)=>sum+(e.quantity??0),0)).toBeCloseTo(q.provisions);
  expect(n.crewState!.morale-g.crewState!.morale).toBe(q.morale);
 });
 it('charges a bargain only once, preserves the chosen account, and records real cash flow',()=>{
  const g=middle('paid'),o=option(g,'bargain'),n=act(g,o.action);
  expect(n.connections?.midpoint?.choice).toBe('bargain');expect(n.connections?.stage).toBe('settlement');
  expect(n.silver).toBeCloseTo(g.silver-o.quote.wages-o.quote.fee);
  expect(n.finances!.entries.slice(g.finances!.entries.length).reduce((sum,e)=>sum+e.cash,0)).toBeCloseTo(-o.quote.wages-o.quote.fee);
  expect(()=>act(n,o.action)).toThrow();expect(connectionsView(n)?.outcome).toContain('paid 36 silver');
 });
 it('makes origin and midpoint choices matter at the payoff, with standing in the final nation',()=>{
  const rewards:number[]=[];
  for(const origin of ['aid','paid'] as const)for(const choice of ['witness','bargain'] as const){
   const g=end(origin,choice),q=option(g,'deliver').quote,n=choose(g,'deliver');rewards.push(q.reward);
   expect(n.silver).toBeCloseTo(g.silver-q.wages+q.reward);expect(n.connections?.stage).toBe('complete');
   expect(attitude(n)-attitude(g)).toBe(q.attitude);expect(reputation(n)-reputation(g)).toBe(q.reputation);
   expect(n.crewState!.morale-g.crewState!.morale).toBe(q.morale);
   expect(n.log[0].text).toContain(`${q.reward} silver`);
  }
  expect(new Set(rewards).size).toBe(4);
 });
 it('persists both recurring characters’ memories and shows the last result while travelling',()=>{
  const witness=choose(middle(),'witness'),bargain=choose(middle(),'bargain');
  expect(witness.connections!.memory.find(m=>m.speaker==='Captain Silas Rook')?.text).toContain('challenged');
  expect(bargain.connections!.memory.find(m=>m.speaker==='Captain Silas Rook')?.text).toContain('paid fairly');
  expect(connectionsView(witness)?.outcome).toContain('shared 2 provisions');expect(connectionsView(witness)?.scene).toBeNull();
  expect(connectionsView(nextPort(bargain))?.scene).toContain('I will remember that');
 });
 it('caps quoted and applied morale, attitude and reputation gains',()=>{
  const g=end();g.crewState!.morale=99;g.economy!.commerce!.attitude[port(g.port).nation]=99;g.economy!.commerce!.reputation=100;
  const q=option(g,'deliver').quote,n=choose(g,'deliver');
  expect(q.morale).toBe(1);expect(q.attitude).toBe(1);expect(q.reputation).toBe(0);
  expect(n.crewState?.morale).toBe(100);expect(attitude(n)).toBe(100);expect(reputation(n)).toBe(100);
 });
 it('validates expected state, source, stage, action ID, choice and current port',()=>{
  const g=middle(),a=option(g,'witness').action,before=structuredClone(g);
  for(const bad of [{...a,id:'made-up'},{...a,stage:'settlement'},{...a,port:'havana'},{...a,choice:'deliver'},{...a,expected:'stale'},{...a,choice:'forged'}])expect(()=>act(g,bad as ConnectionAction)).toThrow();
  expect(()=>act({...g,port:'havana'},a)).toThrow();expect(()=>act({...g,hours:g.hours+1},a)).toThrow();expect(()=>act({...g,silver:g.silver+1},a)).toThrow();
  expect(g).toEqual(before);
 });
 it('requires full upfront fees, wages and provisions, never borrowing against a future reward',()=>{
  const base=middle('paid'),o=option(base,'bargain');
  const poor={...base,silver:o.quote.fee+o.quote.wages-.01};expect(option(poor,'bargain').quote.errors.join(' ')).toMatch(/silver/);expect(()=>choose(poor,'bargain')).toThrow(/silver/);
  const hungry={...base,provisions:option(base,'witness').quote.provisions-.01};expect(()=>choose(hungry,'witness')).toThrow(/provisions/);
  const final=end();final.silver=0;expect(()=>choose(final,'deliver')).toThrow(/silver/);
  const exact={...base,silver:o.quote.fee+o.quote.wages,provisions:o.quote.provisions};const n=choose(exact,'bargain');expect(n.silver).toBeCloseTo(0);expect(n.provisions).toBeCloseTo(0);expect(n.failed).toBeNull();
 });
 it('includes passenger upkeep and rejects stale choices when passenger load changes',()=>{
  const g=middle(),stale=option(g,'witness').action;
  g.contracts.push({id:'passengers',type:'Passengers',from:g.port,to:'havana',reward:100,amount:3});
  const q=option(g,'witness').quote;expect(q.provisions).toBeCloseTo(13*4/24+2);expect(()=>act(g,stale)).toThrow(/terms changed/);
 });
 it('rejects unavailable failed, travelling and battle states without starting a second journey',()=>{
  const g=middle(),a=option(g,'witness').action;
  expect(connectionQuote({...g,failed:'Lost'},a).errors.join(' ')).toMatch(/safely in port/);
  expect(connectionQuote({...g,voyage:{to:'havana',hours:10,remaining:10,weather:'Calm',dice:[3,4]}},a).errors.join(' ')).toMatch(/safely in port/);
  expect(connectionQuote({...g,battle:{} as NonNullable<Game['battle']>},a).errors.join(' ')).toMatch(/safely in port/);
  const local=act(g,{type:'harbour-story',port:g.port,choice:'paid'});expect(connectionsView(local)?.chapter).toBe(2);expect(connectionsView(local)?.options.some(o=>o.id==='accept')).toBe(false);
 });
 it('never trusts forged client reward fields and rejects premature or repeated completion',()=>{
  const g=end(),o=option(g,'deliver'),q=o.quote;
  expect(()=>completeConnection(g,q)).toThrow(/no longer/);
  const n=act(g,{...o.action,reward:999999,fee:-9999,attitude:100} as ConnectionAction);
  expect(n.silver).toBeCloseTo(g.silver-q.wages+q.reward);expect(()=>completeConnection(n,q)).toThrow(/no longer/);
  const {next,q:valid}=afterUpkeep(g,'deliver');completeConnection(next,{...valid,reward:999999,fee:-99999,attitude:100});
  expect(next.silver).toBeCloseTo(g.silver-q.wages+q.reward);expect(attitude(next)-attitude(g)).toBe(q.attitude);
 });
 it('blocks replay forever after completion, including at a different newly completed source',()=>{
  const g=choose(end(),'deliver'),before=structuredClone(g),v=connectionsView(g)!;
  expect(v.status).toBe('complete');expect(v.options).toEqual([]);expect(connectionObjective(g)).toBeNull();
  const away={...g,port:'havana' as const},worked=act(away,{type:'harbour-story',port:'havana',choice:'aid'});
  expect(connectionsView(worked)?.status).toBe('complete');expect(worked.connections).toEqual(before.connections);
  expect(()=>act(worked,option(ready('aid','havana'),'accept').action)).toThrow(/already complete/);
 });
 it('survives JSON reload and normalization with no accidental restart or aliasing',()=>{
  const g=choose(middle('paid'),'bargain'),copy=normalizeGame(JSON.parse(JSON.stringify(g)));
  expect(copy.connections).toEqual(g.connections);expect(connectionObjective(copy)).toEqual(connectionObjective(g));
  copy.connections!.memory[0].text='changed copy';expect(g.connections!.memory[0].text).not.toBe('changed copy');
  expect(connectionsView(normalizeGame(choose(end(),'deliver')))?.status).toBe('complete');
 });
 it('never resets malformed, foreign-route or unsupported saved journey state into another offer',()=>{
  const g=choose(ready(),'accept');
  for(const connections of [null,0,false,{...g.connections!,version:2},{...g.connections!,route:['bridgetown','bridgetown','havana']},{...g.connections!,stage:'invented'},{...g.connections!,acceptedAt:NaN}]){
   const broken={...g,connections} as Game;expect(connectionsView(broken)).toBeNull();expect(connectionObjective(broken)).toBeNull();
   expect(connectionQuote(broken,option(ready(),'accept').action).errors.length).toBeGreaterThan(0);
  }
 });
 it('preserves branching journey snapshots through real profile and church checkpoint storage',async()=>{
  const p:Profile={id:'lantern-ledger-captain',name:'Ledger',game:middle(),updated:1};await saveProfile(p);
  const checkpoint=await saveCheckpoint(p,'Before the tally','Church');p.game=choose(p.game,'bargain');await saveProfile(p);
  expect((await profiles()).find(saved=>saved.id===p.id)?.game.connections?.midpoint?.choice).toBe('bargain');
  const restored=restoreCheckpoint(p,checkpoint);expect(restored.game.connections?.stage).toBe('crossroads');expect(restored.game.connections?.midpoint).toBeUndefined();
  restored.game=choose(restored.game,'witness');expect(restored.game.connections?.midpoint?.choice).toBe('witness');expect(checkpoint.game.connections?.midpoint).toBeUndefined();expect(p.game.connections?.midpoint?.choice).toBe('bargain');
 });
 it('can finish a real two-leg voyage using existing sailing, with no scripted battle or random reward',()=>{
  let g=choose(ready(),'accept');g.pirateDanger=0;
  for(const choice of ['witness','deliver'] as const){
   const destination=connectionObjective(g)!.destination;
   g=act(g,{type:'sail',to:destination},()=>.5);expect(g.port).toBe(destination);expect(g.voyage).toBeNull();expect(g.battle).toBeUndefined();expect(g.failed).toBeNull();
   g=choose(g,choice);
  }
  expect(g.connections?.stage).toBe('complete');expect(g.finances?.voyages).toHaveLength(2);expect(g.provisions).toBeGreaterThan(0);expect(g.silver).toBeGreaterThan(0);
 });
});
