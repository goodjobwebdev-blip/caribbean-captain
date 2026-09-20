import {encounterPractice} from './progression';
import type {Game,PortId} from '../game';
import {SHIPS,createShip,resolveShip,shipDefinition,totalCannons} from '../ships';
import {shipPerformance} from '../performance';
import {CATALOGUE,type GoodId} from '../goods';
import {observeMarket,consumeLots} from '../trade';
import {contraband,type Nation} from '../commerce';
import {record} from '../finance';
import {rng,weighted,mastery,clamp,crew,roll,rank,type Contact,type Encounter,type Role,type Temperament,type Posture,type Npc,type Demand} from './types';
export const concealment=[0,.02,.04,.06,.08,.10,.12,.14,.25,.50,.95];
export const tradeGoods=(g:Game)=>Object.keys(g.cargo).filter(id=>!['Supplies','Ammunition','Materials'].includes(CATALOGUE[id as GoodId].category)&&g.cargo[id]>0);
export const goodsValue=(g:Game)=>tradeGoods(g).reduce((n,id)=>n+g.cargo[id]*CATALOGUE[id as GoodId].base,0);
export const standing=(g:Game,n:Nation)=>g.economy?.commerce?.attitude[n]??0;
export const standingRank=(n:number)=>n>75?'Allied':n>40?'Friendly':n>10?'Favorable':n>=-10?'Neutral':n>=-30?'Suspicious':n>=-50?'Unfriendly':n>=-75?'Hostile':'Wanted';
export function contacts(g:Game,hours:number):Contact[]{
 const cap=Math.ceil(hours/72),lambda=-Math.log(.8)*hours/48*(g.pirateDanger??1);let count=0,p=1;
 // Inverse product Poisson, bounded by the voyage cap; no unbounded loop with scripted RNG.
 while(count<=cap){p*=Math.max(1e-12,rng(g));if(p<=Math.exp(-lambda))break;count++;}
 count=Math.min(count,cap);
 return Array.from({length:count},(_,i)=>({at:Math.max(1,Math.min(hours-1,Math.floor(hours*(i+.2+rng(g)*.6)/count))),npc:generateNpc(g)}));
}
export function generateNpc(g:Game):Npc{
 const value=(goodsValue(g)+g.contracts.reduce((s,c)=>s+c.reward,0))*(1-concealment[mastery(g,'deception')]);
 const danger=g.pirateDanger??1,hostility=Math.max(0,...Object.values(g.economy?.commerce?.attitude??{}).map(x=>-x))/100;
 const bases:[Role,number][]=[['Merchant',25],['Local',20],['Courier',15],['Navy',15],['Privateer',10],['Pirate',10],['Bounty Hunter',5]];
 const role=weighted(g,bases.map(([r,w])=>[r,w*clamp(r==='Pirate'?danger*(1+value/2000):r==='Navy'?(1+hostility)/danger:r==='Merchant'||r==='Courier'?1/danger:r==='Privateer'||r==='Bounty Hunter'?1+hostility+value/3000:1,.25,3)]));
 const temperament=weighted<Temperament>(g,['Cautious','Bold','Aggressive','Fanatical','Honorable'].map(t=>[t as Temperament,1]));
 const level=clamp(Math.min(1+Math.floor(rng(g)*20),1+Math.floor(rng(g)*20))+Math.floor(rng(g)*(2*(shipDefinition(resolveShip(g).configurationId).tier-1)+1)),1,20);
 const tier=level<=3?1:level<=7?2:level<=11?3:level<=15?4:level<=18?5:6;
 const available=SHIPS.filter(s=>role==='Local'?s.tier<=2:role==='Merchant'||role==='Courier'?s.shipClass!=='Warship':s.shipClass!=='Merchant');
 const spec=weighted(g,available.map(s=>[s,1/(1+Math.abs(s.tier-tier))**3]));
 const ship=createShip(spec.id,`${role} ${spec.hullType}`,`contact-${g.seed}`);if(rng(g)<.2){ship.hullPoints=Math.round(spec.maxHull*(.65+rng(g)*.3));ship.sailCondition=Math.round(65+rng(g)*30);}
 const faction: Nation=role==='Pirate'?'Pirates':weighted(g,(['England','France','Dutch','Spain'] as Nation[]).map(n=>[n,1+Math.max(0,-standing(g,n))/50]));
 const origin=weighted<PortId>(g,[['bridgetown',1],['saint-pierre',1],['willemstad',1]]);
 const copy=structuredClone(g);copy.port=origin;copy.voyage=null;observeMarket(copy);
 const quality=clamp(35+level*2,0,100),playerPower=totalCannons(resolveShip(g).cannons)+g.crew*.2;
 const perceivedStrength=playerPower*(1+(rng(g)-.5)*(1-level/25))*(1-mastery(g,'deception')*.025);
 return {silver:50+25*Math.floor(rng(g)*(level+3)),role,faction,temperament,level,origin,departed:g.hours,market:copy.economy!.memories[origin]!,ship,crew:crew(spec.optimalCrew,quality),perceivedStrength};
}
export function opening(g:Game,n:Npc):Posture{
 const hostile=standing(g,n.faction)<-50,ratio=(totalCannons(n.ship.cannons)+n.crew.fit*.2)/Math.max(.1,n.perceivedStrength);
 const score:Record<Posture,number>={Pass:20,Flee:0,Hail:12,Challenge:-20,Demand:-20,Threaten:-20,Attack:-20};
 if(['Merchant','Local','Courier'].includes(n.role)){score.Pass+=15;score.Hail+=12;if(ratio<.6)score.Flee+=30;}
 if(n.role==='Pirate'){score.Demand+=55;score.Threaten+=40;score.Attack+=30;}
 if(n.role==='Navy'){score.Challenge+=55;score.Attack+=hostile?55:0;}
 if(n.role==='Privateer'){score.Demand+=hostile?55:5;score.Attack+=hostile?45:0;}
 if(n.role==='Bounty Hunter'){score.Demand+=standing(g,n.faction)<-75?65:0;score.Challenge+=30;}
 if(hostile){score.Attack+=20;score.Threaten+=20;score.Pass-=15;}
 if(ratio<.6){score.Flee+=40;score.Attack-=30;score.Demand-=20;}
 if(ratio>1.5){score.Attack+=10;score.Threaten+=10;}
 if(n.ship.hullPoints/shipDefinition(n.ship.configurationId).maxHull<.75)score.Flee+=10;
 if(n.temperament==='Cautious'){score.Flee+=15;score.Attack-=15;}
 if(n.temperament==='Aggressive'){score.Attack+=20;score.Threaten+=15;}
 if(n.temperament==='Bold'){score.Attack+=10;score.Flee-=10;}
 if(n.temperament==='Fanatical'){score.Attack+=20;score.Flee-=40;}
 if(n.temperament==='Honorable'){score.Challenge+=15;score.Attack-=10;}
 const entries=Object.entries(score) as [Posture,number][],best=Math.max(...entries.map(x=>x[1]));
 if(rng(g)<.9)return entries.find(x=>x[1]===best)![0];
 const distance={Fanatical:4,Honorable:6,Cautious:7,Aggressive:10,Bold:15}[n.temperament];
 return weighted(g,entries.filter(x=>best-x[1]<=distance).map(([p,s])=>[p,1+s-best+distance]));
}
export function demands(g:Game,n:Npc):Demand[]{
 if(n.role==='Bounty Hunter'&&standing(g,n.faction)<-75)return [{kind:'surrender',value:0,fraction:1}];
 const result:Demand[]=[],silver=Math.floor(Math.max(0,g.silver)*(1-concealment[mastery(g,'deception')])),value=goodsValue(g),passengers=g.contracts.filter(c=>c.type==='Passengers').reduce((s,c)=>s+c.reward*2,0);
 if(silver>0)result.push({kind:'silver',value:silver,fraction:1});if(value>0)result.push({kind:'goods',value,fraction:1});if(passengers>0)result.push({kind:'passengers',value:passengers,fraction:1});return result;
}
export function beginEncounter(g:Game,npc:Npc){const posture=opening(g,npc),choices=demands(g,npc);g.encounter={stage:mastery(g,'lookout')>=3||g.spyglass?'sighting':posture==='Flee'?'pursuit':'response',npc,posture,demand:choices.length&&['Demand','Threaten'].includes(posture)?weighted(g,choices.map(d=>[d,Math.max(1,d.value)])):undefined,responses:0,early:mastery(g,'lookout')>=3||!!g.spyglass,movementUsed:false,message:`${npc.role} vessel flying the ${npc.faction} flag. Opening posture: ${posture}.`};}
export function encounterActions(e:Encounter):string[]{
 if(e.stage==='sighting')return ['continue','investigate','avoid'];if(e.stage==='pursuit')return ['let-go','pursue'];if(e.stage==='counteroffer')return ['offer-silver','offer-goods','offer-passengers','comply','flee','attack'];
 const actions:Record<Posture,string[]>={Pass:['ignore','attack'],Flee:['let-go','pursue'],Hail:['respond','ignore','threaten','attack'],Challenge:['comply','negotiate','deceive','flee','threaten','attack'],Demand:['comply','negotiate','deceive','flee','threaten','attack','surrender'],Threaten:['ignore','comply','negotiate','threaten','flee','attack','surrender'],Attack:['flee','surrender','fight']};
 return actions[e.posture].filter(a=>e.responses<1||!['negotiate','deceive','threaten'].includes(a));
}
function loss(g:Game,id:string,q:number){q=Math.min(g.cargo[id]??0,q);g.cargo[id]=Math.max(0,(g.cargo[id]??0)-q);const consumed=consumeLots(g,id as GoodId,q);void consumed;record(g,'confiscation',0,{good:id as GoodId,quantity:q});}
function payDemand(g:Game,d:Demand){
 if(d.kind==='silver'||d.kind==='fine'){const q=Math.ceil(d.value*d.fraction);if(g.silver<q)throw Error('Not enough exposed silver for this payment.');g.silver-=q;record(g,'ransom',-q);}
 if(d.kind==='goods')for(const id of tradeGoods(g))loss(g,id,Math.ceil(g.cargo[id]*d.fraction));
 if(d.kind==='passengers'){const removed=g.contracts.filter(c=>c.type==='Passengers');g.contracts=g.contracts.filter(c=>c.type!=='Passengers');for(const c of removed){const nation=({bridgetown:'England','saint-pierre':'France',willemstad:'Dutch'} as const)[c.from];g.economy!.commerce!.attitude[nation]=clamp(standing(g,nation)-10,-100,100);}g.economy!.commerce!.reputation=clamp(g.economy!.commerce!.reputation-10,-100,100);}
}
export function rewardSafePassengers(g:Game){const c=g.economy!.commerce!;c.reputation=clamp(c.reputation+2,-100,100);for(const passenger of g.contracts.filter(c=>c.type==='Passengers')){const nation=({bridgetown:'England','saint-pierre':'France',willemstad:'Dutch'} as const)[passenger.from];c.attitude[nation]=clamp(standing(g,nation)+2,-100,100);}}
export type EncounterChoice={choice:string;confirmed?:boolean;dump?:'goods'|'gunpowder'};
/** Mutates only the cloned reducer state; returns the phase transition for game.ts. */
export function resolveEncounter(g:Game,a:EncounterChoice):'continue'|'naval'|'pursuit'|'capture'|null{
 const e=g.encounter!;if(!e||!encounterActions(e).includes(a.choice))throw Error('That response is not available.');const n=e.npc;if(e.demand?.kind==='passengers'&&!['comply','offer-passengers','surrender'].includes(a.choice))e.passengersRefused=true;
 const end=()=>{if(e.passengersRefused&&g.contracts.some(c=>c.type==='Passengers')){rewardSafePassengers(g);}return 'continue' as const;};
 if(a.choice==='continue'||a.choice==='investigate'){if(a.choice==='investigate')encounterPractice(g,'lookout');e.stage=e.posture==='Flee'?'pursuit':'response';e.message+=a.choice==='investigate'?` Lookout identifies a ${rank(n.level)} captain.`:'';return null;}
 if(['ignore','let-go','respond'].includes(a.choice)){if(a.choice==='respond'){g.economy!.memories[n.origin]=structuredClone(n.market);e.message=`Market intelligence from ${n.origin}, observed at hour ${n.departed}.`;}if(a.choice==='ignore'&&e.posture==='Threaten')return 'naval';return end();}
 if(a.choice==='surrender')return 'capture';
 if(a.choice==='attack'||a.choice==='fight'){
  if(standing(g,n.faction)>40&&!a.confirmed)throw Error('Confirm attacking this friendly ship. Identification can damage faction attitude and reputation.');
  if(a.choice==='attack'&&rng(g)<clamp(.85+n.level*.005-mastery(g,'deception')*.06,.1,1)){g.economy!.commerce!.attitude[n.faction]=clamp(standing(g,n.faction)-20,-100,100);g.economy!.commerce!.reputation=clamp(g.economy!.commerce!.reputation-5,-100,100);}
  if(n.temperament!=='Fanatical'&&n.perceivedStrength>(totalCannons(n.ship.cannons)+n.crew.fit*.2)*1.5){e.stage='pursuit';e.posture='Flee';return null;}return 'naval';
 }
 if(a.choice==='comply'){
  if(e.posture==='Challenge'){
   const offenses:string[]=[];if(standing(g,n.faction)<-75)offenses.push('Wanted identity');if(g.falseFlag)offenses.push('False flag');
   const illegal=Object.keys(g.cargo).filter(id=>g.cargo[id]>0&&contraband(id as GoodId)&&!g.economy!.commerce!.permits[n.faction]);if(illegal.length)offenses.push('Contraband');
   if(!offenses.length)return end();e.responses=1;e.posture='Demand';e.demand=offenses.includes('Wanted identity')?{kind:'surrender',value:0,fraction:1}:{kind:'fine',value:50*offenses.length,fraction:1};e.message=`Inspection found: ${offenses.join(', ')}. One final response.`;if(illegal.length>1)for(const id of illegal)loss(g,id,g.cargo[id]);return null;
  }
  if(e.demand?.kind==='surrender')return 'capture';if(e.demand)payDemand(g,e.demand);return end();
 }
 if(a.choice.startsWith('offer-')){const d=demands(g,n).find(d=>`offer-${d.kind}`===a.choice);if(!d||d.value<e.demand!.value*.5)throw Error('Offer must cover at least half the original demand.');d.fraction=d.kind==='passengers'?1:e.demand!.value*.5/d.value;payDemand(g,d);return end();}
 const moving=['avoid','flee','pursue'].includes(a.choice),parts:Record<string,number>={};let distraction=0;
 if(a.choice==='flee'&&a.dump){if(a.dump==='goods'){const value=goodsValue(g);for(const id of tradeGoods(g))loss(g,id,g.cargo[id]);distraction=['Pirate','Privateer'].includes(n.role)?value>=.5*(e.demand?.value??Infinity)?3:value>=.25*(e.demand?.value??Infinity)?2:value>=.1*(e.demand?.value??Infinity)?1:0:0;}else{if((g.cargo.gunpowder??0)<1)throw Error('No prepared gunpowder charge available.');loss(g,'gunpowder',1);distraction=1+Math.floor(mastery(g,'demolitions')/3);}}
 if(moving){parts.Sailing=Math.floor(mastery(g,'sailing')/3);parts['Relative speed']=clamp(Math.round((shipPerformance(g).speed-shipDefinition(n.ship.configurationId).speed)*4),-3,3);parts.Maneuverability=Math.round((shipPerformance(g).maneuverability-shipDefinition(n.ship.configurationId).maneuverability)/30);parts['Crew sailing experience']=Math.floor((g.crewState?.experience??50)/40);parts['NPC movement resistance']=-Math.floor(n.level/5);parts['Early sighting']=e.early&&!e.movementUsed?Math.floor(mastery(g,'lookout')/3):0;parts.Distraction=distraction;e.movementUsed=true;}
 else{const skill=a.choice==='negotiate'?'diplomacy':a.choice==='deceive'?'deception':'intimidation';parts[skill]=Math.floor(mastery(g,skill)/2);parts['NPC resistance']=-Math.floor(n.level/5);if(skill==='diplomacy')parts.Relationship=Math.round(standing(g,n.faction)/40);if(skill==='intimidation')parts['Apparent strength']=clamp(Math.round(n.perceivedStrength/(totalCannons(n.ship.cannons)+n.crew.fit*.2)-1),-2,2);}
 const r=roll(g,a.choice,parts);if(!moving)encounterPractice(g,a.choice==='negotiate'?'diplomacy':a.choice==='deceive'?'deception':'intimidation',r.band===0?.25:.5);if(a.dump==='gunpowder')encounterPractice(g,'demolitions');g.encounterRoll=r;g.lastRoll={label:a.choice,dice:r.dice,outcome:['Setback','Partial','Success'][r.band]};e.message=`${a.choice}: ${r.dice.join(' + ')} ${r.modifier>=0?'+':''}${r.modifier} = ${r.total}. ${['Setback','Partial success','Full success'][r.band]}.`;
 if(a.choice==='avoid'){if(r.band===2)return end();e.stage='response';return null;}
 if(a.choice==='pursue'){if(r.dice[0]+r.dice[1]===12||(r.dice[0]+r.dice[1]!==2&&r.total>=9))return 'pursuit';g.voyage!.remaining+=4;return end();}
 if(a.choice==='flee'){
  if(r.band===0){if(a.dump==='gunpowder'&&r.dice[0]+r.dice[1]===2)g.ship!.hullPoints=Math.max(0,g.ship!.hullPoints-shipDefinition(g.ship!.configurationId).maxHull*.1);return 'naval';}
  if(r.band===1){const i=clamp(r.total-7,0,2),options=['hull','sails',...(tradeGoods(g).length?['goods']:[]),...((g.cargo.gunpowder??0)>0?['powder']:[])];const cost=options[Math.floor(rng(g)*options.length)];if(cost==='hull')g.ship!.hullPoints=Math.max(0,g.ship!.hullPoints-Math.ceil(shipDefinition(g.ship!.configurationId).maxHull*[.15,.1,.05][i]));if(cost==='sails')g.ship!.sailCondition=Math.max(0,g.ship!.sailCondition-[25,15,5][i]);if(cost==='goods')for(const id of tradeGoods(g))loss(g,id,Math.ceil(g.cargo[id]*[.5,.25,.1][i]));if(cost==='powder')loss(g,'gunpowder',Math.ceil(g.cargo.gunpowder*[.5,.25,.1][i]));e.message+=` Escape cost: ${cost}.`;}
  return end();
 }
 e.responses++;if(e.demand?.kind==='passengers')e.passengersRefused=true;
 if(a.choice==='threaten'){if(r.band===0)return 'naval';if(r.band===2)return end();if(e.demand)e.demand.fraction=.5;}
 if(a.choice==='negotiate'&&e.demand){if(r.band===2){e.stage='counteroffer';return null;}if(r.band===1)e.demand.fraction=.75;}
 if(a.choice==='deceive'){
  if(e.posture==='Challenge'){
   // Each concealed fact has its own roll; never bundle inspection facts together.
   const facts=[standing(g,n.faction)<-75?'identity':null,g.falseFlag?'flag':null,Object.keys(g.cargo).some(id=>g.cargo[id]>0&&contraband(id as GoodId)&&!g.economy!.commerce!.permits[n.faction])?'cargo':null].filter(Boolean);
   const checks=facts.map((fact,i)=>({fact,roll:i===0?r:roll(g,`Conceal ${fact}`,parts)}));g.inspectionRolls=checks.map(c=>({...c.roll,label:`Conceal ${c.fact}`}));const found=checks.filter(c=>c.roll.band<2).map(c=>c.fact);if(!found.length)return end();e.posture='Demand';e.demand=found.includes('identity')?{kind:'surrender',value:0,fraction:1}:{kind:'fine',value:50*found.length,fraction:1};e.message+=` Discovered: ${found.join(', ')}.`;
  }else if(e.demand)e.demand.fraction=r.band===2?.5:r.band===1?.75:1;
 }
 if(e.responses>=2)return 'naval';return null;
}
