import {useEffect,useId,useRef,useState} from 'react';
import type {Game,PortId} from './game';
import {port} from './world';
import {connectionsView,type ConnectionAction} from './connections';
import './connected-encounters.css';

type Props={game:Game;busy:boolean;onAction:(action:ConnectionAction)=>void|Promise<void>;onPlan:(destination:PortId)=>void};
const amount=(n:number)=>n.toFixed(2);
const signed=(n:number)=>`${n>=0?'+':''}${amount(n)}`;
const initials=(name:string)=>name.replace(/^Captain\s+/,'').split(' ').filter(Boolean).map(part=>part[0]).slice(0,2).join('');

/** Only the engine's reached chapter is rendered; future scenes never enter the DOM. */
export function ConnectedEncounters({game,busy,onAction,onPlan}:Props){
 const id=useId(),view=connectionsView(game);
 const [submitting,setSubmitting]=useState<string|null>(null),[error,setError]=useState('');
 const actionLock=useRef(false),outcomeRef=useRef<HTMLParagraphElement>(null);
 const submitted=useRef<{signature:string}|null>(null);
 const signature=JSON.stringify([view?.id,view?.status,view?.chapter,view?.outcome,view?.memory]);
 const locked=busy||submitting!==null;
 useEffect(()=>{
  // A resolved callback is not proof of a save. Announce only durable state changes.
  if(busy||submitting!==null||!submitted.current)return;
  const previous=submitted.current;submitted.current=null;
  if(signature!==previous.signature||error)outcomeRef.current?.focus();
 },[busy,submitting,signature,error]);
 async function choose(action:ConnectionAction,choiceId:string){
  if(busy||actionLock.current)return;
  actionLock.current=true;submitted.current={signature};setSubmitting(choiceId);setError('');
  try{await onAction(action);}
  catch(cause){setError(cause instanceof Error?cause.message:'Your choice could not be recorded. Please try again.');}
  finally{actionLock.current=false;setSubmitting(null);}
 }
 if(!view||game.failed||game.voyage||game.battle)return null;
 const latestOutcome=view.outcome??view.memory.at(-1)?.text??'';
 const rivalKnown=view.status!=='offer'||Boolean(view.scene?.includes(view.rival.name)||view.memory.some(memory=>memory.speaker.includes(view.rival.name)||memory.text.includes(view.rival.name)));
 return <section className="connected-encounters" aria-labelledby={`${id}-title`} aria-busy={locked}>
  <header className="connected-heading">
   <div><p className="eyebrow">A CONNECTED JOURNEY</p><h2 id={`${id}-title`}>{view.title}</h2></div>
   <span className="connected-chapter"><strong>Chapter {view.chapter} of 3</strong>{view.status==='complete'?'Journey complete':view.status==='travel'?'A crossing ahead':view.status==='offer'?'An introduction':'A choice ashore'}</span>
  </header>
  <div className="connected-body">
   <div className="connected-people" aria-label="People in this chapter">
    <div className="connected-person"><span className="connected-monogram" aria-hidden="true">{initials(view.contact.name)}</span><div><strong>{view.contact.name}</strong><small>{view.contact.role}</small></div></div>
    {rivalKnown&&<div className="connected-person"><span className="connected-monogram" aria-hidden="true">{initials(view.rival.name)}</span><div><strong>{view.rival.name}</strong><small>{view.rival.role}</small></div></div>}
   </div>
   {view.scene&&<p className="connected-scene">{view.scene}</p>}
   <p ref={outcomeRef} className="connected-outcome" role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}>{submitting!==null?'Recording your choice…':error||latestOutcome}</p>
   {view.objective&&<section className="connected-objective" aria-labelledby={`${id}-objective`}>
    <div><p className="eyebrow">YOUR CURRENT OBJECTIVE</p><h3 id={`${id}-objective`}>{view.objective.title}</h3><p>{view.objective.detail}</p><span className="connected-location">{view.objective.destination===game.port?'Here in':'Next harbour:'} {port(view.objective.destination).name}</span></div>
    {view.objective.destination!==game.port&&<button disabled={locked} onClick={()=>onPlan(view.objective!.destination)}>Review route to {port(view.objective.destination).name}<span aria-hidden="true"> ↗</span></button>}
   </section>}
   {view.options.length>0&&<>
    <div className="connected-choices" aria-label="Your part in this chapter">
     {view.options.map(option=>{const q=option.quote,reasonId=`${id}-${option.id}-reason`,costId=`${id}-${option.id}-cost`,upfront=q.wages+q.fee;
      const gains=[q.attitude?`${signed(q.attitude)} ${port(game.port).nation} attitude`:null,q.reputation?`${signed(q.reputation)} reputation`:null,q.morale?`${signed(q.morale)} crew morale`:null].filter(Boolean);
      return <article className="connected-choice" key={option.id}>
       <h3>{option.label}</h3><p>{option.description}</p>
       <dl id={costId}><dt>Time ashore</dt><dd>{q.hours}h</dd><dt>Provisions used</dt><dd>{amount(q.provisions)}</dd><dt>Crew wages</dt><dd>{amount(q.wages)} silver</dd>{q.fee>0&&<><dt>Additional payment</dt><dd>{amount(q.fee)} silver</dd></>}<dt>Silver needed first</dt><dd>{amount(upfront)}</dd><dt>Payment after the work</dt><dd>{amount(q.reward)} silver</dd></dl>
       <p className="connected-net">Net silver: {signed(q.reward-upfront)}</p>
       {gains.length>0&&<p className="connected-reward">{gains.join(' · ')}</p>}
       {q.supplies>0&&<small>Provisions above include {amount(q.supplies)} shared from your stores.</small>}
       <button disabled={locked||q.errors.length>0} aria-describedby={`${costId}${q.errors.length?` ${reasonId}`:''}`} onClick={()=>{void choose(option.action,option.id);}}>{submitting===option.id?'Recording…':`Choose: ${option.label}`}</button>
       {q.errors.length>0&&<p className="connected-blocked" id={reasonId}>{q.errors.join(' ')}</p>}
      </article>;
     })}
    </div>
    <p className="connected-cost-note">Your choice is remembered. These costs include everyone aboard; wages and provisions are spent before the payment arrives. You can leave and return before choosing.</p>
   </>}
   {view.status==='complete'&&<p className="connected-finished">This journey is now part of your captain’s history. Your other commissions and the open sea are still yours to explore.</p>}
   {view.memory.length>0&&<details className="connected-memory"><summary>Your story so far</summary><ol>{view.memory.map((memory,index)=><li key={`${index}:${memory.speaker}`}><strong>{memory.speaker}</strong><p>{memory.text}</p></li>)}</ol></details>}
  </div>
 </section>;
}
