import {useState} from 'react';
import {ALL_GOODS,CATALOGUE} from './goods';
import {PORTS,date,type Game,type PortId} from './game';
import {ensureEconomy} from './trade';
export function MarketsJournal({game}:{game:Game}){
 const [selected,setSelected]=useState<PortId>(game.port),[search,setSearch]=useState('');
 const g=structuredClone(game);ensureEconomy(g);const snapshot=g.economy!.memories[selected];
 return <><h2>Remembered markets</h2><p className="muted">Prices recorded on your last visit. Markets elsewhere may have changed since then.</p><div className="trade-filters"><label>Port<select value={selected} onChange={e=>setSelected(e.target.value as PortId)}>{PORTS.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label>Find goods<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label></div>{!snapshot?<p>You have no market record for this port.</p>:<><p>Recorded {date(snapshot.hour)} · Trade tier {snapshot.tier}</p><div className="table-wrap"><table><caption>Indicative prices at the time of observation, before quantity effects.</caption><thead><tr><th>Goods</th><th>Role / access</th><th>Stock</th><th>Buy / sell silver</th></tr></thead><tbody>{ALL_GOODS.filter(id=>CATALOGUE[id].name.toLowerCase().includes(search.toLowerCase())).map(id=>{const row=snapshot.goods[id];return <tr key={id}><th scope="row">{CATALOGUE[id].name}</th><td>{row.role} · {row.controlled?'Controlled':'Open'}</td><td>{Math.floor(row.stock).toLocaleString()}</td><td>{row.buy.toFixed(2)} / {row.sell.toFixed(2)}</td></tr>;})}</tbody></table></div></>}</>;
}
