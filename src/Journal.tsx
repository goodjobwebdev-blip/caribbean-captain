import {CrewSummary} from './CrewServices';
import {CaptainEquipment,CombatSkills} from './EquipmentPanel';
import {FinanceJournal} from './FinanceJournal';
import {CargoLedger} from './CargoLedger';
import {spread} from './trade';
import {MarketsJournal} from './MarketsJournal';
import {CATALOGUE} from './goods';
import {tradeProgress} from './skills';
import {PerformanceBreakdown,LoadBreakdown} from './Performance';
import {shipPerformance,GOODS_LOAD} from './performance';
import {BATTERIES,totalCannons,shipSaleValue} from './ships';
import {useState, type KeyboardEvent} from 'react';
import {cash, date, cargoUsed, passengers, port, GOODS, currentShip, ownedShip, hullPercent, effectiveSpeed, sailingBonus, questSkillReward, type Game, type Contract} from './game';
import {sailingProgress,nextTierRequirement} from './skills';
export type Screen = 'game'|'journal'|'profiles'|'settings';
export function Icon({name}:{name:Screen|'log'}){
 const paths={game:<><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/></>,journal:<><path d="M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v16h-6a4 4 0 0 0-3 1 4 4 0 0 0-3-1H3Z"/><path d="M12 6v15"/></>,profiles:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2M8 3l4-1 4 1"/></>,settings:<><path d="m9 3 1-1h4l1 3 3 1 3-1 1 4-2 2v3l2 2-2 4-3-1-3 2-1 2H9l-1-3-3-1-2 1-1-4 2-2v-3L2 8l2-3 3 1Z"/><circle cx="12" cy="12" r="3"/></>,log:<><path d="M5 3h14v18H5Z M8 7h8 M8 11h8 M8 15h5"/></>};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const TABS=['Ship','Skills','Equipment','Crew','Cargo','Passengers','Quests','Markets','Finance'] as const;
type Tab=typeof TABS[number];
function tabKeys(event:KeyboardEvent<HTMLDivElement>){
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 const tabs=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
 const current=tabs.indexOf(document.activeElement as HTMLButtonElement);if(current<0)return;
 event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
 tabs[index].focus();tabs[index].click();
}
function Details({items}:{items:[string,string][]}){return <dl className="full-stats">{items.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;}
function Quest({quest,status,finished}:{quest:Contract;status:string;finished?:number}){return <article className="quest-entry"><div className="section-line"><h3>{quest.type} to {port(quest.to).name}</h3><span className="quest-status">{status}</span></div><p>{port(quest.from).name} → {port(quest.to).name}</p><Details items={[[status==='Completed'?'Payment received':'Payment on delivery',`${cash(quest.reward)} silver`],['Sailing reward',`${finished!==undefined?(quest.sailingReward??0):questSkillReward(quest)} points`],['Load',quest.type==='Freight'?`${quest.amount} hold units`:quest.type==='Passengers'?`${quest.amount} passengers`:'One letter · no hold space'],['Deadline','None']]}/>{finished!==undefined&&<small>Completed {date(finished)}</small>}</article>;}
export function Journal({game:g}:{game:Game}){
 const ship=ownedShip(g),spec=currentShip(g),performance=shipPerformance(g);
 const [tab,setTab]=useState<Tab>('Ship');const [questView,setQuestView]=useState<'active'|'archived'>('active');
 const freight=g.contracts.filter(c=>c.type==='Freight');const people=g.contracts.filter(c=>c.type==='Passengers');
 const archived=g.archive??[];
 const sailing=sailingProgress(g.skills);const target=nextTierRequirement(sailing.tier);
 const location=g.voyage?`At sea, bound for ${port(g.voyage.to).name}`:port(g.port).name;
 return <section className="panel journal-screen"><p className="eyebrow">CAPTAIN {g.captain.toUpperCase()} · {location}</p><h1>Journal</h1><p className="muted">Your ship, people, and commissions. Take actions in Gamespace; this journal is read-only.</p>
 <div className="journal-tabs" role="tablist" aria-label="Journal sections" onKeyDown={tabKeys}>{TABS.map(t=><button key={t} role="tab" id={`journal-tab-${t}`} aria-selected={tab===t} aria-controls={`journal-panel-${t}`} tabIndex={tab===t?0:-1} onClick={()=>setTab(t)}>{t==='Ship'?'Ship stats':t==='Crew'?'Crew stats':t}</button>)}</div>
 <section role="tabpanel" id={`journal-panel-${tab}`} aria-labelledby={`journal-tab-${tab}`} tabIndex={0} className="journal-content">
 {tab==='Ship'&&<><h2>{ship.name}</h2><Details items={[
 ['Type',spec.label],['Tier / class',`${spec.tier} / ${spec.shipClass}`],['Hull points',`${ship.hullPoints.toFixed(0)} / ${spec.maxHull} (${hullPercent(g).toFixed(0)}%)`],['Sail condition',`${ship.sailCondition}%`],['Sale value',`${cash(shipSaleValue(ship))} silver`],['Base ship speed',`${spec.speed} distance units/hour`],['Effective sailing speed',`${effectiveSpeed(g).toFixed(2)} distance units/hour`],['Hold used',`${cargoUsed(g).toFixed(1)} / ${spec.capacity}`],['Free hold space',`${Math.max(0,spec.capacity-cargoUsed(g)).toFixed(1)} units`],['Current deadweight',`${performance.weight.total.toFixed(1)} / ${spec.deadweight}`],['Available deadweight',`${performance.availableDeadweight.toFixed(1)} weight units`],['Location',location],['Status',g.failed?'Voyage ended':g.voyage?'Pirate encounter':'In port']
 ]}/><PerformanceBreakdown game={g}/><h2>Design and armament</h2><Details items={[["Deadweight capacity",`${spec.deadweight} weight units`],['Base maneuverability',`${spec.maneuverability} / 100`],['Hull protection',`${spec.protection} / 100`],['Crew min / optimal / max',`${spec.minCrew} / ${spec.optimalCrew} / ${spec.maxCrew}`],['Passenger berths',String(spec.passengerCapacity)],['Total cannons',`${totalCannons(ship.cannons)} / ${totalCannons(spec.cannonCapacity)}`],...BATTERIES.map(b=>[`${b[0].toUpperCase()+b.slice(1)} cannons`,`${ship.cannons[b]} / ${spec.cannonCapacity[b]}`] as [string,string])]}/><p className="ship-spec-note muted">Hull protection reduces incoming naval damage. Cannons contribute their weight to sailing performance.</p><h2>Captain’s record</h2><Details items={[
 ['Captain',g.captain],['Treasury',`${cash(g.silver)} silver${g.silver<0?' (treasury debt)':''}`],['Calendar',date(g.hours)],['Completed commissions',String(archived.length)]
 ]}/></>}
 {tab==='Finance'&&<FinanceJournal game={g}/>}
 {tab==='Markets'&&<MarketsJournal game={g}/>}
 {tab==='Equipment'&&<CaptainEquipment game={g}/>}
 {tab==='Skills'&&<><CombatSkills game={g}/><article className="skill-card"><h2>Trade</h2><p>Tier {tradeProgress(g.skills).tier} / 10 · {tradeProgress(g.skills).points.toFixed(2)} / {nextTierRequirement(tradeProgress(g.skills).tier)??'Maximum'} points</p><p>Market spread: {(spread(g)*100).toFixed(1)}%. Each tier improves both buying and selling prices. Local attitude and reputation also affect legal terms.</p><p className="muted">Earn 1 point per 100 silver of profitable resale of goods purchased at another port, before voyage expenses. Learning follows each acquired portion of cargo; unprofitable portions earn nothing. Fractions carry forward. Starting cargo and purchases of unknown origin earn no points.</p></article><p className="eyebrow">PLAYER SKILLS</p><article className="skill-card"><div className="section-line"><h2>Sailing &amp; Navigation</h2><span className="quest-status">Tier {sailing.tier} / 10</span></div><p>Ship handling, sail and rigging work, route planning, weather judgment, and avoiding maritime hazards.</p><Details items={[
 ['Mastery tier',`${sailing.tier} / 10`],['Sailing speed bonus',`+${Math.round(sailingBonus(g)*100)}%`],['Effective sailing speed',`${effectiveSpeed(g).toFixed(2)} units/hour`],['Progress to next tier',target===null?'Maximum mastery':`${sailing.points} / ${target} points`],['Practice toward next point',target===null?'Maximum mastery':`${sailing.sailingHours??0} / 24 sailing hours`]
 ]}/>{target!==null&&<><label htmlFor="sailing-progress">Progress toward tier {sailing.tier+1}</label><progress id="sailing-progress" value={Math.min(sailing.points,target)} max={target}>{sailing.points} / {target}</progress></>}<p className="muted">Only mastery tiers affect gameplay. Points track progress toward the next tier.</p><div className="skill-note"><strong>5% more sailing speed per mastery tier</strong><p>Earn 1 point per 24 hours of sailing, awarded on arrival. Leftover hours and points carry forward. Port time and extra encounter delays do not count. Weather effects are unchanged.</p></div></article></>}
 {tab==='Crew'&&<><CrewSummary game={g}/><CaptainEquipment game={g}/><h2>The ship’s company</h2><Details items={[
 ['Sailors aboard',`${g.crew} / ${spec.maxCrew}`],['Minimum to sail',`${spec.minCrew} sailors`],['Optimal crew',`${spec.optimalCrew} sailors`],['Crew performance',`${(performance.factors.crew*100).toFixed(1)}%`],['Daily crew wages',`${g.crew*2} silver`],['Crew provisions',`${g.crew} per day`],['All aboard',`${g.crew+passengers(g)} people`],['Total provisions',`${g.provisions.toFixed(1)} units`],['Food remaining',`${(g.provisions/(g.crew+passengers(g))).toFixed(1)} days for everyone aboard`]
 ]}/><p className="muted">Fit crew handle combat duties. Injured crew remain aboard and consume provisions and wages.</p></>}
 {tab==='Cargo'&&<><CargoLedger game={g}/><h2>The hold</h2><Details items={[["Capacity used",`${cargoUsed(g).toFixed(1)} / ${spec.capacity} units`],['Provisions',`${g.provisions.toFixed(1)} units`]]}/><div className="table-wrap"><table><thead><tr><th>Trade goods</th><th>Quantity / hold units</th><th>Weight per unit</th><th>Total weight</th></tr></thead><tbody>{GOODS.filter(good=>(g.cargo[good]??0)>0).map(good=><tr key={good}><td className="capitalize">{CATALOGUE[good].name}</td><td>{g.cargo[good].toFixed(2)} / {(g.cargo[good]*GOODS_LOAD[good].space).toFixed(1)}</td><td>{GOODS_LOAD[good].weight}</td><td>{(g.cargo[good]*GOODS_LOAD[good].weight).toFixed(1)}</td></tr>)}</tbody></table></div><h2>Contract freight</h2>{freight.length?freight.map(c=><p className="commission" key={c.id}>{c.amount} units · {port(c.to).name} · {c.reward} silver on delivery</p>):<p className="muted">No freight aboard.</p>}<p className="muted">Trade goods, provisions, and freight share the hold. Manage trade cargo at the store.</p><LoadBreakdown game={g}/></>}
 {tab==='Passengers'&&<><h2>Passengers aboard</h2><Details items={[["Berths occupied",`${passengers(g)} / ${spec.passengerCapacity}`],['Daily passenger provisions',`${passengers(g)} units`]]}/>{people.length?people.map(c=><Quest key={c.id} quest={c} status={g.failed?'Voyage ended':!g.voyage&&c.to===g.port?'Ready to deliver':'Aboard'}/>):<p className="muted">No passengers aboard. Passage contracts are available at the Harbour Master.</p>}</>}
 {tab==='Quests'&&<><h2>Your commissions</h2><div className="quest-tabs" role="tablist" aria-label="Quest status" onKeyDown={tabKeys}>{(['active','archived'] as const).map(view=><button role="tab" key={view} id={`quests-tab-${view}`} aria-controls={`quests-panel-${view}`} aria-selected={questView===view} tabIndex={questView===view?0:-1} className="capitalize" onClick={()=>setQuestView(view)}>{view} ({view==='active'?(g.failed?0:g.contracts.length):archived.length+(g.failed?g.contracts.length:0)})</button>)}</div><div role="tabpanel" id={`quests-panel-${questView}`} aria-labelledby={`quests-tab-${questView}`} tabIndex={0}>
 {questView==='active'?(!g.failed&&g.contracts.length?g.contracts.map(c=><Quest key={c.id} quest={c} status={!g.voyage&&c.to===g.port?'Ready to deliver':'In progress'}/>):<p className="muted">No active quests. Visit a Harbour Master in Gamespace to find work.</p>):<>{archived.map((c,i)=><Quest key={`${c.id}-${i}`} quest={c} status="Completed" finished={c.completedAt}/>)}{g.failed&&g.contracts.map(c=><Quest key={c.id} quest={c} status="Failed — voyage ended"/>)}{!archived.length&&(!g.failed||!g.contracts.length)&&<p className="muted">No archived quests yet. Completed commissions will appear here.</p>}<small>Completed quests are recorded from this update onward. Restoring a checkpoint also restores its quest history.</small></>}
 </div></>}
 </section></section>;
}
export function LogDrawer({game}:{game:Game}){
 const [open,setOpen]=useState(false);
 return <section className={`log-drawer ${open?'is-open':''}`} aria-label="Captain’s log">
 <button className="log-toggle" aria-expanded={open} aria-controls="gamespace-log" onClick={()=>setOpen(!open)}><Icon name="log"/><strong>Captain’s log</strong><span className="log-preview">{game.log[0]?.text||'No entries yet.'}</span><span aria-hidden="true">{open?'⌄':'⌃'}</span></button>
 <div id="gamespace-log" hidden={!open} className="log-body" tabIndex={0} onKeyDown={event=>{if(event.key==='Escape'){setOpen(false);event.currentTarget.parentElement?.querySelector('button')?.focus();}}}><ol>{game.log.map((entry,i)=><li key={`${entry.hours}-${i}`}><time>{date(entry.hours)}</time><p>{entry.text}</p></li>)}</ol></div>
 </section>;
}
