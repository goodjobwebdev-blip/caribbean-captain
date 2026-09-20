import {currentShip,type Game} from './game';
import {shipPerformance,loadBreakdown} from './performance';
export function factorLabel(factor:number){
 const delta=(factor-1)*100;
 return Math.abs(delta)<.05?'No change':`${delta>0?'+':'−'}${Math.abs(delta).toFixed(1)}%`;
}
export function PerformanceBreakdown({game:g}:{game:Game}){
 const spec=currentShip(g),p=shipPerformance(g),f=p.factors;
 return <section className="performance-breakdown" aria-label="Sailing performance"><h2>Sailing performance</h2><div className="table-wrap"><table><thead><tr><th>Factor</th><th>Speed</th><th>Maneuverability</th></tr></thead><tbody>
 <tr><th scope="row">Design baseline</th><td>{spec.speed.toFixed(2)} units/hour</td><td>{spec.maneuverability.toFixed(1)}</td></tr>
 <tr><th scope="row">Load · {(p.loadRatio*100).toFixed(1)}% of deadweight</th><td>{factorLabel(f.loadSpeed)}</td><td>{factorLabel(f.loadManeuver)}</td></tr>
 <tr><th scope="row">Hull condition</th><td>{factorLabel(f.hull)}</td><td>{factorLabel(f.hull)}</td></tr>
 <tr><th scope="row">Sail condition</th><td>{factorLabel(f.sails)}</td><td>{factorLabel(f.sails)}</td></tr>
 <tr><th scope="row">Crew · {g.crew} / {spec.optimalCrew} optimal</th><td>{factorLabel(f.crew)}</td><td>{factorLabel(f.crew)}</td></tr>
<tr><th scope="row">Crew sailing experience</th><td>{factorLabel(f.experience)}</td><td>{factorLabel(f.experience)}</td></tr><tr><th scope="row">Morale and discipline</th><td>{factorLabel(f.readiness)}</td><td>{factorLabel(f.readiness)}</td></tr>
 <tr><th scope="row">Captain’s Sailing mastery</th><td>{factorLabel(f.mastery)}</td><td>No change</td></tr>
 <tr className="performance-total"><th scope="row">Current performance</th><td>{p.speed.toFixed(2)} units/hour</td><td>{p.maneuverability.toFixed(1)}</td></tr>
 </tbody></table></div><p className="muted">Modifiers multiply together. The first 20% of deadweight is free of load penalties. Extra crew beyond optimal adds weight and upkeep, with no further speed bonus. Weather is applied separately to each voyage.</p>
 {p.overloaded&&<p className="warning">Overloaded by {(-p.availableDeadweight).toFixed(1)} weight units. Departure is blocked until the load is reduced.</p>}
 <p className="muted">Maneuverability affects turning costs and grappling in naval combat.</p>
 {g.voyage&&<p className="muted">This voyage keeps the duration fixed at departure{g.voyage.departureSpeed!==undefined?` (${g.voyage.departureSpeed.toFixed(2)} units/hour)`:''}. Current conditions apply to the next voyage.</p>}
 </section>;
}
export function LoadBreakdown({game:g}:{game:Game}){
 const weight=loadBreakdown(g),spec=currentShip(g);
 const items:[string,number][]=[['Trade goods',weight.trade],['Contract freight',weight.freight],['Provisions',weight.provisions],['Crew',weight.crew],['Passengers',weight.passengers],['Captain',weight.captain],['Installed cannons',weight.cannons]];
 return <section aria-label="Weight aboard"><h2>Weight aboard</h2><dl className="full-stats">{items.map(([name,value])=><div key={name}><dt>{name}</dt><dd>{value.toFixed(1)} weight units</dd></div>)}<div><dt>Total deadweight</dt><dd>{weight.total.toFixed(1)} / {spec.deadweight}</dd></div><div><dt>Available deadweight</dt><dd>{(spec.deadweight-weight.total).toFixed(1)} weight units</dd></div></dl><p className="muted">Cargo space and weight are separate limits. The empty ship’s structure does not count as carried weight. Installed cannons affect movement through their weight only.</p></section>;
}
