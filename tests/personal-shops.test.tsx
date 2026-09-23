import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {act,newGame,normalizeGame} from '../src/game';
import {equipment,appearanceIndex,armourStats} from '../src/equipment';
import {Blacksmith,Weaver,NavigationEquipment} from '../src/PersonalShops';
import {createBattle} from '../src/battle/naval';
import {generateNpc} from '../src/battle/encounter';
import {resolveDuel} from '../src/battle/boarding';
import type {Decision} from '../src/battle/types';

it('scores only equipped clothing and melee weapon, preserving the original cutlass',()=>{
 let g=newGame('Anne',1);
 expect(equipment(g).equipped).toBe('cutlass');expect(appearanceIndex(g)).toBe(1);
 g=act(g,{type:'buy-apparel',id:'fine-tricorn'});
 expect(appearanceIndex(g)).toBe(1);
 g=act(g,{type:'equip-apparel',id:'fine-tricorn'});
 expect(appearanceIndex(g)).toBe(1.5);
 g=act(g,{type:'buy-equipment',id:'fine-dagger'});
 expect(appearanceIndex(g)).toBe(1.5);
 g=act(g,{type:'equip-weapon',id:'fine-dagger'});
 expect(appearanceIndex(g)).toBe(2);
 g=act(g,{type:'buy-equipment',id:'pistol'});
 expect(appearanceIndex(g)).toBe(2);
 g=act(g,{type:'unequip-apparel',slot:'head'});
 expect(appearanceIndex(g)).toBe(1.25);
});

it('resells only unequipped items at the correct rates and records both cash flows',()=>{
 let g={...newGame('Anne',2),silver:2000};
 g=act(g,{type:'buy-apparel',id:'fine-tricorn'});
 g=act(g,{type:'equip-apparel',id:'fine-tricorn'});
 expect(()=>act(g,{type:'sell-apparel',id:'fine-tricorn'})).toThrow('Unequip');
 g=act(g,{type:'unequip-apparel',slot:'head'});
 g=act(g,{type:'sell-apparel',id:'fine-tricorn'});
 expect(g.silver).toBe(2000-180+27);
 g=act(g,{type:'buy-apparel',id:'leather-jerkin'});
 g=act(g,{type:'sell-apparel',id:'leather-jerkin'});
 expect(g.silver).toBe(2000-180+27-220+132);
 g=act(g,{type:'buy-equipment',id:'dagger'});
 g=act(g,{type:'sell-equipment',id:'dagger'});
 expect(g.silver).toBe(2000-180+27-220+132-60+30);
 expect(()=>act(g,{type:'sell-equipment',id:'cutlass'})).toThrow('Unequip');
 expect(()=>act(g,{type:'sell-apparel',id:'plain-kerchief'})).toThrow('Unequip');
 expect(g.finances!.entries.filter(x=>x.kind==='equipment'&&x.cash>0).map(x=>x.cash)).toEqual([27,132,30]);
});

it('upgrades old equipment records and displays each shop with authored prose',()=>{
 const original=newGame('Anne',3);
 original.equipment={weapons:[{id:'cutlass',name:'Cutlass',skill:'mediumWeapons',quality:0,price:90} as ReturnType<typeof equipment>['weapons'][number]],equipped:'cutlass',pistol:false,cartridges:0,preloads:{}};
 const restored=normalizeGame(JSON.parse(JSON.stringify(original)));
 expect(appearanceIndex(restored)).toBe(1);
 expect(equipment(restored).wardrobe).toContain('work-shirt');
 const shops=renderToStaticMarkup(<><Blacksmith game={restored} busy={false} perform={()=>{}}/><Weaver game={restored} busy={false} perform={()=>{}}/><NavigationEquipment game={restored} busy={false} perform={()=>{}}/></>);
 expect(shops).toContain('Its narrow blade has opened more rope knots than throats');
 expect(shops).toContain('Silk flowers climb the sleeves');
 expect(shops).toContain('Brass tubes draw a distant sail');
});

it('caps snapshotted duel protection at two, spends it on enemy hits, and penalizes Dodge',()=>{
 let g=newGame('Anne',4);
 g=act(g,{type:'buy-apparel',id:'iron-cap'});g=act(g,{type:'equip-apparel',id:'iron-cap'});
 g=act(g,{type:'buy-apparel',id:'steel-breastplate'});g=act(g,{type:'equip-apparel',id:'steel-breastplate'});
 expect(armourStats(g)).toEqual({points:2,dodgePenalty:-1});
 const npc=generateNpc(g);g.battle=createBattle(g,npc);const original=g.battle;
 expect(original.playerArmour).toEqual({points:2,remaining:2,dodgePenalty:-1});
 const decision:Decision={assessment:[],objective:'fight',risk:'moderate',intent:'Attack',action_ids:['heavy']};
 let tested=false;
 for(let seed=1;seed<200&&!tested;seed++){
  const armoured=structuredClone(original),plain=structuredClone(original);
  armoured.phase=plain.phase='duel';
  armoured.duel=plain.duel={initiative:original.npcId,exchange:0,control:0,firstRoll:false,demandedAt:[]};
  armoured.committed=plain.committed=['dodge'];armoured.accepted=plain.accepted=decision;
  plain.playerArmour={points:0,remaining:0,dodgePenalty:-1};
  const a={...g,seed,battle:armoured},p={...g,seed,battle:plain};
  resolveDuel(p,plain);resolveDuel(a,armoured);
  const wound=plain.ships[plain.playerId].captain.injury;
  if(wound>0){
   expect(armoured.rolls[0].parts['Armour mobility']).toBe(-1);
   expect(armoured.ships[armoured.playerId].captain.injury).toBe(Math.max(0,wound-2));
   expect(armoured.playerArmour!.remaining).toBe(2-Math.min(wound,2));
   expect(armoured.log[0]).toContain('stopped by armour');tested=true;
  }
 }
 expect(tested).toBe(true);
});
