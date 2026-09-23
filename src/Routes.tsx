import {useState} from 'react';
import {ISLANDS,PORTS,type PortId} from './world';
import {distance,duration,foodFor,hoursTo,type Game} from './game';
import {sailingProblems} from './performance';

export function Routes({game:g,busy,onSelect}:{game:Game;busy:boolean;onSelect:(id:PortId)=>void}){
 const [search,setSearch]=useState('');
 const blocked=sailingProblems(g).length>0;
 const ports=PORTS.filter(p=>p.id!==g.port&&`${p.name} ${p.island} ${p.nation}`.toLowerCase().includes(search.trim().toLowerCase()));
 return <><label>Find a destination<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Town, island or nation"/></label>
 {!ports.length&&<p>No destinations match your search.</p>}
 {ISLANDS.map(island=>{const towns=ports.filter(p=>p.islandId===island.id);return towns.length>0&&<section key={island.id} aria-label={island.name}><h2>{island.name}</h2><div className="routes">{towns.map(p=><article className="route" key={p.id}><div><p className="eyebrow">{p.nation}</p><h3>{p.name}</h3><p>{blocked?'Departure unavailable':`${duration(hoursTo(g.port,p.id,g))} in normal weather`}</p><small>{distance(g.port,p.id).toFixed(1)} distance units{!blocked&&` · about ${Math.ceil(foodFor(g,hoursTo(g.port,p.id,g)))} provisions`}</small></div><button className="primary" aria-label={`Plan voyage to ${p.name}`} disabled={busy||blocked} onClick={()=>onSelect(p.id)}>Plan voyage</button></article>)}</div></section>;})}</>;
}
