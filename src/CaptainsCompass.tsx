import {connectionObjective} from './connections';
import {useEffect,useId,useRef} from 'react';
import {cash,contractBuilding,currentShip,date,distance,duration,hoursTo,hullPercent,ownedShip,passengers,type Game,type PortId} from './game';
import {PORTS,port} from './world';
import {sailingProblems,shipPerformance} from './performance';
import {npcAt,type NpcPlace} from './npcs';
import {HARBOUR_STORIES,harbourAdventureQuote,visitedHarbours,type AdventureAction,type HarbourStoryState} from './adventures';
import './captains-compass.css';

type CompassGame=Game&HarbourStoryState;
type Bearing={id:string;title:string;detail:string;place?:NpcPlace;destination?:PortId;urgent?:boolean};
export function captainBearings(g:CompassGame,checkpointCount:number):Bearing[]{
 if(g.failed||g.voyage||g.battle)return [];
 const bearings:Bearing[]=[],ship=ownedShip(g),spec=currentShip(g),thread=connectionObjective(g);
 const ready=g.contracts.filter(c=>c.to===g.port);
 if(!checkpointCount)bearings.push({id:'checkpoint',title:'Give this chapter a safe harbour',detail:'Record a free church checkpoint before your first departure. A lost voyage needs a checkpoint to recover.',place:'Church',urgent:true});
 if(ready.length){const building=contractBuilding(ready[0]),count=ready.filter(c=>contractBuilding(c)===building).length;bearings.push({id:'deliver',title:`Your arrival is worth silver`,detail:`${count} commission${count===1?' is':'s are'} ready at the ${building}. Collect the agreed payment there.`,place:building,urgent:true});}
 if((g.captainState?.injury??0)>=5||(g.captainState?.fatigue??0)>=4)bearings.push({id:'recover',title:'Recover before the next crossing',detail:'Rest at the Tavern before trying to sail again.',place:'Tavern',urgent:true});
 if((g.crewState?.fit??g.crew)<spec.minCrew)bearings.push({id:'crew',title:'Find hands for the voyage',detail:`You need at least ${spec.minCrew} fit sailors to put to sea. Visit the Tavern for hiring and crew care.`,place:'Tavern',urgent:true});
 if(hullPercent(g)<70||ship.sailCondition<70)bearings.push({id:'repair',title:'Tend to your ship',detail:`Hull ${hullPercent(g).toFixed(0)}% · sails ${ship.sailCondition.toFixed(0)}%. The Shipyard can quote repairs before you commit.`,place:'Shipyard',urgent:true});
 if(shipPerformance(g).overloaded)bearings.push({id:'load',title:'Lighten the ship',detail:'Your ship is above its safe deadweight. Sell cargo at the Store or deliver any ready freight before departure.',place:'Store',urgent:true});
 const mouths=g.crew+passengers(g),days=mouths>0?g.provisions/mouths:0;
 if(days<3)bearings.push({id:'provisions',title:'Put food aboard',detail:`${days.toFixed(1)} days of provisions remain at the current crew and passenger count. Compare the next route’s reserve before buying.`,place:'Store',urgent:true});
 if(thread?.destination===g.port)bearings.push({id:'connected-arrival',title:'Your next chapter is here',detail:'Inés is waiting on this quay. Read the connected journey above before choosing another crossing.'});
 if(!sailingProblems(g).length&&thread?.destination!==g.port){
  const underway=g.contracts.filter(c=>c.to!==g.port).sort((a,b)=>distance(g.port,a.to)-distance(g.port,b.to));
  if(thread&&thread.destination!==g.port){bearings.push({id:'connected-journey',title:thread.title,detail:thread.detail,destination:thread.destination});}
  else if(underway.length){const next=underway[0];bearings.push({id:'commission-route',title:`Keep your word in ${port(next.to).name}`,detail:`Your accepted work goes to the ${contractBuilding(next)}. Review the route, food and wages before sailing.`,destination:next.to});}
  else {
   const visited=visitedHarbours(g),unseen=PORTS.filter(p=>!visited.includes(p.id)).sort((a,b)=>distance(g.port,a.id)-distance(g.port,b.id))[0];
   if(unseen)bearings.push({id:'new-horizon',title:`A new quay: ${unseen.name}`,detail:`${unseen.island} · ${duration(hoursTo(g.port,unseen.id,g))} in normal weather. A nearby harbour you have yet to visit.`,destination:unseen.id});
  }
 }
 if(!g.contracts.length&&!thread)bearings.push({id:'work',title:'Find a reason to set sail',detail:'Ask the Harbour Master about letters and passengers, or the Store about freight. Read the terms before accepting.',place:'Harbour Master'});
 if(!bearings.length)bearings.push({id:'town',title:'Spend a little time ashore',detail:'The Tavern offers crew training, medical care and shore leave. Your next voyage can wait while you prepare.',place:'Tavern'});
 return bearings.slice(0,3);
}

export function CaptainsCompass({game:g,checkpointCount,busy,onNavigate,onPlan,onAction}:{game:CompassGame;checkpointCount:number;busy:boolean;onNavigate:(place:NpcPlace)=>void;onPlan:(port:PortId)=>void;onAction:(action:AdventureAction)=>void}){
 const id=useId(),outcomeRef=useRef<HTMLDivElement|null>(null);
 const completed=g.harbourStories?.[g.port]?.completedAt,previous=useRef({port:g.port,completed});
 useEffect(()=>{if(previous.current.port===g.port&&completed!==undefined&&previous.current.completed!==completed){outcomeRef.current?.scrollIntoView?.({block:'center'});outcomeRef.current?.focus({preventScroll:true});}previous.current={port:g.port,completed};},[g.port,completed]);
 if(g.failed||g.voyage||g.battle)return null;
 const visited=visitedHarbours(g),finished=PORTS.filter(p=>g.harbourStories?.[p.id]).length,bearings=captainBearings(g,checkpointCount);
 const tale=HARBOUR_STORIES[g.port],memory=g.harbourStories?.[g.port],remembered=tale.choices.find(c=>c.id===memory?.choice);
 const crewMorale=g.crewState?.morale??50;
 return <section className="captains-compass" aria-labelledby={`${id}-title`}>
  <header className="compass-heading">
   <span className="compass-rose" aria-hidden="true">✦</span>
   <div><p className="eyebrow">THE WORLD IS OPEN</p><h2 id={`${id}-title`}>A captain’s bearings</h2><p>Every crossing begins with a reason to leave.</p></div>
  </header>
  <div className="compass-progress" aria-label="Your travels">
   <span><strong>{visited.length}<small> / {PORTS.length}</small></strong> harbours visited</span>
   <span><strong>{finished}<small> / {PORTS.length}</small></strong> harbour stories</span>
   <span><strong>{g.archive?.length??0}</strong> commissions completed</span>
  </div>
  <div className="compass-bearings" aria-label="Suggested next steps">
   {bearings.map((bearing,i)=><article key={bearing.id} className={bearing.urgent?'bearing bearing-urgent':'bearing'}>
    <span className="bearing-number" aria-hidden="true">0{i+1}</span><div><h3>{bearing.title}</h3><p>{bearing.detail}</p>
    {(bearing.place||bearing.destination)&&<button disabled={busy} onClick={()=>bearing.place?onNavigate(bearing.place):bearing.destination&&onPlan(bearing.destination)}>{bearing.place?`Visit ${bearing.place}`:`Chart ${port(bearing.destination!).name}`}<span aria-hidden="true"> ↗</span></button>}</div>
   </article>)}
  </div>
  <section className="harbour-story" aria-labelledby={`${id}-story`}>
   <div className="harbour-story-heading"><p className="eyebrow">{memory?'THIS PORT REMEMBERS':'A STORY ON THE QUAY'}</p><span className="harbour-story-seal">{memory?'Chapter kept':'One chance to take part'}</span></div>
   <h3 id={`${id}-story`}>{tale.title}</h3>
   {memory&&remembered?<div className="harbour-story-memory" ref={outcomeRef} tabIndex={-1} role="status" aria-label="Harbour story outcome"><p>{remembered.outcome}</p><small>{date(memory.completedAt)} · {remembered.label}</small>{!g.connections&&<p><a href="#connected-journey">Your work opened a new lead. Meet the contact ↑</a></p>}</div>:<>
    <p className="harbour-story-narrator">A word from {npcAt(g.port,'Harbour Master').name}, Harbour Master</p>
    <p className="harbour-story-scene">{tale.scene}</p>
    <div className="harbour-story-choices">
     {tale.choices.map(choice=>{const action:AdventureAction={type:'harbour-story',port:g.port,choice:choice.id},quote=harbourAdventureQuote(g,action),gain=Math.max(0,Math.min(choice.morale,100-crewMorale)),reasonId=`${id}-${choice.id}-reasons`;
      return <article key={choice.id} className="harbour-story-choice"><h4>{choice.label}</h4>
       <p className="story-choice-cost">{choice.hours}h ashore · {quote.provisions.toFixed(2)} provisions · {quote.wages.toFixed(2)} silver in wages</p>
       <p className="story-choice-reward">{cash(choice.silver)} silver payment{choice.attitude>0&&` · +${choice.attitude} ${port(g.port).nation} attitude`}{choice.reputation>0&&` · +${choice.reputation} reputation`}{choice.morale>0&&` · +${gain.toFixed(0)} crew morale${gain<choice.morale?' (capped at 100)':''}`}</p>
       <small>Net cash after wages: {quote.choice.silver-quote.wages>=0?'+':''}{(quote.choice.silver-quote.wages).toFixed(2)} silver{choice.supplies>0&&` · includes ${choice.supplies} donated provisions`}</small>
       <button disabled={busy||!!quote.errors.length} aria-describedby={quote.errors.length?reasonId:undefined} onClick={()=>onAction(action)}>Choose: {choice.label}</button>
       {quote.errors.length>0&&<p id={reasonId} className="story-choice-blocked">{quote.errors.join(' ')}</p>}
      </article>;
     })}
    </div>
    <small className="harbour-story-note">Choose one part to play, or leave this story for another visit. Time, wages and food are spent when you choose. Rewards arrive after the work; costs include everyone aboard.</small>
   </>}
  </section>
  <details className="compass-atlas"><summary>Your harbour chart <span>{visited.length} of {PORTS.length} visited</span></summary><p>Known routes are open from the beginning. Visits and the part you play in each port are remembered with your captain.</p><ul>{PORTS.map(p=><li key={p.id} className={visited.includes(p.id)?'charted':'uncharted'}><span aria-hidden="true">{g.harbourStories?.[p.id]?'✦':visited.includes(p.id)?'●':'○'}</span><span>{p.name}<small>{p.island}</small></span><span className="atlas-status">{p.id===g.port?'Here':g.harbourStories?.[p.id]?'Story kept':visited.includes(p.id)?'Visited':'Unvisited'}</span></li>)}</ul></details>
 </section>;
}
