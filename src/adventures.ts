import type {Game} from './game';
import {foodFor,wageFor} from './game';
import {PORTS,type PortId} from './world';
import {ensureEconomy,consumeLots} from './trade';
import {ensureCrew} from './crew';
import {changeStanding} from './commerce';
import {record,recordConsumption} from './finance';

export type HarbourChoiceId='paid'|'aid';
export type HarbourStoryMemory={choice:HarbourChoiceId;completedAt:number};
export type HarbourStoryState={harbourStories?:Partial<Record<PortId,HarbourStoryMemory>>};
export type AdventureAction={type:'harbour-story';port:PortId;choice:HarbourChoiceId};
type StoryChoice={id:HarbourChoiceId;label:string;outcome:string;hours:number;silver:number;attitude:number;reputation:number;supplies:number;morale:number};
type Story={title:string;scene:string;choices:readonly StoryChoice[]};
function story(title:string,scene:string,paid:[string,string],aid:[string,string]):Story {
 return {title,scene,choices:[
  {id:'paid',label:paid[0],outcome:paid[1],hours:2,silver:36,attitude:0,reputation:0,supplies:0,morale:0},
  {id:'aid',label:aid[0],outcome:aid[1],hours:3,silver:8,attitude:2,reputation:1,supplies:0,morale:0},
 ]};
}

/** Authored, one-time local incidents. Neither seeds nor model output select rewards. */
export const HARBOUR_STORIES:Record<PortId,Story>={
 bridgetown:story('The broken lighter',
  'A loading plank has split beside a crowded lighter. A merchant offers silver to move his sugar before the tide turns. Nearby, market sellers struggle to recover their own baskets. Your crew has time to take one side of the quay.',
  ['Move the merchant’s sugar','You rig a new loading line and bring the sugar safely ashore. The merchant counts out the agreed silver; by the time you leave, another crew has taken the far quay.'],
  ['Lend a hand to the market sellers','Your sailors pass baskets hand to hand until the sellers have their stores again. They press a little silver into your palm, and word of your help travels along the quay.']),
 'saint-pierre':story('Rain on the roadstead',
  'Rain sweeps down from the hills. The coffee factors need someone to cover their waiting cargo, while a boatman asks for help carrying the village landing’s benches and gear above the rising water. There is only one spare boat.',
  ['Cover the coffee cargo','Your boat carries tarpaulins across the roadstead. The coffee stays dry, the factor pays your fee, and rain drums on the covered stacks.'],
  ['Help clear the village landing','You work beside the boatman until the landing’s gear is on higher ground. His neighbours pool a small thank-you; the harbour remembers whose boat came through the rain.']),
 willemstad:story('A tangle of manifests',
  'Two lighters have exchanged their manifests. A factor needs an experienced captain to count the commercial bales. Down the quay, new dockhands are trying to reunite several families with their travelling chests.',
  ['Reconcile the factor’s bales','You match marks to manifests and settle the factor’s count. His clerk pays the agreed fee, and the lighters finally take their proper berths.'],
  ['Sort the travellers’ chests','You teach the dockhands to match the chalk marks, then help carry the last chest ashore. The families offer a small purse, and your patience becomes a story on the waterfront.']),
 'basse-terre':story('The wheel in the mud',
  'An overturned produce cart blocks the lane to the quay. The exporter will pay to shift his cocoa to a waiting boat. Beyond it, small growers need a safe path for their handcarts before the light fades.',
  ['Carry the exporter’s cocoa','Your crew forms a chain to the boat and clears the exporter’s sacks. He pays promptly as the first handcarts edge past the emptied wagon.'],
  ['Rebuild the growers’ path','You brace the cart and lay a firm crossing over the rut. The growers can bring their produce through; their modest collection comes with a warm welcome.']),
 capsterville:story('The tangled mooring',
  'A provisioning barge has fouled a small landing’s mooring line. Its owner offers a fee to unload his stores by boat. The landing keeper asks you to clear the tangle properly so everyone can use the steps again.',
  ['Unload the provisioning barge','Your sailors ferry the owner’s stores ashore while he keeps watch on the lines. He pays your fee; a shore gang takes over the mooring work.'],
  ['Free the public landing','You ease the strain and work the tangled lines apart. The landing opens again, and its keeper shares a small collection from the grateful boatmen.']),
 'st-johns':story('Canvas in the wind',
  'A gust tears canvas loose from a sail loft. The sailmaker needs a captain to secure a commissioned sail. On the street below, apprentices are gathering tools and cloth scattered from the open workroom.',
  ['Secure the commissioned sail','You and the sailmaker lash the billowing sail safely inside. He settles your fee, then calls his apprentices back to the loft.'],
  ['Help the apprentices recover their work','Your crew brings every reachable tool and scrap back from the street. The apprentices offer a small purse; their master hears how carefully you treated their work.']),
 philipsburg:story('A narrow crossing',
  'A damaged footbridge holds up the lagoon’s traffic. A cotton merchant offers a fee to ferry his samples across. Local workers ask you to rig a temporary handline so their smaller boats can cross safely.',
  ['Ferry the cotton samples','You carry the factor and his samples across the lagoon. He pays the passage fee as a local crew arrives to tend the crossing.'],
  ['Rig the workers’ handline','You set the handline and stay until the first boats are across. The workers share what they can, and your ship’s name is repeated on both banks.']),
 'san-juan':story('The quay beneath the walls',
  'A loose stack of empty casks narrows the quay beneath the ramparts. An exporter will pay to move his tobacco around it. A porter asks for help clearing the whole passage before more carts arrive.',
  ['Escort the tobacco carts','Your crew guides the loaded carts past the obstruction one at a time. The exporter pays his fee, leaving the quay gang to rearrange the casks.'],
  ['Clear the passage for everyone','You roll the casks into a safe stack and guide the porters through. Their foreman offers a little silver, and the quay’s regulars mark you as a useful friend.']),
 'santo-domingo':story('Bells above the river',
  'A river lighter has arrived with a leaking canopy. A hide merchant wants his cargo brought under cover. Beside the church steps, a relief boat waits for hands to carry its bedding and baskets ashore.',
  ['Bring the hides under cover','Your sailors carry the hides into the merchant’s store before the next shower. He pays the promised silver while the lighter’s crew patches its canopy.'],
  ['Unload the relief boat and share 4 provisions','You carry the bedding and baskets up from the river, adding four provisions from your stores. The boat’s keeper offers a small travelling purse, and the parish speaks well of your ship.']),
 'port-au-prince':story('Timber across the slip',
  'Loose timber has drifted across a crowded slip. A merchant offers payment to recover his marked beams. Fishermen need a clear channel wide enough to bring their smaller craft ashore.',
  ['Recover the marked beams','You tow the marked beams to the merchant’s rack and receive the agreed payment. Other hands take up the remaining driftwood.'],
  ['Clear the fishermen’s channel','Your crew works the loose timber aside until the fishing boats can pass. The fishermen collect a few coins for you; by evening, your help is known along the slip.']),
 havana:story('Room among the masts',
  'A crowded anchorage leaves two jobs waiting for an experienced crew. A factor needs a boat to carry his chandlery order. The harbour watch needs help untangling the landing’s jostling queue of small craft.',
  ['Carry the chandlery order','You thread the anchorage and deliver the factor’s order to the right ship. His agent pays the fee and takes over the unloading.'],
  ['Put the landing in order','You help the boatmen establish a clear passage and take turns at the steps. The watch contributes a small payment, and the harbour hands remember your fair dealing.']),
 santiago:story('The forge delivery',
  'A forge cart has shed a wheel at the foot of the hill. A shipowner offers silver to bring his finished fittings down to the quay. The smith asks for help carrying the broken cart and its remaining tools back inside.',
  ['Deliver the ship’s fittings','Your sailors shoulder the fittings down the hill. The waiting shipowner pays your fee as the smith gathers another crew to help with the cart.'],
  ['Help the smith recover the cart','You shift the cart and return its tools to the forge. The smith offers a small purse and makes sure the neighbours hear who stayed to help.']),
 'port-royal':story('The stranded music',
  'A damaged landing step has left a supply boat waiting offshore. A tavern keeper offers a fee to bring in casks for tonight. Nearby, musicians and their families need help landing their awkward bundles and instruments.',
  ['Bring the tavern’s casks ashore','Your crew brings the casks safely through a neighbouring slip. The tavern keeper pays the agreed fee as the supply boat resumes unloading.'],
  ['Bring the travelling musicians ashore','You find a dry route for every instrument and help the families land. They pool a small payment; later, your ship gets a friendly mention between songs.']),
 tortuga:story('A light on the quay',
  'A quay lantern has fallen, leaving one landing in shadow. A tobacco factor will pay for your boat to escort his last cargo. Local boatmen want hands to raise a replacement light for everyone still coming in.',
  ['Escort the tobacco boat','Your lantern guides the loaded boat to its berth. The factor settles the agreed fee while shore hands bring a new light to the landing.'],
  ['Raise the landing light','You help the boatmen hoist and secure a fresh lantern. They share a modest collection, and the crews coming ashore have a good word for your ship.']),
 'san-jose':story('The rain-soaked storehouse',
  'A storehouse roof is leaking after warm rain. A cocoa buyer offers silver to shift his sacks to a dry shed. The quay workers ask for hands to rig a shared shelter over the smaller traders’ goods.',
  ['Move the buyer’s cocoa','You shift the cocoa to the buyer’s shed and collect the promised payment. Rain taps harmlessly on the sound roof as you leave.'],
  ['Rig a shelter and share 3 provisions','You share three provisions with the rain-soaked workers. Your crew stretches canvas over the waiting goods and secures it against the wind. The traders share a small purse, and their thanks follows you down the quay.']),
};

// Different local needs make time, stores, cash and crew spirits matter.
// Rewards are fixed and inspectable; these are not generated quest terms.
const LOCAL_TERMS:Record<PortId,Partial<Record<HarbourChoiceId,Partial<StoryChoice>>>>={
 bridgetown:{paid:{hours:2,silver:36},aid:{hours:3,silver:8,morale:2}},
 'saint-pierre':{paid:{hours:2,silver:42},aid:{hours:4,silver:12,attitude:3}},
 willemstad:{paid:{hours:3,silver:54},aid:{hours:2,silver:14}},
 'basse-terre':{paid:{hours:2,silver:30},aid:{hours:4,silver:20,morale:3}},
 capsterville:{paid:{hours:3,silver:48},aid:{hours:2,silver:10}},
 'st-johns':{paid:{hours:2,silver:40},aid:{hours:3,silver:12,morale:3}},
 philipsburg:{paid:{hours:1,silver:22},aid:{hours:4,silver:18,attitude:3}},
 'san-juan':{paid:{hours:2,silver:38},aid:{hours:3,silver:16,attitude:3}},
 'santo-domingo':{paid:{hours:2,silver:32},aid:{hours:2,silver:6,supplies:4,attitude:3}},
 'port-au-prince':{paid:{hours:4,silver:64},aid:{hours:2,silver:10,morale:3}},
 havana:{paid:{hours:3,silver:60},aid:{hours:4,silver:26,attitude:3}},
 santiago:{paid:{hours:2,silver:38},aid:{hours:3,silver:18,morale:2}},
 'port-royal':{paid:{hours:2,silver:34},aid:{hours:3,silver:10,morale:5}},
 tortuga:{paid:{hours:1,silver:24},aid:{hours:3,silver:8,attitude:3}},
 'san-jose':{paid:{hours:2,silver:40},aid:{hours:3,silver:12,supplies:3,morale:3}},
};
for(const p of PORTS)for(const choice of HARBOUR_STORIES[p.id].choices)Object.assign(choice,LOCAL_TERMS[p.id][choice.id]);

type StoryGame=Game&HarbourStoryState;
export function harbourAdventureQuote(g:StoryGame,action:AdventureAction){
 // Look up both story and terms from the catalogue; never trust client rewards.
 const tale=HARBOUR_STORIES[g.port],choice=tale.choices.find(c=>c.id===action.choice);
 if(!choice)throw Error('Choose one of the offered harbour story actions.');
 const errors:string[]=[];
 if(g.failed||g.voyage||g.battle)errors.push('Harbour stories are only available while safely in port.');
 if(action.port!==g.port)errors.push('This story belongs to another port.');
 if(g.harbourStories?.[g.port])errors.push('You have already played your part in this harbour story.');
 const provisions=foodFor(g,choice.hours)+choice.supplies,wages=wageFor(g,choice.hours);
 if(g.provisions+1e-8<provisions)errors.push(`Keep ${provisions.toFixed(2)} provisions for upkeep and the chosen work.`);
 if(g.silver+1e-8<wages)errors.push(`Keep ${wages.toFixed(2)} silver for wages before taking this work.`);
 return {port:g.port,started:g.hours,tale,choice,hours:choice.hours,provisions,wages,errors};
}

/** Called on the reducer's cloned state after normal time and upkeep resolve. */
export function completeHarbourAdventure(g:StoryGame,quote:ReturnType<typeof harbourAdventureQuote>){
 if(quote.errors.length||g.failed||g.voyage||g.battle||g.port!==quote.port||g.hours!==quote.started+quote.hours||g.harbourStories?.[quote.port])throw Error('This harbour story can no longer be completed.');
 const canonical=HARBOUR_STORIES[quote.port].choices.find(c=>c.id===quote.choice.id);
 if(!canonical)throw Error('Unknown harbour story choice.');
 if(g.provisions+1e-8<canonical.supplies)throw Error('Not enough provisions for the chosen work.');
 ensureEconomy(g);
 if(canonical.supplies){recordConsumption(g,'provisions-used','provisions',canonical.supplies);consumeLots(g,'provisions',canonical.supplies);g.provisions=Math.max(0,g.provisions-canonical.supplies);}
 if(canonical.morale){const crew=ensureCrew(g);crew.morale=Math.min(100,crew.morale+canonical.morale);}
 g.silver+=canonical.silver;
 record(g,'quest',canonical.silver);
 changeStanding(g,canonical.attitude,canonical.reputation);
 (g.harbourStories??={})[g.port]={choice:canonical.id,completedAt:g.hours};
}

/** Only durable evidence counts; generated market inventories are not visits. */
export function visitedHarbours(g:StoryGame):PortId[]{
 const visited=new Set<PortId>([g.port]);
 for(const p of PORTS){
  if(g.harbourStories?.[p.id]||Object.keys(g.npcMemories??{}).some(key=>key.startsWith(`${p.id}:`)))visited.add(p.id);
 }
 for(const contract of g.contracts)visited.add(contract.from);
 for(const contract of g.archive??[]){visited.add(contract.from);visited.add(contract.to);}
 for(const voyage of g.finances?.voyages??[]){visited.add(voyage.from);if(voyage.arrival!==undefined)visited.add(voyage.to);}
 return PORTS.filter(p=>visited.has(p.id)).map(p=>p.id);
}
