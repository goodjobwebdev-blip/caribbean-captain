import type {Game,Action} from './game';
import {equipment,WEAPONS,AMMUNITION,loadoutNeeds} from './equipment';
import {BATTERIES} from './ships';
import {captain,crew,injuryNames,fatigueNames,type Ammo} from './battle/types';
import {COMBAT_SKILLS,skillName,nextTierRequirement} from './skills';
type Controls={game:Game;busy:boolean;perform:(a:Action)=>void};
export function CombatSkills({game:g}:{game:Game}){
 return <><h2>Encounter and combat practice</h2><p>Completed actions earn practice. Battles award it once at resolution: up to 3 points per skill and 10 total. Mastery remains fixed during a battle.</p><div className="table-wrap"><table><thead><tr><th>Skill</th><th>Mastery</th><th>Progress to next tier</th></tr></thead><tbody>{COMBAT_SKILLS.map(id=>{const s=g.skills?.[id]??{tier:0,points:0};return <tr key={id}><th scope="row">{skillName(id)}</th><td>{s.tier} / 10</td><td>{s.tier===10?'Maximum mastery':`${s.points.toFixed(2)} / ${nextTierRequirement(s.tier)}`}</td></tr>;})}</tbody></table></div></>;
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
 <div><dt>Morale / discipline / experience / equipment</dt><dd>{company.morale} / {company.discipline} / {company.experience} / {company.equipment}</dd></div>
 </dl><p>Living captains can rest at the tavern to clear fatigue and heal one Injury step. Rest also helps injured crew recover. Dead crew cannot recover.</p></>;
}
export function Outfitter({game:g,busy,perform}:Controls){
 const e=equipment(g),c=g.captainState??captain();
 return <section aria-label="Captain outfitter"><details><summary>Captain’s outfitter</summary><h2>Personal equipment</h2><p>Personal equipment uses your captain’s baggage allowance. One of each weapon, one pistol and up to 20 cartridges. Purchases and preparation take no game time.</p><div className="table-wrap"><table><thead><tr><th>Equipment</th><th>Effect</th><th>Silver</th><th>Purchase</th></tr></thead><tbody>{WEAPONS.map(w=><tr key={w.id}><th scope="row">{w.name}</th><td>{skillName(w.skill)} · quality +{w.quality}</td><td>{w.price}</td><td><button disabled={busy||g.silver<w.price||e.weapons.some(item=>item.id===w.id)} onClick={()=>perform({type:'buy-equipment',id:w.id})}>{e.weapons.some(item=>item.id===w.id)?'Owned':`Buy ${w.name}`}</button></td></tr>)}{[{id:'pistol',name:'Pistol',effect:'One loaded shot per duel; reload in port',price:200,owned:e.pistol},{id:'spyglass',name:'Spyglass',effect:'Early sighting before a contact',price:150,owned:!!g.spyglass},{id:'cartridges',name:'5 pistol cartridges',effect:'Each contains one pistol ball and powder',price:25,owned:false}].map(item=><tr key={item.id}><th scope="row">{item.name}</th><td>{item.effect}</td><td>{item.price}</td><td><button disabled={busy||item.owned||g.silver<item.price||item.id==='cartridges'&&e.cartridges+(c.pistol?1:0)>15} onClick={()=>perform({type:'buy-equipment',id:item.id})}>{item.owned?'Owned':`Buy ${item.name}`}</button></td></tr>)}</tbody></table></div><Loadout game={g} busy={busy} perform={perform}/></details></section>;
}
export function Loadout({game:g,busy,perform}:Controls){
 const e=equipment(g),c=g.captainState??captain(),needs=loadoutNeeds(g);
 return <details className="performance-details"><summary>Prepare weapons and battery loadout</summary><p>Choose your weapon and load your pistol in port. Apply the saved battery loadout at the start of each naval battle; ammunition stays in the hold until then.</p><label>Melee weapon<select disabled={busy} value={e.equipped} onChange={event=>perform({type:'equip-weapon',id:event.target.value})}>{e.weapons.map(w=><option value={w.id} key={w.id}>{w.name} · quality +{w.quality}</option>)}</select></label><p>Pistol: {c.pistol?'Loaded':e.pistol?'Unloaded':'Not owned'} · {e.cartridges} spare cartridges</p><div className="button-row"><button disabled={busy||!e.pistol||c.pistol||!e.cartridges} onClick={()=>perform({type:'load-pistol'})}>Load pistol</button><button disabled={busy||!c.pistol} onClick={()=>perform({type:'unload-pistol'})}>Unload pistol</button></div>
 {BATTERIES.filter(b=>(g.ship?.cannons[b]??0)>0).map(b=><label key={b}>{skillName(b)} battery · {g.ship!.cannons[b]} guns<select aria-label={`${b} prepared ammunition`} disabled={busy} value={e.preloads[b]??''} onChange={event=>perform({type:'prepare-battery',battery:b,ammo:(event.target.value||null) as Ammo|null})}><option value="">No preset</option>{AMMUNITION.map(a=><option key={a} value={a}>{a.replaceAll('-',' ')}</option>)}</select></label>)}
 {Object.keys(needs).length?<ul>{Object.entries(needs).map(([id,quantity])=><li key={id} className={(g.cargo[id]??0)<quantity?'warning':''}>{id.replaceAll('-',' ')}: {quantity} needed / {(g.cargo[id]??0).toFixed(0)} aboard{(g.cargo[id]??0)<quantity?' — buy more at the Store':''}</li>)}</ul>:<p>No battery preset selected.</p>}<p>Each loaded cannon consumes one ammunition unit and one gunpowder unit. Buy cannon supplies through the trading counter. Unused loads return to the hold after battle; expended ammunition is lost.</p></details>;
}
