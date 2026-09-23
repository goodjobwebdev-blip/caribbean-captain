import type {Game,Action} from './game';
import {equipment,appearanceIndex,WEAPONS,AMMUNITION,loadoutNeeds} from './equipment';
import {BATTERIES} from './ships';
import {captain,crew,injuryNames,fatigueNames,type Ammo} from './battle/types';
import {apparel,TIER_NAMES,type OutfitSlot} from './apparel';
import {COMBAT_SKILLS,skillName,nextTierRequirement} from './skills';
type Controls={game:Game;busy:boolean;perform:(a:Action)=>void};
export function CombatSkills({game:g}:{game:Game}){
 return <><h2>Training, encounter and combat practice</h2><p>Paid crew training earns 0.5 Training point per session. Completed encounter and combat actions also earn practice. Battles award it once at resolution: up to 3 points per skill and 10 total. Mastery remains fixed during a battle.</p><div className="table-wrap"><table><thead><tr><th>Skill</th><th>Mastery</th><th>Progress to next tier</th></tr></thead><tbody>{COMBAT_SKILLS.map(id=>{const s=g.skills?.[id]??{tier:0,points:0};return <tr key={id}><th scope="row">{skillName(id)}</th><td>{s.tier} / 10</td><td>{s.tier===10?'Maximum mastery':`${s.points.toFixed(2)} / ${nextTierRequirement(s.tier)}`}</td></tr>;})}</tbody></table></div></>;
}
export function CaptainEquipment({game:g}:{game:Game}){
 const e=equipment(g),c=g.captainState??captain(),company=g.crewState??crew(g.crew);
 return <><h2>Captain and equipment</h2><dl className="full-stats">
 <div><dt>Injury</dt><dd>{injuryNames[c.injury]}</dd></div><div><dt>Fatigue</dt><dd>{fatigueNames[c.fatigue]}</dd></div>
 <div><dt>Equipped weapon</dt><dd>{e.weapons.find(w=>w.id===e.equipped)?.name??skillName(c.weapon)} · quality +{c.quality} · {skillName(c.weapon)}</dd></div>
 <div><dt>Owned weapons</dt><dd>{e.weapons.map(w=>w.name).join(', ')}</dd></div>
 <div><dt>Pistol</dt><dd>{c.pistol?'Loaded':e.pistol?'Owned, unloaded':'Not owned'}</dd></div><div><dt>Spare cartridges</dt><dd>{e.cartridges}</dd></div>
 <div><dt>Spyglass</dt><dd>{g.spyglass?'Owned · early sightings':'Not owned'}</dd></div>
 <div><dt>Crew fit / injured / dead</dt><dd>{company.fit} / {company.injured} / {company.dead}</dd></div>
 <div><dt>Morale / discipline / equipment</dt><dd>{company.morale.toFixed(1)} / {company.discipline.toFixed(1)} / {company.equipment}</dd></div>
 </dl><h2>Outfit · appearance {appearanceIndex(g).toFixed(1)} / 4</h2><p>The index averages equipped head, body, feet, and melee weapon tiers. Owned gear left unworn does not count.</p><div className="outfit-slots">{(['head','body','feet'] as OutfitSlot[]).map(slot=>{const item=apparel(e.outfit?.[slot]??'');return <article key={slot}><small>{slot.toUpperCase()}</small><strong>{item?.name??'Bare'} · {item?TIER_NAMES[item.tier]:'Rough'}</strong><p>{item?.description??'Nothing worn in this slot.'}</p></article>;})}<article><small>MELEE</small><strong>{e.weapons.find(w=>w.id===e.equipped)?.name}</strong><p>{WEAPONS.find(w=>w.id===e.equipped)?.description??'A familiar weapon that has served its captain through earlier voyages.'}</p></article></div><p>Living captains can rest at the tavern to clear fatigue and heal one Injury step. Rest also helps injured crew recover. Dead crew cannot recover.</p></>;
}
export {Blacksmith as Outfitter} from './PersonalShops';
export function Loadout({game:g,busy,perform}:Controls){
 const e=equipment(g),c=g.captainState??captain(),needs=loadoutNeeds(g);
 return <details className="performance-details"><summary>Prepare weapons and battery loadout</summary><p>Choose your weapon and load your pistol in port. Apply the saved battery loadout at the start of each naval battle; ammunition stays in the hold until then.</p><label>Melee weapon<select disabled={busy} value={e.equipped} onChange={event=>perform({type:'equip-weapon',id:event.target.value})}>{e.weapons.map(w=><option value={w.id} key={w.id}>{w.name} · quality +{w.quality}</option>)}</select></label><p>Pistol: {c.pistol?'Loaded':e.pistol?'Unloaded':'Not owned'} · {e.cartridges} spare cartridges</p><div className="button-row"><button disabled={busy||!e.pistol||c.pistol||!e.cartridges} onClick={()=>perform({type:'load-pistol'})}>Load pistol</button><button disabled={busy||!c.pistol} onClick={()=>perform({type:'unload-pistol'})}>Unload pistol</button></div>
 {BATTERIES.filter(b=>(g.ship?.cannons[b]??0)>0).map(b=><label key={b}>{skillName(b)} battery · {g.ship!.cannons[b]} guns<select aria-label={`${b} prepared ammunition`} disabled={busy} value={e.preloads[b]??''} onChange={event=>perform({type:'prepare-battery',battery:b,ammo:(event.target.value||null) as Ammo|null})}><option value="">No preset</option>{AMMUNITION.map(a=><option key={a} value={a}>{a.replaceAll('-',' ')}</option>)}</select></label>)}
 {Object.keys(needs).length?<ul>{Object.entries(needs).map(([id,quantity])=><li key={id} className={(g.cargo[id]??0)<quantity?'warning':''}>{id.replaceAll('-',' ')}: {quantity} needed / {(g.cargo[id]??0).toFixed(0)} aboard{(g.cargo[id]??0)<quantity?' — buy more at the Store':''}</li>)}</ul>:<p>No battery preset selected.</p>}<p>Each loaded cannon consumes one ammunition unit and one gunpowder unit. Buy cannon supplies through the trading counter. Unused loads return to the hold after battle; expended ammunition is lost.</p></details>;
}
