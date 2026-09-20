import type {Game,PortId} from './game';
import type {GoodId} from './goods';
import type {Channel} from './commerce';
import {cargoCost} from './trade';
export type EntryKind='shore-leave'|'training'|'medical'|'equipment'|'purchase'|'sale'|'wages'|'provisions-used'|'spoilage'|'materials-used'|'confiscation'|'repairs'|'recruiting'|'lodging'|'permit'|'contact'|'preparation'|'quest'|'fine'|'ransom'|'loot'|'ship-purchase'|'ship-sale'|'recovery';
export const ENTRY_NAMES:Record<EntryKind,string>={'shore-leave':'Shore leave',training:'Crew training',medical:'Medical care',equipment:'Captain equipment',recovery:'Rescue and recovery',purchase:'Cargo purchase',sale:'Cargo sale',wages:'Crew wages','provisions-used':'Provisions consumed',spoilage:'Spoilage','materials-used':'Repair materials',confiscation:'Confiscated purchases',repairs:'Shipyard bill',recruiting:'Recruitment',lodging:'Lodging',permit:'Trade permit',contact:'Smuggler introduction',preparation:'Food preparation',quest:'Quest payment',fine:'Inspection fine',ransom:'Pirate payment',loot:'Encounter proceeds','ship-purchase':'Ship purchase','ship-sale':'Ship sale'};
export type FinanceEntry={id:number;account:number|null;hour:number;port:PortId;atSea:boolean;kind:EntryKind;cash:number;cost?:number|null;unknownQuantity?:number;good?:GoodId;quantity?:number;channel?:Channel;deal?:number};
export type VoyageAccount={plannedTo?:PortId;id:number;from:PortId;to:PortId;departure:number;arrival?:number;closed?:number;openingSilver:number;currentSilver:number;status:'at-sea'|'in-port'|'closed'|'failed';partial:boolean};
export type Finances={started:number;openingSilver:number;entries:FinanceEntry[];voyages:VoyageAccount[];active:number|null};
export function ensureFinances(g:Game){
 if(g.finances)return;
 g.finances={started:g.hours,openingSilver:g.silver,entries:[],voyages:[],active:null};
 if(g.voyage){beginAccount(g,g.voyage.to,true);if(g.failed)finishAccounting(g);}
}
export function beginAccount(g:Game,to:PortId,partial=false){
 ensureFinances(g);const f=g.finances!;
 const previous=f.voyages.find(v=>v.id===f.active);if(previous){previous.closed=g.hours;previous.currentSilver=g.silver;previous.status='closed';}
 const id=f.voyages.length+1;f.active=id;f.voyages.push({id,from:g.port,to,departure:g.hours,openingSilver:g.silver,currentSilver:g.silver,status:'at-sea',partial});
}
export function finishAccounting(g:Game){
 const f=g.finances;if(!f)return;const v=f.voyages.find(v=>v.id===f.active);if(!v)return;
 v.currentSilver=g.silver;
 if(g.failed){v.status='failed';v.closed=g.hours;}
 else if(!g.voyage){v.status='in-port';v.arrival??=g.hours;}
}
export function record(g:Game,kind:EntryKind,cash:number,extra:Partial<FinanceEntry>={}){
 ensureFinances(g);const f=g.finances!;
 f.entries.push({...extra,id:f.entries.length+1,account:f.active,hour:g.hours,port:g.port,atSea:!!g.voyage,kind,cash});
}
export function recordConsumption(g:Game,kind:EntryKind,good:GoodId,quantity:number){
 if(quantity<=1e-9)return;const c=cargoCost(g,good,quantity);record(g,kind,0,{good,quantity,cost:c.unknown>1e-8?null:c.total,unknownQuantity:c.unknown});
}
export function recordTrade(g:Game,before:Game,lines:{good:GoodId;side:'buy'|'sell';quantity:number;total:number}[],channel:Channel){
 ensureFinances(g);const deal=g.finances!.entries.length+1;
 for(const l of lines){const cost=cargoCost(before,l.good,l.quantity);record(g,l.side==='buy'?'purchase':'sale',l.side==='buy'?-l.total:l.total,{deal,good:l.good,quantity:l.quantity,channel,...(l.side==='sell'?{cost:cost.unknown>1e-8?null:cost.total,unknownQuantity:cost.unknown}:{})});}
}
const CASH_COSTS:EntryKind[]=['shore-leave','training','medical','equipment','wages','repairs','recruiting','lodging','permit','contact','fine','ransom','recovery'];
const INVENTORY_COSTS:EntryKind[]=['provisions-used','spoilage','materials-used','confiscation'];
export function financialSummary(entries:FinanceEntry[]){
 const sales=entries.filter(e=>e.kind==='sale'),costs=entries.filter(e=>INVENTORY_COSTS.includes(e.kind));
 const revenue=sales.reduce((n,e)=>n+e.cash,0),soldCost=sales.reduce((n,e)=>n+(e.cost??0),0),unknownSales=sales.some(e=>e.cost===null);
 const otherIncome=entries.filter(e=>e.kind==='quest'||e.kind==='loot').reduce((n,e)=>n+e.cash,0),cashExpenses=-entries.filter(e=>CASH_COSTS.includes(e.kind)).reduce((n,e)=>n+e.cash,0),usedCost=costs.reduce((n,e)=>n+(e.cost??0),0);
 const knownResult=revenue-soldCost+otherIncome-cashExpenses-usedCost;
 return {cashFlow:entries.reduce((n,e)=>n+e.cash,0),revenue,soldCost,unknownSales,tradingMargin:unknownSales?null:revenue-soldCost,otherIncome,cashExpenses,usedCost,unknownCosts:costs.some(e=>e.cost===null),knownResult,operatingResult:unknownSales||costs.some(e=>e.cost===null)?null:knownResult};
}
