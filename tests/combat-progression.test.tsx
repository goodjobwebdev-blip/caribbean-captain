import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {act,newGame,normalizeGame,type Game} from '../src/game';
import {equipment} from '../src/equipment';
import {CaptainEquipment,CombatSkills,Loadout,Outfitter} from '../src/EquipmentPanel';
import {creditSkillPoints} from '../src/skills';
import {financialSummary} from '../src/finance';
import {practice,awardBattlePractice,encounterPractice} from '../src/battle/progression';
import {createBattle,schedule,stepNaval,mergeCompletions,preload} from '../src/battle/naval';
import {generateNpc,beginEncounter,resolveEncounter} from '../src/battle/encounter';
import {captain,finish,crew,type Decision} from '../src/battle/types';
import {createShip} from '../src/ships';
import {enterBoarding,resolveDuel} from '../src/battle/boarding';
const decision=(...action_ids:string[]):Decision=>({assessment:[],objective:'survive',risk:'moderate',intent:'Hold position',action_ids});
function combat(source?:Game){const g=source??newGame('Anne',42);g.ship!.id='player';g.cargo={'round-shot':20,'chain-shot':20,gunpowder:40};const npc=generateNpc(g);npc.ship=createShip('sloop-universal','Enemy','npc');npc.crew=crew(10);npc.temperament='Bold';g.battle=createBattle(g,npc);g.voyage={to:'saint-pierre',hours:49,remaining:25,weather:'Steady winds',dice:[3,4]};return g;}
it('carries fractional skill overflow through thresholds and caps mastery',()=>{
 const g=newGame('A',1);g.skills!.aiming={tier:0,points:9.75};const s=creditSkillPoints(g.skills,'aiming',20.5);expect(s.aiming).toEqual({tier:2,points:.25});expect(g.skills!.aiming.points).toBe(9.75);
 expect(creditSkillPoints(s,'aiming',1e6).aiming).toEqual({tier:10,points:0});expect(()=>creditSkillPoints(s,'aiming',NaN)).toThrow();expect(()=>creditSkillPoints(s,'aiming',-1)).toThrow();
});
it('caps completed battle practice and ignores enemy work',()=>{
 const b=combat().battle!;practice(b,b.npcId,'aiming',3);expect(b.practice).toBeUndefined();
 for(const s of ['aiming','boarding','reloading','shooting','athletics'] as const)practice(b,b.playerId,s,100);
 expect(b.practice).toEqual({aiming:3,boarding:3,reloading:3,shooting:1});
});
it('awards once at resolution, preserves battle mastery and persists the award flag',()=>{
 let g=combat();g.skills!.boarding={tier:0,points:9.5};practice(g.battle!,'player','boarding',.5);awardBattlePractice(g);expect(g.skills!.boarding.tier).toBe(0);
 g=act(g,{type:'battle-surrender'});expect(g.skills!.boarding).toEqual({tier:1,points:0});expect(g.battle!.ships.player.skills.boarding).toBe(0);
 const restored=normalizeGame(JSON.parse(JSON.stringify(g)));awardBattlePractice(restored);expect(restored.skills).toEqual(g.skills);expect(restored.battle!.practiceAwarded).toBe(true);
});
it('awards no practice to a dead captain or for surrender alone',()=>{
 const g=combat();practice(g.battle!,'player','boarding');g.battle!.ships.player.captain.injury=6;finish(g.battle!,'npc','Death');awardBattlePractice(g);expect(g.skills!.boarding).toBeUndefined();
 expect(act(combat(),{type:'battle-surrender'}).skills!.boarding).toBeUndefined();
});
it('merges simultaneous practice deltas once and independently of event order',()=>{
 const b=combat().battle!;practice(b,'player','aiming',2);const pre=structuredClone(b),one=structuredClone(b),two=structuredClone(b);practice(one,'player','aiming');practice(two,'player','reloading');
 const reverse=structuredClone(b);mergeCompletions(b,pre,[one,two]);mergeCompletions(reverse,pre,[two,one]);expect(b.practice).toEqual({aiming:2.5,reloading:.5});expect(reverse.practice).toEqual(b.practice);
});
it('credits a completed reload but not planning, preloads or invalid volleys',()=>{
 const g=combat(),b=g.battle!;preload(b,'player','port','round-shot');expect(b.practice).toBeUndefined();b.plans.player=schedule(b,'player',['reload_starboard_round-shot']);expect(b.practice).toBeUndefined();b.plans.npc=[];b.status='playback';stepNaval(g,b);expect(b.practice?.reloading).toBe(.5);
 const failed=combat(),fb=failed.battle!;preload(fb,'player','port','round-shot');fb.plans.player=schedule(fb,'player',['fire_port']);fb.plans.player[0].begun=true;fb.plans.npc=[];fb.status='playback';stepNaval(failed,fb);expect(fb.practice?.aiming).toBeUndefined();
});
it('credits deck fighting through the public reducer and ignores replayed reveal',()=>{
 let g=combat();enterBoarding(g.battle!,'player');g=act(g,{type:'battle-transition'});g=act(g,{type:'battle-commit',ids:['guard']});g=act(g,{type:'battle-accept',decision:decision('guard'),key:g.battle!.decisionKey});g=act(g,{type:'battle-reveal'});expect(g.battle!.practice!.boarding).toBeGreaterThan(0);expect(()=>act(g,{type:'battle-reveal'})).toThrow();
});
it('learns lookout from investigation and bounds practice per contact',()=>{
 const g=newGame('A',42);g.spyglass=true;beginEncounter(g,generateNpc(g));resolveEncounter(g,{choice:'investigate'});expect(g.skills!.lookout?.points).toBe(.5);expect(()=>resolveEncounter(g,{choice:'investigate'})).toThrow();encounterPractice(g,'lookout',100);expect(g.skills!.lookout?.points).toBe(1);
});
it('buys, owns and equips weapons without changing mastery; records the bill',()=>{
 const g=newGame('A',1),bought=act(g,{type:'buy-equipment',id:'fine-axe'});expect(g.equipment).toBeUndefined();expect(bought.silver).toBe(g.silver-450);expect(bought.skills).toEqual(g.skills);expect(financialSummary(bought.finances!.entries).cashExpenses).toBe(450);
 const equipped=act(bought,{type:'equip-weapon',id:'fine-axe'});expect(equipped.captainState).toMatchObject({weapon:'heavyWeapons',quality:1});expect(()=>act(equipped,{type:'buy-equipment',id:'fine-axe'})).toThrow('already');expect(()=>act(g,{type:'equip-weapon',id:'fine-axe'})).toThrow('first');
 expect(()=>act(g,{type:'buy-equipment',id:'__proto__'})).toThrow('Unknown');expect(()=>act({...g,silver:0},{type:'buy-equipment',id:'pistol'})).toThrow('silver');
});
it('preserves legacy weapon quality, injury, spyglass and pistol ownership after firing',()=>{
 let g=newGame('A',3);g.captainState={...captain(),weapon:'heavyWeapons',quality:2,injury:2,pistol:true};g.spyglass=true;g=act(g,{type:'buy-equipment',id:'cartridges'});expect(equipment(g).weapons[0]).toMatchObject({skill:'heavyWeapons',quality:2});expect(g.captainState).toMatchObject({injury:2,pistol:true});expect(equipment(g).pistol).toBe(true);expect(g.spyglass).toBe(true);
 const legacy=combat({...newGame('A',4),captainState:{...captain(),pistol:true}});const after=act(legacy,{type:'battle-preload',battery:'port',ammo:'round-shot'});after.battle!.ships.player.captain.pistol=false;expect(equipment(after).pistol).toBe(true);
});
it('loads and unloads one cartridge without duplication and enforces the allowance',()=>{
 let g=newGame('A',1);expect(()=>act(g,{type:'load-pistol'})).toThrow('pistol');g=act(g,{type:'buy-equipment',id:'pistol'});g=act(g,{type:'buy-equipment',id:'cartridges'});g=act(g,{type:'load-pistol'});expect(g.equipment!.cartridges).toBe(4);expect(()=>act(g,{type:'load-pistol'})).toThrow('already');g=act(g,{type:'unload-pistol'});expect(g.equipment!.cartridges).toBe(5);expect(()=>act(g,{type:'unload-pistol'})).toThrow('not loaded');
 for(let i=0;i<3;i++)g=act(g,{type:'buy-equipment',id:'cartridges'});expect(()=>act(g,{type:'buy-equipment',id:'cartridges'})).toThrow('allowance');
});
it('consumes the bought pistol shot in a duel and prevents equipment changes at sea',()=>{
 let g=newGame('A',42);g=act(g,{type:'buy-equipment',id:'pistol'});g=act(g,{type:'buy-equipment',id:'cartridges'});g=act(g,{type:'load-pistol'});g=combat(g);const b=g.battle!;b.phase='duel';b.duel={initiative:'player',exchange:0,control:0,firstRoll:true,demandedAt:[]};
 expect(()=>act(g,{type:'load-pistol'})).toThrow();g=act(g,{type:'battle-commit',ids:['pistol']});g=act(g,{type:'battle-accept',decision:decision('dodge'),key:g.battle!.decisionKey});g=act(g,{type:'battle-reveal'});expect(g.captainState!.pistol).toBe(false);expect(g.equipment!.pistol).toBe(true);expect(g.equipment!.cartridges).toBe(4);expect(g.battle!.practice!.shooting).toBeGreaterThan(0);
});
it('applies saved cannon loadouts atomically and cannot consume twice',()=>{
 let g=newGame('A',42);g=act(g,{type:'prepare-battery',battery:'port',ammo:'round-shot'});g=act(g,{type:'prepare-battery',battery:'starboard',ammo:'chain-shot'});g=combat(g);const before=structuredClone(g),loaded=act(g,{type:'battle-loadout'});expect(g).toEqual(before);expect(loaded.cargo.gunpowder).toBe(36);expect(loaded.battle!.ships.player.batteries.port.loaded).toBe(2);expect(loaded.battle!.practice).toBeUndefined();expect(()=>act(loaded,{type:'battle-loadout'})).toThrow();
 g.cargo.gunpowder=3;g.battle!.ships.player.cargo.gunpowder=3;expect(()=>act(g,{type:'battle-loadout'})).toThrow('gunpowder');expect(g.battle!.ships.player.batteries.port.loaded).toBe(0);expect(g.cargo.gunpowder).toBe(3);
});
it('spyglass purchase unlocks early sightings and equipment views show real conditions',()=>{
 let g=act(newGame('A',42),{type:'buy-equipment',id:'spyglass'});beginEncounter(g,generateNpc(g));expect(g.encounter!.stage).toBe('sighting');g.captainState={...captain(),injury:2,fatigue:1};g.crewState={...crew(8),injured:2,dead:1};
 const html=renderToStaticMarkup(<><CaptainEquipment game={g}/><CombatSkills game={g}/><Outfitter game={g} busy={false} perform={()=>{}}/><Loadout game={g} busy={false} perform={()=>{}}/></>);expect(html).toContain('Injured');expect(html).toContain('Tired');expect(html).toContain('8 / 2 / 1');expect(html).toContain('Fine cutlass');expect(html).toContain('Aiming');expect(html).toContain('Apply the saved battery loadout');
});

it('does not apply fine melee quality to a pistol shot or dodge',()=>{
 const g=combat(),b=g.battle!;b.phase='duel';b.duel={initiative:'player',exchange:0,control:0,firstRoll:true,demandedAt:[]};b.ships.player.captain.quality=1;b.ships.player.captain.pistol=true;b.ships.npc.captain.quality=0;b.committed=['pistol'];b.accepted=decision('dodge');resolveDuel(g,b);expect(b.rolls[0].parts['Weapon quality']).toBe(0);
});
