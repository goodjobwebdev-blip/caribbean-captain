import type {Game} from './game';
import {captain,type Captain,type Ammo} from './battle/types';
import {BATTERIES,type Battery} from './ships';
import {record} from './finance';
import {STARTER_OUTFIT,apparel,type OutfitSlot} from './apparel';
export type Weapon={id:string;name:string;skill:Captain['weapon'];quality:number;price:number;tier:number;description:string};
export const WEAPONS:Weapon[]=[
 {id:'knife',name:"Sailor's knife",skill:'lightWeapons',quality:0,price:45,tier:0,description:'Its narrow blade has opened more rope knots than throats, though it can do either.'},
 {id:'dagger',name:'Dagger',skill:'lightWeapons',quality:0,price:60,tier:1,description:'A compact blade sits close to the belt, ready before a longer weapon clears its scabbard.'},
 {id:'cutlass',name:'Cutlass',skill:'mediumWeapons',quality:0,price:90,tier:1,description:'Short enough for a crowded deck and heavy enough to make a defender respect the edge.'},
 {id:'axe',name:'Boarding axe',skill:'heavyWeapons',quality:0,price:120,tier:1,description:'Made to bite timber and rigging; in a boarding fight it is a fearsome burden to swing.'},
 {id:'sabre',name:'Naval sabre',skill:'mediumWeapons',quality:0,price:170,tier:2,description:"A curved officer's blade bears a maker's mark worn smooth by careful practice."},
 {id:'mace',name:'Heavy mace',skill:'heavyWeapons',quality:0,price:180,tier:2,description:'Its blunt iron head answers armour with force rather than finesse.'},
 {id:'fine-dagger',name:'Fine dagger',skill:'lightWeapons',quality:1,price:300,tier:3,description:'A slim, balanced blade slips from a tooled sheath without a sound.'},
 {id:'fine-cutlass',name:'Fine cutlass',skill:'mediumWeapons',quality:1,price:400,tier:3,description:'The edge holds true from guard to tip, and the hilt has been shaped for one practiced hand.'},
 {id:'fine-axe',name:'Fine boarding axe',skill:'heavyWeapons',quality:1,price:450,tier:3,description:"Polished steel and a fitted haft turn a rough shipboard tool into a captain's chosen weapon."},
 {id:'gold-inlaid-sabre',name:'Gold-inlaid sabre',skill:'mediumWeapons',quality:1,price:6000,tier:4,description:'Gold wire curls along the guard like a chart of imagined currents; the edge is no sharper than a fine cutlass.'},
];
export const AMMUNITION:Ammo[]=['round-shot','chain-shot','grapeshot','bombs'];
export type Equipment={weapons:Weapon[];equipped:string;pistol:boolean;cartridges:number;preloads:Partial<Record<Battery,Ammo>>;wardrobe?:string[];outfit?:Partial<Record<OutfitSlot,string>>};
/** Preserve existing captains, including non-catalogue weapons and their loaded pistol. */
export function equipment(g:Game):Equipment{
 if(g.equipment){g.equipment.wardrobe??=Object.values(STARTER_OUTFIT);g.equipment.outfit??={...STARTER_OUTFIT};return g.equipment;}
 const c=g.captainState??captain(),match=WEAPONS.find(w=>['dagger','cutlass','axe','fine-dagger','fine-cutlass','fine-axe'].includes(w.id)&&w.skill===c.weapon&&w.quality===c.quality);
 const weapon=match??{id:'legacy',name:'Existing weapon',skill:c.weapon,quality:c.quality,price:0,tier:1,description:'A familiar weapon that has served its captain through earlier voyages.'};
 return {weapons:[{...weapon}],equipped:weapon.id,pistol:c.pistol,cartridges:0,preloads:{},wardrobe:Object.values(STARTER_OUTFIT),outfit:{...STARTER_OUTFIT}};
}
export function appearanceIndex(g:Game){const e=equipment(g),slots:(OutfitSlot)[]=['head','body','feet'];const clothing=slots.reduce((sum,slot)=>sum+(apparel(e.outfit?.[slot]??'')?.tier??0),0);const weapon=e.weapons.find(w=>w.id===e.equipped);return (clothing+(WEAPONS.find(w=>w.id===weapon?.id)?.tier??weapon?.tier??1))/4;}
export function armourStats(g:Game){const outfit=equipment(g).outfit??{};const worn=['head','body'].map(slot=>apparel(outfit[slot as OutfitSlot]??''));return {points:Math.min(2,worn.reduce((sum,item)=>sum+(item?.protection??0),0)),dodgePenalty:worn.reduce((sum,item)=>sum+(item?.dodgePenalty??0),0)};}
export type EquipmentAction={type:'buy-equipment'|'sell-equipment'|'buy-apparel'|'sell-apparel'|'equip-weapon'|'equip-apparel';id:string}|{type:'unequip-apparel';slot:OutfitSlot}|{type:'load-pistol'|'unload-pistol'}|{type:'prepare-battery';battery:Battery;ammo:Ammo|null};
export function equipmentAct(g:Game,a:EquipmentAction){
 if(g.voyage||g.battle)throw Error('Prepare equipment in port.');
 const e=g.equipment=equipment(g),c=g.captainState??=captain();
 if(a.type==='buy-equipment'){
  const w=WEAPONS.find(w=>w.id===a.id);
  const price=w?.price??({pistol:200,spyglass:150,cartridges:25} as Record<string,number>)[a.id];
  if(typeof price!=='number'||!Number.isFinite(price))throw Error('Unknown equipment.');
  if(w&&e.weapons.some(item=>item.id===w.id)||a.id==='pistol'&&e.pistol||a.id==='spyglass'&&g.spyglass)throw Error('You already own this equipment.');
  if(a.id==='cartridges'&&e.cartridges+(c.pistol?1:0)+5>20)throw Error('Personal ammunition allowance is 20 cartridges, including the loaded shot.');
  if(g.silver<price)throw Error('Not enough silver.');
  g.silver-=price;record(g,'equipment',-price);
  if(w)e.weapons.push({...w});else if(a.id==='pistol')e.pistol=true;else if(a.id==='spyglass')g.spyglass=true;else e.cartridges+=5;
  g.log.unshift({hours:g.hours,text:`Bought ${w?.name??a.id} for ${price} silver.`});
 }else if(a.type==='sell-equipment'){
  const w=e.weapons.find(w=>w.id===a.id);
  if(!w&&a.id!=='pistol')throw Error('You do not own this weapon.');
  if(w&&(e.equipped===a.id||e.weapons.length<=1||!w.price))throw Error('Unequip this weapon and keep at least one melee weapon.');
  if(a.id==='pistol'&&(!e.pistol||c.pistol))throw Error('Unload the owned pistol before selling it.');
  const price=Math.floor((w?.price??200)*.5);g.silver+=price;record(g,'equipment',price);
  if(w)e.weapons=e.weapons.filter(item=>item.id!==a.id);else e.pistol=false;
  g.log.unshift({hours:g.hours,text:`Sold ${w?.name??'pistol'} for ${price} silver.`});
 }else if(a.type==='buy-apparel'){
  const item=apparel(a.id);if(!item||item.starter)throw Error('Unknown shop item.');
  if(e.wardrobe!.includes(item.id))throw Error('You already own this item.');
  if(g.silver<item.price)throw Error('Not enough silver.');
  g.silver-=item.price;record(g,'equipment',-item.price);e.wardrobe!.push(item.id);
  g.log.unshift({hours:g.hours,text:`Bought ${item.name} for ${item.price} silver.`});
 }else if(a.type==='sell-apparel'){
  const item=apparel(a.id);if(!item||!e.wardrobe!.includes(a.id))throw Error('You do not own this item.');
  if(item.starter||e.outfit?.[item.slot]===a.id)throw Error('Unequip this item before selling it.');
  const price=Math.floor(item.price*(item.kind==='clothing'?.15:.6));
  e.wardrobe=e.wardrobe!.filter(id=>id!==a.id);g.silver+=price;record(g,'equipment',price);
  g.log.unshift({hours:g.hours,text:`Sold ${item.name} for ${price} silver.`});
 }else if(a.type==='equip-apparel'){
  const item=apparel(a.id);if(!item||!e.wardrobe!.includes(item.id))throw Error('Buy this item first.');
  e.outfit![item.slot]=item.id;
 }else if(a.type==='unequip-apparel'){
  if(!(['head','body','feet'] as string[]).includes(a.slot))throw Error('Unknown outfit slot.');
  delete e.outfit![a.slot];
 }else if(a.type==='equip-weapon'){
  const w=e.weapons.find(w=>w.id===a.id);if(!w)throw Error('Buy this weapon first.');
  e.equipped=w.id;c.weapon=w.skill;c.quality=w.quality;
 }else if(a.type==='load-pistol'){
  if(!e.pistol)throw Error('Buy a pistol first.');if(c.pistol)throw Error('Pistol is already loaded.');if(e.cartridges<1)throw Error('Buy pistol cartridges first.');
  e.cartridges--;c.pistol=true;
 }else if(a.type==='unload-pistol'){
  if(!c.pistol)throw Error('Pistol is not loaded.');c.pistol=false;e.cartridges++;
 }else if(a.type==='prepare-battery'){
  if(!BATTERIES.includes(a.battery)||a.ammo!==null&&!AMMUNITION.includes(a.ammo))throw Error('Invalid battery or ammunition.');
  if(a.ammo===null)delete e.preloads[a.battery];else e.preloads[a.battery]=a.ammo;
 }
}
export function loadoutNeeds(g:Game){
 const needs:Record<string,number>={},preset=equipment(g).preloads;
 for(const battery of BATTERIES){const ammo=preset[battery],count=g.ship?.cannons[battery]??0;if(!ammo||!count)continue;needs[ammo]=(needs[ammo]??0)+count;needs.gunpowder=(needs.gunpowder??0)+count;}
 return needs;
}
