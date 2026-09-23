import {PORTS,FREIGHT_SIZES} from './game';
import {ALL_GOODS,CATALOGUE} from './goods';
import {SHIPS} from './ships';
import {PERMIT_PRICE,unavailable} from './commerce';
import {marketRule} from './trade';
import {RECIPES,FRUIT_DAILY_LOSS} from './operations';
import {nextTierRequirement} from './skills';
export type WikiArticle={id:string;category:string;title:string;paragraphs:string[];tips?:string[];table?:{headers:string[];rows:(string|number)[][]}};
export const WIKI:WikiArticle[]=[
 {id:'start',category:'Getting started',title:'Your first voyage',paragraphs:[
  'You begin in Bridgetown with a Universal Sloop, 800 silver, 10 sailors and 120 provisions. Earn silver through commissions and trade, keep the crew supplied, and exchange your ship for a vessel that suits your plans.',
  'Gamespace is where you take actions. The Journal contains ship and crew statistics, skills, cargo, passengers, quests, market memories and financial records. The compact top strip and expandable bottom log belong to Gamespace. Settings and this Wiki are available even before creating a captain.'
 ],tips:['Visit the Church and create a checkpoint before sailing.','Use the Harbour Master for commissions and the Store for provisions and trade goods.','Review both hold space and weight, then use Plan voyage at the Harbour.','On arrival, sell cargo at the Store and collect completed commissions at the Harbour Master.']},
 {id:'npc-dialogue',category:'Getting started',title:'Talking to townspeople',paragraphs:[
  'Every town building has a fixed named host. On entry, choose a spoken reply to open trading, repairs, commissions or another supported service. Speak to the host returns to the conversation; Back to harbour leaves the building. Town navigation also remains available.',
  'A purchase or service keeps its panel open. Each captain has separate memories of visits, successful dealings and completed commissions. Checkpoints restore those memories. Talking and navigating do not advance the clock.',
  'Enable a prose model in Settings for contextual greetings and short reactions. Written dialogue appears immediately while the model works, and remains available if the request fails. Game controls and prices remain authoritative. Placeholder buildings do not offer services yet.'
 ]},
 {id:'time',category:'Getting started',title:'Calendar, actions and upkeep',paragraphs:[
  'Time advances when you confirm game actions. Reading the Journal or Wiki, browsing shops, changing settings and closing the browser do not advance the calendar. Months have 30 days; years have 12 months.',
  'Each sailor costs 2 silver in wages per day. Each sailor and passenger consumes 1 provision per day, including time spent in port. The captain does not add a separate food or wage charge. Costs are proportional to the hours that pass.',
  'A trade basket, crew hire or dismissal, contract acceptance or delivery, permit purchase, and smuggler introduction each take one hour. Tavern rest takes eight hours and costs 8 silver, plus upkeep. Repair and food-preparation times appear in their quotes. Ship exchanges take no time.',
  'Running out of provisions ends the run; use a church checkpoint to recover. Wages and inspection fines can leave negative silver, shown as debt. Debt has no interest or separate bankruptcy system in this version. Unpaid wages gradually reduce morale and discipline; see Crew development and care.'
 ]},
 {id:'checkpoints',category:'Getting started',title:'Captains, saves and church checkpoints',paragraphs:[
  'Each captain has an independent world, including markets, contacts, reputation and financial records. Progress resumes when you reopen that captain. Resuming is not an undo: a failed run stays failed.',
  'Recovery checkpoints can only be created at a Church, while in port and before failure. They are free. Restoring one replaces current progress with its exact captain, ship, cargo, skills, calendar, markets, quests and financial history. Other checkpoints remain available.',
  'Use Delete beside a checkpoint to remove it permanently, then confirm in the dialog. Keep checkpoint or Escape cancels. Deleting a checkpoint does not change your current progress or other checkpoints; even the last checkpoint can be removed.',
  'Profiles and checkpoints live in this browser on this device. There is no game-imposed count limit, but browser storage is finite. Clearing site data removes these local records; they do not automatically sync to another browser.',
  'Old saves remain playable. Newly introduced histories are not invented retroactively: old goods may have unknown purchase costs and old voyages may have only partial financial records.'
 ]},
 {id:'world',category:'Sailing and ships',title:'Ports, islands and distance',paragraphs:[
  `The current world has ${PORTS.length} colonial towns across 13 islands or island groups. Cuba and Hispaniola each have two playable towns, with separate markets. Every town offers the existing services, including Blacksmith and Weaver. National identity affects permits and local attitude.`,
  'Find destinations at the Harbour by town, island or nation. Routes are grouped by island; Harbour Master commissions are grouped by destination. Spain has its own national permit and reputation, shared across Spanish ports.',
  'Geography follows the Sea Dogs reference catalogue. Pirate settlements, bays, coves, overland travel, and local shipyard or equipment specializations are deferred. Existing saves keep their markets and gain the new destinations.',
  'Ports have coordinates in fictional distance units. Bridgetown is the origin. Distance is a straight line: the square root of the sum of the squared horizontal and vertical differences. There are no sea waypoints or land-routing restrictions yet.'
 ],table:{headers:['Port','Island','Nation','Coordinates'],rows:PORTS.map(p=>[p.name,p.island,p.nation,`${p.x}, ${p.y}`])}},
 {id:'sailing',category:'Sailing and ships',title:'Sailing time and weather',paragraphs:[
  'Normal sailing time is distance divided by your current effective speed, rounded up to whole hours. The departure review includes a financial estimate, provision requirements and fruit spoilage.',
  'At departure, weather changes the rounded normal time: fair winds multiply it by 0.85, steady winds by 1, and headwinds by 1.25; the result is rounded up again. Fair winds occur about 20% of the time, steady winds 60%, and headwinds 20%. Seasons do not yet alter weather.',
  'Speed is calculated from your ship, load, hull, sails, crew and Sailing mastery at departure. That snapshot determines the voyage duration; lighter cargo or a new skill tier during arrival does not recalculate the leg. Pirate encounters can add delays.',
  'Carry food for headwinds and possible delay, not just the normal estimate. Adding cargo or provisions can change your speed and therefore your food requirements.'
 ]},
 {id:'load',category:'Sailing and ships',title:'Hold space, deadweight and performance',paragraphs:[
  'Hold space and deadweight are separate limits. Goods, provisions and contract freight occupy the hold. Weight also includes crew, passengers, the captain and mounted cannons. One person weighs 1 unit; each mounted cannon weighs 5 units. Trade cannons are cargo until an installation system is added.',
  'At up to 20% of maximum deadweight, there is no load penalty. Above that, penalties rise continuously: at full deadweight the load factor reduces speed by 25% and maneuverability by 35%. Exceeding hold space or deadweight blocks departure.',
  'Effective speed = base speed × load factor × hull factor × sail factor × crew factor × crew sailing experience × morale/discipline readiness × Sailing bonus. Positive hull condition gives a factor from just above 0.5 to 1; positive sail condition gives just above 0.2 to 1. Zero hull or sails blocks sailing.',
  'Below minimum crew you cannot sail. From minimum to optimal crew, the crew factor rises from 0.6 to 1; if minimum and optimal are equal it is 1. Extra crew beyond optimal adds weight, food and wages without another performance bonus. Maneuverability uses the same condition and crew factors, but no Sailing bonus.',
  'The Journal’s Ship tab shows the actual factors and weight breakdown for your current command.'
 ]},
 {id:'ships',category:'Sailing and ships',title:'Buying ships and hiring crew',paragraphs:[
  `The Shipyard offers ${SHIPS.length} configurations across six tiers: Merchant, Warship and Universal. Some hull types have multiple configurations. Tier and class are navigation labels; the listed statistics determine performance.`,
  'You command one ship. Buying another sells the current vessel and transfers your cargo, crew, passengers and contracts. The offered ship is fully repaired and includes its default mounted cannons. The quote shows the full price, trade-in value and net balance.',
  'Trade-in value is 70% of the current ship’s listed price, rounded down after subtracting quoted hull, sail and missing-default-cannon repairs, with a minimum of zero. Exchanges must satisfy the new ship’s crew, passenger, hold, weight and silver requirements.',
  'At the Tavern, hiring one sailor costs 25 silver and one hour. Dismissing one sailor is free but takes one hour, and cannot reduce crew below the ship’s minimum. Officers and fleets are not implemented. A defeated ship can replace your single owned ship after battle.'
 ]},
 {id:'encounters',category:'Sailing and ships',title:'Ship encounters, pursuit and demands',paragraphs:[
  'Contacts are generated once at departure using the saved random seed. A two-day voyage has approximately a 20% contact chance; the contact cap is one per three voyage days, rounded up. Merchants, local vessels, couriers, navy, privateers, pirates and bounty hunters may appear.',
  'The opening posture determines your responses. Lookout can provide an early sighting. Hail may provide accurate dated market intelligence. Flee, Pursue and social checks use visible modifier breakdowns; natural 2 and 12 override modifiers. Attacking a friendly ship requires confirmation.',
  'Demands can take exposed silver, trade goods or passengers. Supplies and ammunition are excluded from trade-goods demands. Social attempts are bounded; there is no endless negotiation loop.'
 ],tips:['Encounters can lead to tactical combat. Select a Battle model in Settings before fighting.','Legacy saves already inside a prototype pirate encounter retain their old resolution rules. New voyages use the new contact system.']},
 {id:'naval',category:'Sailing and ships',title:'Naval Engagement and ammunition',paragraphs:[
  'Each captain secretly commits up to 1,000 units of orders. Actions take effect at completion; movement continues throughout the window. Wind, sails, range and bearing affect combat. Both accepted plans are saved before reveal and playback.',
  'Each battery can receive one free preload before the first schedule, consuming its normal ammunition and powder. Reload reserves one round and one gunpowder per surviving cannon. Unload before switching ammunition. A volley requires a target in the battery arc and ammunition range.',
  'Invalid actions at their start pause for one replacement. Later orders shift, and excess tail orders are removed. You can pause, step through events, use normal or fast playback, or resolve the window instantly.',
  'Critical hits can cause Fire, Flooding, Rigging Damage or Crew Shock. Repairs, Doctoring, Rally, Deception and dumped explosives provide support options. A successful Grapple enters Deck Battle and cancels remaining naval orders.'
 ],table:{headers:['Ammunition','Target','Maximum range'],rows:[['Round Shot','Hull, sails, crew or guns','Distant'],['Chain Shot','Sails','Long'],['Bombs','Hull; both ships at grapple distance','Medium'],['Grapeshot','Crew and morale','Close']]}},
 {id:'boarding',category:'Sailing and ships',title:'Deck Battle and Captain Duel',paragraphs:[
  'Deck Battle lasts the average of both ship tiers, rounded up. Assault is balanced; Guard adds defense and halves casualties but cannot gain control; Breakthrough risks heavier losses for a two-step control gain. Casualties are individually assigned as injured or dead.',
  'Final Boarding Control, capped at −2 to +2, modifies the first duel roll and determines starting Initiative. The captains then choose Quick, Standard, Heavy or an available loaded pistol; defenders choose legal Block, Parry or Dodge responses. Only Dodge answers a pistol.',
  'Injury can end in incapacitation or death. Every five exchanges worsens both captains’ fatigue; Collapse ends the duel. Demand Surrender can be attempted once per opponent injury condition. Fanatical captains refuse voluntary surrender while their crew can fight.',
  'Capture Resolution lets victors release or ransom a living captain, select cargo within capacity, and keep or exchange their ship. Conditional surrender terms are honored. Defeat applies losses and allows a return to port when your captain and ship survive. Death or ship loss requires a church checkpoint.'
 ]},
 {id:'capture-resolution',category:'Sailing and ships',title:'After battle: prizes, ransom and recovery',paragraphs:[
  'Victors can exchange their vessel for an intact prize, retaining their own surviving crew and cargo. Hull, sail damage and installed cannons are preserved. You still own only one ship. Unselected loot stays behind; loads, berths and crew accommodation must fit.',
  'Ransom transfers only the recorded enemy purse and is unavailable for dead captains or accepted conditional surrender. Release grants +2 reputation and +2 faction attitude. Taking the ship costs 10 faction attitude.',
  'Pirate defeat costs exposed silver and trade goods; other captors charge 25% of positive silver and confiscate controlled cargo. All active commissions fail, passengers are repatriated, and surviving crew return with you.',
  'Return service costs 100 silver per ship tier plus 12 hours of wages. It includes food, tow and captain stabilization, and can create debt. Damage and crew injuries remain; fruit spoils. No Sailing practice or delivery reward is granted for the aborted voyage.',
  'Eight hours of tavern rest clear captain fatigue, heal one Injury step and restore up to 10% of living crew from injured to fit. Death and ship loss still require a church checkpoint.'
 ]},
 {id:'crew-development',category:'Work and skills',title:'Crew development and care',paragraphs:[
  'Crew sailing, gunnery and fighting experience range from 0 to 100. Old collective experience supplies any missing specialty. Sailing affects speed and maneuverability; gunnery affects cannon accuracy and reload costs; fighting affects boarding strength. New recruits join at 50 and change the living crew average.',
  'Successful arrival grants up to 3 crew sailing experience, at 1 per 48 voyage hours. Valid volleys, timed reloads, grappling and deck rounds grant their corresponding specialty practice, up to 2 per battle. Rewards apply once at resolution and do not change active orders. Free preloads, NPC actions and invalid actions earn nothing.',
  'At the Tavern, an eight-hour training session costs at least 20 silver or 2 per sailor, plus wages and provisions. The selected specialty gains up to 2 + 0.2 per captain Training tier, scaled by the fit share of the crew, capped at 75. The captain gains 0.5 Training point; discipline rises by 1. Training requires a functioning captain and fit sailors.',
  'Four-hour medical care heals up to 25% of living crew, rounded up and improved by Doctoring mastery, plus one captain Injury step. The fee is 10 per healed sailor and 50 for the captain, plus upkeep. Dead sailors cannot recover. Eight-hour shore leave costs 5 per sailor (minimum 10), plus upkeep, and restores up to 10 morale, stopping at 80.',
  'Battle victory gives +4 morale and +1 discipline; defeat gives −6 and −2. Net fit-crew losses impose up to 10 additional morale loss. Each equivalent day of unpaid wages costs 4 morale and 2 discipline, proportional to the unpaid share. Incoming silver offsets treasury debt but does not restore lost morale. Morale and discipline influence sailing, boarding and morale checks; there is no desertion or mutiny yet.'
 ]},
 {id:'contracts',category:'Work and skills',title:'Harbour Master commissions',paragraphs:[
  `Carry up to three active commissions. Letters take no hold space. Freight jobs provide ${FREIGHT_SIZES.join(', ')} units of cargo to transport; you do not buy it yourself. Passenger jobs take three berths, and passengers eat provisions.`,
  'Offers refresh with the game day. There are no deadlines in these commissions. Accept a job at its origin and use Deliver completed tasks at the destination to collect payment; arrival alone does not pay you. Accepted rewards stay fixed.',
  'New letter rewards are round(20 + distance × 1.04). Freight rewards are round(20 + distance × quantity × 0.0432). Passenger rewards are round(30 + distance × passenger count × 0.69). Letters also award ceil(distance ÷ 100) Sailing points.',
  'Each delivered commission grants +2 attitude with the receiving nation and +1 global reputation. Completed commissions appear in the Journal archive. Restoring a checkpoint restores the quest history too.'
 ]},
 {id:'skills',category:'Work and skills',title:'Sailing and Trade skills',paragraphs:[
  'Skills have mastery tiers 0–10. The next tier costs 10 × 2 to the power of your current tier. Leftover points carry forward. At tier 10 the skill is capped.',
  'Sailing adds 5% to sailing speed per mastery tier, up to 50%. Successful arrival awards 1 point for every 24 hours of the weather-adjusted voyage time; leftover hours carry forward. Port time and additional encounter delays do not count. Letter rewards add points through the same progression.',
  'Trade narrows the merchant spread by one percentage point per mastery tier, subject to the market’s minimum spread. Buying alone awards no Trade points. Profitable resale of cargo purchased in another port earns 1 point per 100 silver of positive marginal profit before voyage expenses.',
  'Trade learning follows the oldest acquisition records first, using unrounded purchase and sale price curves. Profitable portions earn points; losing portions earn none. Fractions carry forward. Same-port resale, unknown-cost gifts or legacy goods, and provisions produced by food conversion do not earn Trade points. Splitting an identical stock path into smaller deals does not create extra learning.'
 ],table:{headers:['Current tier','Points needed for next tier'],rows:Array.from({length:11},(_,tier)=>[tier,nextTierRequirement(tier)??'Maximum mastery'])}},
 {id:'basket',category:'Trading and markets',title:'Buying and selling with the basket',paragraphs:[
  'Build one basket containing purchases and sales. A good can appear once, in one direction. Sales can fund purchases and free capacity within the same deal. Quantities must be whole units; fractionally consumed or spoiled goods can leave a remainder aboard.',
  'The displayed unit prices are indicative. Large quantities move prices as stock changes, so review the exact full-line totals. Each purchase line is rounded up to silver; each sale line is rounded down. The complete basket takes one hour, with crew wages and meals.',
  'Confirmation checks stock, market storage, access, funds, both ship load limits and food for the trading hour. Invalid or stale quotes do not spend silver, goods or time. A new Trade tier earned from a sale applies after the whole basket settles.',
  'Use search, category filters, Aboard only and quantity shortcuts to build the deal. Sell all respects the market’s storage limit; for provisions it keeps only one trading hour of food, not a voyage reserve.'
 ]},
 {id:'prices',category:'Trading and markets',title:'Market roles, stock and prices',paragraphs:[
  'Export goods are usually cheaper and well supplied; Import goods are usually dearer and locally wanted. Neutral goods sit between them. Market role is separate from access: a good can be Controlled regardless of its role.',
  'Each captain has finite, independent port stocks. Buying removes stock and selling adds it, up to market storage capacity. Provisions start at 100,000 per port, with a maximum of 200,000. They are abundant, not infinite. Luxury stock targets and limits are 2% of ordinary goods.',
  'Stock gradually approaches its target as game time passes: target + (previous stock − target) × exp(−elapsed days ÷ recovery constant). Recovery constants are 5 days for Export, 7 for Neutral, 10 for Import and 20 for provisions. Browsing does not reset stock.',
  'Reference price = base price × role multiplier × scarcity × local event multiplier. Role multipliers are 0.70 for Export, 1 for Neutral and 1.40 for Import. Scarcity is 1.4 − 0.4 × stock ÷ target, limited to 0.65–1.50. The basket integrates that price along the full stock change.',
  'Legal spread = 0.15 − 0.01 × Trade tier − 0.02 × attitude ÷ 100 − 0.01 × reputation ÷ 100, limited to 0.05–0.22. Buying adds this spread and selling subtracts it. Regional prices and stock usually matter more than small reputation adjustments.'
 ],table:{headers:['Ordinary goods','Target stock','Maximum stock','Recovery constant'],rows:[['Export',4000,8000,'5 days'],['Neutral',2000,4000,'7 days'],['Import',1000,2000,'10 days']]}},
 {id:'access',category:'Trading and markets',title:'Permits, attitude and reputation',paragraphs:[
  `A permanent national trade permit costs ${PERMIT_PRICE} silver and one hour at the Harbour Master. It allows legal trading of Weapons, Gunpowder, Cannons and Bombs in that nation’s ports while local attitude is at least −30. Permits do not transfer between nations.`,
  'Attitude and global reputation range from −100 to +100, starting at zero. Positive standing improves legal spreads; negative standing worsens them. At attitude −60 or below, legal trade is blocked except for provisions. Harbour Master commissions remain a way to rebuild trust.',
  'Unavailable means the port does not handle that good through its legal market. Jewelry is unavailable in Bridgetown and Perfume in Saint-Pierre. A permit does not override this; find a buyer elsewhere or use a local smuggler contact.'
 ]},
 {id:'smuggling',category:'Trading and markets',title:'Smuggler contacts and inspections',paragraphs:[
  'Meet a local contact at the Tavern for 50 silver and one hour, then choose Smugglers at the Store. Contacts handle Controlled and locally Unavailable goods only. They are absent every fifth calendar day: days 5, 10, 15, and so on.',
  'Smugglers have separate finite stocks at 5% of the corresponding legal target, with storage twice that target. Their spread is 0.30 − 0.01 × Trade tier − 0.02 × negative reputation magnitude ÷ 100, with a minimum of 0.15. Positive legal reputation and national permits do not reduce it.',
  'Every valid confirmed smuggler basket settles and then rolls 2d6 for inspection, within the deal’s one hour. Sold goods remain sold. A caught deal confiscates only its new purchases, not previously owned cargo. The quote shows possible fined balances; fines can create debt.',
  'Trade learning on sold cargo is calculated before inspection fines. Smuggling does not introduce arrest, imprisonment or a separate combat encounter.'
 ],table:{headers:['Roll','Cargo','Fine on total purchases + sales','Standing loss'],rows:[['2–6','New purchases confiscated','25%, rounded up; minimum 50 silver','−10 local attitude; −5 reputation'],['7–9','Retained','10%, rounded up; minimum 25 silver','−3 local attitude; −1 reputation'],['10–12','Retained','None','None']]}},
 {id:'memory',category:'Trading and markets',title:'Remembered prices and market events',paragraphs:[
  'The current market shows live prices. Journal Markets keeps dated observations for visited ports, including the trading terms at the time. Remote records do not update automatically. Smuggler records are separate and require an established, available contact.',
  'Use Compare ports to estimate a sale using a remembered stock curve. An old observation is not a guaranteed offer. Unvisited ports, unavailable goods and insufficient remembered storage cannot provide a usable quote. Older records without full curve data need refreshing before quantity estimates work.',
  'Local events can temporarily change prices: poor harvest ×1.20 Agricultural; bountiful harvest ×0.85 Agricultural; shipyard orders ×1.20 Materials; festival demand ×1.25 Luxury; merchant convoy ×0.85 Manufactured. Provisions are unaffected.',
  'The first ten days after the event system initializes are calm. Later ten-day periods may begin with a five-day event or stay calm. Events follow a fixed timeline for that captain; browsing or reloading does not reroll them. Events change prices, not stock recovery. Remote event notes remain historical observations.'
 ]},
 {id:'supplies',category:'Supplies and repairs',title:'Provisions, food conversion and fruit spoilage',paragraphs:[
  `Fruit loses ${FRUIT_DAILY_LOSS*100}% of its remaining quantity per game day, including time in port and encounter delays. Remaining fruit = quantity × 0.95 to the power of (elapsed hours ÷ 24). Only time actually played forward counts; old cargo is not aged retroactively on load. Provisions and other goods do not spoil in this version.`,
  'Spoilage removes the oldest cargo and its purchase records, frees space and weight, and appears in the log. The Cargo tab and voyage review forecast remaining fruit.',
  'At the Store, Prepare provisions consumes food already aboard. It costs 1 silver per input unit and takes one hour per 20 input units, rounded up. The output is available to feed the crew during preparation. Both ship capacities must fit the full output before those meals are deducted.',
  'Known input costs and preparation fees become part of the prepared provisions’ cost. Unknown costs stay unknown. Conversion and resale of converted provisions grant no Trade learning. Ordinary provisions may be cheaper than conversion; compare the full quote.'
 ],table:{headers:['Input unit','Provisions produced'],rows:Object.entries(RECIPES).map(([id,yieldAmount])=>[CATALOGUE[id as keyof typeof RECIPES].name,yieldAmount])}},
 {id:'repairs',category:'Supplies and repairs',title:'Hull, sails and repair materials',paragraphs:[
  'Full-service repairs at the Shipyard supply their own materials. Hull repair costs missing hull points × ship tier; sail repair costs missing percentage points × ship tier, rounded up. Each takes one hour per five restored points, rounded up. Upkeep continues during work.',
  'You can instead supply materials from your cargo for a lower cash bill. Hull repairs require Planks at 1 unit per 20 hull points and Tools at 1 per 100. Sail repairs require Sailcloth at 1 per 20 percentage points, Rope at 1 per 40, and Tools at 1 per 100. Fractional supply units are consumed.',
  'Material credit is the smaller of 60% of the full-service bill or the materials’ combined base value, each rounded down. You pay the rest. Compare the recorded purchase cost of your supplies with the credit; providing cargo is not always cheaper. You must have all materials and enough food for the full job before confirming.',
  'Replacing lost default mounted cannons costs 100 × ship tier per cannon and takes one hour per cannon. The restored guns must fit the weight limit. Trade cannon goods cannot yet be installed or converted into mounted guns.'
 ]},
 {id:'accounts',category:'Journal and planning',title:'Voyage accounts, cash flow and profit',paragraphs:[
  'Journal Finance automatically opens an account at departure. It contains one sea leg and destination business until the next departure closes it. Transactions before the first recorded departure are Initial port business. There are no multi-port expedition accounts.',
  'Cash flow records all silver entering or leaving the treasury. Buying unsold cargo changes cash but does not create a trading loss. Realized cargo margin subtracts the recorded cost of sold quantities from sale proceeds.',
  'Operating result combines cargo margin, quest and encounter income, then deducts operating expenses and recorded costs of food eaten, fruit spoiled, repair materials used and confiscated purchases. Preparation fees are included in prepared-food costs instead of being expensed twice. Ship exchanges are capital cash flow and are excluded from operating profit.',
  'Starting goods and old cargo may have unknown purchase costs. A complete margin or operating result is marked Unknown when required costs are missing; cash flow remains exact. The accounts are not a full net-worth statement: ship depreciation and the ship’s value lost on defeat are not calculated.',
  'Trade history stores dates, ports, quantities, exact totals, market channels and recorded purchase costs. Lines in one basket share a deal number. Old history is paginated, not discarded. Recording starts when this feature is available; past transactions are not reconstructed. Church checkpoints include all financial records.'
 ]},
 {id:'forecast',category:'Journal and planning',title:'Reading a departure forecast',paragraphs:[
  'Plan voyage at the Harbour includes Voyage finances. Compare normal winds, headwinds, and headwinds plus one day of delay. The estimate shows travel time, wages, food, spoilage, remembered cargo sale totals and commissions payable after delivery.',
  'Forecasts use your current manifest and only recorded destination prices and stock limits. They do not reveal live remote markets. Missing prices create an incomplete subtotal; missing costs or insufficient food prevent a complete estimated result.',
  'Provisions are reserved for crew use, not forecast as sale income. Remaining fractional cargo stays in inventory. Arrival trading and delivery hours, repairs, inspections, encounter losses and future price changes are excluded. These are planning estimates, not guaranteed payments or automatic trades.'
 ]},
 {id:'settings',category:'Getting started',title:'Themes and optional AI dialogue',paragraphs:[
  'Choose among three light and three dark themes in Settings → Preferences. The choice applies immediately and is remembered in this browser. The Wiki uses the same theme.',
  'AI is optional. Enter your NanoGPT key, load the model list, choose a model in the searchable selector, then enable AI dialogue. It rephrases predefined NPC text; the game controls actions, prices, rewards and rolls.',
  'The key is kept only in memory for this tab and clears on refresh. Requests go directly to NanoGPT and may use your balance. Clear key and disable AI removes the current key. Standard dialogue remains available without AI or if a request fails.'
 ]},
 {id:'catalogue',category:'Reference tables',title:'Goods catalogue: base prices, space and weight',paragraphs:[
  'These fictional base values are reference data, not current shop offers. Role, stock, skill, standing, events and quantity change actual prices. Goods with future operational uses can still be trade cargo when access allows.'
 ],table:{headers:['Goods','Category','Base silver','Space / unit','Weight / unit'],rows:ALL_GOODS.map(id=>{const g=CATALOGUE[id];return [g.name,g.category,g.base,g.space,g.weight];})}},
 {id:'specializations',category:'Reference tables',title:'Port specializations and legal access',paragraphs:['Export, Neutral and Import roles guide buying and selling. Controlled requires a national permit and sufficient attitude. Unavailable cannot be unlocked by a permit. This table describes the port design, not live prices or stock.'],table:{headers:['Goods',...PORTS.map(p=>p.name)],rows:ALL_GOODS.map(id=>[CATALOGUE[id].name,...PORTS.map(p=>{const r=marketRule(p.id,id);return unavailable(p.id,id)?'Unavailable':`${r.role} · ${r.controlled?'Controlled':'Open'}`;})])}},
 {id:'ship-catalogue',category:'Reference tables',title:'Ship catalogue: capacity, crew and price',paragraphs:['Listed prices are full purchase prices before your current ship’s trade-in. These are design limits, not the condition or performance of your owned vessel. Compare configurations at the Shipyard for all armament, hull and maneuverability statistics.'],table:{headers:['Ship','Tier','Price','Hold / weight','Crew min / optimal / max','Berths'],rows:SHIPS.map(s=>[s.label,s.tier,s.price,`${s.capacity} / ${s.deadweight}`,`${s.minCrew} / ${s.optimalCrew} / ${s.maxCrew}`,s.passengerCapacity])}},
 {id:'future',category:'Getting started',title:'What is not implemented yet',paragraphs:[
  'The current game focuses on sailing, trade, supplies and a single ship. Fleets, officers, treasure maps, beaches, changing flags and a navigable visual world map are future features.',
  'Persistent prisoners, prize fleets, cannon installation, detailed weapon catalogs, more perishable goods, and season-dependent sailing remain future features. Combat skill inputs are supported, but new training and reward paths beyond Sailing and Trade are not introduced by the battle release.',
  'Merchant procurement contracts, banking, loans, warehouses and owned businesses are not available. Current freight commissions provide their cargo; you do not source it from shops.'
 ]},
];
export const WIKI_CATEGORIES=[...new Set(WIKI.map(a=>a.category))];
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function searchWiki(query:string,category='All topics'){
 const words=normalize(query).trim().split(/\s+/).filter(Boolean);
 return WIKI.filter(a=>(category==='All topics'||a.category===category)&&words.every(word=>normalize([a.title,...a.paragraphs,...(a.tips??[]),...(a.table?.rows.flat()??[])].join(' ')).includes(word)));
}
