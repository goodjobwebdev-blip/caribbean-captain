import {rewardSafePassengers} from './encounter';
import type {Game} from '../game';
import type {Battery} from '../ships';
import {consumeLots} from '../trade';
import type {GoodId} from '../goods';
import {record} from '../finance';
import {type Ammo,type Decision,finish} from './types';
import {preload,schedule,stepNaval,replaceOrder,completePreloads} from './naval';
import {legalBoarding,resolveDeck,resolveDuel} from './boarding';
import {validateDecision} from './planner';
export type BattleAction={type:'battle-preload';battery:Battery;ammo:Ammo}|{type:'battle-commit';ids:string[]}|{type:'battle-accept';decision:Decision;key:number}|{type:'battle-step'|'battle-reveal'|'battle-transition'|'battle-surrender'|'battle-request'|'battle-resume'|'battle-instant'};
export function syncBattle(g:Game){const b=g.battle!,p=b.ships[b.playerId];g.ship=structuredClone(p.ship);g.crew=p.crew.fit+p.crew.injured;g.crewState=structuredClone(p.crew);g.captainState=structuredClone(p.captain);
 for(const [id,amount] of Object.entries(g.cargo)){const after=p.cargo[id]??0;if(after<amount){consumeLots(g,id as GoodId,amount-after);record(g,'materials-used',0,{good:id as GoodId,quantity:amount-after});}}
 g.cargo=structuredClone(p.cargo);
}
export function battleAct(g:Game,a:BattleAction){
 const b=g.battle;if(!b)throw Error('No active battle.');
 if(a.type==='battle-surrender'){if(!['planning','transition'].includes(b.status))throw Error('Surrender is available before planning or between exchanges.');finish(b,b.npcId,'Player surrendered.');}
 else if(a.type==='battle-preload')preload(b,b.playerId,a.battery,a.ammo);
 else if(a.type==='battle-transition'){if(b.status!=='transition')throw Error('No phase transition pending.');b.status='planning';}
 else if(a.type==='battle-request'){if(b.status==='replacement'&&b.replacement?.includes(b.npcId)&&!b.replacement.includes(b.playerId)){b.status='waiting';return;}if(b.phase!=='duel'||b.duel?.initiative!==b.npcId||b.status!=='planning')throw Error('No enemy attack pending.');b.status='waiting';}
 else if(a.type==='battle-commit'){
  if(!['planning','replacement'].includes(b.status))throw Error('Orders are already committed.');
  if(b.phase==='naval'){if(b.replacement){if(!b.replacement.includes(b.playerId)||a.ids.length!==1)throw Error('Choose one replacement.');replaceOrder(structuredClone(b),b.playerId,a.ids[0]);}else schedule(b,b.playerId,a.ids);}
  else if(a.ids.length!==1||!legalBoarding(b,b.playerId).includes(a.ids[0]))throw Error('Choose a legal boarding action.');
  if(a.ids[0]==='surrender'){finish(b,b.npcId,'Player surrendered.');return;}
  b.committed=[...a.ids];b.status=b.accepted?'reveal':'waiting';
  // Player-only replacement needs no NPC request or fallback.
  if(b.phase==='naval'&&b.replacement&&!b.replacement.includes(b.npcId)){replaceOrder(b,b.playerId,a.ids[0]);delete b.replacement;delete b.committed;b.status='reveal';}
 }
 else if(a.type==='battle-accept'){
  if(b.status!=='waiting'||b.accepted||a.key!==b.decisionKey)throw Error('Stale or duplicate battle decision.');b.accepted=validateDecision(b,a.decision);
  if(b.phase==='duel'&&b.duel!.initiative===b.npcId&&!b.committed){b.duel!.npcAttack=b.accepted.action_ids[0];b.status='planning';if(b.duel!.npcAttack==='surrender')finish(b,b.playerId,'Enemy captain surrendered.');}
  else b.status='reveal';
 }
 else if(a.type==='battle-reveal'){
  if(b.status!=='reveal')throw Error('Both decisions must be accepted before reveal.');
  if(b.accepted?.action_ids[0]==='surrender'){finish(b,b.playerId,'Enemy captain surrendered.');}
  else if(b.phase==='naval'){
   if(b.replacement){for(const id of b.replacement)replaceOrder(b,id,(id===b.playerId?b.committed!:b.accepted!.action_ids)[0]);delete b.replacement;}
   else if(!Object.keys(b.plans).length){b.plans[b.playerId]=schedule(b,b.playerId,b.committed!);b.plans[b.npcId]=schedule(b,b.npcId,b.accepted!.action_ids);completePreloads(b);}
   b.status='playback';
  }else if(b.phase==='deck')resolveDeck(g,b);else if(b.phase==='duel')resolveDuel(g,b);
 }
 else if(a.type==='battle-step')stepNaval(g,b);
 else if(a.type==='battle-instant'){if(b.status!=='playback')throw Error('No active playback.');const window=b.window;for(let i=0;i<50&&b.status==='playback'&&b.window===window;i++)stepNaval(g,b);}
 else if(a.type==='battle-resume'){
  if(b.phase!=='ended')throw Error('Capture Resolution is pending.');if(g.encounter?.passengersRefused&&g.contracts.some(c=>c.type==='Passengers'))rewardSafePassengers(g);g.battleHistory=[structuredClone(b),...(g.battleHistory??[])].slice(0,5);delete g.battle;delete g.encounter;return;
 }
 syncBattle(g);
}
