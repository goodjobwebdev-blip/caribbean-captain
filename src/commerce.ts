import type {Game,PortId} from './game';
import {CATALOGUE,type GoodId} from './goods';
export type Nation='England'|'France'|'Dutch'|'Spain'|'Pirates';
export type Channel='legal'|'smuggler';
export type Commerce={seed:number;started:number;permits:Partial<Record<Nation,boolean>>;attitude:Partial<Record<Nation,number>>;reputation:number;contacts:Partial<Record<PortId,boolean>>};
export const nationOf=(p:PortId):Nation=>({bridgetown:'England','saint-pierre':'France',willemstad:'Dutch'} as const)[p];
export const PERMIT_PRICE=750;
export const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export const attitude=(g:Game,p:PortId=g.port)=>g.economy?.commerce?.attitude[nationOf(p)]??0;
export const reputation=(g:Game)=>g.economy?.commerce?.reputation??0;
export const hasPermit=(g:Game,p:PortId=g.port)=>!!g.economy?.commerce?.permits[nationOf(p)];
export function changeStanding(g:Game,local:number,global:number){const c=g.economy!.commerce!,nation=nationOf(g.port);c.attitude[nation]=clamp((c.attitude[nation]??0)+local,-100,100);c.reputation=clamp(c.reputation+global,-100,100);}
export const unavailable=(p:PortId,id:GoodId)=>(p==='bridgetown'&&id==='jewelry')||(p==='saint-pierre'&&id==='perfume');
export const contraband=(id:GoodId)=>['weapons','gunpowder','cannons','bombs'].includes(id);
export const smuggled=(p:PortId,id:GoodId)=>contraband(id)||unavailable(p,id);
export const smugglerOpen=(g:Game)=>Math.floor(g.hours/24)%5!==4;
export function accessProblem(g:Game,id:GoodId,channel:Channel='legal'){
 if(channel==='smuggler'){
  if(!g.economy?.commerce?.contacts[g.port])return 'Ask for a smuggler contact at the tavern.';
  if(!smugglerOpen(g))return 'The smugglers are absent today. Try tomorrow.';
  if(!smuggled(g.port,id))return 'The smugglers do not handle these goods.';
  return null;
 }
 if(unavailable(g.port,id))return 'Unavailable through this port’s legal market.';
 if(id!=='provisions'&&attitude(g)<=-60)return 'Local authorities have barred you from legal trade. Complete commissions to rebuild trust.';
 if(contraband(id)&&(!hasPermit(g)||attitude(g)<-30))return 'Requires a national trade permit and local attitude of at least −30.';
 return null;
}
export type MarketEvent={title:string;category:string;multiplier:number;start:number;end:number};
const EVENTS=[
 {title:'Poor harvest',category:'Agricultural',multiplier:1.2},
 {title:'Bountiful harvest',category:'Agricultural',multiplier:.85},
 {title:'Shipyard orders',category:'Materials',multiplier:1.2},
 {title:'Festival demand',category:'Luxury',multiplier:1.25},
 {title:'Merchant convoy',category:'Manufactured',multiplier:.85},
] as const;
/** Fixed seed, local 10-day periods and no travel RNG consumption. First period stays calm. */
export function localEvent(g:Game,p:PortId=g.port):MarketEvent|null{
 const c=g.economy?.commerce;if(!c)return null;
 const period=Math.floor((g.hours-c.started)/240);if(period<1)return null;
 let hash=(c.seed^Math.imul(period,2654435761)^Math.imul(['bridgetown','saint-pierre','willemstad'].indexOf(p)+1,1597334677))>>>0;
 hash=Math.imul(hash^(hash>>>16),2246822507)>>>0;
 if(hash%4===0)return null;
 const start=c.started+period*240,end=start+120;if(g.hours>=end)return null;
 return {...EVENTS[(hash>>>3)%EVENTS.length],start,end};
}
export function eventFactor(g:Game,id:GoodId,p:PortId=g.port){const e=localEvent(g,p);return e&&CATALOGUE[id].category===e.category?e.multiplier:1;}
