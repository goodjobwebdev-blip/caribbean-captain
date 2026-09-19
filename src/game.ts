export const PORTS = [
  { id: 'bridgetown', name: 'Bridgetown', island: 'Barbados', nation: 'England', x: 0, y: 0, prices: { sugar: 8, rum: 16, cloth: 22 }, description: 'Sunlight falls across the quays. Barrels roll toward waiting ships, and the harbour bell marks another hour of business.' },
  { id: 'saint-pierre', name: 'Saint-Pierre', island: 'Martinique', nation: 'France', x: -29, y: 50, prices: { sugar: 12, rum: 10, cloth: 25 }, description: 'Green slopes rise behind the waterfront. Boatmen call across the roadstead while merchants inspect the morning cargo.' },
  { id: 'willemstad', name: 'Willemstad', island: 'Curaçao', nation: 'Dutch', x: -285, y: -25, prices: { sugar: 17, rum: 20, cloth: 14 }, description: 'A sheltered harbour opens between busy quays. Cargo from distant shores changes hands beneath the fort’s watchful guns.' },
] as const;
export type PortId = typeof PORTS[number]['id'];
export type Good = 'sugar' | 'rum' | 'cloth';
export const GOODS: Good[] = ['sugar', 'rum', 'cloth'];
export const SHIP = { name: 'The Wayfarer', type: 'Trading sloop', capacity: 300, speed: 1.2, minCrew: 5, maxCrew: 20 };
export type Contract = { id: string; type: 'Freight' | 'Letter' | 'Passengers'; from: PortId; to: PortId; reward: number; amount: number };
export type Dice = [number, number];
export type Voyage = { to: PortId; hours: number; remaining: number; weather: string; dice: Dice };
export type Game = { version: 1; captain: string; port: PortId; hours: number; silver: number; provisions: number; crew: number; condition: number; cargo: Record<Good, number>; contracts: Contract[]; archive?: (Contract & {completedAt:number})[]; accepted: string[]; log: { hours: number; text: string }[]; seed: number; voyage: Voyage | null; failed: string | null; lastRoll: { label: string; dice: Dice; outcome: string } | null };
export type Action = { type: 'buy' | 'sell'; good: Good | 'provisions'; quantity: number } | { type: 'hire' | 'sleep' | 'repair' | 'deliver' } | { type: 'accept'; contract: Contract } | { type: 'sail'; to: PortId } | { type: 'encounter'; choice: 'flee' | 'negotiate' | 'fight' };
export const port = (id: PortId) => PORTS.find(p => p.id === id)!;
export const distance = (a: PortId, b: PortId) => Math.hypot(port(a).x - port(b).x, port(a).y - port(b).y);
export const hoursTo = (a: PortId, b: PortId) => Math.ceil(distance(a, b) / SHIP.speed);
export const cargoUsed = (g: Game) => Object.values(g.cargo).reduce((a,b) => a+b, 0) + g.provisions + g.contracts.filter(c => c.type === 'Freight').reduce((a,c) => a+c.amount,0);
export const passengers = (g: Game) => g.contracts.filter(c => c.type === 'Passengers').reduce((a,c) => a+c.amount,0);
export const foodFor = (g: Game, hours: number) => (g.crew + passengers(g)) * hours / 24;
export const wageFor = (g: Game, hours: number) => g.crew * 2 * hours / 24;
export const cash = (n: number) => Math.floor(n).toLocaleString('en');
export function date(hours: number) { const day = Math.floor(hours / 24); const months = ['January','February','March','April','May','June','July','August','September','October','November','December']; return `${day % 30 + 1} ${months[Math.floor(day / 30) % 12]}, Year ${Math.floor(day / 360) + 1} · ${String(hours % 24).padStart(2,'0')}:00`; }
export function duration(hours: number) { return `${Math.floor(hours / 24)}d ${hours % 24}h`; }
export function newGame(captain: string, seed = crypto.getRandomValues(new Uint32Array(1))[0]): Game { return { version:1, captain:captain.trim().slice(0,40) || 'Captain', port:'bridgetown', hours:8, silver:800, provisions:120, crew:10, condition:100, cargo:{sugar:0,rum:0,cloth:0},contracts:[],archive:[],accepted:[],log:[{hours:8,text:'Your command begins in Bridgetown. Visit the church to make your first checkpoint before sailing.'}],seed, voyage:null,failed:null,lastRoll:null }; }
function note(g:Game,text:string) { g.log.unshift({hours:g.hours,text}); g.log = g.log.slice(0,60); }
function advance(g:Game,hours:number) {
  const food = foodFor(g,hours);
  if (food > g.provisions + 1e-8) {
    const available = Math.floor(g.provisions * 24 / (g.crew + passengers(g)));
    g.silver -= wageFor(g,available); g.hours += available; g.provisions=0;
    g.failed='Your provisions ran out. The voyage is over. Return to a church checkpoint.';
    note(g,g.failed); return false;
  }
  g.provisions=Math.max(0,g.provisions-food); g.silver-=wageFor(g,hours); g.hours+=hours; return true;
}
export function offers(g:Game):Contract[] {
  return PORTS.filter(p=>p.id!==g.port).flatMap(p=>(['Letter','Freight','Passengers'] as const).map(type=>({id:`${g.port}:${p.id}:${Math.floor(g.hours/24)}:${type}`,type,from:g.port,to:p.id,reward:Math.round(hoursTo(g.port,p.id)*(type==='Letter'?3:type==='Freight'?5:4)+60),amount:type==='Freight'?40:type==='Passengers'?3:0}))).filter(c=>!g.accepted.includes(c.id));
}
export function canSave(g:Game) { return !g.failed && !g.voyage; }
export function outcome(total:number) { return total<=6?'Setback':total<=9?'Partial success':'Success'; }
export function act(original:Game, action:Action, randomOverride?:()=>number):Game {
  if (original.failed) throw new Error('Load a church checkpoint to continue.');
  if (original.voyage && action.type!=='encounter') throw new Error('Resolve the pirate encounter first.');
  const g=structuredClone(original);
  const random=()=>{ if(randomOverride) return randomOverride(); g.seed=(g.seed+0x6D2B79F5)>>>0; let t=g.seed; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; };
  const roll=():Dice=>[Math.floor(random()*6)+1,Math.floor(random()*6)+1];
  const pay=(cost:number)=>{if(g.silver<cost)throw new Error('Not enough silver.');g.silver-=cost;};
  const arrive=()=>{const v=g.voyage!; if(advance(g,v.remaining)){g.port=v.to;g.voyage=null;note(g,`Arrived at ${port(g.port).name}. Visit the Harbour Master to collect completed contract payments.`);}};
  switch(action.type) {
    case 'buy': case 'sell': {
      const q=action.quantity;if(!Number.isInteger(q)||q<1||q>300) throw new Error('Choose a valid quantity.');
      if(![...GOODS,'provisions'].includes(action.good)) throw new Error('Unknown goods.');
      if(action.type==='buy') {
        if(cargoUsed(g)+q>SHIP.capacity+1e-8)throw new Error('Not enough room in the hold.');
        const price=action.good==='provisions'?1:port(g.port).prices[action.good];pay(q*price);
        if(action.good==='provisions')g.provisions+=q;else g.cargo[action.good]+=q;
        note(g,`Bought ${q} ${action.good} for ${q*price} silver.`);
      } else {
        if(action.good==='provisions')throw new Error('Provisions cannot be sold.');
        if(g.cargo[action.good]<q)throw new Error('You do not have that much cargo.');
        const price=Math.floor(port(g.port).prices[action.good]*0.85);g.cargo[action.good]-=q;g.silver+=q*price;note(g,`Sold ${q} ${action.good} for ${q*price} silver.`);
      }
      advance(g,1);break;
    }
    case 'hire':if(g.crew>=SHIP.maxCrew)throw new Error('Your crew is already full.');pay(25);g.crew++;advance(g,1);note(g,'One sailor joined your crew for 25 silver.');break;
    case 'sleep':pay(8);if(advance(g,8))note(g,'You rested at the tavern for eight hours.');break;
    case 'repair':{if(g.condition===100)throw new Error('Your ship needs no repairs.');const damage=100-g.condition;pay(damage*2);if(advance(g,Math.ceil(damage/5))){g.condition=100;note(g,`The shipyard repaired The Wayfarer for ${damage*2} silver.`);}break;}
    case 'accept': {
      const c=offers(g).find(c=>c.id===action.contract.id);if(!c)throw new Error('That offer is no longer available.');
      if(g.contracts.length>=3)throw new Error('You can carry up to three active contracts.');
      if(c.type==='Freight' && cargoUsed(g)+c.amount>SHIP.capacity)throw new Error('This freight needs 40 free hold units.');
      if(c.type==='Passengers' && passengers(g)+c.amount>6)throw new Error('There are only six passenger berths.');
      g.contracts.push(c);g.accepted.push(c.id);advance(g,1);note(g,`Accepted ${c.type.toLowerCase()} to ${port(c.to).name}: ${c.reward} silver on delivery.`);break;
    }
    case 'deliver':{const delivered=g.contracts.filter(c=>c.to===g.port);if(!delivered.length)throw new Error('No contracts to deliver at this port.');const reward=delivered.reduce((a,c)=>a+c.reward,0);g.silver+=reward;g.archive=[...delivered.map(c=>({...c,completedAt:g.hours+1})),...(g.archive??[])];g.contracts=g.contracts.filter(c=>c.to!==g.port);advance(g,1);note(g,`Delivered ${delivered.length} contract(s). Earned ${reward} silver.`);break;}
    case 'sail': {
      if(!PORTS.some(p=>p.id===action.to)||action.to===g.port)throw new Error('Choose another port.');
      if(g.crew<SHIP.minCrew)throw new Error('You need at least five sailors.');
      const weatherRoll=random();const factor=weatherRoll<0.2?0.85:weatherRoll>0.8?1.25:1;
      const weather=factor<1?'Fair winds':factor>1?'Headwinds':'Steady winds';const hours=Math.ceil(hoursTo(g.port,action.to)*factor);const dice=roll();
      g.voyage={to:action.to,hours,remaining:hours,weather,dice};g.lastRoll={label:'Voyage encounter',dice,outcome:dice[0]+dice[1]===2?'Pirates sighted':'Clear passage'};
      note(g,`Departed for ${port(action.to).name}. ${weather}; ${duration(hours)}. Voyage roll: ${dice.join(' + ')} = ${dice[0]+dice[1]}.`);
      if(dice[0]+dice[1]===2){const first=Math.floor(hours/2);g.voyage.remaining-=first;if(advance(g,first))note(g,'A pirate ship closes in. Choose whether to flee, negotiate, or fight.');}
      else arrive();break;
    }
    case 'encounter': {
      if(!g.voyage)throw new Error('There is no encounter.');
      const dice=roll(),total=dice[0]+dice[1],band=outcome(total);g.lastRoll={label:action.choice,dice,outcome:band};
      let effects='';
      if(action.choice==='flee'){const delay=total<=6?24:total<=9?8:0;const damage=total<=6?25:total<=9?10:0;g.condition-=damage;g.voyage.remaining+=delay;effects=`${damage} ship damage; ${delay} hours delay.`;}
      else if(action.choice==='negotiate'){const demand=total<=6?150:total<=9?60:0;const paid=Math.min(Math.max(0,g.silver),demand);g.silver-=paid;const damage=paid<demand?15:0;g.condition-=damage;effects=`Paid ${cash(paid)} silver.${damage?' Unable to meet their demand: 15 ship damage.':''}`;}
      else {const damage=total<=6?50:total<=9?20:5;const losses=total<=6?3:total<=9?1:0;const loot=total<=6?0:total<=9?60:150;g.condition-=damage;g.crew-=losses;g.silver+=loot;effects=`${damage} ship damage; ${losses} crew lost; ${loot} silver recovered.`;}
      g.condition=Math.max(0,g.condition);note(g,`${action.choice}: ${dice.join(' + ')} = ${total}. ${band}. ${effects}`);
      if(g.condition<=0||g.crew<SHIP.minCrew){g.failed=g.condition<=0?'Your ship was lost. Load a church checkpoint.':'Too few sailors survived to bring the ship home. Load a church checkpoint.';note(g,g.failed);}else arrive();break;
    }
  }
  return g;
}
