import {useState, type KeyboardEvent} from 'react';
import {cash, date, cargoUsed, passengers, port, GOODS, SHIP, effectiveSpeed, sailingBonus, type Game, type Contract} from './game';
import {sailingProgress,nextTierRequirement} from './skills';
export type Screen = 'game'|'journal'|'profiles'|'settings';
export function Icon({name}:{name:Screen|'log'}){
 const paths={game:<><circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/></>,journal:<><path d="M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v16h-6a4 4 0 0 0-3 1 4 4 0 0 0-3-1H3Z"/><path d="M12 6v15"/></>,profiles:<><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2M8 3l4-1 4 1"/></>,settings:<><path d="m9 3 1-1h4l1 3 3 1 3-1 1 4-2 2v3l2 2-2 4-3-1-3 2-1 2H9l-1-3-3-1-2 1-1-4 2-2v-3L2 8l2-3 3 1Z"/><circle cx="12" cy="12" r="3"/></>,log:<><path d="M5 3h14v18H5Z M8 7h8 M8 11h8 M8 15h5"/></>};
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
const TABS=['Ship','Skills','Crew','Cargo','Passengers','Quests'] as const;
type Tab=typeof TABS[number];
function tabKeys(event:KeyboardEvent<HTMLDivElement>){
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
 const tabs=Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
 const current=tabs.indexOf(document.activeElement as HTMLButtonElement);if(current<0)return;
 event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?tabs.length-1:(current+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
 tabs[index].focus();tabs[index].click();
}
function Details({items}:{items:[string,string][]}){return <dl className="full-stats">{items.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;}
function Quest({quest,status,finished}:{quest:Contract;status:string;finished?:number}){return <article className="quest-entry"><div className="section-line"><h3>{quest.type} to {port(quest.to).name}</h3><span className="quest-status">{status}</span></div><p>{port(quest.from).name} → {port(quest.to).name}</p><Details items={[[status==='Completed'?'Payment received':'Payment on delivery',`${cash(quest.reward)} silver`],['Load',quest.type==='Freight'?`${quest.amount} hold units`:quest.type==='Passengers'?`${quest.amount} passengers`:'One letter · no hold space'],['Deadline','None']]}/>{finished!==undefined&&<small>Completed {date(finished)}</small>}</article>;}
export function Journal({game:g}:{game:Game}){
 const [tab,setTab]=useState<Tab>('Ship');const [questView,setQuestView]=useState<'active'|'archived'>('active');
 const freight=g.contracts.filter(c=>c.type==='Freight');const people=g.contracts.filter(c=>c.type==='Passengers');
 const archived=g.archive??[];
 const sailing=sailingProgress(g.skills);const target=nextTierRequirement(sailing.tier);
 const location=g.voyage?`At sea, bound for ${port(g.voyage.to).name}`:port(g.port).name;
 return <section className="panel journal-screen"><p className="eyebrow">CAPTAIN {g.captain.toUpperCase()} · {location}</p><h1>Journal</h1><p className="muted">Your ship, people, and commissions. Take actions in Gamespace; this journal is read-only.</p>
 <div className="journal-tabs" role="tablist" aria-label="Journal sections" onKeyDown={tabKeys}>{TABS.map(t=><button key={t} role="tab" id={`journal-tab-${t}`} aria-selected={tab===t} aria-controls={`journal-panel-${t}`} tabIndex={tab===t?0:-1} onClick={()=>setTab(t)}>{t==='Ship'?'Ship stats':t==='Crew'?'Crew stats':t}</button>)}</div>
 <section role="tabpanel" id={`journal-panel-${tab}`} aria-labelledby={`journal-tab-${tab}`} tabIndex={0} className="journal-content">
 {tab==='Ship'&&<><h2>{SHIP.name}</h2><Details items={[
 ['Type',SHIP.type],['Condition',`${g.condition}%`],['Base ship speed',`${SHIP.speed} distance units/hour`],['Effective sailing speed',`${effectiveSpeed(g).toFixed(2)} distance units/hour`],['Hold used',`${cargoUsed(g).toFixed(1)} / ${SHIP.capacity}`],['Free hold space',`${Math.max(0,SHIP.capacity-cargoUsed(g)).toFixed(1)} units`],['Location',location],['Status',g.failed?'Voyage ended':g.voyage?'Pirate encounter':'In port']
 ]}/><h2>Captain’s record</h2><Details items={[
 ['Captain',g.captain],['Treasury',`${cash(g.silver)} silver${g.silver<0?' (wages owed)':''}`],['Calendar',date(g.hours)],['Completed commissions',String(archived.length)]
 ]}/></>}
 {tab==='Skills'&&<><p className="eyebrow">PLAYER SKILLS</p><article className="skill-card"><div className="section-line"><h2>Sailing &amp; Navigation</h2><span className="quest-status">Tier {sailing.tier} / 10</span></div><p>Ship handling, sail and rigging work, route planning, weather judgment, and avoiding maritime hazards.</p><Details items={[
 ['Mastery tier',`${sailing.tier} / 10`],['Sailing speed bonus',`+${Math.round(sailingBonus(g)*100)}%`],['Effective sailing speed',`${effectiveSpeed(g).toFixed(2)} units/hour`],['Progress to next tier',target===null?'Maximum mastery':`${sailing.points} / ${target} points`],['Practice toward next point',target===null?'Maximum mastery':`${sailing.sailingHours??0} / 24 sailing hours`]
 ]}/>{target!==null&&<><label htmlFor="sailing-progress">Progress toward tier {sailing.tier+1}</label><progress id="sailing-progress" value={Math.min(sailing.points,target)} max={target}>{sailing.points} / {target}</progress></>}<p className="muted">Only mastery tiers affect gameplay. Points track progress toward the next tier.</p><div className="skill-note"><strong>5% more sailing speed per mastery tier</strong><p>Earn 1 point per 24 hours of sailing, awarded on arrival. Leftover hours and points carry forward. Port time and extra encounter delays do not count. Weather effects are unchanged.</p></div></article></>}
 {tab==='Crew'&&<><h2>The ship’s company</h2><Details items={[
 ['Sailors aboard',`${g.crew} / ${SHIP.maxCrew}`],['Minimum to sail',`${SHIP.minCrew} sailors`],['Daily crew wages',`${g.crew*2} silver`],['Crew provisions',`${g.crew} per day`],['All aboard',`${g.crew+passengers(g)} people`],['Total provisions',`${g.provisions.toFixed(1)} units`],['Food remaining',`${(g.provisions/(g.crew+passengers(g))).toFixed(1)} days for everyone aboard`]
 ]}/><p className="muted">Officers, individual experience, and skills will be added later.</p></>}
 {tab==='Cargo'&&<><h2>The hold</h2><Details items={[["Capacity used",`${cargoUsed(g).toFixed(1)} / ${SHIP.capacity} units`],['Provisions',`${g.provisions.toFixed(1)} units`]]}/><div className="table-wrap"><table><thead><tr><th>Trade goods</th><th>Quantity / hold units</th></tr></thead><tbody>{GOODS.map(good=><tr key={good}><td className="capitalize">{good}</td><td>{g.cargo[good]}</td></tr>)}</tbody></table></div><h2>Contract freight</h2>{freight.length?freight.map(c=><p className="commission" key={c.id}>{c.amount} units · {port(c.to).name} · {c.reward} silver on delivery</p>):<p className="muted">No freight aboard.</p>}<p className="muted">Trade goods, provisions, and freight share the hold. Cargo management actions will come later.</p></>}
 {tab==='Passengers'&&<><h2>Passengers aboard</h2><Details items={[["Berths occupied",`${passengers(g)} / 6`],['Daily passenger provisions',`${passengers(g)} units`]]}/>{people.length?people.map(c=><Quest key={c.id} quest={c} status={g.failed?'Voyage ended':!g.voyage&&c.to===g.port?'Ready to deliver':'Aboard'}/>):<p className="muted">No passengers aboard. Passage contracts are available at the Harbour Master.</p>}</>}
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
