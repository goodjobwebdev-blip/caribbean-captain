import type {Game,Good} from './game';
import {resolveShip,shipDefinition,totalCannons,type OwnedShip} from './ships';
import {sailingProgress} from './skills';
/** Fictional units. These extend the current goods, not the future market system. */
export const GOODS_LOAD:Record<Good|'provisions',{space:number;weight:number}>={
 sugar:{space:1,weight:2},rum:{space:1,weight:1.5},cloth:{space:1,weight:.5},provisions:{space:1,weight:.25},
};
export const PERSON_WEIGHT=1;
export const CANNON_WEIGHT=5;
export const FREIGHT_WEIGHT=1;
const clamp=(n:number,min=0,max=1)=>Math.max(min,Math.min(max,n));
export function cargoSpaceUsed(g:Game){
 return Object.entries(g.cargo).reduce((sum,[good,amount])=>sum+amount*GOODS_LOAD[good as Good].space,0)+g.provisions*GOODS_LOAD.provisions.space+g.contracts.filter(c=>c.type==='Freight').reduce((sum,c)=>sum+c.amount,0);
}
export function loadBreakdown(g:Game,ship:OwnedShip=resolveShip(g)){
 const trade=Object.entries(g.cargo).reduce((sum,[good,amount])=>sum+amount*GOODS_LOAD[good as Good].weight,0);
 const freight=g.contracts.filter(c=>c.type==='Freight').reduce((sum,c)=>sum+c.amount*FREIGHT_WEIGHT,0);
 const passengers=g.contracts.filter(c=>c.type==='Passengers').reduce((sum,c)=>sum+c.amount,0)*PERSON_WEIGHT;
 const provisions=g.provisions*GOODS_LOAD.provisions.weight;
 const crew=g.crew*PERSON_WEIGHT,captain=PERSON_WEIGHT,cannons=totalCannons(ship.cannons)*CANNON_WEIGHT;
 return {trade,freight,provisions,crew,passengers,captain,cannons,total:trade+freight+provisions+crew+passengers+captain+cannons};
}
export function shipPerformance(g:Game,ship:OwnedShip=resolveShip(g)){
 const spec=shipDefinition(ship.configurationId),weight=loadBreakdown(g,ship);
 const loadRatio=weight.total/spec.deadweight;
 // Light loading (up to 20%) preserves the current starting sloop's pace.
 const loaded=clamp((loadRatio-.2)/.8);
 const loadSpeed=1-.25*loaded,loadManeuver=1-.35*loaded;
 const hullRatio=clamp(ship.hullPoints/spec.maxHull),sailRatio=clamp(ship.sailCondition/100);
 const hull=hullRatio===0?0:.5+.5*hullRatio;
 const sails=sailRatio===0?0:.2+.8*sailRatio;
 const crew=g.crew<spec.minCrew?0:spec.optimalCrew===spec.minCrew?1:.6+.4*clamp((g.crew-spec.minCrew)/(spec.optimalCrew-spec.minCrew));
 const mastery=1+sailingProgress(g.skills).tier*.05;
 const speed=spec.speed*loadSpeed*hull*sails*crew*mastery;
 const maneuverability=spec.maneuverability*loadManeuver*hull*sails*crew;
 return {weight,loadRatio,availableDeadweight:spec.deadweight-weight.total,overloaded:weight.total>spec.deadweight+1e-8,
  factors:{loadSpeed,loadManeuver,hull,sails,crew,mastery},speed,maneuverability};
}
export function sailingProblems(g:Game):string[]{
 const ship=resolveShip(g),spec=shipDefinition(ship.configurationId),performance=shipPerformance(g,ship),problems:string[]=[];
 if(cargoSpaceUsed(g)>spec.capacity+1e-8)problems.push('Reduce your hold load before sailing.');
 if(g.crew<spec.minCrew)problems.push(`You need at least ${spec.minCrew} sailors.`);
 if(ship.hullPoints<=0)problems.push('Repair your hull before sailing.');
 if(ship.sailCondition<=0)problems.push('Repair your sails before sailing.');
 if(performance.overloaded)problems.push(`Overloaded by ${(-performance.availableDeadweight).toFixed(1)} weight units. Sell cargo or deliver freight before sailing.`);
 return problems;
}
