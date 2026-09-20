import type {Game} from './game';
import {captain,type Captain,type Ammo} from './battle/types';
import {BATTERIES,type Battery} from './ships';
import {record} from './finance';
export type Weapon={id:string;name:string;skill:Captain['weapon'];quality:number;price:number};
export const WEAPONS:Weapon[]=[
 {id:'dagger',name:'Dagger',skill:'lightWeapons',quality:0,price:60},
 {id:'cutlass',name:'Cutlass',skill:'mediumWeapons',quality:0,price:90},
 {id:'axe',name:'Boarding axe',skill:'heavyWeapons',quality:0,price:120},
 {id:'fine-dagger',name:'Fine dagger',skill:'lightWeapons',quality:1,price:300},
 {id:'fine-cutlass',name:'Fine cutlass',skill:'mediumWeapons',quality:1,price:400},
 {id:'fine-axe',name:'Fine boarding axe',skill:'heavyWeapons',quality:1,price:450},
];
export const AMMUNITION:Ammo[]=['round-shot','chain-shot','grapeshot','bombs'];
export type Equipment={weapons:Weapon[];equipped:string;pistol:boolean;cartridges:number;preloads:Partial<Record<Battery,Ammo>>};
/** Preserve existing captains, including non-catalogue weapons and their loaded pistol. */
export function equipment(g:Game):Equipment{
 if(g.equipment)return g.equipment;
 const c=g.captainState??captain(),match=WEAPONS.find(w=>w.skill===c.weapon&&w.quality===c.quality);
 const weapon=match??{id:'legacy',name:'Existing weapon',skill:c.weapon,quality:c.quality,price:0};
 return {weapons:[{...weapon}],equipped:weapon.id,pistol:c.pistol,cartridges:0,preloads:{}};
}
export type EquipmentAction={type:'buy-equipment';id:string}|{type:'equip-weapon';id:string}|{type:'load-pistol'|'unload-pistol'}|{type:'prepare-battery';battery:Battery;ammo:Ammo|null};
export function equipmentAct(g:Game,a:EquipmentAction){
 if(g.voyage||g.battle)throw Error('Prepare equipment in port.');
 const e=g.equipment??=equipment(g),c=g.captainState??=captain();
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
