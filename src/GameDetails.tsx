import {useId} from 'react';
import type {Game,Action} from './game';
import {cargoUsed,contractBuilding,ownedShip,currentShip} from './game';
import {loadBreakdown} from './performance';
import {crew,crewExperience} from './battle/types';
import {CREW_DOMAINS} from './crew';
import {PLAYER_SKILLS,nextTierRequirement,skillName,type SkillProgress} from './skills';
export function StatusMeter({label,value,max=100,detail,tone='normal',progress=false}:{label:string;value:number;max?:number;detail?:string;tone?:'normal'|'warning'|'danger';progress?:boolean}){
 const id=useId(),limit=Number.isFinite(max)&&max>0?max:1,actual=Number.isFinite(value)?value:0,clamped=Math.max(0,Math.min(actual,limit)),text=detail??`${actual.toFixed(1)} / ${max}`;
 return <div className={`status-meter meter-${tone}`}><div className="meter-caption"><span id={id}>{label}</span><strong>{text}</strong></div><div className="meter-track" role={progress?'progressbar':'meter'} aria-labelledby={id} aria-valuemin={0} aria-valuemax={limit} aria-valuenow={clamped} aria-valuetext={text}><span style={{width:`${100*clamped/limit}%`}}/></div></div>;
}
export const conditionLabel=(percent:number)=>percent<=0?'Disabled':percent<30?'Critical':percent<70?'Damaged':'Sound';
export function ConditionMeters({hull,maxHull,sails}:{hull:number;maxHull:number;sails:number}){
 const percent=maxHull?100*hull/maxHull:0;
 return <div className="meter-grid"><StatusMeter label="Hull condition" value={hull} max={maxHull} detail={`${hull.toFixed(1)} / ${maxHull} · ${conditionLabel(percent)}`} tone={percent<30?'danger':percent<70?'warning':'normal'}/><StatusMeter label="Sail condition" value={sails} detail={`${sails.toFixed(1)}% · ${conditionLabel(sails)}`} tone={sails<30?'danger':sails<70?'warning':'normal'}/></div>;
}
export function CapacityMeters({game:g}:{game:Game}){
 const spec=currentShip(g),weight=loadBreakdown(g).total;
 return <div className="meter-grid">{[['Cargo space',cargoUsed(g),spec.capacity],['Deadweight',weight,spec.deadweight]].map(([label,value,max])=>{const used=Number(value),capacity=Number(max),free=capacity-used;return <StatusMeter key={String(label)} label={String(label)} value={used} max={capacity} tone={free<0?'danger':used>=capacity*.9?'warning':'normal'} detail={`${used.toFixed(1)} / ${capacity} · ${Math.abs(free).toFixed(1)} ${free<0?'over capacity':'free'}`}/>;})}</div>;
}
export function ShipMeters({game:g}:{game:Game}){const ship=ownedShip(g);return <section className="ship-meters" aria-label="Condition and capacity"><ConditionMeters hull={ship.hullPoints} maxHull={currentShip(g).maxHull} sails={ship.sailCondition}/><CapacityMeters game={g}/></section>;}
export const readyCount=(g:Game,building?:string)=>g.failed||g.voyage||g.battle?0:g.contracts.filter(c=>c.to===g.port&&(!building||contractBuilding(c)===building)).length;
export function DeliveryBadge({game,building}:{game:Game;building:string}){const n=readyCount(game,building);return n?<span className="delivery-badge" aria-label={`${n} ready to deliver`}>{n} ready</span>:null;}
export function QuestBadge({status}:{status:string}){return <span className={`quest-status ${status==='Ready to deliver'?'quest-ready':status==='Completed'?'quest-completed':status.startsWith('Failed')?'quest-failed':'quest-active'}`}>{status==='Ready to deliver'?'● ':status==='Completed'?'✓ ':''}{status}</span>;}
export type FeedbackItem={text:string;kind:'gain'|'cost'|'milestone'|'neutral'};
function practiceTotal(p:SkillProgress){let n=p.points;for(let t=0;t<p.tier;t++)n+=nextTierRequirement(t)??0;return n;}
export function actionFeedback(before:Game,after:Game,action:Action):FeedbackItem[]{
 if(action.type==='difficulty')return [];
 const items:FeedbackItem[]=[],delta=(label:string,value:number)=>{if(Math.abs(value)>=.005)items.push({text:`${value>0?'+':'−'}${Math.abs(value).toFixed(2)} ${label}`,kind:value>0?'gain':'cost'});};
 delta('silver net',after.silver-before.silver);delta('provisions',after.provisions-before.provisions);
 const a=before.crewState??crew(before.crew),b=after.crewState??crew(after.crew);
 for(const d of CREW_DOMAINS)delta(`crew ${d} experience`,crewExperience(b,d)-crewExperience(a,d));
 for(const id of PLAYER_SKILLS){const old=before.skills?.[id]??{tier:0,points:0},next=after.skills?.[id]??{tier:0,points:0},gained=practiceTotal(next)-practiceTotal(old);if(next.tier>old.tier)items.push({text:`${skillName(id)} reached tier ${next.tier}!`,kind:'milestone'});if(gained>0)delta(`${skillName(id)} practice`,gained);}
 const old=ownedShip(before),next=ownedShip(after);
 if(old.id===next.id){if(next.hullPoints>old.hullPoints)items.push({text:`Hull restored +${(next.hullPoints-old.hullPoints).toFixed(1)}`,kind:'gain'});if(next.sailCondition>old.sailCondition)items.push({text:`Sails restored +${(next.sailCondition-old.sailCondition).toFixed(1)}%`,kind:'gain'});}
 const completed=(after.archive?.length??0)-(before.archive?.length??0);if(completed>0)items.push({text:`${completed} commission${completed===1?'':'s'} completed`,kind:'milestone'});
 if(action.type==='refit')items.push({text:'Refit complete',kind:'milestone'});
 if(action.type==='replace-cannons')items.push({text:'Fitted guns restored',kind:'gain'});
 return items;
}
export function ActionFeedback({items,onDismiss}:{items:FeedbackItem[];onDismiss:()=>void}){return <section className="action-feedback" aria-label="Last action result"><div role="status" aria-live="polite" aria-atomic="true"><strong className="feedback-heading">Action result</strong><ul>{items.map((item,i)=><li key={i} className={`feedback-${item.kind}`}>{item.text}</li>)}</ul></div><button aria-label="Dismiss action result" onClick={onDismiss}>×</button></section>;}
