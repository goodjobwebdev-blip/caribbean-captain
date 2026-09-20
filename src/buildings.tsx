export type PlannedBuilding={
 name:string;
 description:string;
 speaker:string;
 commerce:string[];
 services:string[];
 quests:string[];
};

export const PLANNED_BUILDINGS=[
 {name:'Brothel',description:'Music and whispered conversations spill into the street. Captains come here for diversion, restored spirits, and rumours that respectable offices never record.',speaker:'A word with the house keeper',commerce:['No buying or selling planned.'],services:['Heal the captain.','Raise crew morale.'],quests:['Buy a treasure map.','Learn about wealthy merchants worth intercepting.','Find ransom targets and bounty hunters.']},
 {name:'Pharmacy',description:'Shelves of dried herbs, glass bottles, and careful remedies line the walls. The apothecary serves sailors who need more than an evening of rest.',speaker:'A word with the apothecary',commerce:['Buy potions and medicinal herbs.','Sell potions and medicinal herbs.'],services:['Heal the captain.','Treat injured or ill crew.'],quests:['Deliver potions, herbs, and other medical supplies.']},
 {name:'Blacksmith',description:'Hammer blows ring over the hiss of hot iron. Weapons and armour hang beside work ordered for sailors, soldiers, and private captains.',speaker:'A word with the blacksmith',commerce:['Buy personal weapons and armour.','Sell personal weapons and armour.'],services:['No services planned.'],quests:['No quests planned.']},
 {name:'Fort & Garrison',description:'Soldiers watch the harbour from stone walls and heavy batteries. The garrison needs supplies, intelligence, and captains willing to hunt dangerous enemies.',speaker:'A word with the duty officer',commerce:['No buying or selling planned.'],services:['Hand over captured pirates.','Hand over captured enemies of the controlling nation.'],quests:['Hunt wanted captains.','Resupply the fort with ammunition and gunpowder from another colony.','Patrol nearby waters for pirates.']},
 {name:'Governor',description:'The colony’s highest office grants audiences sparingly. Official commissions promise greater rewards, greater political consequences, and greater danger.',speaker:'A word with the governor’s secretary',commerce:['No buying or selling planned.'],services:['No services planned.'],quests:['Hunt high-value targets for a greater reward.','Patrol waters for pirates.','Deliver very important letters.','Spy in hostile ports.','Capture ships carrying specified loot.']},
 {name:'Book Store',description:'Charts, journals, manuals, and rare volumes crowd the shelves. The right book can turn hard-won knowledge into practical mastery.',speaker:'A word with the bookseller',commerce:['Buy skill books.','Sell skill books.'],services:['Read level-gated books to earn skill points.'],quests:['No quests planned.']},
 {name:'Bank',description:'Ledgers, locked strongboxes, and armed clerks protect fortunes gathered across the islands. Credit is available to captains whose prospects justify the risk.',speaker:'A word with the banker',commerce:['Buy and sell gold coins, jewelry, precious minerals, and precious metals.','Rarely offer extremely expensive weapons.'],services:['Deposit silver and valuables.','Take secured or reputation-based credit.'],quests:['Seize money from debtors.','Seize ships pledged against unpaid debts.']},
 {name:'Weaver',description:'Bolts of cloth and finished garments fill a bright workshop. Sailors and captains can trade practical clothing or finer dress suited to wealth and status.',speaker:'A word with the weaver',commerce:['Buy clothing.','Sell clothing.'],services:['No services planned.'],quests:['No quests planned.']},
 {name:'Customs House',description:'Clerks inspect manifests beneath the eyes of armed customs officers. Legal cargo, captured vessels, duties, and smuggling offences all pass through this office.',speaker:'A word with the customs officer',commerce:['No direct buying or selling planned.'],services:['Declare cargo and pay duties.','Clear captured vessels and disputed cargo.','Resolve confiscations and customs penalties.'],quests:['Inspect suspicious ships.','Carry out anti-smuggling patrols.','Recover or deliver confiscated cargo.']}
] as const satisfies readonly PlannedBuilding[];

export type PlannedBuildingName=typeof PLANNED_BUILDINGS[number]['name'];
export const plannedBuilding=(name:string)=>PLANNED_BUILDINGS.find(building=>building.name===name);

function Capability({title,items}:{title:string;items:readonly string[]}){
 return <section><div className="section-line"><h2>{title}</h2><span className="tbd-badge">TBD</span></div><ul>{items.map(item=><li key={item}>{item}</li>)}</ul></section>;
}

export function BuildingPlaceholder({building}:{building:PlannedBuilding}){
 return <div className="building-placeholder" aria-label={`${building.name} planned features`}>
  <div className="planned-notice"><span className="tbd-badge">BUILDING TBD</span><p>This location is visible for planning only. Its commerce, services, and quests are not actionable yet.</p></div>
  <div className="building-capabilities"><Capability title="Buy and sell" items={building.commerce}/><Capability title="Services" items={building.services}/><Capability title="Quests" items={building.quests}/></div>
 </div>;
}
