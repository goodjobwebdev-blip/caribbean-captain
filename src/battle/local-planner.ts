import {BATTERIES,shipDefinition} from '../ships';
import {legalBoarding} from './boarding';
import {arc,coursePreview,distance,norm,orderCatalogue,replaceOrder,schedule,speed,validateOrder} from './naval';
import {validateDecision} from './planner';
import {clamp,crew,type Ammo,type Battle,type Combatant,type Decision,type Npc,type Order} from './types';

/** Only these observations may influence the local opponent or its cache key. */
function observe(b:Battle){
 const own=structuredClone(b.ships[b.npcId]),seen=b.ships[b.playerId];
 const spec=shipDefinition(seen.ship.configurationId);
 const obscured=b.deception?.[b.playerId]?.window===b.window;
 const step=obscured?.2:.05;
 const estimate=(n:number,size:number)=>n===0?0:Math.max(1,Math.round(n/Math.max(1,size*step))*Math.max(1,size*step));
 // Enemy cargo, skills, battery loads, crew quality, and unannounced orders are deliberately absent.
 const enemy:Combatant={
  ship:{id:b.playerId,name:'Observed opponent',configurationId:seen.ship.configurationId,
   hullPoints:estimate(seen.ship.hullPoints,spec.maxHull),sailCondition:estimate(seen.ship.sailCondition,100),
   cannons:{...seen.ship.cannons},sailType:seen.ship.sailType,reinforcedHull:seen.ship.reinforcedHull},
  crew:crew(estimate(seen.crew.fit,Math.max(10,spec.optimalCrew))),captain:{...seen.captain},
  skills:{},cargo:{},x:seen.x,y:seen.y,heading:seen.heading,sails:seen.sails,states:{...seen.states},
  batteries:Object.fromEntries(BATTERIES.map(k=>[k,{loaded:0,ammo:null,power:1}])) as Combatant['batteries'],
  startHull:spec.maxHull,startSails:100,startFit:spec.optimalCrew,provisions:0,freight:0,passengers:0
 };
 const replacement=!!b.replacement?.includes(b.npcId);
 return {own,enemy,npc:{role:b.npc.role,temperament:b.npc.temperament,level:b.npc.level},
  playerId:b.playerId,npcId:b.npcId,phase:b.phase,window:b.window,unit:b.unit,
  wind:b.wind,windStrength:b.windStrength,hazards:structuredClone(b.hazards),difficulty:b.difficulty,
  round:b.round,rounds:b.rounds,control:b.control,attacker:b.attacker,
  duel:b.phase==='duel'&&b.duel?{...b.duel,demandedAt:[...b.duel.demandedAt]}:undefined,
  declaredAttack:b.phase==='duel'&&b.duel?.initiative===b.playerId?b.committed?.[0]:undefined,
  replacement,tail:replacement?structuredClone(b.plans[b.npcId]??[]):[],
  preloaded:b.preloaded.filter(id=>id.startsWith(`${b.npcId}:`)),obscured};
}
type Observation=ReturnType<typeof observe>;

/** Stable across commitment, reveal, resume, and changes to private player information. */
export function localDecisionKey(b:Battle):string{return JSON.stringify(observe(b));}

/** Engine helpers receive a fresh allowlisted view, never the original Battle. */
function engineView(o:Observation):Battle{
 const npc:Npc={...o.npc,faction:'Pirates',origin:'bridgetown',departed:0,perceivedStrength:0,
  ship:o.own.ship,crew:o.own.crew,market:{hour:0,tier:1,goods:{} as Npc['market']['goods']}};
 return {id:'local-observation',phase:o.phase,playerId:o.playerId,npcId:o.npcId,
  ships:{[o.npcId]:o.own,[o.playerId]:o.enemy},npc,window:o.window,unit:o.unit,
  wind:o.wind,windStrength:o.windStrength,hazards:o.hazards,difficulty:o.difficulty,
  round:o.round,rounds:o.rounds,control:o.control,attacker:o.attacker,duel:o.duel,
  plans:o.replacement?{[o.npcId]:o.tail}:{},replacement:o.replacement?[o.npcId]:undefined,
  committed:o.declaredAttack?[o.declaredAttack]:undefined,preloaded:o.preloaded,
  decisionKey:0,status:o.replacement?'replacement':'planning',log:[],rolls:[]};
}

type Tactics={escape:boolean;capture:boolean;board:boolean;cautious:boolean;aggressive:boolean;goal:number;objective:string};
function tactics(b:Battle):Tactics{
 const own=b.ships[b.npcId],enemy=b.ships[b.playerId],{role,temperament}=b.npc;
 const cautious=temperament==='Cautious',aggressive=temperament==='Aggressive'||temperament==='Fanatical';
 const civilian=['Merchant','Local','Courier'].includes(role),hull=own.ship.hullPoints/shipDefinition(own.ship.configurationId).maxHull;
 const capture=['Pirate','Privateer','Bounty Hunter'].includes(role);
 const armed=BATTERIES.some(k=>own.ship.cannons[k]>0&&(own.batteries[k].loaded>0
  ||(own.cargo.gunpowder??0)>=own.ship.cannons[k]&&(['round-shot','chain-shot','grapeshot','bombs'] as Ammo[]).some(a=>(own.cargo[a]??0)>=own.ship.cannons[k])));
 const board=capture||aggressive||!armed;
 const escape=temperament!=='Fanatical'&&(civilian||!armed&&own.crew.fit<enemy.crew.fit*.8||(cautious&&(hull<.35||own.crew.fit<enemy.crew.fit*.45)));
 const goal=escape?1300:!armed?15:capture?(enemy.ship.sailCondition<35||distance(own,enemy)<110?15:120):aggressive?120:cautious?380:240;
 const objectives:Record<Npc['role'],string>={Merchant:'Escape with the cargo',Local:'Keep the crew alive and disengage',Courier:'Carry the dispatches safely away',Navy:'Disable the hostile ship',Privateer:'Take a serviceable prize',Pirate:'Disable and board the prize','Bounty Hunter':'Capture the opposing captain alive'};
 return {escape,capture,board,cautious,aggressive,goal,objective:escape&&!civilian?'Disengage and preserve the crew':civilian&&!escape?'Defend the vessel at all costs':objectives[role]};
}
function shouldSurrender(b:Battle,t:Tactics):boolean{
 const s=b.ships[b.npcId],enemy=b.ships[b.playerId];
 if(b.npc.temperament==='Fanatical'&&s.crew.fit>0)return false;
 if(!s.crew.fit)return true;
 const hull=s.ship.hullPoints/shipDefinition(s.ship.configurationId).maxHull,ratio=s.crew.fit/Math.max(1,enemy.crew.fit);
 if(b.phase==='duel')return s.captain.injury>=(t.cautious?3:4)&&enemy.captain.injury<=2;
 if(b.phase==='deck')return ratio<(t.cautious?.3:.16)&&(s.crew.morale<45||s.crew.fit<s.startFit*.3);
 return hull<.1&&(s.states.fire>0||s.states.flooding>0||distance(s,enemy)<300)
  ||t.cautious&&ratio<.25&&s.crew.fit<s.startFit*.4&&distance(s,enemy)<200;
}
function boardingAction(b:Battle,t:Tactics):string{
 const own=b.ships[b.npcId],enemy=b.ships[b.playerId],ratio=own.crew.fit/Math.max(1,enemy.crew.fit);
 if(b.phase==='deck'){
  if(b.control<0&&(t.cautious||t.escape||b.round===b.rounds))return 'guard';
  if((t.aggressive||t.capture&&ratio>1.4)&&ratio>=.8&&b.control>=0)return 'breakthrough';
  if(t.escape||t.cautious&&ratio<1.2||ratio<.65)return 'guard';
  return 'assault';
 }
 if(b.duel!.initiative===b.npcId){
  if(own.captain.pistol&&b.npc.temperament!=='Honorable'&&(t.aggressive||own.captain.injury>=2||(own.skills.shooting??0)>(own.skills[own.captain.weapon]??0)))return 'pistol';
  if(own.captain.injury>=3||own.captain.fatigue>=3||t.cautious)return 'quick';
  if(t.aggressive&&enemy.captain.injury<=2&&b.npc.role!=='Bounty Hunter')return 'heavy';
  return 'standard';
 }
 // Reading the declared attack here is legal: the player has already announced it.
 const declared=b.committed?.[0];
 if(declared==='pistol')return 'dodge';
 if(declared==='heavy')return t.cautious||own.captain.injury>=3?'dodge':'block';
 if(t.escape&&own.captain.injury>=2)return 'dodge';
 return 'parry';
}

const ammoLimit=(ammo:Ammo)=>ammo==='round-shot'?1000:ammo==='chain-shot'?599:ammo==='bombs'?299:99;
function ammunition(s:Combatant,t:Tactics,d:number):Ammo[]{
 const preferred:Ammo[]=t.capture||t.escape?d<100?['grapeshot','chain-shot','round-shot']:d<600?['chain-shot','round-shot']:['round-shot']
  :t.aggressive&&d>30&&d<300?['bombs','round-shot','chain-shot']:['round-shot','chain-shot'];
 return [...preferred,...(['round-shot','chain-shot','grapeshot','bombs'] as Ammo[]).filter(a=>!preferred.includes(a))]
  .filter(a=>(s.cargo[a]??0)>0);
}
type Course={s:Combatant;e:Combatant;unit:number;ids:string[];value:number;services:Record<string,number>};
function copyCourse(c:Course):Course{return {...c,s:structuredClone(c.s),e:{...c.e},ids:[...c.ids],services:{...c.services}};}
function courseBattle(b:Battle,c:Course):Battle{return {...b,ships:{[b.npcId]:c.s,[b.playerId]:c.e}};}
function move(b:Battle,c:Course,units:number){
 const view=courseBattle(b,c);
 for(const ship of [c.s,c.e]){const amount=speed(ship,view)*.25*units;ship.x+=Math.cos(ship.heading*Math.PI/180)*amount;ship.y+=Math.sin(ship.heading*Math.PI/180)*amount;}
 c.unit+=units;
}
function canFire(s:Combatant,e:Combatant,o:Order){
 const gun=s.batteries[o.battery!],d=distance(s,e);
 return gun.loaded>0&&gun.ammo!==null&&arc(s,e)===o.battery&&d<=ammoLimit(gun.ammo)
  &&!(gun.ammo==='bombs'&&d<=25);
}
function grappleReady(b:Battle,c:Course){
 const v=courseBattle(b,c),a=speed(c.s,v),e=speed(c.e,v);
 return distance(c.s,c.e)<=25&&Math.hypot(a*Math.cos(c.s.heading*Math.PI/180)-e*Math.cos(c.e.heading*Math.PI/180),a*Math.sin(c.s.heading*Math.PI/180)-e*Math.sin(c.e.heading*Math.PI/180))*250<=50;
}
function append(b:Battle,c:Course,id:string):Course|undefined{
 const o=orderCatalogue(courseBattle(b,c),b.npcId).find(o=>o.id===id);
 if(!o||c.ids.length>=20||c.unit+o.cost>1000||validateOrder(c.s,o).length)return;
 if(o.kind==='preload'&&(c.unit!==0||b.preloaded.includes(`${b.npcId}:${o.battery}`)||c.ids.some(id=>id.startsWith(`preload_${o.battery}_`))))return;
 if(o.kind==='fire'&&!canFire(c.s,c.e,o)||o.kind==='grapple'&&distance(c.s,c.e)>=100)return;
 const next=copyCourse(c);move(b,next,o.cost);
 if(o.kind==='fire'&&!canFire(next.s,next.e,o)||o.kind==='grapple'&&!grappleReady(b,next))return;
 next.ids.push(id);
 if(o.kind==='turn')next.s.heading=norm(next.s.heading+o.angle!);
 if(o.kind==='sails')next.s.sails=o.setting!;
 if(o.kind==='reload'||o.kind==='preload')next.s.batteries[o.battery!]={loaded:next.s.ship.cannons[o.battery!],ammo:o.ammo!,power:1};
 if(o.kind==='fire'||o.kind==='unload'){
  const gun=next.s.batteries[o.battery!];
  if(o.kind==='unload'){next.s.cargo[gun.ammo!]=(next.s.cargo[gun.ammo!]??0)+gun.loaded;next.s.cargo.gunpowder=(next.s.cargo.gunpowder??0)+gun.loaded;}
  gun.loaded=0;gun.ammo=null;
 }
 for(const [resource,n] of Object.entries(o.resources))next.s.cargo[resource]=(next.s.cargo[resource]??0)-n;
 next.services[o.kind]=(next.services[o.kind]??0)+1;
 return next;
}
function serviceValue(b:Battle,c:Course,o:Order,t:Tactics){
 const s=c.s,count=c.services[o.kind]??0,remaining=1000-c.unit;
 if(o.kind==='extinguish')return count<s.states.fire?36+s.states.fire*10:0;
 if(o.kind==='flooding')return count<s.states.flooding?29+s.states.flooding*9:0;
 if(o.kind==='rally')return count<s.states.shock?12+s.states.shock*5:0;
 if(o.kind==='patch')return count<1&&s.ship.hullPoints<Math.min(s.startHull,shipDefinition(s.ship.configurationId).maxHull*.7)?(t.cautious?23:14):0;
 if(o.kind==='repair')return count<1&&s.ship.sailCondition<Math.min(s.startSails,65)?(t.escape?28:16):0;
 if(o.kind==='doctor')return count<1&&s.crew.injured>0&&s.crew.fit<s.startFit*.65?15:0;
 if(o.kind==='deceive')return count===0&&remaining<400&&b.window%3===0&&b.npc.temperament!=='Honorable'?3:0;
 return 0;
}
function shotValue(c:Course,o:Order,t:Tactics){
 const gun=c.s.batteries[o.battery!],d=distance(c.s,c.e),rangeFactor=d<100?1.2:d<300?1:d<600?.7:.4;
 const purpose=gun.ammo==='chain-shot'?(t.capture||t.escape?1.2:.65)*(c.e.ship.sailCondition<15?.25:1)
  :gun.ammo==='grapeshot'?(t.capture?1.4:1):gun.ammo==='bombs'?(t.capture?.6:1.5):1;
 return (16+Math.min(30,gun.loaded*3))*rangeFactor*purpose;
}
function fill(b:Battle,initial:Course,t:Tactics):Course{
 let c=initial;
 // A fixed small horizon keeps even large ships and low-cost legendary crews bounded.
 const planningLevel=clamp(b.npc.level+({Easy:-4,Normal:0,Hard:4}[b.difficulty]),1,20);
 const horizon=3+Math.floor(planningLevel/5);
 for(let i=0;i<horizon&&c.ids.length<20;i++){
  let best:Course|undefined,bestValue=0;
  const orders=orderCatalogue(courseBattle(b,c),b.npcId);
  for(const o of orders){
   if(o.target&&o.target!==b.playerId||['turn','sails','preload','unload','dump'].includes(o.kind))continue;
   let value=serviceValue(b,c,o,t),next:Course|undefined;
   if(o.kind==='fire')value=shotValue(c,o,t);
   if(o.kind==='grapple')value=!t.escape&&t.board&&c.s.crew.fit>=c.e.crew.fit*(t.aggressive?.65:.9)?100:0;
   if(o.kind==='reload'){
    if(c.s.batteries[o.battery!].loaded||!o.ammo)continue;
    next=append(b,c,o.id);if(!next)continue;
    const fire=append(b,next,`fire_${o.battery}`);
    if(fire){const preferred=ammunition(c.s,t,distance(c.s,c.e));value=shotValue(next,{...o,kind:'fire'},t)*(o.ammo===preferred[0]?1:.8);next=fire;}
    else if(c.unit<450&&o.ammo===ammunition(c.s,t,distance(c.s,c.e))[0])value=4;
   }
   if(value<=0)continue;
   next??=append(b,c,o.id);if(!next)continue;
   // Prefer useful effects per time, while allowing a loaded volley to beat a small repair.
   const score=value/(1+(next.unit-c.unit)/700);
   if(score>bestValue){bestValue=score;best=next;best.value=c.value+value;}
  }
  if(!best)break;c=best;
  if(c.ids.at(-1)==='grapple')break;
 }
 return c;
}
function courseScore(b:Battle,c:Course,t:Tactics,baseline:number){
 const end=copyCourse(c);move(b,end,1000-c.unit);
 const d=distance(end.s,end.e),start=distance(b.ships[b.npcId],b.ships[b.playerId]);
 const progress=t.escape?(d-baseline)*.16:(Math.abs(baseline-t.goal)-Math.abs(d-t.goal))*.11;
 const separation=!t.escape&&d>1000?-80:t.escape&&d>1000?100:0;
 const bearing=arc(end.s,end.e),ready=end.s.batteries[bearing];
 const opportunity=!t.escape&&ready.loaded&&ready.ammo&&d<=ammoLimit(ready.ammo)?8:0;
 const risk=b.hazards.reduce((sum,h)=>sum+(h.armed&&Math.hypot(end.s.x-h.x,end.s.y-h.y)<70?50:0),0);
 // Escape captains value movement more than a broadside, so they do not circle forever to fire.
 return c.value*(t.escape?.4:1)+progress+separation+opportunity-risk-c.ids.filter(id=>id.startsWith('turn_')).length*3
  +(!t.escape&&d<start&&start>600?8:0);
}
function navalActions(b:Battle,t:Tactics):string[]{
 const s=b.ships[b.npcId],e=b.ships[b.playerId];
 let base:Course={s:structuredClone(s),e:structuredClone(e),unit:0,ids:[],value:0,services:{}};
 // Preload before any timed action; every reservation uses the actual remaining cargo.
 for(const battery of [...BATTERIES].sort((a,z)=>s.ship.cannons[z]-s.ship.cannons[a])){
  if(s.batteries[battery].loaded)continue;
  for(const ammo of ammunition(base.s,t,distance(s,e))){const next=append(b,base,`preload_${battery}_${ammo}`);if(next){base=next;break;}}
 }
 // Urgent damage control must not lose to a promising broadside's short-term score.
 for(const id of ['extinguish','control-flooding']){
  const severity=id==='extinguish'?s.states.fire:s.states.flooding;
  if(severity>=2){const next=append(b,base,id);if(next){base=next;base.value+=45;}}
 }
 const forecast=coursePreview(b,b.npcId,[]);
 const options:string[][]=[[]];
 for(const turn of [-90,90,-45,45,-135,135,180])if(s.sails>0)options.push([`turn_${turn}`]);
 for(const sail of [0,1,2])if(sail!==s.sails){
  options.push([`sails_${sail}`]);
  if(sail>0&&(s.sails===0||sail===2&&t.escape))for(const turn of [-90,90,-45,45,180])options.push([`sails_${sail}`,`turn_${turn}`]);
 }
 let best=base,bestScore=-Infinity;
 for(const navigation of options){
  let candidate:Course|undefined=base;
  for(const id of navigation){candidate=append(b,candidate,id);if(!candidate)break;}
  if(!candidate)continue;
  candidate=fill(b,candidate,t);
  const score=courseScore(b,candidate,t,forecast.distance);
  if(score>bestScore){best=candidate;bestScore=score;}
 }
 // Final authoritative reservation catches any engine change without mutating the live game.
 const ids=[...best.ids];
 while(ids.length){try{schedule(b,b.npcId,ids);return ids;}catch{ids.pop();}}
 return [];
}
function replacementAction(b:Battle,t:Tactics):string{
 const own=b.ships[b.npcId],enemy=b.ships[b.playerId];
 const course:Course={s:structuredClone(own),e:structuredClone(enemy),unit:b.unit,ids:[],value:0,services:{}};
 let best:string|undefined,score=-Infinity;
 for(const o of orderCatalogue(b,b.npcId)){
  if(o.kind==='preload'||o.target&&o.target!==b.playerId)continue;
  const next=append(b,course,o.id);if(!next)continue;
  try{replaceOrder(structuredClone(b),b.npcId,o.id);}catch{continue;}
  let value=serviceValue(b,course,o,t);
  if(o.kind==='fire')value+=shotValue(course,o,t);
  if(o.kind==='grapple')value+=!t.escape&&own.crew.fit>=enemy.crew.fit*.8?100:-50;
  if(o.kind==='reload')value+=8+(o.ammo===ammunition(own,t,distance(own,enemy))[0]?6:0);
  if(o.kind==='turn'||o.kind==='sails')value+=courseScore(b,next,t,distance(own,enemy));
  if(o.kind==='unload')value-=5;
  if(value>score){best=o.id;score=value;}
 }
 if(best)return best;
 return 'cancel-remaining-orders';
}

/** Offline, deterministic, and side-effect free: the engine still owns all costs and outcomes. */
export function localBattleDecision(b:Battle):Decision{
 const observed=observe(b),view=engineView(observed),t=tactics(view);
 if(view.phase!=='naval'&&view.phase!=='deck'&&view.phase!=='duel')throw Error('No tactical decision is needed after combat.');
 const surrender=shouldSurrender(view,t);
 const actions=surrender?['surrender']:view.phase==='naval'?observed.replacement?[replacementAction(view,t)]:navalActions(view,t):[boardingAction(view,t)];
 const result:Decision={assessment:[`${view.npc.role} captain, ${view.npc.temperament.toLowerCase()} temperament.`,
  observed.obscured?'The enemy course is visible; preparations remain uncertain.':view.phase==='naval'?`Visible separation: ${Math.round(distance(observed.own,observed.enemy))} metres.`:`Deck control: ${view.control}.`],
  objective:actions[0]==='surrender'?'Preserve surviving lives':t.objective,risk:t.cautious?'low':t.aggressive?'high':'moderate',
  intent:actions[0]==='surrender'?'Strike the colours before further losses.':view.phase==='naval'?t.escape?'Open the distance while covering the retreat.':t.capture?'Control the range, disable the target, and look for a boarding opportunity.':'Bring working batteries to bear and keep the ship fighting.':view.phase==='deck'?'Fight for control while protecting the crew.':'Respond to the visible opening and preserve the captain.',
  action_ids:actions};
 // Also verifies pistol-only defenses and the fanatical surrender rule.
 if(view.phase!=='naval'&&!legalBoarding(view,view.npcId).includes(actions[0]))throw Error('No legal boarding decision.');
 return validateDecision(view,result);
}
