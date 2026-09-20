import {useState} from 'react';
import type {Action,Game} from './game';
import {captureQuote,type CaptureChoice} from './battle/capture';
import {CATALOGUE,type GoodId} from './goods';
import {shipDefinition} from './ships';
export function CapturePanel({game:g,busy,onAction}:{game:Game;busy:boolean;onAction:(a:Action)=>Promise<void>}){
 const b=g.battle!,p=b.ships[b.playerId],n=b.ships[b.npcId],victory=b.winner===b.playerId;
 const [choice,setChoice]=useState<CaptureChoice>({ship:'keep',captain:'release',cargo:{},route:victory?'continue':'return'});
 const [error,setError]=useState('');const quote=captureQuote(g,choice);
 async function confirm(){setError('');try{await onAction({type:'battle-settle',choice});}catch(e){setError(e instanceof Error?e.message:'Unable to resolve aftermath.');}}
 return <div className="capture-panel"><h2>{quote.fatal?'A captain’s reckoning':victory?'Victory — settle the aftermath':'Defeat — terms of release'}</h2><p>{b.reason}</p>{b.terms&&<p>Accepted terms: {b.terms}. Personal safety is honored; no ransom can be imposed.</p>}
 {quote.fatal?<p>{p.captain.injury>=6?'Your captain died.':'Your only ship was lost.'} Record the loss, then restore a church checkpoint.</p>:victory?<>
 <label>Ship disposition<select value={choice.ship} onChange={e=>setChoice({...choice,ship:e.target.value as CaptureChoice['ship']})}><option value="keep">Keep {p.ship.name}; release the enemy vessel</option><option value="exchange" disabled={n.ship.hullPoints<=0}>Take {n.ship.name}; relinquish your current ship</option></select></label>
 <p>Your surviving crew, passengers, supplies and commissions transfer with you. Enemy crew are released, not recruited. Captured hull damage, sail damage and missing cannons remain.</p>
 <label>Enemy captain<select value={choice.captain} onChange={e=>setChoice({...choice,captain:e.target.value as CaptureChoice['captain']})}><option value="release">{n.captain.injury>=6?'Captain died; release surviving crew':'Release without ransom'}</option><option value="ransom" disabled={!!b.terms||n.captain.injury>=6||n.ship.hullPoints<=0}>Ransom from the ship’s purse ({Math.max(0,b.npc.silver??0)} silver)</option></select></label>
 <small>Ransom uses only recorded enemy funds. There is no captive upkeep or future ransom claim. Mercy grants +2 reputation and +2 faction attitude; taking the ship costs 10 faction attitude.</small>
 <h3>Select cargo to take</h3>{Object.entries(quote.loot).filter(([id,q])=>q>=1&&id in CATALOGUE).length?<div className="capture-loot">{Object.entries(quote.loot).filter(([id,q])=>q>=1&&id in CATALOGUE&&id!=='provisions').map(([id,quantity])=><label key={id}>{CATALOGUE[id as GoodId].name} · {Math.floor(quantity)} available<input type="number" min="0" max={Math.floor(quantity)} step="1" value={choice.cargo[id as GoodId]??0} onChange={e=>{const value=Number(e.target.value);if(Number.isFinite(value)&&Number.isInteger(value)&&value>=0)setChoice({...choice,cargo:{...choice.cargo,[id]:value}});}}/></label>)}</div>:<p>No recoverable cargo remains.</p>}
 <p>Hold: {quote.hold.toFixed(1)} / {quote.capacity}. Weight: {quote.weight.toFixed(1)} / {quote.deadweight}. Unselected cargo stays behind.</p>
 <label>After the settlement<select value={choice.route} onChange={e=>setChoice({...choice,route:e.target.value as CaptureChoice['route']})}><option value="continue">Continue the current voyage</option><option value="return">Arrange a return to the departure port</option></select></label>
 </>:<><p>You retain your surviving ship and crew. {['Pirate','Privateer'].includes(b.npc.role)?'The captors take your exposed silver (after Deception concealment) and carried trade goods.':'The captors demand 25% of your positive silver balance and confiscate controlled cargo.'} Supplies remain aboard. All current commissions fail; passengers are repatriated.</p><p>Release payment: {quote.payment} silver. You will return to your departure port.</p></>}
 {!quote.fatal&&<p>{choice.route==='return'||!victory?`Return service: ${quote.fee} silver plus 12 hours of crew wages. Food and captain stabilization are included. Unpaid costs become debt. Ship damage and crew injuries remain.`:'Secured ships stop suffering ongoing combat emergencies. Existing damage and injuries are retained.'}</p>}
 {!quote.fatal&&quote.problems.length>0&&<ul role="alert">{quote.problems.map((problem,i)=><li key={i}>{problem}</li>)}</ul>}
 {!quote.fatal&&<p>After confirming, you will command {shipDefinition(quote.ship.configurationId).label}. Settlement is saved once; it cannot be collected again.</p>}
 {error&&<p role="alert">{error}</p>}<button className="primary" disabled={busy||(!quote.fatal&&quote.problems.length>0)} onClick={()=>void confirm()}>{quote.fatal?'Record loss':'Confirm settlement'}</button>
 </div>;
}
