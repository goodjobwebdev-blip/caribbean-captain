import type {Game,Action} from './game';
import {APPAREL,TIER_NAMES,apparel,type Apparel,type OutfitSlot} from './apparel';
import {WEAPONS,equipment,appearanceIndex,armourStats} from './equipment';
import {skillName} from './skills';

type Controls={game:Game;busy:boolean;perform:(action:Action)=>void};
const silver=(n:number)=>n.toLocaleString('en');

function ApparelCard({item,game:g,busy,perform}:{item:Apparel}&Controls){
 const e=equipment(g),owned=e.wardrobe!.includes(item.id),worn=e.outfit?.[item.slot]===item.id;
 const sale=Math.floor(item.price*(item.kind==='clothing'?.15:.6));
 return <article className="shop-item"><div className="section-line"><h3>{item.name}</h3><strong>{silver(item.price)} silver</strong></div>
  <small>{item.slot} · {TIER_NAMES[item.tier]} · tier {item.tier}{item.kind==='armour'&&` · ${item.protection} protection${item.dodgePenalty?` · Dodge ${item.dodgePenalty}`:''}`}</small>
  <p>{item.description}</p><div className="button-row">
  {!owned?<button disabled={busy||g.silver<item.price} onClick={()=>perform({type:'buy-apparel',id:item.id})}>Buy</button>:<><button disabled={busy||worn} onClick={()=>perform({type:'equip-apparel',id:item.id})}>{worn?'Equipped':'Equip'}</button>{worn&&<button disabled={busy} onClick={()=>perform({type:'unequip-apparel',slot:item.slot})}>Remove</button>}{!item.starter&&<button disabled={busy||worn} onClick={()=>perform({type:'sell-apparel',id:item.id})}>Sell · {silver(sale)} silver</button>}</>}
  </div></article>;
}
function Outfit({game:g}:{game:Game}){
 const e=equipment(g),armour=armourStats(g);
 return <section className="outfit-summary"><h2>What you wear</h2><p>Appearance index <strong>{appearanceIndex(g).toFixed(1)} / 4</strong> · the average tier of equipped head, body, feet, and melee weapon. Owned gear left unworn does not count.</p>
  <div className="outfit-slots">{(['head','body','feet'] as OutfitSlot[]).map(slot=>{const item=apparel(e.outfit?.[slot]??'');return <div key={slot}><small>{slot.toUpperCase()}</small><strong>{item?.name??'Bare'}</strong><span>{item?`${TIER_NAMES[item.tier]} · tier ${item.tier}`:'tier 0'}</span></div>;})}</div>
  <p className="muted">Captain Duel: {armour.points} protection point{armour.points===1?'':'s'}{armour.dodgePenalty?` · Dodge ${armour.dodgePenalty}`:''}. Protection resets for each duel, up to two points.</p>
 </section>;
}
export function Weaver(props:Controls){return <><Outfit game={props.game}/><h2>Clothing</h2><p className="muted">Clothes shape your appearance but do not yet change prices or conversations. The weaver pays 15% of the original price for unworn pieces.</p><div className="shop-grid">{APPAREL.filter(item=>item.kind==='clothing'&&!item.starter).map(item=><ApparelCard key={item.id} item={item} {...props}/>)}</div></>;}
export function Blacksmith({game:g,busy,perform}:Controls){
 const e=equipment(g),c=g.captainState;
 return <><Outfit game={g}/><h2>Weapons</h2><p className="muted">Your equipped melee weapon counts toward appearance. Weapon quality affects combat; luxury tier describes how it looks. Unequipped weapons can be sold for half their listed price.</p>
 <div className="shop-grid">{WEAPONS.map(w=>{const owned=e.weapons.some(item=>item.id===w.id),equipped=e.equipped===w.id;return <article className="shop-item" key={w.id}><div className="section-line"><h3>{w.name}</h3><strong>{silver(w.price)} silver</strong></div><small>{TIER_NAMES[w.tier]} · tier {w.tier} · {skillName(w.skill)} · quality +{w.quality}</small><p>{w.description}</p><div className="button-row">{!owned?<button disabled={busy||g.silver<w.price} onClick={()=>perform({type:'buy-equipment',id:w.id})}>Buy</button>:<><button disabled={busy||equipped} onClick={()=>perform({type:'equip-weapon',id:w.id})}>{equipped?'Equipped':'Equip'}</button><button disabled={busy||equipped||e.weapons.length<=1} onClick={()=>perform({type:'sell-equipment',id:w.id})}>Sell · {silver(Math.floor(w.price*.5))} silver</button></>}</div></article>;})}</div>
 <h2>Pistol supplies</h2><div className="shop-grid"><article className="shop-item"><h3>Pistol · 200 silver</h3><small>Respectable · tier 2 · not part of the appearance index</small><p>A flintlock with a reliable grip; one loaded shot may settle a duel before steel meets steel.</p><div className="button-row">{e.pistol?<><button disabled={busy||!!c?.pistol} onClick={()=>perform({type:'sell-equipment',id:'pistol'})}>Sell unloaded · 100 silver</button><span>{c?.pistol?'Loaded':'Owned, unloaded'}</span></>:<button disabled={busy||g.silver<200} onClick={()=>perform({type:'buy-equipment',id:'pistol'})}>Buy pistol</button>}</div></article><article className="shop-item"><h3>Five cartridges · 25 silver</h3><p>Five paper-wrapped charges, kept dry and counted twice before putting to sea.</p><p>{e.cartridges} spare · {c?.pistol?'1 loaded':'none loaded'} · maximum 20</p><button disabled={busy||g.silver<25||e.cartridges+(c?.pistol?1:0)>15} onClick={()=>perform({type:'buy-equipment',id:'cartridges'})}>Buy five</button></article></div>
 <h2>Armour</h2><p className="muted">Armour shares your clothing slots. Unworn pieces sell for 60% of their original price. A finer fit can make heavy steel easier to move in, while protection remains capped.</p><div className="shop-grid">{APPAREL.filter(item=>item.kind==='armour').map(item=><ApparelCard key={item.id} item={item} game={g} busy={busy} perform={perform}/>)}</div></>;
}
export function NavigationEquipment({game:g,busy,perform}:Controls){return <section className="shop-item"><h2>Navigation equipment</h2><h3>Spyglass · 150 silver</h3><p>Brass tubes draw a distant sail into focus, while the sea beyond it keeps its secrets.</p><p className="muted">An owned spyglass reveals early sightings at sea. It is not part of your appearance index.</p><button disabled={busy||!!g.spyglass||g.silver<150} onClick={()=>perform({type:'buy-equipment',id:'spyglass'})}>{g.spyglass?'Owned':'Buy spyglass'}</button></section>;}
