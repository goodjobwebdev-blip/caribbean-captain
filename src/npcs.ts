import type {Game,Action} from './game';
import {port,type PortId} from './world';
import {shipDefinition} from './ships';
import {attitude} from './commerce';

export const NPC_PLACES=['Store','Tavern','Harbour Master','Shipyard','Church','Blacksmith','Weaver','Brothel','Pharmacy','Fort & Garrison','Governor','Book Store','Bank','Customs House'] as const;
export type NpcPlace=typeof NPC_PLACES[number];
export type NpcMemory={visits:number;lastVisit:number;interactions:number;lastAction?:{text:string;hour:number};lastTrade?:{text:string;hour:number};completedWork:number};
export type NpcMemories=Partial<Record<string,NpcMemory>>;
export type Topic={id:string;choice:string;description:string};
const topic=(id:string,choice:string,description:string):Topic=>({id,choice,description});
export const TOPICS:Partial<Record<NpcPlace,readonly Topic[]>>={
 Store:[topic('quests','Have you any work for my ship?','Accept small and medium freight commissions and deliver Store commissions here.'),topic('trade','Let me see your wares.','Buy and sell cargo through a single trading basket.'),topic('supplies','My crew needs provisions.','Prepare provisions from food carried aboard; provisions can also be bought at the trading counter.'),topic('smuggler','I have business best kept off the books.','Use the existing smuggler market. A tavern introduction is required; inspections and fines remain possible.')],
 Tavern:[topic('lodging','I need hands for my ship—and perhaps a room.','Hire or release sailors, or rest at the tavern.'),topic('crew','My people could use your help.','Arrange training, medical care, or shore leave.'),topic('contact','Can you introduce me to someone discreet?','Arrange a local smuggler introduction.')],
 'Harbour Master':[topic('quests','Have you work for a reliable captain?','Accept letters, large freight, or passenger commissions. Deliver Harbour Master commissions here, including work accepted before freight moved to Stores.'),topic('permits','Let us put my papers and lookout in order.','Buy a national trade permit or a spyglass.')],
 Shipyard:[topic('repairs','My ship needs a practiced hand.','Repair hull and sails or replace missing cannons, including repairs with carried materials.'),topic('ships','Show me what ships you have for sale.','Compare ships and exchange the current vessel for another.')],
 Church:[topic('quests','Does the parish need passage or a helping hand?','Carry monks to another church or fulfil a local silver donation request.'),topic('checkpoints','Let us record this chapter of my voyage.','Create, restore, or delete church checkpoints.')],
 Pharmacy:[topic('quests','Have you remedies that need carrying overseas?','Deliver sealed medical supplies to another pharmacy.')],
 'Fort & Garrison':[topic('quests','Does another garrison need supplies?','Carry sealed ammunition and gunpowder to a garrison of the same nation.')],
 Governor:[topic('quests','May I carry a dispatch for your office?','Deliver an official dispatch to another governor of the same nation.')],
 Blacksmith:[topic('equipment','Show me your steel and armour.','Buy, sell, and equip the existing personal combat equipment.')],
 Weaver:[topic('clothing','I could use something fit for a captain.','Buy, sell, and equip clothing.')],
};
const occupations=['merchant','tavern keeper','harbour master','shipwright','church keeper','blacksmith','weaver','house keeper','apothecary','duty officer','governor’s secretary','bookseller','banker','customs officer'];
const styles=['warm, observant, speaks in practical nautical comparisons','dry-witted and brisk, never cruel','formal and meticulous, quietly proud of the town','patient and thoughtful, favors plain language','cheerful storyteller, keeps anecdotes brief'];
const scenes=['A ledger lies open beside a set of brass scales.','Lamplight catches on mugs behind the counter.','Neat stacks of manifests cover the desk.','Wood shavings curl across the workshop floor.','A candle flickers beside the open register.','The forge breathes heat into the workshop.','Lengths of cloth hang above a well-worn cutting table.','Quiet music drifts from beyond the entrance.','Dried herbs hang above rows of stoppered bottles.','Bootsteps echo beyond the guardroom door.','A clerk sets aside a carefully folded dispatch.','The room smells of paper and salt-damp leather.','A heavy ledger rests beside a locked strongbox.','A scale and a stack of manifests occupy the counter.'];
// Each row below is an authored roster in NPC_PLACES order. Never generated at runtime.
const NAMES = {
 "bridgetown": [
  "Elias Ward",
  "Martha Bell",
  "Edmund Price",
  "Thomas Reed",
  "Samuel Hale",
  "Isaac Flint",
  "Alice Mercer",
  "Rose Beckett",
  "Judith Moss",
  "Henry Pike",
  "Margaret Ashby",
  "Walter Finch",
  "Catherine Locke",
  "Arthur Shaw"
 ],
 "saint-pierre": [
  "Lucien Moreau",
  "Adele Dufour",
  "Etienne Caron",
  "Mathieu Girard",
  "Andre Noel",
  "Bastien Forge",
  "Claire Vautrin",
  "Celeste Aubry",
  "Jeanne Perrin",
  "Louis Marchand",
  "Helene Arnaud",
  "Remy Boucher",
  "Paul Delattre",
  "Antoine Leclerc"
 ],
 "willemstad": [
  "Pieter van Dijk",
  "Anika de Vries",
  "Willem Smit",
  "Hendrik Bakker",
  "Jan Visser",
  "Dirk Vos",
  "Mara de Wit",
  "Elsje Vermeer",
  "Lena Bos",
  "Karel Jansen",
  "Sofia Dekker",
  "Joost Meijer",
  "Cornelis Kok",
  "Floris Maas"
 ],
 "basse-terre": [
  "Gabriel Roux",
  "Manon Fabre",
  "Armand Laurent",
  "Pascal Dumont",
  "Pierre Colin",
  "Olivier Garnier",
  "Elise Lambert",
  "Ninon Chevalier",
  "Louise Renaud",
  "Jules Lefevre",
  "Colette Denis",
  "Hugo Brun",
  "Henri Marchal",
  "Victor Gautier"
 ],
 "capsterville": [
  "Marcel Duval",
  "Sabine Roche",
  "Philippe Beaumont",
  "Jacques Pelletier",
  "Claude Breton",
  "Nicolas Ferrand",
  "Camille Tessier",
  "Odette Pascal",
  "Margot Renard",
  "Charles Valette",
  "Aline Monnier",
  "Denis Lacroix",
  "Leon Mercier",
  "Rene Picard"
 ],
 "st-johns": [
  "Nathan Cole",
  "Agnes Turner",
  "George Abbott",
  "William Cooper",
  "Peter Wren",
  "Robert Harker",
  "Mary Sutton",
  "Grace Field",
  "Esther Hart",
  "Richard Frost",
  "Eleanor Kent",
  "Simon Page",
  "Francis Holt",
  "James North"
 ],
 "philipsburg": [
  "Adriaan de Groot",
  "Trijntje van Rijn",
  "Bram Mulder",
  "Gerrit Kuiper",
  "Abel de Jong",
  "Sander Smits",
  "Eva Willems",
  "Nele van Dam",
  "Mieke Prins",
  "Roelof Post",
  "Ida Kramer",
  "Leendert van Leeuwen",
  "Frederik Molenaar",
  "Tobias van Vliet"
 ],
 "san-juan": [
  "Diego Salazar",
  "Ines Rojas",
  "Alonso Vega",
  "Tomas Herrera",
  "Mateo Cruz",
  "Pedro Molina",
  "Isabel Santos",
  "Catalina Leon",
  "Beatriz Romero",
  "Rodrigo Fuentes",
  "Elena Navarro",
  "Martin Solis",
  "Francisco Ortega",
  "Luis Mendez"
 ],
 "santo-domingo": [
  "Rafael Cabrera",
  "Teresa Castillo",
  "Gonzalo Paredes",
  "Joaquin Serrano",
  "Nicolas Reyes",
  "Andres Vargas",
  "Lucia Medina",
  "Mercedes Rivas",
  "Ana Palacios",
  "Hernando Castro",
  "Dolores Aguilar",
  "Sebastian Mora",
  "Vicente Rubio",
  "Esteban Cordero"
 ],
 "port-au-prince": [
  "Emile Bertrand",
  "Lucile Masson",
  "Auguste Fournier",
  "Benoit Lambert",
  "Jean Baudin",
  "Gaston Valois",
  "Sylvie Guerin",
  "Juliette Benoit",
  "Marthe Rousseau",
  "Arnaud Delorme",
  "Solange Petit",
  "Felix Pichon",
  "Laurent Marin",
  "Tristan Rolland"
 ],
 "havana": [
  "Manuel Valdes",
  "Carmen Ochoa",
  "Baltasar Campos",
  "Ignacio Robles",
  "Gabriel Espinosa",
  "Javier Lozano",
  "Leonor Ponce",
  "Pilar Acosta",
  "Mariana Flores",
  "Cristobal Lara",
  "Juana Benitez",
  "Felipe Bravo",
  "Antonio Duran",
  "Fernando Montes"
 ],
 "santiago": [
  "Salvador Ibarra",
  "Rosa Galvez",
  "Miguel Zamora",
  "Arturo Peralta",
  "Pablo Vidal",
  "Julian Salas",
  "Clara Figueroa",
  "Antonia Luna",
  "Josefa Arias",
  "Ramiro Cortes",
  "Victoria Pardo",
  "Bernardo Nieto",
  "Domingo Cardenas",
  "Emilio Torres"
 ],
 "port-royal": [
  "Jonathan Briggs",
  "Bess Hawthorne",
  "Edward Collins",
  "Daniel Drake",
  "Joseph Marsh",
  "Benjamin Steele",
  "Anne Whitmore",
  "Frances Blake",
  "Ruth Alder",
  "Oliver Grant",
  "Elizabeth West",
  "Matthew Quill",
  "Nicholas Stone",
  "John Farrow"
 ],
 "tortuga": [
  "Guillaume Lenoir",
  "Madeleine Faucher",
  "Roland Deschamps",
  "Luc Aubert",
  "Michel Savary",
  "Adrien Charpentier",
  "Pauline Roussel",
  "Delphine Barre",
  "Simone Forest",
  "Alain Dumas",
  "Yvonne Vasseur",
  "Bernard Lemaire",
  "Serge Clement",
  "Patrice Favre"
 ],
 "san-jose": [
  "Leandro Marquez",
  "Soledad Costa",
  "Agustin Prieto",
  "Eduardo Beltran",
  "Benito Salcedo",
  "Ricardo Ferrer",
  "Amalia Dominguez",
  "Consuelo Pascual",
  "Esperanza Gil",
  "Federico Rosales",
  "Blanca Hidalgo",
  "Lorenzo Pastor",
  "Mariano Escobar",
  "Jacinto Peña"
 ]
} satisfies Record<PortId,string[]>;
export function npcAt(town:PortId,place:NpcPlace){
 const index=NPC_PLACES.indexOf(place);
 return {id:`${town}:${place}`,name:NAMES[town][index],occupation:occupations[index],voice:styles[(Object.keys(NAMES).indexOf(town)+index)%styles.length],scene:scenes[index]};
}
export function visitNpc(original:Game,place:NpcPlace):Game{
 const g=structuredClone(original),id=npcAt(g.port,place).id;
 const memory=(g.npcMemories??={})[id]??{visits:0,lastVisit:g.hours,interactions:0,completedWork:0};
 g.npcMemories[id]={...memory,visits:memory.visits+1,lastVisit:g.hours};return g;
}
const RESULTS:Partial<Record<Action['type'],string>>={
 trade:'The cargo deal is complete.',buy:'The purchase is complete.',sell:'The sale is complete.',
 hire:'A new sailor has joined your crew.',dismiss:'A sailor has been released from service.',sleep:'Your stay at the tavern is complete.',
 'train-crew':'The crew has finished its training.','medical-care':'The treatment is complete.','shore-leave':'Your crew has returned from shore leave.',
 repair:'The hull repairs are complete.','repair-sails':'The sail repairs are complete.','replace-cannons':'The missing default cannons have been replaced.',
 'material-repair':'The repair using your carried materials is complete.','buy-ship':'The ship exchange is complete.',
 'buy-permit':'Your national trade permit has been issued.','meet-smuggler':'Your local smuggler introduction is arranged.',
 accept:'Your commission has been accepted.',deliver:'Your completed commissions have been delivered.',
 'prepare-provisions':'Your provisions have been prepared.','buy-equipment':'Your equipment purchase is complete.','sell-equipment':'Your equipment sale is complete.',
 'equip-weapon':'Your weapon is equipped.','buy-apparel':'Your apparel purchase is complete.','sell-apparel':'Your apparel sale is complete.',
 'equip-apparel':'Your chosen garment is equipped.','unequip-apparel':'Your garment has been removed.',
};
export function rememberService(before:Game,after:Game,place:NpcPlace,action:Action){
 if(after.failed||after.voyage)return false;
 const donated=action.type==='accept'&&(after.archive?.length??0)>(before.archive?.length??0);
 let text=donated?'Your parish donation is received with thanks.':RESULTS[action.type];if(!text)return false;
 if(action.type==='trade'&&action.channel==='smuggler')text='The discreet exchange and its inspection are resolved. Consult the transaction record for any confiscations or fines.';
 const id=npcAt(after.port,place).id,memory=(after.npcMemories??={})[id]??{visits:1,lastVisit:before.hours,interactions:0,completedWork:0};
 memory.interactions++;memory.lastAction={text,hour:after.hours};
 if(['trade','buy','sell','buy-equipment','sell-equipment','buy-apparel','sell-apparel','buy-ship'].includes(action.type))memory.lastTrade={text,hour:after.hours};
 if(action.type==='deliver')memory.completedWork+=before.contracts.length-after.contracts.length;
 if(donated)memory.completedWork++;
 after.npcMemories[id]=memory;return true;
}
export function dialogueContext(g:Game,place:NpcPlace,topicId:string|null,reaction=false){
 const npc=npcAt(g.port,place),memory=g.npcMemories?.[npc.id],topics=TOPICS[place]??[],topic=topics.find(t=>t.id===topicId);
 const phase=reaction&&memory?.lastAction?'reaction':topic?'service':'greeting';
 const fallback=phase==='reaction'?`${memory!.lastAction!.text} ${npc.name} gives you a brief nod.`:topic?`“Of course, Captain.” ${topic.description}`:topics.length?
 `${npc.scene} ${npc.name} looks up as you approach. “${(memory?.visits??0)>1?'Welcome back, Captain.':'Welcome, Captain.'} ${memory?.completedWork?'Your completed work is remembered here.':memory?.lastTrade?'I remember our last dealings.':'What brings you through my door?'}”`:
 `${npc.scene} ${npc.name} greets you at the entrance. “This office is not receiving business yet, Captain.”`;
 return {npc,town:port(g.port).name,phase,canonical:fallback,availableServices:topics.map(t=>t.description),selectedService:topic?.description??null,
 memory:memory??null,conditions:{attitude:attitude(g),hullDamaged:!!g.ship&&g.ship.hullPoints<shipDefinition(g.ship.configurationId).maxHull*.75,sailsDamaged:(g.ship?.sailCondition??100)<75,lowProvisions:g.provisions<g.crew*2,crewMorale:g.crewState?.morale??50}};
}
export type DialogueContext=ReturnType<typeof dialogueContext>;

export function rememberCheckpoint(g:Game){
 const id=npcAt(g.port,'Church').id,memory=(g.npcMemories??={})[id]??{visits:1,lastVisit:g.hours,interactions:0,completedWork:0};
 memory.interactions++;memory.lastAction={text:'This chapter of your voyage has been recorded.',hour:g.hours};g.npcMemories[id]=memory;
}
