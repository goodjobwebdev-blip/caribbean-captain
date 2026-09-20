import type {Game} from './game';
import {crew,crewExperience,clamp,type Crew,type CrewDomain,type Battle} from './battle/types';
import {creditSkillPoints} from './skills';
export const CREW_DOMAINS:CrewDomain[]=['sailing','gunnery','fighting'];
export function ensureCrew(g:Game){const c=g.crewState??=crew(g.crew);for(const domain of CREW_DOMAINS)(c.expertise??={})[domain]=crewExperience(c,domain);return c;}
export function gainCrew(c:Crew,domain:CrewDomain,points:number){const before=crewExperience(c,domain);(c.expertise??={})[domain]=clamp(before+points,0,100);return c.expertise[domain]!-before;}
export function recruitCrew(g:Game){const c=ensureCrew(g),living=c.fit+c.injured;for(const domain of CREW_DOMAINS)c.expertise![domain]=(crewExperience(c,domain)*living+50)/(living+1);c.morale=(c.morale*living+50)/(living+1);c.discipline=(c.discipline*living+50)/(living+1);c.fit++;g.crew++;}
export function sailingCrewPractice(g:Game,hours:number){const c=ensureCrew(g);if(!c.fit)return;const earned=gainCrew(c,'sailing',Math.min(3,hours/48));if(earned)g.log.unshift({hours:g.hours,text:`Crew sailing experience +${earned.toFixed(2)}.`});}
/** Called after charging wages. Only the unpaid portion causes discontent, proportional to time. */
export function crewWages(g:Game,hours:number,wages:number){
 if(!wages||!hours)return;const c=ensureCrew(g),unpaid=Math.min(wages,Math.max(0,-g.silver)),days=hours/24*unpaid/wages;
 c.unpaidWageHours=(c.unpaidWageHours??0)+days*24;
 c.morale=clamp(c.morale-days*4,0,100);c.discipline=clamp(c.discipline-days*2,0,100);
}
export function crewPractice(b:Battle,id:string,domain:CrewDomain,points:number){if(id!==b.playerId||b.crewResolved)return;const pending=b.crewPractice??={};pending[domain]=Math.min(2,(pending[domain]??0)+points);}
export function resolveCrewBattle(g:Game){
 const b=g.battle;if(!b||b.crewResolved||!['capture','ended'].includes(b.phase))return;b.crewResolved=true;
 const p=b.ships[b.playerId],c=p.crew;for(const domain of CREW_DOMAINS)(c.expertise??={})[domain]=crewExperience(c,domain);if(c.fit+c.injured===0)return;
 const gunnery=Math.min(2,b.crewPractice?.gunnery??0),fighting=Math.min(2,b.crewPractice?.fighting??0);
 const earnedGunnery=gainCrew(c,'gunnery',gunnery),earnedFighting=gainCrew(c,'fighting',fighting);
 const outcome=b.winner===b.playerId?4:b.winner===b.npcId?-6:0,losses=10*Math.max(0,p.startFit-c.fit)/Math.max(1,p.startFit);
 c.morale=clamp(c.morale+outcome-losses,0,100);c.discipline=clamp(c.discipline+(outcome>0?1:outcome<0?-2:0),0,100);
 g.crewState=structuredClone(c);
 g.log.unshift({hours:g.hours,text:`Crew after battle: gunnery +${earnedGunnery.toFixed(2)}, fighting +${earnedFighting.toFixed(2)}; morale ${c.morale.toFixed(1)}, discipline ${c.discipline.toFixed(1)}.`});
}
export type CrewAction={type:'train-crew';domain:CrewDomain}|{type:'medical-care'}|{type:'shore-leave'};
export function crewServiceQuote(g:Game,a:CrewAction){
 const c=g.crewState??crew(g.crew),errors:string[]=[];let fee=0,hours=0,gain=0,healed=0,captainHealed=0;
 if(g.voyage||g.battle)errors.push('Crew services are available in port.');
 if(g.failed||(g.captainState?.injury??0)>=6)errors.push('Restore a checkpoint to continue this captain.');
 if(a.type==='train-crew'){
  hours=8;fee=Math.max(20,g.crew*2);
  if((g.captainState?.injury??0)>=5||(g.captainState?.fatigue??0)>=4)errors.push('Recover the captain before supervising training.');
  if(!CREW_DOMAINS.includes(a.domain))errors.push('Unknown training discipline.');
  else gain=Math.max(0,Math.min(75-crewExperience(c,a.domain),(2+.2*(g.skills?.training?.tier??0))*c.fit/Math.max(1,g.crew)));
  if(!c.fit)errors.push('Training requires fit crew.');if(!gain)errors.push('Port training is capped at 75 experience.');
 }else if(a.type==='shore-leave'){
  hours=8;fee=Math.max(10,g.crew*5);gain=Math.max(0,Math.min(10,80-c.morale));
  if(!g.crew)errors.push('No crew aboard.');if(!gain)errors.push('Shore leave restores morale only up to 80.');
 }else{
  hours=4;healed=Math.min(c.injured,Math.max(1,Math.ceil(g.crew*.25*(1+.05*(g.skills?.doctoring?.tier??0)))));
  captainHealed=(g.captainState?.injury??0)>0?1:0;fee=healed*10+captainHealed*50;
  if(!healed&&!captainHealed)errors.push('No injuries need treatment.');
 }
 const wages=g.crew*2*hours/24,food=(g.crew+g.contracts.filter(c=>c.type==='Passengers').reduce((s,c)=>s+c.amount,0))*hours/24;
 if(g.silver+1e-8<fee+wages)errors.push('Not enough silver for the fee and wages.');
 if(g.provisions+1e-8<food)errors.push('Not enough provisions for the service.');
 return {fee,hours,wages,food,gain,healed,captainHealed,errors};
}
export function completeCrewService(g:Game,a:CrewAction,q:ReturnType<typeof crewServiceQuote>){
 const c=ensureCrew(g);
 if(a.type==='train-crew'){gainCrew(c,a.domain,q.gain);c.discipline=clamp(c.discipline+1,0,100);g.skills=creditSkillPoints(g.skills,'training',.5);g.log.unshift({hours:g.hours,text:`Crew ${a.domain} training: +${q.gain.toFixed(2)} experience, +1 discipline; Training practice +0.5.`});}
 else if(a.type==='shore-leave'){c.morale=clamp(c.morale+q.gain,0,100);g.log.unshift({hours:g.hours,text:`Paid shore leave: crew morale +${q.gain.toFixed(1)}.`});}
 else{c.injured-=q.healed;c.fit+=q.healed;if(g.captainState)g.captainState.injury-=q.captainHealed;g.log.unshift({hours:g.hours,text:`Medical care: ${q.healed} crew recovered; captain healed ${q.captainHealed} Injury step. Fee ${q.fee} silver.`});}
}
