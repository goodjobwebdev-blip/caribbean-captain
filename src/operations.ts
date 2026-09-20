import type {Game} from './game';
import {CATALOGUE,type GoodId} from './goods';
import {aboard,cargoCost,consumeLots,ensureEconomy} from './trade';
import {cargoSpaceUsed,loadBreakdown} from './performance';
import {resolveShip,shipDefinition,hullRepairQuote,sailRepairQuote} from './ships';
export const FRUIT_DAILY_LOSS=.05;
export const fruitAfter=(quantity:number,hours:number)=>quantity*(1-FRUIT_DAILY_LOSS)**(Math.max(0,hours)/24);
/** Only elapsed game time spoils cargo. Oldest cargo and its provenance are removed together. */
export function spoilCargo(g:Game,hours:number){
 const before=aboard(g,'fruit');if(before<=0||hours<=0)return 0;
 const after=fruitAfter(before,hours),loss=before-after;consumeLots(g,'fruit',loss);g.cargo.fruit=after;return loss;
}
export const RECIPES={grain:4,fruit:3,'salted-fish':6,'salted-meat':8} as const;
export type FoodGood=keyof typeof RECIPES;
export type RepairKind='hull'|'sails';
export const people=(g:Game)=>g.crew+g.contracts.filter(c=>c.type==='Passengers').reduce((n,c)=>n+c.amount,0);
function commonProblems(g:Game){const errors:string[]=[];if(g.failed||g.voyage)errors.push('This service is only available in port.');return errors;}
export function provisionQuote(original:Game,good:FoodGood,quantity:number){
 const g=structuredClone(original);ensureEconomy(g);const errors=commonProblems(g);
 const valid=Object.hasOwn(RECIPES,good)&&Number.isSafeInteger(quantity)&&quantity>0&&quantity<=200000;
 if(!valid)errors.push('Choose a valid food and whole quantity.');
 const q=valid?quantity:0,output=q*(valid?RECIPES[good]:0),fee=q,hours=Math.ceil(q/20);
 const cost=valid?cargoCost(g,good,q):{known:0,unknown:0,total:0,average:null};
 if(valid&&aboard(g,good)+1e-8<q)errors.push('Not enough food cargo aboard.');
 if(g.silver<fee)errors.push('Not enough silver for preparation.');
 if(valid)g.cargo[good]=aboard(g,good)-q;
 g.provisions+=output;
 const spec=shipDefinition(resolveShip(g).configurationId),space=cargoSpaceUsed(g),weight=loadBreakdown(g).total,food=people(g)*hours/24;
 if(space>spec.capacity+1e-8)errors.push('Prepared provisions would exceed hold capacity.');
 if(weight>spec.deadweight+1e-8)errors.push('Prepared provisions would exceed deadweight capacity.');
 if(g.provisions+1e-8<food)errors.push('The prepared food is insufficient for the preparation time.');
 return {quantity:q,output,fee,hours,cost,space,weight,food,finalProvisions:g.provisions-food,finalSilver:g.silver-fee-g.crew*2*hours/24,errors,token:JSON.stringify([original,'prepare-provisions',good,quantity])};
}
export function prepareProvisions(g:Game,good:FoodGood,quantity:number){
 const q=provisionQuote(g,good,quantity);if(q.errors.length)throw new Error(q.errors.join(' '));ensureEconomy(g);
 consumeLots(g,good,quantity);g.cargo[good]-=quantity;g.provisions+=q.output;g.silver-=q.fee;
 const lots=g.economy!.lots.provisions??=[];
 const knownOutput=q.output*q.cost.known/quantity,unknownOutput=q.output-knownOutput;
 if(knownOutput>1e-9)lots.push({quantity:knownOutput,paidPerUnit:(q.cost.total+q.fee*q.cost.known/quantity)/knownOutput});
 if(unknownOutput>1e-9)lots.push({quantity:unknownOutput});
 g.economy!.lots.provisions=lots;return q;
}
export function materialRepairQuote(g:Game,kind:RepairKind){
 const ship=resolveShip(g),spec=shipDefinition(ship.configurationId),errors=commonProblems(g);
 const damage=kind==='hull'?spec.maxHull-ship.hullPoints:100-ship.sailCondition;
 if(!['hull','sails'].includes(kind))errors.push('Unknown repair.');
 if(damage<=0)errors.push('No repair is needed.');
 const materials:{good:GoodId;quantity:number}[]=kind==='hull'?[{good:'planks',quantity:damage/20},{good:'tools',quantity:damage/100}]:[{good:'sailcloth',quantity:damage/20},{good:'rope',quantity:damage/40},{good:'tools',quantity:damage/100}];
 const full=kind==='hull'?hullRepairQuote(ship):sailRepairQuote(ship),baseValue=materials.reduce((n,m)=>n+m.quantity*CATALOGUE[m.good].base,0),discount=Math.min(Math.floor(full*.6),Math.floor(baseValue+1e-9)),silver=full-discount,hours=Math.ceil(damage/5);
 for(const m of materials)if(aboard(g,m.good)+1e-8<m.quantity)errors.push(`Need ${m.quantity.toFixed(2)} ${CATALOGUE[m.good].name} aboard.`);
 if(discount<=0&&damage>0)errors.push('This repair is too small for a material discount. Use full service.');
 if(g.silver<silver)errors.push('Not enough silver for the remaining repair bill.');
 if(g.provisions+1e-8<people(g)*hours/24)errors.push('Keep enough provisions for the full repair time.');
 const costs=materials.map(m=>cargoCost(g,m.good,m.quantity)),knownCost=costs.every(c=>c.unknown<1e-8)?costs.reduce((n,c)=>n+c.total,0):null;
 return {kind,materials,full,discount,silver,hours,knownCost,finalSilver:g.silver-silver-g.crew*2*hours/24,errors,token:JSON.stringify([g,'material-repair',kind])};
}
export function supplyRepairMaterials(g:Game,kind:RepairKind){
 const quote=materialRepairQuote(g,kind);if(quote.errors.length)throw new Error(quote.errors.join(' '));ensureEconomy(g);
 for(const m of quote.materials){consumeLots(g,m.good,m.quantity);g.cargo[m.good]=Math.max(0,aboard(g,m.good)-m.quantity);}
 g.silver-=quote.silver;return quote;
}
