import {gunDamage,shipDefinition,type Battery} from '../ships';
import {arc,bearing,distance,norm,performance,schedule,speed} from './naval';
import type {Ammo,Battle,Combatant,Scheduled} from './types';

export type ManeuverPlan={id:string;title:string;description:string;ids:string[]};
type Candidate={ids:string[];orders:Scheduled[]};
const angles=[-45,45,-90,90,-135,135,180];
const ammunition:Ammo[]=['round-shot','chain-shot','grapeshot','bombs'];

/** Small, editable courses, using only existing completion-time orders. */
function courses(s:Combatant):string[][]{
 const result:string[][]=[[]];
 for(const setting of [0,1,2])if(setting!==s.sails)result.push([`sails_${setting}`]);
 for(const angle of angles){
  const turn=`turn_${angle}`;
  if(s.sails){
   result.push([turn]);
   for(const setting of [0,1,2])if(setting!==s.sails){
    result.push([turn,`sails_${setting}`]);
    if(setting)result.push([`sails_${setting}`,turn]);
   }
  }else for(const setting of [1,2]){
   result.push([`sails_${setting}`,turn],[`sails_${setting}`,turn,'sails_0']);
  }
 }
 return result;
}

function inRange(ammo:Ammo,d:number){
 return ammo==='round-shot'?d<=1000:ammo==='chain-shot'?d<600:ammo==='bombs'?d<300:d<100;
}
function relativeMovement(a:Combatant,c:Combatant,b:Battle){
 const av=speed(a,b),cv=speed(c,b),ah=a.heading*Math.PI/180,ch=c.heading*Math.PI/180;
 return Math.hypot(av*Math.cos(ah)-cv*Math.cos(ch),av*Math.sin(ah)-cv*Math.sin(ch))*250;
}

/**
 * The same passive-motion / completion-only forecast as coursePreview. The
 * opponent holds its current course; its queued or accepted orders are ignored.
 * Movement is integrated by event rather than unit because speed is constant
 * between these events. Scheduled loads also update weight at completion.
 * Hazards, enemy actions, and combat rolls remain outside this advisory forecast.
 */
function project(b:Battle,orders:Scheduled[]){
 const p=structuredClone(b.ships[b.playerId]),n=structuredClone(b.ships[b.npcId]);
 const copy={...b,ships:{...b.ships,[b.playerId]:p,[b.npcId]:n}};
 let unit=0,shotReady=true,grappleReady=true,shotDistance=0,shotMargin=0;
 const advance=(end:number)=>{
  for(const s of [p,n]){
   const moved=speed(s,copy)*.25*(end-unit),heading=s.heading*Math.PI/180;
   s.x+=Math.cos(heading)*moved;s.y+=Math.sin(heading)*moved;
  }
  unit=end;
 };
 const fireReady=(o:Scheduled)=>{
  const gun=p.batteries[o.battery!];
  return !!gun.loaded&&!!gun.ammo&&arc(p,n)===o.battery&&inRange(gun.ammo,distance(p,n));
 };
 for(const o of orders){
  if(o.kind==='fire')shotReady=shotReady&&fireReady(o);
  if(o.kind==='grapple')grappleReady=grappleReady&&distance(p,n)<100;
  advance(o.end);
  if(o.kind==='fire'){
   shotDistance=distance(p,n);
   shotReady=shotReady&&fireReady(o)&&!(p.batteries[o.battery!].ammo==='bombs'&&shotDistance<=25);
   const center=o.battery==='port'?270:90;
   shotMargin=45-Math.abs(norm(bearing(p,n)-center+180)-180);
  }
  if(o.kind==='grapple')grappleReady=grappleReady&&distance(p,n)<=25&&relativeMovement(p,n,copy)<=50;
  if(o.kind==='turn')p.heading=norm(p.heading+o.angle!);
  if(o.kind==='sails')p.sails=o.setting!;
  if(o.kind==='reload'||o.kind==='preload'){
   const count=p.ship.cannons[o.battery!];
   p.cargo[o.ammo!]=(p.cargo[o.ammo!]??0)-count;
   p.cargo.gunpowder=(p.cargo.gunpowder??0)-count;
   p.batteries[o.battery!]={loaded:count,ammo:o.ammo!,power:1};
  }
 }
 const lastDistance=distance(p,n);
 advance(1000);
 return {distance:distance(p,n),lastDistance,shotReady,shotDistance,shotMargin,grappleReady};
}

function damageControl(b:Battle,valid:(ids:string[])=>Candidate|undefined):ManeuverPlan|undefined{
 const p=structuredClone(b.ships[b.playerId]),spec=shipDefinition(p.ship.configurationId),ids:string[]=[];
 // Track deterministic benefits to avoid repairs above engagement-start caps or
 // repeated treatment of a condition that this same plan has already removed.
 while(ids.length<20){
  const choices:{id:string;priority:number;apply:()=>void}[]=[];
  if(p.states.fire)choices.push({id:'extinguish',priority:p.states.fire===3?100:80,apply:()=>p.states.fire--});
  if(p.states.flooding)choices.push({id:'control-flooding',priority:p.states.flooding===3?90:70,apply:()=>p.states.flooding--});
  if(p.states.shock)choices.push({id:'rally',priority:60,apply:()=>p.states.shock--});
  if(p.ship.hullPoints<p.startHull)choices.push({id:'patch-hull',priority:50,apply:()=>{p.ship.hullPoints=Math.min(p.startHull,p.ship.hullPoints+spec.maxHull*(.02+.005*(p.skills.carpentry??0)));}});
  if(p.crew.injured&&p.crew.fit<p.startFit)choices.push({id:'doctor',priority:40,apply:()=>{
   const restored=Math.min(p.crew.injured,p.startFit-p.crew.fit,Math.ceil((p.crew.fit+p.crew.injured)*(.02+.005*(p.skills.doctoring??0))));
   p.crew.fit+=restored;p.crew.injured-=restored;
  }});
  if(p.ship.sailCondition<p.startSails)choices.push({id:'repair-sails',priority:30,apply:()=>{p.ship.sailCondition=Math.min(p.startSails,p.ship.sailCondition+5+(p.skills.sailmaking??0));}});
  const next=choices.sort((a,c)=>c.priority-a.priority).find(c=>valid([...ids,c.id]));
  if(!next)break;
  ids.push(next.id);next.apply();
 }
 return ids.length?{id:'damage-control',title:'Damage control',description:'Treat current damage and crew conditions; spend time and available supplies instead of firing.',ids}:undefined;
}

/** Suggested player schedules only: selection never commits or changes battle. */
export function maneuverPlans(b:Battle):ManeuverPlan[]{
 if(b.phase!=='naval'||b.status!=='planning'||b.replacement||b.unit!==0)return [];
 const p=b.ships[b.playerId],n=b.ships[b.npcId];
 if(!p||!n||p.crew.fit<=0||p.ship.hullPoints<=0)return [];
 const cache=new Map<string,Candidate|undefined>();
 const valid=(ids:string[])=>{
  const key=ids.join('|');
  if(!cache.has(key)){
   try{cache.set(key,{ids,orders:schedule(b,b.playerId,ids)});}catch{cache.set(key,undefined);}
  }
  return cache.get(key);
 };
 const paths=courses(p).flatMap(ids=>{const c=valid(ids);return c?[c]:[];}),plans:ManeuverPlan[]=[];

 let attack:{candidate:Candidate;battery:Battery;ammo:Ammo;score:number}|undefined;
 // Even the fastest heading at full sail cannot cover more than this bound.
 // Avoid searching every load/turn combination for an unreachable target.
 const sailing=performance(p);
 const closingBound=(sailing.speed/sailing.factors.loadSpeed*1.32+speed(n,b))*250;
 for(const battery of ['port','starboard'] as const){
  if(!p.ship.cannons[battery])continue;
  const gun=p.batteries[battery],ammos=gun.loaded?(gun.ammo?[gun.ammo]:[]):ammunition;
  const center=battery==='port'?270:90;
  const courseRank=(path:Candidate)=>{
   const headingChange=path.orders.reduce((sum,o)=>sum+(o.angle??0),0);
   return Math.abs(norm(bearing(p,n)-headingChange-center+180)-180)+(path.orders.at(-1)?.end??0)/100;
  };
  const attackPaths=[...paths].sort((a,c)=>courseRank(a)-courseRank(c));
  for(const ammo of ammos){
   const count=p.ship.cannons[battery];
   if(!gun.loaded&&((p.cargo[ammo]??0)<count||(p.cargo.gunpowder??0)<count))continue;
   if(!inRange(ammo,Math.max(0,distance(p,n)-closingBound)))continue;
   let found=false;
   for(const path of attackPaths){
    let robust=false;
    const reload=`reload_${battery}_${ammo}`,fire=`fire_${battery}`;
    const variants=gun.loaded?[[...path.ids,fire]]:[
     [`preload_${battery}_${ammo}`,...path.ids,fire],
     [reload,...path.ids,fire],
     [...path.ids,reload,fire],
    ];
    for(const ids of variants){
     const candidate=valid(ids);if(!candidate)continue;
     const forecast=project(b,candidate.orders);if(!forecast.shotReady)continue;
     const count=gun.loaded?gun.loaded:p.ship.cannons[battery];
     const score=count*gunDamage(p.ship,battery)*20+forecast.shotMargin/10-forecast.shotDistance/100-candidate.orders.at(-1)!.end/100;
     found=true;
     if(!attack||score>attack.score)attack={candidate,battery,ammo,score};
     // A robust bearing is enough for an editable preset; avoid an exhaustive
     // optimizer on every render. Marginal arcs keep searching for a better one.
     if(forecast.shotMargin>=10){robust=true;break;}
    }
    if(robust)break;
   }
   // Prefer general-purpose round shot when available; retain existing loads.
   if(found)break;
  }
 }
 if(attack)plans.push({id:'broadside',title:'Broadside attack',description:`Bring the ${attack.battery} guns to bear with ${attack.ammo.replaceAll('-',' ')}; enemy movement and rolls can spoil the shot.`,ids:attack.candidate.ids});

 const coast=project(b,[]).distance,currentDistance=distance(p,n);
 const forecasts=paths.map(candidate=>({candidate,forecast:project(b,candidate.orders)}));
 const escape=[...forecasts].sort((a,c)=>c.forecast.distance-a.forecast.distance||a.candidate.orders.length-c.candidate.orders.length)[0];
 if(escape&&(escape.forecast.distance>coast+1||!escape.candidate.ids.length&&coast>currentDistance+1)){
  plans.push({id:'break-away',title:'Break away',description:`${escape.candidate.ids.length?'Favor separation':'Hold your current escape course'}: about ${Math.round(escape.forecast.distance)} distance if the enemy holds course. Escape is not assured.`,ids:escape.candidate.ids});
 }

 const repairs=damageControl(b,valid);if(repairs)plans.push(repairs);

 let boarding:Candidate|undefined;
 for(const {candidate,forecast} of forecasts){
  if(forecast.lastDistance>=100)continue;
  const grapple=valid([...candidate.ids,'grapple']);
  if(!grapple||!project(b,grapple.orders).grappleReady)continue;
  if(!boarding||grapple.orders.at(-1)!.end<boarding.orders.at(-1)!.end)boarding=grapple;
 }
 if(boarding)plans.push({id:'boarding',title:'Boarding approach',description:'Match close-range geometry and attempt a grapple; enemy maneuvers or the grapple roll can defeat it.',ids:boarding.ids});
 else{
  const approach=forecasts.filter(c=>c.forecast.distance<100&&c.forecast.distance<currentDistance-5).sort((a,c)=>a.forecast.distance-c.forecast.distance)[0];
  if(approach)plans.push({id:'boarding',title:'Boarding approach',description:`Close to about ${Math.round(approach.forecast.distance)} distance if the enemy holds course; no grapple queued, and close range exposes your ship.`,ids:approach.candidate.ids});
 }
 return plans;
}
