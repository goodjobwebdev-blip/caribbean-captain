import type {Game} from '../game';
import {BATTERIES,shipDefinition} from '../ships';
import {cargoSpaceUsed,loadBreakdown,sailingProblems} from '../performance';
import {ALL_GOODS,type GoodId} from '../goods';
import {consumeLots} from '../trade';
import {record,recordConsumption} from '../finance';
import {contraband} from '../commerce';
import {clamp,report,mastery,type Combatant} from './types';
import {tradeGoods,rewardSafePassengers,concealment} from './encounter';
export type CaptureChoice={ship:'keep'|'exchange';captain:'release'|'ransom';cargo:Partial<Record<GoodId,number>>;route:'continue'|'return'};
export type CaptureSettlement={hour:number;outcome:'victory'|'defeat'|'loss';ship:string;captain:string;cargo:Partial<Record<GoodId,number>>;silver:number;route:'continue'|'return'|'checkpoint';terms?:string};
/** Surviving loaded rounds belong to the ship's inventory, not a second loot source. */
export function availableCargo(s:Combatant){const cargo={...s.cargo};for(const k of BATTERIES){const gun=s.batteries[k];if(gun.ammo&&gun.loaded){const surviving=Math.min(gun.loaded,s.ship.cannons[k]);cargo[gun.ammo]=(cargo[gun.ammo]??0)+surviving;cargo.gunpowder=(cargo.gunpowder??0)+surviving;}}return cargo;}
function unload(s:Combatant){s.cargo=availableCargo(s);for(const k of BATTERIES){s.batteries[k].loaded=0;s.batteries[k].ammo=null;}}
export const returnFee=(g:Game)=>100*shipDefinition(g.ship!.configurationId).tier;
export function captureQuote(g:Game,choice:CaptureChoice){
 const b=g.battle;if(!b||b.phase!=='capture'||b.settlement)throw Error('No unresolved capture.');
 if(!['keep','exchange'].includes(choice.ship)||!['release','ransom'].includes(choice.captain)||!['continue','return'].includes(choice.route))throw Error('Invalid aftermath choice.');
 const p=b.ships[b.playerId],n=b.ships[b.npcId],victory=b.winner===b.playerId,fatal=p.captain.injury>=6||p.ship.hullPoints<=0;
 const problems:string[]=[],loot=n.ship.hullPoints>0?availableCargo(n):{},copy=structuredClone(g);
 copy.ship=structuredClone(choice.ship==='exchange'?n.ship:p.ship);copy.cargo=availableCargo(p);copy.crew=p.crew.fit+p.crew.injured;copy.crewState=structuredClone(p.crew);copy.captainState=structuredClone(p.captain);
 if(choice.ship==='exchange'&&(!victory||n.ship.hullPoints<=0))problems.push('Only an intact defeated ship can be taken.');
 if(choice.captain==='ransom'&&(!victory||n.ship.hullPoints<=0||n.captain.injury>=6||b.terms))problems.push('Ransom requires a living captain, an intact ship, and no accepted conditional terms.');
 if(!choice.cargo||typeof choice.cargo!=='object'||Array.isArray(choice.cargo))throw Error('Invalid cargo selection.');
 for(const [id,q] of Object.entries(choice.cargo)){
  if(!ALL_GOODS.includes(id as GoodId)||id==='provisions'||typeof q!=='number'||!Number.isFinite(q)||q<0||!Number.isInteger(q))throw Error('Loot quantities must be nonnegative whole units of available cargo.');
  if(q>(loot[id]??0)||(!victory&&q>0))problems.push(`Insufficient available ${id}.`);
  copy.cargo[id]=(copy.cargo[id]??0)+q;
 }
 const spec=shipDefinition(copy.ship.configurationId);
 if(victory){
  if(cargoSpaceUsed(copy)>spec.capacity+1e-8)problems.push('The chosen cargo exceeds hold capacity.');
  if(loadBreakdown(copy).total>spec.deadweight+1e-8)problems.push('The chosen cargo exceeds deadweight.');
  if(copy.crew>spec.maxCrew)problems.push('The captured ship cannot accommodate your surviving crew.');
  if(copy.contracts.filter(c=>c.type==='Passengers').reduce((a,c)=>a+c.amount,0)>spec.passengerCapacity)problems.push('The captured ship has too few passenger berths.');
  if(choice.route==='continue')problems.push(...sailingProblems(copy));
 }
 const purse=n.ship.hullPoints>0?Math.max(0,b.npc.silver??0):0;
 const payment=victory?(choice.captain==='ransom'?purse:0):fatal?0:Math.min(Math.max(0,g.silver),Math.ceil(Math.max(0,g.silver)*(['Pirate','Privateer'].includes(b.npc.role)?1-concealment[mastery(g,'deception')]:.25)));
 const fee=!fatal&&(choice.route==='return'||!victory)?returnFee(copy):0;
 return {victory,fatal,problems,loot,ship:copy.ship,cargo:copy.cargo,payment,fee,returnHours:12,hold:cargoSpaceUsed(copy),capacity:spec.capacity,weight:loadBreakdown(copy).total,deadweight:spec.deadweight};
}
function gain(g:Game,id:GoodId,q:number,returnedLoad=false){if(!q)return;g.cargo[id]=(g.cargo[id]??0)+q;g.economy!.lots[id]??=[];g.economy!.lots[id]!.push(returnedLoad?{quantity:q}:{quantity:q,paidPerUnit:0});record(g,'loot',0,{good:id,quantity:q,cost:returnedLoad?null:0,unknownQuantity:returnedLoad?q:undefined});}
function lose(g:Game,id:GoodId){const q=g.cargo[id]??0;if(q<=0)return;recordConsumption(g,'confiscation',id,q);consumeLots(g,id,q);g.cargo[id]=0;}
/** One atomic settlement. The immutable terminal result remains available alongside this record. */
export function settleCapture(g:Game,choice:CaptureChoice){
 const q=captureQuote(g,choice),b=g.battle!,p=b.ships[b.playerId],n=b.ships[b.npcId];if(!q.fatal&&q.problems.length)throw Error(q.problems.join(' '));
 if(q.fatal){b.settlement={hour:g.hours,outcome:'loss',ship:p.ship.id,captain:'lost',cargo:{},silver:0,route:'checkpoint',terms:b.terms};g.failed=p.captain.injury>=6?'Your captain died. Load a church checkpoint.':'Your ship was lost. Load a church checkpoint.';report(b,g.failed);return;}
 // Return each surviving player load exactly once. Battle sync has already accounted for the original loading.
 const loaded=availableCargo(p);for(const [id,amount] of Object.entries(loaded))if(amount>(g.cargo[id]??0))gain(g,id as GoodId,amount-(g.cargo[id]??0),true);unload(p);
 g.ship=structuredClone(p.ship);g.crewState=structuredClone(p.crew);g.crew=p.crew.fit+p.crew.injured;g.captainState=structuredClone(p.captain);
 if(q.victory){
  for(const [id,amount] of Object.entries(choice.cargo))gain(g,id as GoodId,amount!);
  unload(n);for(const [id,amount] of Object.entries(choice.cargo))n.cargo[id]-=amount!;
  if(choice.captain==='ransom'){g.silver+=q.payment;b.npc.silver=Math.max(0,(b.npc.silver??0)-q.payment);record(g,'loot',q.payment);}
  if(choice.ship==='exchange')g.ship=structuredClone(n.ship);
  const c=g.economy!.commerce!;const mercy=choice.captain==='release'&&n.captain.injury<6&&n.ship.hullPoints>0;
  if(mercy){c.reputation=clamp(c.reputation+2,-100,100);c.attitude[b.npc.faction]=clamp((c.attitude[b.npc.faction]??0)+2,-100,100);}
  if(choice.ship==='exchange')c.attitude[b.npc.faction]=clamp((c.attitude[b.npc.faction]??0)-10,-100,100);
  if(g.encounter?.passengersRefused&&g.contracts.some(c=>c.type==='Passengers')){rewardSafePassengers(g);g.encounter.passengersRefused=false;}
 }else{
  g.silver-=q.payment;if(q.payment)record(g,'ransom',-q.payment);
  const confiscate=['Pirate','Privateer'].includes(b.npc.role)?tradeGoods(g):Object.keys(g.cargo).filter(id=>contraband(id as GoodId));for(const id of confiscate)lose(g,id as GoodId);
  for(const c of g.contracts){g.log.unshift({hours:g.hours,text:`Commission failed after capture: ${c.type} to ${c.to}.`});}
  g.contracts=[];
 }
 const route=q.victory?choice.route:'return';
 b.settlement={hour:g.hours,outcome:q.victory?'victory':'defeat',ship:g.ship.id,captain:q.victory?(n.captain.injury>=6?'dead':choice.captain):'released',cargo:q.victory?{...choice.cargo}:{},silver:q.victory?q.payment:-q.payment,route,terms:b.terms};
 // Securing the surrendered ships ends ongoing combat emergencies, without repairing damage or reviving anyone.
 p.states={fire:0,flooding:0,rigging:0,shock:0};b.phase='ended';b.status='finished';
 b.reason=q.victory?`Aftermath settled. ${choice.ship==='exchange'?'Command transferred to the captured ship.':'Your ship retained.'} Captain ${b.settlement.captain}.`:`Captors accepted ${q.payment} silver and released you for return to port. Commissions failed.`;
 report(b,b.reason);g.log.unshift({hours:g.hours,text:b.reason});g.log=g.log.slice(0,60);
 // Do not syncBattle after this point: captured ship ownership and transferred cargo now belong to Game.
}

export function restoreEscapeLoads(g:Game){const b=g.battle!;if(b.settlement)return;const p=b.ships[b.playerId],loaded=availableCargo(p);for(const [id,amount] of Object.entries(loaded))if(amount>(g.cargo[id]??0))gain(g,id as GoodId,amount-(g.cargo[id]??0),true);unload(p);}
