import type {Game} from '../game';
import {BATTERIES,shipDefinition,totalCannons,type Battery} from '../ships';
import {shipPerformance} from '../performance';
import {clamp,rng,weighted,mastery,crew,captain,roll,casualties,strength,ratioEdge,report,recordRoll,finish,type Battle,type Combatant,type Npc,type Skill,type Ammo,type Order,type Scheduled,type Condition} from './types';
import {enterBoarding} from './boarding';
export const AMMO:Ammo[]=['round-shot','chain-shot','grapeshot','bombs'];
const skills:Skill[]=['sailing','lookout','deception','diplomacy','intimidation','boarding','aiming','reloading','demolitions','carpentry','sailmaking','doctoring','leadership','lightWeapons','mediumWeapons','heavyWeapons','athletics','shooting'];
export function createBattle(g:Game,n:Npc,pursuit=false):Battle{
 const make=(player:boolean):Combatant=>{const ship=structuredClone(player?g.ship!:n.ship),c=structuredClone(player?g.crewState??crew(g.crew):n.crew),spec=shipDefinition(ship.configurationId);const cargo=player?structuredClone(g.cargo):Object.fromEntries([...AMMO,'gunpowder','planks','sailcloth','rope','tools','medicine'].map(id=>[id,id==='gunpowder'?totalCannons(ship.cannons)*8:totalCannons(ship.cannons)*2+spec.tier]));return {ship,crew:c,captain:structuredClone(player?g.captainState??captain():captain()),skills:Object.fromEntries(skills.map(id=>[id,player?mastery(g,id):Math.floor(n.level/2)])),cargo,x:player?0:450,y:0,heading:player?0:pursuit?0:180,sails:1,states:{fire:0,flooding:0,rigging:0,shock:0},batteries:Object.fromEntries(BATTERIES.map(k=>[k,{loaded:0,ammo:null,power:1}])) as Combatant['batteries'],startHull:ship.hullPoints,startSails:ship.sailCondition,startFit:c.fit,provisions:player?g.provisions:0,freight:player?g.contracts.filter(c=>c.type==='Freight').reduce((s,c)=>s+c.amount,0):0,passengers:player?g.contracts.filter(c=>c.type==='Passengers').reduce((s,c)=>s+c.amount,0):0};};
 const p=make(true),enemy=make(false);return {id:`battle-${g.seed}`,phase:'naval',playerId:p.ship.id,npcId:enemy.ship.id,ships:{[p.ship.id]:p,[enemy.ship.id]:enemy},npc:n,window:1,unit:0,wind:90,windStrength:2,hazards:[],plans:{},decisionKey:0,status:'planning',round:0,rounds:0,control:0,attacker:p.ship.id,preloaded:[],log:['Naval Engagement begins at Long range. Choose preloads and commit orders.'],rolls:[],difficulty:g.difficulty??'Normal'};
}
export const distance=(a:Combatant,b:Combatant)=>Math.hypot(a.x-b.x,a.y-b.y);
export const range=(d:number)=>d<100?'Close':d<300?'Medium':d<600?'Long':d<=1000?'Distant':'Outside engagement';
export const norm=(a:number)=>(a%360+360)%360;
export const bearing=(a:Combatant,b:{x:number;y:number})=>norm(Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI-a.heading);
export const arc=(a:Combatant,b:{x:number;y:number}):Battery=>{const d=Math.round(bearing(a,b)*1e9)/1e9;return d<45||d>=315?'bow':d<135?'starboard':d<225?'stern':'port';};
export function performance(s:Combatant){return shipPerformance({ship:s.ship,crew:s.crew.fit,cargo:s.cargo,provisions:s.provisions,contracts:[{type:'Freight',amount:s.freight},{type:'Passengers',amount:s.passengers}],skills:{sailing:{tier:s.skills.sailing??0,points:0}}} as Game);}
const stateFactor=(v:number)=>[1,.9,.75,.5][v];
const statePenalty=(v:number)=>[0,.1,.25,.5][v];
export function speed(s:Combatant,b:Battle){const sector=Math.round(norm(s.heading-b.wind)/45)%8;return performance(s).speed*[0,.5,1][s.sails]*[0,.6,1,1.1,.9,1.1,1,.6][sector]*[.25,.75,1,1.2][b.windStrength]*stateFactor(s.states.flooding)*stateFactor(s.states.rigging);}
export function orderCatalogue(b:Battle,id:string):Order[]{
 const s=b.ships[id],spec=shipDefinition(s.ship.configurationId),enemy=id===b.playerId?b.npcId:b.playerId,orders:Order[]=[];
 const add=(id:string,kind:string,base:number,skill:Skill,resources:Record<string,number>={},extra:Partial<Order>={},penalties:Record<string,number>={})=>{const parts:Record<string,number>={'Skill bonus':-.03*(s.skills[skill]??0),'Crew insufficiency':s.crew.fit<spec.minCrew?1:s.crew.fit<spec.optimalCrew?.2:0,'Crew Shock':statePenalty(s.states.shock),...penalties};const cost=Math.round(base*clamp(1+Object.values(parts).reduce((a,b)=>a+b,0),.5,2));orders.push({id,kind,cost,parts,resources,...extra});};
 for(const angle of [-180,-135,-90,-45,45,90,135,180])add(`turn_${angle}`,'turn',100*Math.abs(angle)/45,'sailing',{}, {angle},{Maneuverability:(50-performance(s).maneuverability)/100,'Full Sail':s.sails===2?.2:0,'Through wind':Math.abs(norm(b.wind-s.heading+180)-180)<=Math.abs(angle)?.2:0,Rigging:statePenalty(s.states.rigging)});
 for(const setting of [0,1,2])if(setting!==s.sails)add(`sails_${setting}`,'sails',150*Math.abs(setting-s.sails),'sailing',{}, {setting},{'Sail damage':(100-s.ship.sailCondition)/200,Rigging:statePenalty(s.states.rigging)});
 for(const battery of BATTERIES){const count=s.ship.cannons[battery];if(!count)continue;
  const penalties={'Gunnery experience':(50-s.crew.experience)/200,'Battery damage':Math.max(0,1-count/Math.max(1,spec.defaultCannons[battery]))*.25};
  add(`fire_${battery}`,'fire',150,'aiming',{}, {battery,target:enemy},penalties);
  for(const h of b.hazards)add(`fire_${battery}_${h.id}`,'fire',150,'aiming',{}, {battery,target:h.id},penalties);
  add(`unload_${battery}`,'unload',200,'reloading',{}, {battery},penalties);
  for(const ammo of AMMO){add(`reload_${battery}_${ammo}`,'reload',ammo==='bombs'?437.5:350,'reloading',{[ammo]:count,gunpowder:count},{battery,ammo},penalties);if(b.window===1&&b.unit===0&&!b.replacement&&!b.preloaded.includes(`${id}:${battery}`))orders.push({id:`preload_${battery}_${ammo}`,kind:'preload',cost:0,parts:{},resources:{[ammo]:count,gunpowder:count},battery,ammo});}
 }
 const qty=Math.ceil(spec.tier/2);
 add('grapple','grapple',200,'boarding',{}, {target:enemy});add('dump-explosives','dump',250,'demolitions',{bombs:1,gunpowder:1});
 add('patch-hull','patch',300,'carpentry',{planks:qty});add('repair-sails','repair',250,'sailmaking',{sailcloth:qty,rope:qty});add('extinguish','extinguish',200,'leadership');add('control-flooding','flooding',250,'carpentry',{planks:qty});add('rally','rally',150,'leadership');add('doctor','doctor',300,'doctoring',{medicine:qty});add('deceive','deceive',200,'deception');return orders;
}
export function validateOrder(s:Combatant,o:Order):string[]{
 const errors:string[]=[];if(s.crew.fit===0)errors.push('No Fit Crew.');if(o.kind==='turn'&&s.sails===0)errors.push('Cannot turn with furled sails.');
 if(o.battery){const gun=s.batteries[o.battery];if(!s.ship.cannons[o.battery])errors.push('Battery destroyed.');if(['reload','preload'].includes(o.kind)&&gun.loaded>0)errors.push('Unload before reloading.');if(['fire','unload'].includes(o.kind)&&!gun.loaded)errors.push('Battery is empty.');}
 if(['patch','repair','flooding'].includes(o.kind)&&(s.cargo.tools??0)<1)errors.push('Tools required.');
 for(const [id,q] of Object.entries(o.resources))if((s.cargo[id]??0)<q)errors.push(`Insufficient ${id}: requires ${q}.`);
 return errors;
}
function inventoryEffect(s:Combatant,o:Order){
 if(o.kind==='reload'||o.kind==='preload'){const n=s.ship.cannons[o.battery!];s.cargo[o.ammo!]=(s.cargo[o.ammo!]??0)-n;s.cargo.gunpowder=(s.cargo.gunpowder??0)-n;s.batteries[o.battery!]={loaded:n,ammo:o.ammo!,power:1};}
 else if(o.kind==='unload'){const gun=s.batteries[o.battery!];s.cargo[gun.ammo!]=(s.cargo[gun.ammo!]??0)+gun.loaded;s.cargo.gunpowder=(s.cargo.gunpowder??0)+gun.loaded;gun.loaded=0;gun.ammo=null;}
 else if(o.kind==='fire'){s.batteries[o.battery!].loaded=0;s.batteries[o.battery!].ammo=null;}
 else for(const [id,q] of Object.entries(o.resources))s.cargo[id]-=q;
 if(o.kind==='sails')s.sails=o.setting!;if(o.kind==='turn')s.heading=norm(s.heading+o.angle!);
}
export function schedule(b:Battle,id:string,ids:string[],start=0):Scheduled[]{
 if(ids.length>20)throw Error('Too many orders.');const copy=structuredClone(b),s=copy.ships[id];let unit=start;const result:Scheduled[]=[];
 for(const actionId of ids){const o=orderCatalogue(copy,id).find(o=>o.id===actionId);if(!o)throw Error(`Unknown action ${actionId}.`);const errors=validateOrder(s,o);if(errors.length)throw Error(`${actionId}: ${errors.join(' ')}`);if(o.kind==='preload'){if(unit!==0||copy.preloaded.includes(`${id}:${o.battery}`))throw Error('Preloads must precede timed actions, once per battery.');copy.preloaded.push(`${id}:${o.battery}`);}unit+=o.cost;if(unit>1000)throw Error('Schedule exceeds 1,000 units.');result.push({...o,start:unit-o.cost,end:unit});inventoryEffect(s,o);}
 return result;
}
export function preload(b:Battle,id:string,battery:Battery,ammo:Ammo){
 if(b.window!==1||b.unit!==0||b.status!=='planning'||b.preloaded.includes(`${id}:${battery}`))throw Error('Free preload is available once per battery before the first commitment.');
 const s=b.ships[id],o=orderCatalogue(b,id).find(o=>o.id===`reload_${battery}_${ammo}`);if(!o)throw Error('No operational cannons.');const errors=validateOrder(s,o);if(errors.length)throw Error(errors.join(' '));inventoryEffect(s,o);b.preloaded.push(`${id}:${battery}`);
}
export function completePreloads(b:Battle){for(const [id,plan] of Object.entries(b.plans)){for(const o of plan.filter(o=>o.kind==='preload')){inventoryEffect(b.ships[id],o);b.preloaded.push(`${id}:${o.battery}`);}b.plans[id]=plan.filter(o=>o.kind!=='preload');}}
function accuracy(ammo:Ammo,d:number){return ammo==='round-shot'?d<26?2:d<100?1:d<300?0:d<600?-1:d<=1000?-2:null:ammo==='chain-shot'?d<26?2:d<100?1:d<300?0:d<600?-2:null:ammo==='bombs'?d<26?2:d<100?1:d<300?-1:null:d<26?2:d<100?0:null;}
function upgrade(s:Combatant,state:Condition,severity:number){s.states[state]=Math.min(3,Math.max(severity,s.states[state]?s.states[state]+1:0));}
function hurt(s:Combatant,kind:string,raw:number,g:Game){const spec=shipDefinition(s.ship.configurationId),mitigation=kind==='hull'||kind==='cannons'?spec.protection:kind==='crew'?s.crew.equipment:0;const n=raw<=0?0:Math.max(1,Math.round(raw*100/(100+mitigation)));
 if(kind==='hull')s.ship.hullPoints-=n;if(kind==='sails')s.ship.sailCondition=Math.max(0,s.ship.sailCondition-n);if(kind==='crew')casualties(g,s.crew,n);
 if(kind==='cannons')for(let i=0;i<n;i++){const batteries=BATTERIES.filter(k=>s.ship.cannons[k]>0);if(!batteries.length)break;const k=batteries[Math.floor(rng(g)*batteries.length)];s.ship.cannons[k]--;s.batteries[k].loaded=Math.min(s.batteries[k].loaded,s.ship.cannons[k]);}
}
function morale(g:Game,b:Battle,s:Combatant,penalty=0){const mod=(n:number)=>n<20?-2:n<40?-1:n<70?0:n<90?1:2;const r=roll(g,'Crew Morale',{Morale:mod(s.crew.morale),Discipline:mod(s.crew.discipline),Leadership:Math.floor((s.skills.leadership??0)/3),'Crew Shock':-s.states.shock,Losses:penalty});recordRoll(g,b,r);if(r.dice[0]+r.dice[1]===2||(r.dice[0]+r.dice[1]!==12&&r.total<9))upgrade(s,'shock',1);}
function explode(g:Game,b:Battle,hazardId:string,critical=false){const h=b.hazards.find(h=>h.id===hazardId);if(!h)return;b.hazards=b.hazards.filter(x=>x.id!==hazardId);for(const s of Object.values(b.ships)){const d=Math.hypot(s.x-h.x,s.y-h.y);if(d<=50)hurt(s,'hull',d<=20?24:12,g);if(d<=20&&critical)upgrade(s,'fire',1);}for(const other of [...b.hazards])if(Math.hypot(other.x-h.x,other.y-h.y)<=50)explode(g,b,other.id);report(b,'A dumped charge detonates.');}
function volley(g:Game,b:Battle,id:string,o:Order,pre:Battle){
 const shooter=pre.ships[id],s=b.ships[id],gun=shooter.batteries[o.battery!],count=Math.min(shooter.ship.cannons[o.battery!],gun.loaded),target=pre.ships[o.target!]??pre.hazards.find(h=>h.id===o.target);
 if(!target||!count||!gun.ammo||arc(shooter,target)!==o.battery){report(b,`${id}: ${o.id} has no target in its bearing; load retained.`);return;}
 const d=Math.hypot(shooter.x-target.x,shooter.y-target.y),rangeMod=accuracy(gun.ammo,d);if(rangeMod===null){report(b,`${o.id}: target outside ammunition range; load retained.`);return;}
 const shipTarget='ship' in target?target:null,tier=shipTarget?shipDefinition(shipTarget.ship.configurationId).tier:1;
 const transverse=shipTarget?Math.abs(Math.sin((shipTarget.heading-Math.atan2(target.y-shooter.y,target.x-shooter.x)*180/Math.PI)*Math.PI/180)*speed(shipTarget,pre)*250):0;
 const r=roll(g,'Cannon volley',{'Cannon Aiming':Math.floor((shooter.skills.aiming??0)/3),'Ammunition range':rangeMod,'Target size':shipTarget?tier<=2?-1:tier>=5?1:0:-2,'Transverse movement':transverse<25?1:transverse<100?0:transverse<200?-1:-2,'Gunnery experience':Math.floor((shooter.crew.experience-50)/25)});recordRoll(g,b,r);
 const natural=r.dice[0]+r.dice[1],out=natural===2?0:natural===12?3:r.total<=6?0:r.total<=8?1:r.total<=10?2:3,mult=[0,.5,1,1.5][out];
 s.batteries[o.battery!].loaded=0;s.batteries[o.battery!].ammo=null;report(b,`${id} ${o.battery}: ${['Miss','Glancing hit','Solid hit','Critical hit'][out]}.`);if(!out)return;
 if(!shipTarget){explode(g,b,o.target!,out===3);return;}const t=b.ships[o.target!],packets:Record<string,number>={hull:0,sails:0,crew:0,cannons:0};
 for(let i=0;i<count;i++){const kind=gun.ammo==='round-shot'?weighted(g,[['hull',50],['sails',20],['crew',20],['cannons',10]]):gun.ammo==='chain-shot'?'sails':gun.ammo==='grapeshot'?'crew':'hull';packets[kind]+=(gun.ammo==='round-shot'?{hull:4,sails:2,crew:1,cannons:1}[kind]!:gun.ammo==='chain-shot'?5:gun.ammo==='grapeshot'?2:8)*gun.power;}
 for(const [kind,raw] of Object.entries(packets))hurt(t,kind,raw*mult,g);
 if(gun.ammo==='bombs'&&d<=25)hurt(s,'hull',packets.hull*mult,g);
 if(gun.ammo==='grapeshot'&&t.crew.fit<shipTarget.crew.fit){const lost=1-t.crew.fit/shipTarget.crew.fit;morale(g,b,t,lost<.05?0:lost<.15?-1:lost<.3?-2:-3);}
 if(out===3){const severity=count/tier<=1?1:count/tier<=3?2:3;const tables:Record<Ammo,[string,number][]>={'round-shot':[['flooding',35],['cannons',25],['shock',20],['rigging',20]],'chain-shot':[['rigging',60],['sails',25],['shock',15]],grapeshot:[['shock',65],['crew',35]],bombs:[['fire',55],['flooding',30],['hull',15]]};const effect=weighted(g,tables[gun.ammo]);if(['fire','flooding','shock','rigging'].includes(effect))upgrade(t,effect as Condition,severity);else hurt(t,effect,packets[effect]*mult*[0,.25,.5,1][severity],g);report(b,`Critical result: ${effect}, severity ${severity}.`);}
}
function complete(g:Game,b:Battle,id:string,o:Scheduled,pre:Battle):string|undefined{
 const s=b.ships[id],old=pre.ships[id],spec=shipDefinition(s.ship.configurationId);if(o.failed){report(b,`${o.id} fails: ${o.failed}`);return;}
 const adjusted={...o,resources:o.kind==='reload'?{[o.ammo!]:old.ship.cannons[o.battery!],gunpowder:old.ship.cannons[o.battery!]}:o.resources};const errors=validateOrder(old,adjusted);if(errors.length){report(b,`${o.id} fails after spending ${o.cost}: ${errors.join(' ')}`);return;}
 if(o.kind==='fire'){volley(g,b,id,o,pre);return;}
 if(o.kind==='grapple'){const target=pre.ships[o.target!],relative=Math.hypot(speed(old,pre)*Math.cos(old.heading*Math.PI/180)-speed(target,pre)*Math.cos(target.heading*Math.PI/180),speed(old,pre)*Math.sin(old.heading*Math.PI/180)-speed(target,pre)*Math.sin(target.heading*Math.PI/180))*250;if(distance(old,target)>25||relative>50){report(b,'Grapple failed: requires distance ≤25 and relative movement ≤50.');return;}const r=roll(g,'Grapple',{Strength:ratioEdge(strength(old)/Math.max(.001,strength(target))),Maneuverability:Math.round((performance(old).maneuverability-performance(target).maneuverability)/25)});recordRoll(g,b,r);if(r.dice[0]+r.dice[1]===12||(r.dice[0]+r.dice[1]!==2&&r.total>=9))return id;return;}
 inventoryEffect(s,adjusted);
 if(o.kind==='patch')s.ship.hullPoints=Math.min(s.startHull,s.ship.hullPoints+spec.maxHull*(.02+.005*(s.skills.carpentry??0)));
 if(o.kind==='repair')s.ship.sailCondition=Math.min(s.startSails,s.ship.sailCondition+5+(s.skills.sailmaking??0));
 if(o.kind==='extinguish')s.states.fire=Math.max(0,s.states.fire-1);if(o.kind==='flooding')s.states.flooding=Math.max(0,s.states.flooding-1);if(o.kind==='rally')s.states.shock=Math.max(0,s.states.shock-1);
 if(o.kind==='doctor'){const restored=Math.min(s.crew.injured,Math.max(0,s.startFit-s.crew.fit),Math.ceil((s.crew.fit+s.crew.injured)*(.02+.005*(s.skills.doctoring??0))));s.crew.fit+=restored;s.crew.injured-=restored;}
 if(o.kind==='dump')b.hazards.push({id:`charge-${id}-${b.window}-${b.unit}`,x:old.x,y:old.y,owner:id,armed:false});
 if(o.kind==='deceive'){const other=pre.ships[id===b.playerId?b.npcId:b.playerId];const r=roll(g,'Combat Deception',{Deception:Math.floor((old.skills.deception??0)/2),Discipline:Math.floor((old.crew.discipline-50)/25),Resistance:-Math.floor((other.skills.lookout??0)/2)});recordRoll(g,b,r);if(r.band)b.deception={...b.deception,[id]:{window:b.window+1,band:r.band}};}
 report(b,`${id}: ${o.id} completes at ${b.unit}.`);
}
/** Merge independent effects from a shared pre-event snapshot, so repair/fire order cannot decide survival. */
export function mergeCompletions(b:Battle,pre:Battle,events:Battle[]){
 const delta=(base:number,values:number[])=>base+values.reduce((sum,n)=>sum+n-base,0);
 for(const id of Object.keys(b.ships)){
  const s=b.ships[id],old=pre.ships[id],all=events.map(e=>e.ships[id]);
  s.ship.hullPoints=clamp(delta(old.ship.hullPoints,all.map(s=>s.ship.hullPoints)),0,shipDefinition(s.ship.configurationId).maxHull);
  s.ship.sailCondition=clamp(delta(old.ship.sailCondition,all.map(s=>s.ship.sailCondition)),0,100);
  for(const k of ['fit','injured','dead'] as const)s.crew[k]=Math.max(0,delta(old.crew[k],all.map(s=>s.crew[k])));
  const total=old.crew.fit+old.crew.injured+old.crew.dead;s.crew.dead=Math.min(total,s.crew.dead);s.crew.injured=Math.min(total-s.crew.dead,s.crew.injured);s.crew.fit=total-s.crew.dead-s.crew.injured;
  for(const k of BATTERIES){s.ship.cannons[k]=Math.max(0,delta(old.ship.cannons[k],all.map(s=>s.ship.cannons[k])));const loaded=delta(old.batteries[k].loaded,all.map(s=>s.batteries[k].loaded));s.batteries[k].loaded=clamp(loaded,0,s.ship.cannons[k]);s.batteries[k].ammo=s.batteries[k].loaded?(all.find(s=>s.batteries[k].ammo!==old.batteries[k].ammo)?.batteries[k].ammo??old.batteries[k].ammo):null;}
  for(const k of new Set([...Object.keys(old.cargo),...all.flatMap(s=>Object.keys(s.cargo))]))s.cargo[k]=Math.max(0,delta(old.cargo[k]??0,all.map(s=>s.cargo[k]??0)));
  for(const k of ['fire','flooding','rigging','shock'] as const)s.states[k]=clamp(delta(old.states[k],all.map(s=>s.states[k])),0,3);
  s.heading=all.find(s=>s.heading!==old.heading)?.heading??old.heading;s.sails=all.find(s=>s.sails!==old.sails)?.sails??old.sails;
 }
 const removed=new Set(pre.hazards.filter(h=>events.some(e=>!e.hazards.some(v=>v.id===h.id))).map(h=>h.id));
 b.hazards=[...pre.hazards.filter(h=>!removed.has(h.id)),...events.flatMap(e=>e.hazards.filter(h=>!pre.hazards.some(v=>v.id===h.id)))];
 for(const e of events){for(const line of [...e.log].reverse())report(b,line);b.rolls=[...e.rolls,...b.rolls].slice(0,40);b.deception={...b.deception,...e.deception};}
}
function terminal(b:Battle){for(const s of Object.values(b.ships))s.ship.hullPoints=Math.max(0,s.ship.hullPoints);const dead=Object.values(b.ships).filter(s=>s.ship.hullPoints<=0||s.crew.fit===0);if(!dead.length)return false;const survivors=Object.keys(b.ships).filter(id=>!dead.some(s=>s.ship.id===id));finish(b,survivors.length===1?survivors[0]:undefined,dead.some(s=>s.ship.hullPoints<=0)?'Ship sunk.':'No Fit Crew remain; automatic surrender.');return true;}
/** Advance at most to the next completion, pausing at invalid starts and transitions. */
export function stepNaval(g:Game,b:Battle){
 if(b.status!=='playback')throw Error('Reveal both schedules before playback.');
 const needs:string[]=[];
 for(const id of Object.keys(b.ships)){const action=b.plans[id]?.find(o=>o.start===b.unit&&!o.begun);if(action){const adjusted={...action,resources:action.kind==='reload'?{[action.ammo!]:b.ships[id].ship.cannons[action.battery!],gunpowder:b.ships[id].ship.cannons[action.battery!]}:action.resources};const errors=validateOrder(b.ships[id],adjusted);if(action.kind==='grapple'&&distance(b.ships[id],b.ships[action.target!])>=100)errors.push('Grapple must begin in Close range.');if(action.kind==='fire'){const s=b.ships[id],target=b.ships[action.target!]??b.hazards.find(h=>h.id===action.target),ammo=s.batteries[action.battery!].ammo;if(!target||arc(s,target)!==action.battery||!ammo||accuracy(ammo,Math.hypot(s.x-target.x,s.y-target.y))===null)errors.push('No valid target in battery bearing and ammunition range.');}if(errors.length){needs.push(id);report(b,`${id}: replacement required for ${action.id}: ${errors.join(' ')}`);}else action.begun=true;}}
 if(needs.length){b.status='replacement';b.replacement=needs;delete b.committed;delete b.accepted;b.decisionKey++;return;}
 const next=Math.min(1000,...Object.values(b.plans).flat().filter(o=>o.end>b.unit).map(o=>o.end));
 // Unit stepping resolves hazard crossings, including fast ships passing entirely through a charge radius.
 while(b.unit<next){for(const s of Object.values(b.ships)){const moved=speed(s,b)*.25;s.x+=Math.cos(s.heading*Math.PI/180)*moved;s.y+=Math.sin(s.heading*Math.PI/180)*moved;}b.unit++;for(const h of [...b.hazards]){if(!h.armed&&Math.hypot(b.ships[h.owner].x-h.x,b.ships[h.owner].y-h.y)>50)h.armed=true;if(h.armed&&Object.values(b.ships).some(s=>Math.hypot(s.x-h.x,s.y-h.y)<=50))explode(g,b,h.id);}if(b.unit<next&&terminal(b))return;}
 const pre=structuredClone(b);let grapple:string|undefined;
 // Each completion reads a common snapshot; additive effects are committed to the live state.
 const events:{state:Battle;grapple?:string}[]=[];const detonated=new Set<string>();
 for(const id of Object.keys(b.ships))for(const o of pre.plans[id]??[])if(o.end===b.unit){const isolated=structuredClone(pre);isolated.log=[];isolated.rolls=[];isolated.hazards=isolated.hazards.filter(h=>!detonated.has(h.id));events.push({state:isolated,grapple:complete(g,isolated,id,o,pre)});for(const h of pre.hazards)if(!isolated.hazards.some(x=>x.id===h.id))detonated.add(h.id);}
 mergeCompletions(b,pre,events.map(e=>e.state));grapple=events.find(e=>e.grapple)?.grapple;
 if(terminal(b))return;if(grapple){enterBoarding(b,grapple);return;}
 if(b.unit===1000){
  for(const s of Object.values(b.ships)){const max=shipDefinition(s.ship.configurationId).maxHull;for(const state of ['fire','flooding'] as const)if(s.states[state])s.ship.hullPoints=Math.max(0,s.ship.hullPoints-Math.ceil(max*(state==='fire'?[0,.01,.02,.04]:[0,.005,.01,.02])[s.states[state]]));}
  if(terminal(b))return;
  if(distance(b.ships[b.playerId],b.ships[b.npcId])>1000){b.phase='ended';b.status='finished';b.reason='Ships separated beyond engagement range.';report(b,b.reason);return;}
  if(rng(g)<.2)b.wind=norm(b.wind+(rng(g)<.5?-45:45));if(rng(g)<.1)b.windStrength=clamp(b.windStrength+(rng(g)<.5?-1:1),0,3);
  b.window++;b.unit=0;b.status='planning';b.plans={};delete b.committed;delete b.accepted;b.decisionKey++;report(b,`Window ${b.window}: new orders.`);
 }
}
export function replaceOrder(b:Battle,id:string,replacement:string){
 const old=b.plans[id],index=old.findIndex(o=>o.start===b.unit&&!o.begun);if(index<0)throw Error('No replacement pending.');
 const ids=[replacement,...old.slice(index+1).map(o=>o.id)];let plan:Scheduled[]=[];
 // Later orders retain order; only tail orders that overflow are removed.
 while(ids.length){try{plan=schedule(b,id,ids,b.unit);break;}catch(e){if(!(e instanceof Error)||!e.message.includes('exceeds'))throw e;ids.pop();}}
 if(!plan.length)throw Error('Replacement cannot fit the remaining window.');b.plans[id]=[...old.slice(0,index),...plan];
}

/** Advisory course preview; enemy holds visible course and cannot leak its secret orders. */
export function coursePreview(b:Battle,id:string,ids:string[]){
 const copy=structuredClone(b),plan=schedule(copy,id,ids),s=copy.ships[id],other=copy.ships[id===b.playerId?b.npcId:b.playerId],path:[number,number][]=[[s.x,s.y]];
 for(let unit=1;unit<=1000;unit++){for(const ship of [s,other]){const step=speed(ship,copy)*.25;ship.x+=Math.cos(ship.heading*Math.PI/180)*step;ship.y+=Math.sin(ship.heading*Math.PI/180)*step;}for(const action of plan.filter(o=>o.end===unit)){if(action.kind==='turn')s.heading=norm(s.heading+action.angle!);if(action.kind==='sails')s.sails=action.setting!;}if(unit%50===0)path.push([s.x,s.y]);}
 return {path,distance:distance(s,other),range:range(distance(s,other)),bearing:bearing(s,other)};
}
