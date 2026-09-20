import {practice} from './progression';
import type {Game} from '../game';
import {shipDefinition} from '../ships';
import {clamp,strength,ratioEdge,masteryEdge,casualties,roll,recordRoll,report,finish,type Battle,type Combatant} from './types';
export function enterBoarding(b:Battle,attacker:string){b.phase='deck';b.status='transition';b.attacker=attacker;b.round=1;b.rounds=Math.ceil((shipDefinition(b.ships[b.playerId].ship.configurationId).tier+shipDefinition(b.ships[b.npcId].ship.configurationId).tier)/2);b.control=0;b.plans={};delete b.committed;delete b.accepted;b.decisionKey++;report(b,'Grapples hold. Naval orders cancelled. Prepare for Deck Battle.');checkDefeat(b);}
export function checkDefeat(b:Battle){
 for(const id of [b.playerId,b.npcId]){const s=b.ships[id];if(s.crew.fit===0||s.captain.injury>=5||s.captain.fatigue>=4){finish(b,id===b.playerId?b.npcId:b.playerId,s.crew.fit===0?'No Fit Crew remain.':s.captain.injury===6?'Captain killed.':s.captain.injury===5?'Captain incapacitated.':'Captain collapsed.');return true;}}return false;
}
export function legalBoarding(b:Battle,id:string):string[]{
 const s=b.ships[id],npc=id===b.npcId,surrender=!npc||b.npc.temperament!=='Fanatical'||s.crew.fit===0?['surrender']:[];
 if(b.phase==='deck')return ['assault','guard','breakthrough',...surrender];
 const d=b.duel!;if(d.initiative===id)return ['quick','standard','heavy',...(s.captain.pistol?['pistol']:[]),...(!npc&&!d.demandedAt.includes(b.ships[b.npcId].captain.injury)?['demand-surrender']:[]),...surrender];
 const attack=npc?b.committed?.[0]:d.npcAttack;
 return [...(attack==='pistol'?[]:['block','parry']),'dodge',...surrender];
}
export function resolveDeck(g:Game,b:Battle){
 const p=b.ships[b.playerId],n=b.ships[b.npcId],pa=b.committed![0],na=b.accepted!.action_ids[0];if(na==='surrender'){finish(b,b.playerId,'Enemy captain surrendered.');return;}
 const mods:Record<string,number>={Assault:0,guard:1,breakthrough:-1};
 const r=roll(g,'Deck Battle',{Strength:ratioEdge(strength(p)/Math.max(.001,strength(n))),'Home deck':b.attacker===b.playerId?-1:1,'Player order':mods[pa]??0,'NPC order':-(mods[na]??0)});recordRoll(g,b,r);practice(b,b.playerId,'boarding',r.band===0?.25:.5);
 const natural=r.dice[0]+r.dice[1],decisive=natural===2||natural===12,winner=r.band===2?1:r.band===0?-1:0;
 if(winner!==0){const winningOrder=winner===1?pa:na;if(winningOrder!=='guard')b.control+=winner*(decisive||winningOrder==='breakthrough'?2:1);}
 const before=[p.crew.fit,n.crew.fit],injured=[p.crew.injured,n.crew.injured],dead=[p.crew.dead,n.crew.dead];
 for(const [s,order,side] of [[p,pa,1],[n,na,-1]] as const){let rate=winner===0?.025:winner===side?0:decisive?.1:.05;if(order==='guard')rate*=.5;if(order==='breakthrough'&&winner===-side)rate*=1.5;casualties(g,s.crew,s.crew.fit*rate);}
 report(b,`Round ${b.round}: ${pa} / ${na}. Control ${b.control}. Player casualties ${before[0]-p.crew.fit} (${p.crew.injured-injured[0]} injured, ${p.crew.dead-dead[0]} dead); enemy ${before[1]-n.crew.fit} (${n.crew.injured-injured[1]} injured, ${n.crew.dead-dead[1]} dead).`);
 if(checkDefeat(b))return;
 if(b.round>=b.rounds){b.control=clamp(b.control,-2,2);b.phase='duel';b.duel={initiative:b.control>0?b.playerId:b.control<0?b.npcId:b.attacker,exchange:0,control:b.control,firstRoll:true,demandedAt:[]};b.status='transition';report(b,'Deck Battle ends. The captains meet.');}else{b.round++;b.status='planning';}
 clearDecision(b);
}
export function clearDecision(b:Battle){delete b.accepted;delete b.committed;b.decisionKey++;}
const condition=(s:Combatant)=>-[0,0,1,2,3,4,4][s.captain.injury]-[0,0,1,2,3][s.captain.fatigue];
const weaponQuality=(s:Combatant,action:string)=>['pistol','dodge'].includes(action)?0:s.captain.quality;
const damage=(a:string)=>a==='heavy'||a==='pistol'?2:1;
export function resolveDuel(g:Game,b:Battle){
 const d=b.duel!,p=b.ships[b.playerId],n=b.ships[b.npcId],pa=b.committed![0],na=b.accepted!.action_ids[0];
 if(na==='surrender'){finish(b,b.playerId,'Enemy captain surrendered.');return;}
 const attacking=d.initiative===b.playerId,attack=attacking?pa:na,defense=attacking?na:pa;
 if(pa==='demand-surrender'){
  d.demandedAt.push(n.captain.injury);
  if(b.npc.temperament==='Fanatical'&&n.crew.fit>0){d.initiative=b.npcId;report(b,'The fanatical captain refuses surrender.');}
  else{const r=roll(g,'Demand Surrender',{'Intimidation edge':masteryEdge((p.skills.intimidation??0)-Math.floor(b.npc.level/2)),'Injury pressure':n.captain.injury-2,'Crew pressure':ratioEdge(strength(p)/Math.max(.001,strength(n)))});recordRoll(g,b,r);practice(b,b.playerId,'intimidation',r.band===0?.25:.5);if(r.band>0){finish(b,b.playerId,r.band===2?'Unconditional surrender.':'Conditional surrender.',r.band===1?'Personal safety and honorable treatment':undefined);return;}d.initiative=b.npcId;}
 }else{
  if(attack==='pistol')(attacking?p:n).captain.pistol=false;
  const skill=attacking?(attack==='pistol'?'shooting':p.captain.weapon):defense==='dodge'?'athletics':p.captain.weapon;
  const actionMod=attack==='quick'?1:attack==='heavy'?-2:0;
  const defenseMod=defense==='block'?1:defense==='parry'&&attack==='heavy'?-1:0;
  const r=roll(g,attacking?`Attack: ${attack} against ${defense}`:`Defend: ${defense} against ${attack}`,{'Mastery edge':masteryEdge((p.skills[skill]??0)-Math.floor(b.npc.level/2)),'Action':attacking?actionMod:-actionMod,'Reaction':attacking?-defenseMod:defenseMod,'Player conditions':condition(p),'Opponent condition advantage':-condition(n),'Weapon quality':weaponQuality(p,attacking?attack:defense)-weaponQuality(n,attacking?defense:attack),'Boarding Control':d.firstRoll?d.control:0});recordRoll(g,b,r);practice(b,b.playerId,skill,r.band===0?.25:.5);d.firstRoll=false;
  const natural=r.dice[0]+r.dice[1];let toPlayer=0,toNpc=0;
  if(attacking){
   if(natural===2){toPlayer=attack==='pistol'?0:1;d.initiative=b.npcId;}
   else if(natural===12){toNpc=2;d.initiative=attack==='quick'?b.npcId:b.playerId;}
   else if(r.band===0)d.initiative=b.npcId;
   else{toNpc=Math.min(2,damage(attack)+(r.band===2?1:0));d.initiative=attack==='quick'?b.npcId:b.playerId;
    // Invert the player's partial-defense rules for the NPC's partial response.
    if(r.band===1){if(defense==='block')toNpc=Math.max(0,toNpc-1);if(defense==='parry'){toNpc=0;d.initiative=b.npcId;}if(defense==='dodge')toNpc=0;}
   }
  }else{
   if(natural===2){toPlayer=Math.min(2,damage(attack)+1);d.initiative=b.npcId;}
   else if(natural===12){toNpc=1;d.initiative=b.playerId;}
   else if(r.band===2)d.initiative=b.playerId;
   else if(r.band===0){toPlayer=damage(attack);d.initiative=attack==='quick'?b.playerId:b.npcId;}
   else if(defense==='block'){toPlayer=Math.max(0,damage(attack)-1);d.initiative=attack==='quick'?b.playerId:b.npcId;}
   else if(defense==='parry')d.initiative=b.playerId;
   else d.initiative=attack==='quick'?b.playerId:b.npcId;
  }
  p.captain.injury=clamp(p.captain.injury+toPlayer,0,6);n.captain.injury=clamp(n.captain.injury+toNpc,0,6);report(b,`${attack} vs ${defense}: player suffers ${toPlayer} Injury step(s), opponent ${toNpc}.`);
 }
 d.exchange++;delete d.npcAttack;
 if(checkDefeat(b))return;
 if(d.exchange%5===0){p.captain.fatigue=clamp(p.captain.fatigue+1,0,4);n.captain.fatigue=clamp(n.captain.fatigue+1,0,4);report(b,'Five exchanges completed: both captains gain one Fatigue step.');if(p.captain.fatigue===4&&n.captain.fatigue===4){finish(b,d.control>0?b.playerId:d.control<0?b.npcId:b.attacker===b.playerId?b.npcId:b.playerId,'Both captains collapsed; Boarding Control and home-deck advantage decide the victor.');return;}if(checkDefeat(b))return;}
 b.status='planning';clearDecision(b);
}
