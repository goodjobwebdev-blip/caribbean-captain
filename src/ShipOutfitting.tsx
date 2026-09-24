import {useEffect,useRef,useState} from 'react';
import {cash,ownedShip,type Game,type Action} from './game';
import {BATTERIES,CALIBRES,GUN_STATS,SAILS,gunFit,maxCalibre,reinforcementPrice,reinforcementWeight,sailStats,shipDefinition,shipProtection,type Battery,type Calibre,type GunType,type SailType,type OwnedShip} from './ships';
import {refitQuote,type Refit} from './outfitting';
import {shipPerformance} from './performance';
export function OutfitSummary({ship}:{ship:OwnedShip}){
 return <section aria-label="Ship outfit"><h2>Ship outfit</h2><p>{sailStats(ship).name} sails · {ship.reinforcedHull?'Reinforced hull':'Standard hull'} · {shipProtection(ship)} protection</p><div className="table-wrap"><table><thead><tr><th>Battery</th><th>Guns</th><th>Operational / fitted</th></tr></thead><tbody>{BATTERIES.map(b=>{const f=gunFit(ship,b);return <tr key={b}><th className="capitalize" scope="row">{b}</th><td>{f.calibre}-pound {f.type}s</td><td>{ship.cannons[b]} / {f.fitted}</td></tr>;})}</tbody></table></div></section>;
}
function BatteryEditor({game:g,battery,busy,onReview}:{game:Game;battery:Battery;busy:boolean;onReview:(c:Refit)=>void}){
 const ship=ownedShip(g),spec=shipDefinition(ship.configurationId),f=gunFit(ship,battery);
 const [type,setType]=useState<GunType>(f.type),[calibre,setCalibre]=useState<Calibre>(f.calibre),[count,setCount]=useState(ship.cannons[battery]);
 const change:Refit={kind:'guns',battery,gunType:type,calibre,count},q=refitQuote(g,change),stats=GUN_STATS[calibre];
 return <article className="service"><h3 className="capitalize">{battery} battery</h3>
 <p>{ship.cannons[battery]} operational / {f.fitted} fitted · {spec.cannonCapacity[battery]} mounts</p>
 <label>Gun type<select aria-label={`${battery} gun type`} disabled={busy} value={type} onChange={e=>setType(e.target.value as GunType)}><option value="cannon">Cannon</option><option value="culverin">Culverin</option></select></label>
 <label>Calibre<select aria-label={`${battery} calibre`} disabled={busy} value={calibre} onChange={e=>setCalibre(Number(e.target.value) as Calibre)}>{CALIBRES.filter(c=>c<=maxCalibre(spec)).map(c=><option key={c} value={c}>{c}-pound</option>)}</select></label>
 <label>Number of guns<input aria-label={`${battery} gun count`} disabled={busy} type="number" min={0} max={spec.cannonCapacity[battery]} step={1} value={count} onChange={e=>setCount(e.target.value===''?0:Number(e.target.value))}/></label>
 <p>Per gun: {stats.weight} weight · ×{(stats.damage*(type==='culverin'?.8:1)).toFixed(2)} damage compared with a 6-pound cannon.{type==='culverin'?' Accuracy +1; +2 total at long/distant range.':''}</p>
 <p>{q.balance<0?'Receive':'Pay'} {cash(Math.abs(q.balance))} silver · {q.hours} hours, plus upkeep.</p>
 <button disabled={busy||!!q.errors.length} onClick={()=>onReview(change)}>Review {battery} refit</button>{q.errors.map(e=><small className="warning" key={e}>{e}</small>)}
 </article>;
}
export function ShipOutfitting({game:g,busy,perform}:{game:Game;busy:boolean;perform:(a:Action)=>void}){
 const ship=ownedShip(g),spec=shipDefinition(ship.configurationId),[sails,setSails]=useState<SailType>(ship.sailType??'standard'),[pending,setPending]=useState<Refit|null>(null);
 const review=useRef<HTMLElement>(null);
 useEffect(()=>{if(pending)review.current?.focus();},[pending]);
 const sailChange:Refit={kind:'sails',sailType:sails},sailQuote=refitQuote(g,sailChange),hullQuote=refitQuote(g,{kind:'hull'}),q=pending?refitQuote(g,pending):null,current=shipPerformance(g);
 return <section className="ship-outfitting"><OutfitSummary ship={ship}/><p>Maximum calibre: {maxCalibre(spec)}-pound. Batteries may differ; guns within one battery must match. Equipment stays with this ship when sold or captured.</p>
 {q&&<section ref={review} tabIndex={-1} className="service" aria-label="Review ship refit"><h2>Review refit</h2><dl className="full-stats">
 <div><dt>New equipment / work</dt><dd>{cash(q.purchase)} silver</dd></div><div><dt>Equipment buyback</dt><dd>{cash(q.buyback)} silver</dd></div><div><dt>Time / upkeep</dt><dd>{q.hours} hours · {q.wages.toFixed(2)} silver · {q.food.toFixed(2)} provisions</dd></div>
 <div><dt>Weight before → after</dt><dd>{current.weight.total.toFixed(1)} → {q.performance.weight.total.toFixed(1)} / {spec.deadweight}</dd></div><div><dt>Loaded speed before → after</dt><dd>{current.speed.toFixed(2)} → {q.performance.speed.toFixed(2)}</dd></div><div><dt>Maneuverability before → after</dt><dd>{current.maneuverability.toFixed(1)} → {q.performance.maneuverability.toFixed(1)}</dd></div><div><dt>Protection before → after</dt><dd>{shipProtection(ship)} → {shipProtection(q.ship)}</dd></div><div><dt>Silver after refit and wages</dt><dd>{(g.silver-q.balance-q.wages).toFixed(2)}</dd></div></dl>
 {pending?.kind==='hull'&&<p>Permanent reinforcement cannot be removed. It stays with the ship and increases resale value.</p>}
 <p>Performance preview uses current cargo and provisions. Upkeep during the work will slightly reduce carried weight.</p>
 {q.errors.map(e=><p key={e} className="warning">{e}</p>)}<div className="button-row"><button className="primary" disabled={busy||!!q.errors.length} onClick={()=>{perform({type:'refit',change:pending!,expected:q.token});setPending(null);}}>Confirm refit</button><button disabled={busy} onClick={()=>setPending(null)}>Cancel refit</button></div></section>}
 <h2>Armament</h2><p>Removed guns sell for 60%. Retained matching guns are not bought again. Ammunition and reload times remain the same for all calibres. Culverins improve accuracy without extending ammunition range limits.</p><div className="two-columns">{BATTERIES.filter(b=>spec.cannonCapacity[b]>0).map(b=><BatteryEditor key={`${b}:${JSON.stringify(gunFit(ship,b))}:${ship.cannons[b]}`} game={g} battery={b} busy={busy} onReview={setPending}/>)}</div>
 <h2>Sails</h2><div className="table-wrap"><table><thead><tr><th>Set</th><th>Speed</th><th>Turning</th><th>Sail damage taken</th><th>New price</th></tr></thead><tbody>{Object.entries(SAILS).map(([id,s])=><tr key={id}><th>{s.name}</th><td>×{s.speed}</td><td>×{s.maneuver}</td><td>×{s.damage}</td><td>{cash(s.price*spec.tier)} silver</td></tr>)}</tbody></table></div>
 <label>Sail set<select aria-label="Sail set" disabled={busy} value={sails} onChange={e=>setSails(e.target.value as SailType)}>{Object.entries(SAILS).map(([id,s])=><option key={id} value={id}>{s.name}</option>)}</select></label><p>Eight hours. New sails arrive fully repaired. Old sails sell for 60% of list price scaled by condition. Better sails cost more to repair.</p><button disabled={busy||!!sailQuote.errors.length} onClick={()=>setPending(sailChange)}>Review sail refit</button>{sailQuote.errors.map(e=><small className="warning" key={e}>{e}</small>)}
 <h2>Hull reinforcement</h2><p>{ship.reinforcedHull?`Installed · ${reinforcementWeight(ship)} extra weight.`:`Permanent +10 protection · ${spec.deadweight*.05} extra weight · ${cash(reinforcementPrice(ship))} silver · 24 hours.`} Resale recovers 70% of reinforcement cost.</p><button disabled={busy||!!hullQuote.errors.length} onClick={()=>setPending({kind:'hull'})}>Review hull reinforcement</button>{hullQuote.errors.map(e=><small className="warning" key={e}>{e}</small>)}
 </section>;
}
