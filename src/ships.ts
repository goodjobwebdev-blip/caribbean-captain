/** Ship balance values are fictional and provisional. Labels grant no bonuses. */
export type ShipClass = 'Merchant' | 'Universal' | 'Warship';
export const BATTERIES = ['port','starboard','bow','stern'] as const;
export type Battery = typeof BATTERIES[number];
export type Batteries = Record<Battery,number>;
export type ShipDefinition = {
 id:string; hullType:string; label:string; shipClass:ShipClass; tier:number; price:number;
 maxHull:number; speed:number; maneuverability:number; capacity:number; deadweight:number;
 minCrew:number; optimalCrew:number; maxCrew:number; passengerCapacity:number; protection:number;
 cannonCapacity:Batteries; defaultCannons:Batteries;
};
export type OwnedShip = {id:string; name:string; configurationId:string; hullPoints:number; sailCondition:number; cannons:Batteries};
const guns=(port:number,starboard:number,bow=0,stern=0):Batteries=>({port,starboard,bow,stern});
function define(id:string,hullType:string,shipClass:ShipClass,tier:number,price:number,maxHull:number,speed:number,maneuverability:number,capacity:number,deadweight:number,crew:[number,number,number],passengerCapacity:number,protection:number,cannonCapacity:Batteries,defaultCannons:Batteries):ShipDefinition {
 return {id,hullType,label:`${shipClass} ${hullType}`,shipClass,tier,price,maxHull,speed,maneuverability,capacity,deadweight,minCrew:crew[0],optimalCrew:crew[1],maxCrew:crew[2],passengerCapacity,protection,cannonCapacity,defaultCannons};
}
const anchors:ShipDefinition[]=[
 define('tartana-universal','Tartana','Universal',1,4000,60,.95,85,140,230,[3,5,10],3,5,guns(1,1),guns(1,1)),
 define('cutter-universal','Cutter','Universal',1,6000,70,1.30,95,100,200,[3,6,12],3,6,guns(2,2,0,1),guns(1,1)),
 define('sloop-universal','Sloop','Universal',2,12000,100,1.20,80,300,500,[5,10,20],6,10,guns(4,4,0,2),guns(2,2)),
 define('schooner-universal','Schooner','Universal',2,14000,110,1.45,85,240,450,[6,12,24],9,10,guns(4,4,1,1),guns(2,2)),
 define('brigantine-universal','Brigantine','Universal',3,30000,180,1.30,70,500,850,[10,20,40],12,15,guns(7,7,1,1),guns(4,4)),
 define('fluyt-merchant','Fluyt','Merchant',3,36000,200,1.00,45,900,1300,[8,16,32],12,12,guns(4,4,0,2),guns(2,2)),
 define('brig-universal','Brig','Universal',4,65000,300,1.20,60,800,1500,[16,32,64],18,22,guns(10,10,2,2),guns(6,6,1,1)),
 define('corvette-warship','Corvette','Warship',4,80000,320,1.45,75,350,1200,[20,45,90],6,25,guns(12,12,2,2),guns(10,10,1,1)),
 define('merchantman-merchant','Merchantman','Merchant',4,75000,340,1.05,40,1500,2200,[14,28,56],24,18,guns(6,6,0,2),guns(3,3)),
 define('galleon-universal','Galleon','Universal',5,150000,550,1.00,35,1800,3200,[30,65,130],30,30,guns(18,18,2,4),guns(12,12,1,2)),
 define('frigate-warship','Frigate','Warship',5,180000,500,1.40,60,650,2400,[40,90,180],12,32,guns(22,22,2,2),guns(18,18,2,2)),
 define('grand-merchantman-merchant','Grand Merchantman','Merchant',6,300000,700,.95,25,3500,5000,[25,55,110],42,25,guns(10,10,0,4),guns(5,5,0,2)),
 define('war-galleon-universal','War Galleon','Universal',6,360000,900,1.05,30,2200,4500,[55,120,240],36,40,guns(30,30,4,4),guns(22,22,2,2)),
 define('man-of-war-warship','Man-of-war','Warship',6,500000,1200,1.10,25,900,5000,[80,180,360],12,50,guns(48,48,4,4),guns(40,40,2,2)),
];
/** Explicit variant overrides: no runtime class multiplier affects an owned ship. */
function variant(base:string,id:string,label:string,shipClass:ShipClass,overrides:Partial<ShipDefinition>):ShipDefinition {
 const a=anchors.find(s=>s.id===base)!;
 return {...a,id,label,shipClass,...overrides};
}
export const SHIPS:readonly ShipDefinition[]=[...anchors,
 variant('tartana-universal','tartana-merchant','Merchant Tartana','Merchant',{price:4500,capacity:180,deadweight:270,optimalCrew:4,cannonCapacity:guns(1,1),defaultCannons:guns(0,0)}),
 variant('cutter-universal','cutter-warship','Patrol Cutter','Warship',{price:7000,capacity:70,optimalCrew:8,maxCrew:16,cannonCapacity:guns(3,3,1,1),defaultCannons:guns(2,2)}),
 variant('sloop-universal','sloop-merchant','Merchant Sloop','Merchant',{price:13000,capacity:390,deadweight:580,optimalCrew:8,cannonCapacity:guns(2,2,0,1),defaultCannons:guns(1,1)}),
 variant('sloop-universal','sloop-warship','Raider Sloop','Warship',{price:15000,maxHull:120,capacity:210,optimalCrew:13,maxCrew:26,protection:14,cannonCapacity:guns(6,6,0,2),defaultCannons:guns(4,4)}),
 variant('schooner-universal','schooner-merchant','Merchant Schooner','Merchant',{price:16000,capacity:310,deadweight:530,optimalCrew:10,cannonCapacity:guns(2,2,0,1),defaultCannons:guns(1,1)}),
 variant('schooner-universal','schooner-warship','Patrol Schooner','Warship',{price:18000,maxHull:130,capacity:170,optimalCrew:16,maxCrew:32,protection:14,cannonCapacity:guns(6,6,2,2),defaultCannons:guns(4,4,1,1)}),
 variant('brigantine-universal','brigantine-merchant','Merchant Brigantine','Merchant',{price:33000,capacity:650,deadweight:1000,optimalCrew:16,cannonCapacity:guns(4,4,0,1),defaultCannons:guns(2,2)}),
 variant('brigantine-universal','brigantine-warship','Raider Brigantine','Warship',{price:38000,maxHull:210,capacity:350,optimalCrew:26,maxCrew:52,protection:20,cannonCapacity:guns(10,10,2,2),defaultCannons:guns(7,7,1,1)}),
 variant('brig-universal','brig-merchant','Merchant Brig','Merchant',{price:70000,capacity:1040,deadweight:1750,optimalCrew:26,cannonCapacity:guns(6,6,1,1),defaultCannons:guns(3,3)}),
 variant('brig-universal','brig-warship','War Brig','Warship',{price:82000,maxHull:350,capacity:560,optimalCrew:42,maxCrew:84,protection:28,cannonCapacity:guns(14,14,2,2),defaultCannons:guns(10,10,1,1)}),
 variant('merchantman-merchant','merchantman-universal','Armed Merchantman','Universal',{price:85000,maxHull:380,capacity:1150,optimalCrew:36,maxCrew:72,protection:23,cannonCapacity:guns(10,10,1,2),defaultCannons:guns(6,6,0,1)}),
 variant('galleon-universal','galleon-merchant','Merchant Galleon','Merchant',{price:160000,capacity:2340,deadweight:3800,optimalCrew:52,cannonCapacity:guns(10,10,1,2),defaultCannons:guns(5,5,0,1)}),
 variant('frigate-warship','frigate-universal','Universal Frigate','Universal',{price:165000,maxHull:460,capacity:950,optimalCrew:70,maxCrew:140,protection:27,cannonCapacity:guns(16,16,2,2),defaultCannons:guns(10,10,1,1)}),
 variant('war-galleon-universal','war-galleon-warship','Battle Galleon','Warship',{price:430000,maxHull:1050,capacity:1540,optimalCrew:156,maxCrew:312,protection:46,cannonCapacity:guns(42,42,4,4),defaultCannons:guns(30,30,2,2)}),
].sort((a,b)=>a.tier-b.tier||a.price-b.price);
export const STARTER_ID='sloop-universal';
export function shipDefinition(id:string):ShipDefinition {
 const ship=SHIPS.find(s=>s.id===id);
 if(!ship)throw new Error('Unknown ship configuration.');
 return ship;
}
export function createShip(configurationId=STARTER_ID,name?:string,id:string=crypto.randomUUID()):OwnedShip {
 const spec=shipDefinition(configurationId);
 return {id,name:name??spec.label,configurationId,hullPoints:spec.maxHull,sailCondition:100,cannons:{...spec.defaultCannons}};
}
export const totalCannons=(b:Batteries)=>BATTERIES.reduce((sum,k)=>sum+b[k],0);
export const hullRepairQuote=(s:OwnedShip)=>Math.ceil((shipDefinition(s.configurationId).maxHull-s.hullPoints)*shipDefinition(s.configurationId).tier);
export const sailRepairQuote=(s:OwnedShip)=>Math.ceil((100-s.sailCondition)*shipDefinition(s.configurationId).tier);
export const cannonPrice=(s:ShipDefinition)=>100*s.tier;
export function cannonReplacementQuote(s:OwnedShip){const spec=shipDefinition(s.configurationId);return BATTERIES.reduce((sum,b)=>sum+Math.max(0,spec.defaultCannons[b]-s.cannons[b]),0)*cannonPrice(spec);}
export function shipSaleValue(s:OwnedShip){const spec=shipDefinition(s.configurationId);return Math.max(0,Math.floor(spec.price*.7-hullRepairQuote(s)-sailRepairQuote(s)-cannonReplacementQuote(s)));}
