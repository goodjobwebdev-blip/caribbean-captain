import type {Game} from './game';
import {BATTERIES,CALIBRES,SAILS,gunFit,gunUnitPrice,maxCalibre,reinforcementPrice,resolveShip,sailPrice,shipDefinition,type Battery,type GunType,type Calibre,type SailType} from './ships';
import {loadBreakdown,shipPerformance} from './performance';
export type Refit={kind:'guns';battery:Battery;gunType:GunType;calibre:Calibre;count:number}|{kind:'sails';sailType:SailType}|{kind:'hull'};
export type RefitAction={type:'refit';change:Refit;expected:string};
export function refitQuote(g:Game,change:Refit){
 const current=resolveShip(g),ship=structuredClone(current),spec=shipDefinition(ship.configurationId),errors:string[]=[];
 let purchase=0,buyback=0,hours=1;
 if(g.failed||g.voyage||g.battle)errors.push('Refitting is available only in port outside combat.');
 if(change.kind==='guns'){
  if(!BATTERIES.includes(change.battery)||!['cannon','culverin'].includes(change.gunType)||!CALIBRES.includes(change.calibre)||!Number.isInteger(change.count)||change.count<0||change.count>spec.cannonCapacity[change.battery]||change.calibre>maxCalibre(spec))errors.push('Choose a supported calibre and a whole gun count within this battery’s capacity.');
  else{
   const b=change.battery,old=gunFit(current,b),count=current.cannons[b],next={type:change.gunType,calibre:change.calibre,fitted:change.count},same=old.type===next.type&&old.calibre===next.calibre;
   const removed=same?Math.max(0,count-change.count):count,added=same?Math.max(0,change.count-count):change.count;
   purchase=added*gunUnitPrice(current,next);buyback=Math.floor(removed*gunUnitPrice(current,old)*.6);hours=Math.max(1,removed+added);
   if(same&&count===change.count&&old.fitted===change.count)errors.push('This battery already has that outfit.');
   ship.gunFits={...ship.gunFits,[b]:next};ship.cannons[b]=change.count;
  }
 }else if(change.kind==='sails'){
  if(!Object.hasOwn(SAILS,change.sailType))errors.push('Choose a valid sail set.');
  else{
   if(change.sailType===(current.sailType??'standard')&&current.sailCondition===100)errors.push('These sails are already fitted and undamaged.');
   purchase=sailPrice(current,change.sailType);buyback=Math.floor(sailPrice(current)*.6*current.sailCondition/100);hours=8;ship.sailType=change.sailType;ship.sailCondition=100;
  }
 }else if(change.kind==='hull'){
  if(current.reinforcedHull)errors.push('This hull is already reinforced.');
  purchase=reinforcementPrice(current);hours=24;ship.reinforcedHull=true;
 }else errors.push('Unknown refit.');
 const balance=purchase-buyback,wages=g.crew*2*hours/24,people=g.crew+g.contracts.filter(c=>c.type==='Passengers').reduce((n,c)=>n+c.amount,0),food=people*hours/24;
 if(g.silver-balance+1e-8<wages)errors.push('Keep enough silver for the refit and crew wages.');
 if(g.provisions+1e-8<food)errors.push('Keep enough provisions for the entire refit.');
 if(loadBreakdown(g,ship).total>spec.deadweight+1e-8)errors.push('The refitted ship would exceed its deadweight capacity.');
 return {ship,purchase,buyback,balance,hours,wages,food,errors,performance:shipPerformance(g,ship),token:JSON.stringify([g,change])};
}
