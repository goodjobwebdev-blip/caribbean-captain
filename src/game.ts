import {ALL_GOODS,type GoodId} from './goods';
import {ensureEconomy,observeMarket,consumeLots,settleBasket,type Economy,type BasketLine} from './trade';
import {cargoSpaceUsed,shipPerformance,loadBreakdown,sailingProblems,PERSON_WEIGHT,FREIGHT_WEIGHT,CANNON_WEIGHT} from './performance';
import {resolveShip,createShip,shipDefinition,shipSaleValue,hullRepairQuote,sailRepairQuote,cannonReplacementQuote,BATTERIES,STARTER_ID,type OwnedShip} from './ships';
import {initialSkills,sailingProgress,creditSailing,creditSailingPoints,type PlayerSkills} from './skills';
export const PORTS = [
  { id: 'bridgetown', name: 'Bridgetown', island: 'Barbados', nation: 'England', x: 0, y: 0, prices: { sugar: 8, rum: 16, cloth: 22 }, description: 'Sunlight falls across the quays. Barrels roll toward waiting ships, and the harbour bell marks another hour of business.' },
  { id: 'saint-pierre', name: 'Saint-Pierre', island: 'Martinique', nation: 'France', x: -29, y: 50, prices: { sugar: 12, rum: 10, cloth: 25 }, description: 'Green slopes rise behind the waterfront. Boatmen call across the roadstead while merchants inspect the morning cargo.' },
  { id: 'willemstad', name: 'Willemstad', island: 'Curaçao', nation: 'Dutch', x: -285, y: -25, prices: { sugar: 17, rum: 20, cloth: 14 }, description: 'A sheltered harbour opens between busy quays. Cargo from distant shores changes hands beneath the fort’s watchful guns.' },
] as const;
export type PortId = typeof PORTS[number]['id'];
export type Good = Exclude<GoodId,'provisions'>;
export const GOODS: Good[] = ALL_GOODS.filter((id):id is Good=>id!=='provisions');
// Fixed baseline is retained only for contract pricing and legacy callers.
export const SHIP = {...shipDefinition(STARTER_ID),name:'The Wayfarer',type:'Universal Sloop'};
export type Contract = { id: string; type: 'Freight' | 'Letter' | 'Passengers'; from: PortId; to: PortId; reward: number; sailingReward?: number; amount: number };
export type Dice = [number, number];
export type Voyage = { to: PortId; hours: number; remaining: number; departureSpeed?:number; weather: string; dice: Dice };
export type Game = { version: 1 | 2; ship?:OwnedShip; captain: string; skills?: PlayerSkills; port: PortId; hours: number; silver: number; provisions: number; crew: number; condition?: number; economy?:Economy; cargo: Record<string, number>; contracts: Contract[]; archive?: (Contract & {completedAt:number})[]; accepted: string[]; log: { hours: number; text: string }[]; seed: number; voyage: Voyage | null; failed: string | null; lastRoll: { label: string; dice: Dice; outcome: string } | null };
export type Action = {type:'trade';lines:BasketLine[];expected:string} | { type: 'buy' | 'sell'; good: Good | 'provisions'; quantity: number } | { type: 'hire' | 'dismiss' | 'sleep' | 'repair' | 'repair-sails' | 'replace-cannons' | 'deliver' } | {type:'buy-ship';configurationId:string} | { type: 'accept'; contract: Contract } | { type: 'sail'; to: PortId } | { type: 'encounter'; choice: 'flee' | 'negotiate' | 'fight' };
export const port = (id: PortId) => PORTS.find(p => p.id === id)!;
export const distance = (a: PortId, b: PortId) => Math.hypot(port(a).x - port(b).x, port(a).y - port(b).y);
export const letterReward = (from:PortId,to:PortId) => Math.ceil(distance(from,to)/100);
export const questSkillReward = (c:Contract) => c.sailingReward ?? (c.type==='Letter'?letterReward(c.from,c.to):0);
export const sailingBonus = (g?:Pick<Game,'skills'>) => sailingProgress(g?.skills).tier * 0.05;
export const effectiveSpeed = (g?:Game) => g?shipPerformance(g).speed:SHIP.speed;
// Omit the captain only for fixed contract pricing at baseline speed.
export const hoursTo = (a: PortId, b: PortId, g?:Game) => effectiveSpeed(g)>0?Math.ceil(distance(a, b) / effectiveSpeed(g)):Infinity;
export const cargoUsed = cargoSpaceUsed;
export const passengers = (g: Game) => g.contracts.filter(c => c.type === 'Passengers').reduce((a,c) => a+c.amount,0);
/** Old records are upgraded lazily; stored checkpoints are never overwritten. */
export const ownedShip=(g:Game)=>resolveShip(g);
export const currentShip=(g:Game)=>shipDefinition(ownedShip(g).configurationId);
export const hullPercent=(g:Game)=>100*ownedShip(g).hullPoints/currentShip(g).maxHull;
export function normalizeGame(original:Game):Game {
 if(original.version!==1&&original.version!==2)throw new Error('Unsupported captain save version.');
 const g=structuredClone(original);g.ship=ownedShip(g);g.version=2;delete g.condition;ensureEconomy(g);return g;
}
export function shipPurchaseQuote(g:Game,configurationId:string){
 const target=shipDefinition(configurationId),sale=shipSaleValue(ownedShip(g)),balance=target.price-sale;
 const offeredShip=createShip(target.id,undefined,'preview');
 const offeredPerformance=shipPerformance(g,offeredShip);
 const problems:string[]=[];
 if(offeredPerformance.overloaded)problems.push(`The offered ship would be overloaded by ${(-offeredPerformance.availableDeadweight).toFixed(1)} weight units. Reduce cargo before exchanging ships.`);
 if(g.failed)problems.push('Load a church checkpoint to continue.');
 if(g.voyage)problems.push('Resolve the encounter before visiting a shipyard.');
 if(target.id===currentShip(g).id)problems.push('You already command this configuration.');
 if(cargoUsed(g)>target.capacity+1e-8)problems.push(`Reduce your hold load to ${target.capacity} units before exchanging ships.`);
 if(g.crew>target.maxCrew)problems.push(`Release crew at the tavern until no more than ${target.maxCrew} remain.`);
 if(g.crew<target.minCrew)problems.push(`Hire at least ${target.minCrew} sailors before taking command.`);
 if(passengers(g)>target.passengerCapacity)problems.push(`Deliver passengers first: this ship has ${target.passengerCapacity} berths.`);
 if(g.silver-balance<0)problems.push('Not enough silver for the exchange.');
 return {target,sale,balance,problems,offeredPerformance};
}
export const foodFor = (g: Game, hours: number) => (g.crew + passengers(g)) * hours / 24;
export const wageFor = (g: Game, hours: number) => g.crew * 2 * hours / 24;
export const cash = (n: number) => Math.floor(n).toLocaleString('en');
export function date(hours: number) { const day = Math.floor(hours / 24); const months = ['January','February','March','April','May','June','July','August','September','October','November','December']; return `${day % 30 + 1} ${months[Math.floor(day / 30) % 12]}, Year ${Math.floor(day / 360) + 1} · ${String(hours % 24).padStart(2,'0')}:00`; }
export function duration(hours: number) { if(!Number.isFinite(hours))return 'Unavailable'; return `${Math.floor(hours / 24)}d ${hours % 24}h`; }
export function newGame(captain: string, seed = crypto.getRandomValues(new Uint32Array(1))[0]): Game { const game:Game = { version:2, ship:createShip(STARTER_ID,'The Wayfarer'), skills:initialSkills(), captain:captain.trim().slice(0,40) || 'Captain', port:'bridgetown', hours:8, silver:800, provisions:120, crew:10, cargo:{sugar:0,rum:0,cloth:0},contracts:[],archive:[],accepted:[],log:[{hours:8,text:'Your command begins in Bridgetown. Visit the church to make your first checkpoint before sailing.'}],seed, voyage:null,failed:null,lastRoll:null }; ensureEconomy(game); return game; }
function note(g:Game,text:string) { g.log.unshift({hours:g.hours,text}); g.log = g.log.slice(0,60); }
function advance(g:Game,hours:number) {
  const food = foodFor(g,hours);
  if (food > g.provisions + 1e-8) {
    const available = Math.floor(g.provisions * 24 / (g.crew + passengers(g)));
    g.silver -= wageFor(g,available); g.hours += available; consumeLots(g,'provisions',g.provisions); g.provisions=0;
    g.failed='Your provisions ran out. The voyage is over. Return to a church checkpoint.';
    note(g,g.failed); return false;
  }
  consumeLots(g,'provisions',food); g.provisions=Math.max(0,g.provisions-food); g.silver-=wageFor(g,hours); g.hours+=hours; return true;
}
export const FREIGHT_SIZES=[40,200,800] as const;
export function offers(g:Game):Contract[] {
 return PORTS.filter(p=>p.id!==g.port).flatMap(p=>{
  const d=distance(g.port,p.id);
  const base=(type:Contract['type'],amount:number):Contract=>({
   id:`${g.port}:${p.id}:${Math.floor(g.hours/24)}:${type}${type==='Freight'&&amount!==40?`:${amount}`:''}`,
   type,from:g.port,to:p.id,sailingReward:type==='Letter'?letterReward(g.port,p.id):0,
   reward:Math.round(type==='Letter'?20+d*1.04:type==='Freight'?20+d*amount*.0432:30+d*amount*.69),amount,
  });
  // Keep original offer IDs and ordering for saved commissions.
  return [base('Letter',0),base('Freight',40),base('Passengers',3),...FREIGHT_SIZES.filter(n=>n!==40).map(n=>base('Freight',n))];
 }).filter(c=>!g.accepted.includes(c.id));
}
export function contractProblems(g:Game,c:Contract):string[]{
 const spec=currentShip(g),problems:string[]=[];
 if(g.contracts.length>=3)problems.push('You can carry up to three active contracts.');
 if(c.type==='Freight'&&cargoUsed(g)+c.amount>spec.capacity+1e-8)problems.push(`This freight needs ${c.amount} free hold units.`);
 if(c.type==='Passengers'&&passengers(g)+c.amount>spec.passengerCapacity)problems.push(`There are only ${spec.passengerCapacity} passenger berths.`);
 const addedWeight=c.type==='Freight'?c.amount*FREIGHT_WEIGHT:c.type==='Passengers'?c.amount*PERSON_WEIGHT:0;
 if(addedWeight>0&&loadBreakdown(g).total+addedWeight>spec.deadweight+1e-8)problems.push(`This contract needs ${addedWeight} available weight units.`);
 return problems;
}
export function canSave(g:Game) { return !g.failed && !g.voyage; }
export function outcome(total:number) { return total<=6?'Setback':total<=9?'Partial success':'Success'; }
export function act(original:Game, action:Action, randomOverride?:()=>number):Game {
  if (original.failed) throw new Error('Load a church checkpoint to continue.');
  if (original.voyage && action.type!=='encounter') throw new Error('Resolve the pirate encounter first.');
  const g=normalizeGame(original);
  const spec=currentShip(g),ship=g.ship!;
  const damageHull=(percent:number)=>{ship.hullPoints=Math.max(0,ship.hullPoints-spec.maxHull*percent/100);};
  const random=()=>{ if(randomOverride) return randomOverride(); g.seed=(g.seed+0x6D2B79F5)>>>0; let t=g.seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
  const roll=():Dice=>[Math.floor(random()*6)+1,Math.floor(random()*6)+1];
  const allowWeight=(added:number)=>{if(loadBreakdown(g).total+added>spec.deadweight+1e-8)throw new Error('Not enough available deadweight. Sell cargo or reduce your load first.');};
  const pay=(cost:number)=>{if(g.silver<cost)throw new Error('Not enough silver.');g.silver-=cost;};
  const arrive=()=>{const v=g.voyage!; if(advance(g,v.remaining)){g.port=v.to;g.voyage=null;
    const practice=creditSailing(g.skills,v.hours);g.skills=practice.skills;
    if(practice.earned)note(g,`Sailing practice: +${practice.earned} point(s) for ${v.hours} hours at sea.${practice.tiers?` Mastery increased to tier ${g.skills.sailing.tier}.`:''}`);
    note(g,`Arrived at ${port(g.port).name}. Visit the Harbour Master to collect completed contract payments.`);}};
  switch(action.type) {
    case 'trade': case 'buy': case 'sell': {
      const lines=action.type==='trade'?action.lines:[{good:action.good,side:action.type,quantity:action.quantity}];
      // Verify against the original state before lazy migration changes its representation.
      if(action.type==='trade'&&action.expected!==JSON.stringify([original,lines]))throw new Error('The deal changed. Review the updated basket.');
      const q=settleBasket(g,lines);advance(g,1);
      note(g,`Trade deal: paid ${q.buys}, received ${q.sales} silver. ${q.lines.length} cargo line(s).${q.xp?` +${q.xp.toFixed(2)} Trade points.`:''}`);break;
    }
    case 'hire':if(g.crew>=spec.maxCrew)throw new Error('Your crew is already full.');allowWeight(PERSON_WEIGHT);pay(25);g.crew++;advance(g,1);note(g,'One sailor joined your crew for 25 silver.');break;
    case 'sleep':pay(8);if(advance(g,8))note(g,'You rested at the tavern for eight hours.');break;
    case 'dismiss':if(g.crew<=spec.minCrew)throw new Error(`Keep at least ${spec.minCrew} sailors to operate this ship.`);g.crew--;advance(g,1);note(g,'One sailor left your crew at the tavern.');break;
    case 'repair':{
      const cost=hullRepairQuote(ship);if(!cost)throw new Error('Your hull needs no repairs.');
      pay(cost);if(advance(g,Math.ceil((spec.maxHull-ship.hullPoints)/5))){ship.hullPoints=spec.maxHull;note(g,`The shipyard repaired ${ship.name}'s hull for ${cost} silver.`);}break;
    }
    case 'repair-sails':{
      const cost=sailRepairQuote(ship);if(!cost)throw new Error('Your sails need no repairs.');
      pay(cost);if(advance(g,Math.ceil((100-ship.sailCondition)/5))){ship.sailCondition=100;note(g,`Sails repaired for ${cost} silver.`);}break;
    }
    case 'replace-cannons':{
      const cost=cannonReplacementQuote(ship);if(!cost)throw new Error('No default cannons need replacing.');
      const missing=BATTERIES.reduce((n,b)=>n+Math.max(0,spec.defaultCannons[b]-ship.cannons[b]),0);
      allowWeight(missing*CANNON_WEIGHT);pay(cost);if(advance(g,missing)){for(const b of BATTERIES)ship.cannons[b]=Math.max(ship.cannons[b],spec.defaultCannons[b]);note(g,`Replaced ${missing} cannons for ${cost} silver.`);}break;
    }
    case 'buy-ship':{
      const quote=shipPurchaseQuote(g,action.configurationId);
      if(quote.problems.length)throw new Error(quote.problems.join(' '));
      g.silver-=quote.balance;
      g.ship=createShip(quote.target.id,undefined,`ship-${g.seed}-${g.hours}-${quote.target.id}`);
      note(g,`Sold ${ship.name} for ${quote.sale} silver and bought ${quote.target.label} for ${quote.target.price} silver. ${quote.balance>=0?`Paid ${quote.balance}`:`Received ${-quote.balance}`} silver in the exchange.`);
      break;
    }
    case 'accept': {
      const c=offers(g).find(c=>c.id===action.contract.id);if(!c)throw new Error('That offer is no longer available.');
      const problems=contractProblems(g,c);if(problems.length)throw new Error(problems.join(' '));
      g.contracts.push(c);g.accepted.push(c.id);advance(g,1);note(g,`Accepted ${c.type.toLowerCase()} to ${port(c.to).name}: ${c.reward} silver on delivery.`);break;
    }
    case 'deliver':{const delivered=g.contracts.filter(c=>c.to===g.port);if(!delivered.length)throw new Error('No contracts to deliver at this port.');const reward=delivered.reduce((a,c)=>a+c.reward,0);const skillReward=delivered.reduce((a,c)=>a+questSkillReward(c),0);const learning=creditSailingPoints(g.skills,skillReward);g.skills=learning.skills;g.silver+=reward;g.archive=[...delivered.map(c=>({...c,sailingReward:questSkillReward(c),completedAt:g.hours+1})),...(g.archive??[])];g.contracts=g.contracts.filter(c=>c.to!==g.port);advance(g,1);note(g,`Delivered ${delivered.length} contract(s). Earned ${reward} silver.${learning.earned?` +${learning.earned} Sailing point(s).`:''}${learning.tiers?` Sailing mastery increased to tier ${g.skills.sailing.tier}.`:''}`);break;}
    case 'sail': {
      if(!PORTS.some(p=>p.id===action.to)||action.to===g.port)throw new Error('Choose another port.');
      const problems=sailingProblems(g);if(problems.length)throw new Error(problems.join(' '));
      const weatherRoll=random();const factor=weatherRoll<0.2?0.85:weatherRoll>0.8?1.25:1;
      const weather=factor<1?'Fair winds':factor>1?'Headwinds':'Steady winds';const hours=Math.ceil(hoursTo(g.port,action.to,g)*factor);const dice=roll();
      g.voyage={to:action.to,hours,remaining:hours,departureSpeed:effectiveSpeed(g),weather,dice};g.lastRoll={label:'Voyage encounter',dice,outcome:dice[0]+dice[1]===2?'Pirates sighted':'Clear passage'};
      note(g,`Departed for ${port(action.to).name}. ${weather}; ${duration(hours)}. Voyage roll: ${dice.join(' + ')} = ${dice[0]+dice[1]}.`);
      if(dice[0]+dice[1]===2){const first=Math.floor(hours/2);g.voyage.remaining-=first;if(advance(g,first))note(g,'A pirate ship closes in. Choose whether to flee, negotiate, or fight.');}
      else arrive();break;
    }
    case 'encounter': {
      if(!g.voyage)throw new Error('There is no encounter.');
      const dice=roll(),total=dice[0]+dice[1],band=outcome(total);g.lastRoll={label:action.choice,dice,outcome:band};
      let effects='';
      if(action.choice==='flee'){const delay=total<=6?24:total<=9?8:0;const damage=total<=6?25:total<=9?10:0;damageHull(damage);g.voyage.remaining+=delay;effects=`${damage}% hull damage; ${delay} hours delay.`;}
      else if(action.choice==='negotiate'){const demand=total<=6?150:total<=9?60:0;const paid=Math.min(Math.max(0,g.silver),demand);g.silver-=paid;const damage=paid<demand?15:0;damageHull(damage);effects=`Paid ${cash(paid)} silver.${damage?' Unable to meet their demand: 15% hull damage.':''}`;}
      else {const damage=total<=6?50:total<=9?20:5;const losses=total<=6?3:total<=9?1:0;const loot=total<=6?0:total<=9?60:150;damageHull(damage);g.crew-=losses;g.silver+=loot;effects=`${damage}% hull damage; ${losses} crew lost; ${loot} silver recovered.`;}
      note(g,`${action.choice}: ${dice.join(' + ')} = ${total}. ${band}. ${effects}`);
      if(ship.hullPoints<=0||g.crew<spec.minCrew){g.failed=ship.hullPoints<=0?'Your ship was lost. Load a church checkpoint.':'Too few sailors survived to bring the ship home. Load a church checkpoint.';note(g,g.failed);}else arrive();break;
    }
  }
  if(!g.voyage)observeMarket(g);
  return g;
}
