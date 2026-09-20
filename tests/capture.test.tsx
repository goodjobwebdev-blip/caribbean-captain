import {describe,it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {act,newGame,normalizeGame,type Game} from '../src/game';
import {generateNpc} from '../src/battle/encounter';
import {createBattle} from '../src/battle/naval';
import {finish,crew} from '../src/battle/types';
import {captureQuote,type CaptureChoice} from '../src/battle/capture';
import {createShip} from '../src/ships';
import {CapturePanel} from '../src/CapturePanel';
import {financialSummary,beginAccount} from '../src/finance';
import {cargoCost} from '../src/trade';
const choice:CaptureChoice={ship:'keep',captain:'release',cargo:{},route:'continue'};
function captured(won=true):Game{
 const g=newGame('Anne',42);g.ship!.id='player';g.provisions=80;
 const n=generateNpc(g);n.ship=createShip('sloop-universal','Prize','enemy');n.crew=crew(10);n.silver=200;n.role='Pirate';n.faction='Pirates';
 g.battle=createBattle(g,n);g.battle.ships.enemy.cargo={sugar:15,'round-shot':10,gunpowder:10};beginAccount(g,'saint-pierre');g.voyage={to:'saint-pierre',hours:49,remaining:20,weather:'Steady',dice:[3,3],contacts:[]};finish(g.battle,won?'player':'enemy','Surrender');return g;
}
describe('Capture Resolution',()=>{
 it('takes only selected finite cargo and ransom once, retaining the terminal snapshot',()=>{
  const g=captured(),snapshot=structuredClone(g.battle!.result);const next=act(g,{type:'battle-settle',choice:{...choice,captain:'ransom',cargo:{sugar:5}}});
  expect(next.silver).toBe(g.silver+200);expect(next.cargo.sugar).toBe(5);expect(next.battle!.ships.enemy.cargo.sugar).toBe(10);expect(next.battle!.npc.silver).toBe(0);expect(next.battle!.result).toEqual(snapshot);expect(next.battle!.settlement?.cargo).toEqual({sugar:5});expect(cargoCost(next,'sugar',5).total).toBe(0);
  expect(()=>act(next,{type:'battle-settle',choice})).toThrow('No unresolved capture');expect(g.battle!.phase).toBe('capture');
 });
 it('honors conditional surrender and excludes dead captains or sunk ships from ransom',()=>{
  for(const modify of [(g:Game)=>{g.battle!.terms='Personal safety';},(g:Game)=>{g.battle!.ships.enemy.captain.injury=6;},(g:Game)=>{g.battle!.ships.enemy.ship.hullPoints=0;}]){const g=captured();modify(g);expect(()=>act(g,{type:'battle-settle',choice:{...choice,captain:'ransom'}})).toThrow('Ransom');}
 });
 it('rejects fractional, negative, unknown, excessive and overweight loot atomically',()=>{
  const g=captured(),before=structuredClone(g);for(const cargo of [{sugar:1.5},{sugar:-1},{sugar:100},{fake:1},{sugar:NaN}])expect(()=>act(g,{type:'battle-settle',choice:{...choice,cargo}})).toThrow();
  g.battle!.ships.enemy.cargo.iron=1000;expect(captureQuote(g,{...choice,cargo:{iron:300}}).problems.join()).toContain('deadweight');delete g.battle!.ships.enemy.cargo.iron;expect(g).toEqual(before);
 });
 it('exchanges one ship while preserving crew, cargo, commissions, and captured damage',()=>{
  const g=captured();g.battle!.ships.enemy.ship=createShip('schooner-universal','Prize','enemy');g.battle!.ships.enemy.ship.hullPoints=70;g.battle!.ships.enemy.ship.sailCondition=65;g.battle!.ships.enemy.ship.cannons.port=1;
  g.contracts=[{id:'letter',type:'Letter',from:'bridgetown',to:'saint-pierre',reward:25,amount:0}];const next=act(g,{type:'battle-settle',choice:{...choice,ship:'exchange'}});
  expect(next.ship).toMatchObject({id:'enemy',hullPoints:70,sailCondition:65,cannons:{port:1}});expect(next.crew).toBe(10);expect(next.contracts).toEqual(g.contracts);expect(next.provisions).toBe(80);
  const arrived=act(next,{type:'battle-resume'});expect(arrived.ship!.id).toBe('enemy');expect(arrived.port).toBe('saint-pierre');expect(arrived.battleHistory![0].settlement!.ship).toBe('enemy');
 });
 it('prevents oversized crew and passenger transfers, but allows towing an undermanned prize',()=>{
  const g=captured();g.battle!.ships.enemy.ship=createShip('tartana-universal','Prize','enemy');g.battle!.ships.player.crew.fit=11;
  expect(captureQuote(g,{...choice,ship:'exchange'}).problems.join()).toContain('surviving crew');g.battle!.ships.player.crew.fit=10;
  g.contracts=[{id:'passengers',type:'Passengers',from:'bridgetown',to:'saint-pierre',reward:100,amount:6}];expect(captureQuote(g,{...choice,ship:'exchange'}).problems.join()).toContain('berths');
  g.contracts=[];g.battle!.ships.enemy.ship=createShip('brig-universal','Prize','enemy');expect(captureQuote(g,{...choice,ship:'exchange'}).problems.join()).toContain('16 sailors');expect(captureQuote(g,{...choice,ship:'exchange',route:'return'}).problems).toEqual([]);
 });
 it('releases a defeated surviving player with visible confiscation, failed contracts and port recovery',()=>{
  const g=captured(false);g.cargo.sugar=8;g.battle!.ships.player.cargo.sugar=8;g.contracts=[{id:'job',type:'Passengers',from:'bridgetown',to:'saint-pierre',reward:100,amount:3}];g.accepted=['job'];
  const settled=act(g,{type:'battle-settle',choice:{...choice,route:'return'}});expect(settled.silver).toBe(0);expect(settled.cargo.sugar).toBe(0);expect(settled.contracts).toEqual([]);expect(settled.accepted).toContain('job');expect(()=>act(settled,{type:'battle-resume'})).toThrow('return');
  const home=act(settled,{type:'battle-return'});expect(home.port).toBe('bridgetown');expect(home.voyage).toBeNull();expect(home.battle).toBeUndefined();expect(home.hours).toBe(g.hours+12);expect(home.silver).toBe(-210);expect(home.failed).toBeNull();expect(home.provisions).toBe(g.provisions);expect(home.finances!.voyages[0].to).toBe('bridgetown');expect(home.finances!.voyages[0].plannedTo).toBe('saint-pierre');
 });
 it('navy defeat fines silver and confiscates controlled cargo without taking ordinary trade goods',()=>{
  const g=captured(false);g.battle!.npc.role='Navy';g.cargo={sugar:8,gunpowder:4};g.battle!.ships.player.cargo={...g.cargo};const next=act(g,{type:'battle-settle',choice:{...choice,route:'return'}});expect(next.silver).toBe(600);expect(next.cargo.sugar).toBe(8);expect(next.cargo.gunpowder).toBe(0);
 });
 it('does not revive dead captains or replace sunk ships',()=>{
  for(const kind of ['captain','ship']){const g=captured(false);if(kind==='captain')g.battle!.ships.player.captain.injury=6;else g.battle!.ships.player.ship.hullPoints=0;const next=act(g,{type:'battle-settle',choice:{...choice,route:'return'}});expect(next.failed).toContain('checkpoint');expect(next.battle!.settlement!.route).toBe('checkpoint');expect(()=>act(next,{type:'battle-return'})).toThrow('checkpoint');}
 });
 it('restores surviving preloads once and never generates loot from sunk targets',()=>{
  const g=captured();g.battle!.ships.player.batteries.port={loaded:2,ammo:'round-shot',power:1};g.battle!.ships.enemy.ship.hullPoints=0;expect(captureQuote(g,choice).loot).toEqual({});const next=act(g,{type:'battle-settle',choice});expect(next.cargo['round-shot']).toBe(2);expect(next.cargo.gunpowder).toBe(2);expect(cargoCost(next,'round-shot',2).unknown).toBe(2);expect(next.battle!.ships.player.batteries.port.loaded).toBe(0);
 });
 it('survives save restoration and prevents duplicate recovery/rewards',()=>{
  let g=act(captured(),{type:'battle-settle',choice:{...choice,route:'return',captain:'ransom'}});g=normalizeGame(JSON.parse(JSON.stringify(g)));const home=act(g,{type:'battle-return'});expect(()=>act(home,{type:'battle-return'})).toThrow('No active battle');expect(home.battleHistory![0].settlement?.silver).toBe(200);
 });
 it('retains injuries and repairs through recovery while ordinary rest heals living crew',()=>{
  const g=captured(false);const p=g.battle!.ships.player;p.captain.injury=5;p.captain.fatigue=4;p.crew={...crew(5),injured:4,dead:1};p.ship.hullPoints=40;g.crew=9;g.crewState={...p.crew};
  const home=act(act(g,{type:'battle-settle',choice:{...choice,route:'return'}}),{type:'battle-return'});expect(home.captainState).toMatchObject({injury:4,fatigue:0});expect(home.ship!.hullPoints).toBe(40);home.silver=100;const rested=act(home,{type:'sleep'});expect(rested.captainState!.injury).toBe(3);expect(rested.crewState).toMatchObject({fit:6,injured:3,dead:1});expect(rested.crew).toBe(9);
 });
 it('records settlements as reconciled cash flow and renders reviewable choices',()=>{
  const g=captured();const next=act(act(g,{type:'battle-settle',choice:{...choice,captain:'ransom',route:'return'}}),{type:'battle-return'});expect(financialSummary(next.finances!.entries).cashFlow).toBe(next.silver-g.silver);
  const html=renderToStaticMarkup(<CapturePanel game={g} busy={false} onAction={async()=>{}}/>);expect(html).toContain('Confirm settlement');expect(html).toContain('Select cargo');expect(html).toContain('Ransom');
 });
});
