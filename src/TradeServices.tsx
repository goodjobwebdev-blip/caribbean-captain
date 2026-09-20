import {PERMIT_PRICE,attitude,reputation,hasPermit,nationOf} from './commerce';
import {type Game,type Action} from './game';
export function TradePermit({game:g,busy,perform}:{game:Game;busy:boolean;perform:(a:Action)=>void}){
 return <article className="service"><h2>National trade permit</h2><p>{nationOf(g.port)} attitude: {attitude(g)} · Global reputation: {reputation(g)}</p><p>A permanent permit covers Controlled goods in this nation’s ports. Local attitude must stay at least −30. Commissions improve local attitude by 2 and global reputation by 1 per delivery.</p>{hasPermit(g)?<strong>Permit held</strong>:<button disabled={busy||g.silver<PERMIT_PRICE||attitude(g)<-30} onClick={()=>perform({type:'buy-permit'})}>Buy permit · {PERMIT_PRICE} silver · 1 hour</button>}</article>;
}
export function SmugglerContact({game:g,busy,perform}:{game:Game;busy:boolean;perform:(a:Action)=>void}){
 return <article className="service"><h2>A discreet introduction</h2><p>Smugglers handle Controlled goods and local unavailable goods. They have separate stocks, wider spreads and inspection risks.</p>{g.economy?.commerce?.contacts[g.port]?<p>Your contact is known. Choose Smugglers at the Store. They are absent every fifth calendar day.</p>:<button disabled={busy||g.silver<50} onClick={()=>perform({type:'meet-smuggler'})}>Meet contact · 50 silver · 1 hour</button>}</article>;
}
