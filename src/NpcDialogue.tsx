import {useEffect,useRef,useState} from 'react';
import type {Game} from './game';
import {dialogueContext,TOPICS,type NpcPlace} from './npcs';
import {dressDialogue} from './nanogpt';

export function NpcDialogue({game,place,topic,reaction,busy,enabled,apiKey,model,onTopic,onHarbour}:{game:Game;place:NpcPlace;topic:string|null;reaction:boolean;busy:boolean;enabled:boolean;apiKey:string;model:string;onTopic:(id:string|null)=>void;onHarbour:()=>void}){
 const context=dialogueContext(game,place,topic,reaction),serialized=JSON.stringify(context);
 const [response,setResponse]=useState<{context:string;text:string;status:string}|null>(null);
 const cache=useRef(new Map<string,string>());
 useEffect(()=>{cache.current.clear();},[apiKey,model,enabled]);
 useEffect(()=>{
  let live=true;const controller=new AbortController();
  if(!enabled||!apiKey||!model){setResponse(null);return;}
  const cached=cache.current.get(serialized);
  if(cached){setResponse({context:serialized,text:cached,status:'AI dialogue'});return;}
  setResponse({context:serialized,text:'',status:'Listening…'});
  const timer=setTimeout(()=>{controller.abort();if(live)setResponse({context:serialized,text:'',status:'Using written dialogue'});},12000);
  dressDialogue(apiKey,model,JSON.parse(serialized),controller.signal).then(text=>{
   if(!live||controller.signal.aborted)return;
   if(cache.current.size>=24)cache.current.delete(cache.current.keys().next().value!);
   cache.current.set(serialized,text);setResponse({context:serialized,text,status:'AI dialogue'});
  }).catch(()=>{if(live&&!controller.signal.aborted)setResponse({context:serialized,text:'',status:'Using written dialogue'});}).finally(()=>clearTimeout(timer));
  return()=>{live=false;controller.abort();clearTimeout(timer);};
 },[serialized,enabled,apiKey,model]);
 const current=enabled&&response?.context===serialized?response:null;
 const choices=TOPICS[place]??[];
 return <section className="npc-dialogue" aria-label={`Conversation with ${context.npc.name}`}>
  <p className="eyebrow">{context.npc.occupation}</p><h2>{context.npc.name}</h2>
  <blockquote><span aria-live="polite">{current?.text||context.canonical}</span><small role="status">{current?.status||'Written dialogue'}</small></blockquote>
  {!topic&&<div className="dialogue-choices" aria-label="What do you say?">{choices.map(choice=><button key={choice.id} disabled={busy} onClick={()=>onTopic(choice.id)}><strong>“{choice.choice}”</strong><small>{choice.description}</small></button>)}</div>}
  <div className="button-row">{topic&&<button disabled={busy} onClick={()=>onTopic(null)}>Speak to {context.npc.name}</button>}<button disabled={busy} onClick={onHarbour}>Back to harbour</button></div>
 </section>;
}
