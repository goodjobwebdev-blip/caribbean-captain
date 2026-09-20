import {crewPractice} from '../crew';
import type {Game} from '../game';
import type {Battle,Skill} from './types';
import {creditSkillPoints,skillName} from '../skills';
/** Per-skill and overall caps apply to completed actions, including simultaneous events. */
export function practice(b:Battle,id:string,skill:Skill,points=.5,creditCrew=true){
 if(id!==b.playerId||b.practiceAwarded)return;
 if(creditCrew&&['aiming','reloading','boarding'].includes(skill))crewPractice(b,id,skill==='boarding'?'fighting':'gunnery',points);
 const progress=b.practice??={},total=Object.values(progress).reduce((a,n)=>a+n,0);
 const earned=Math.max(0,Math.min(points,3-(progress[skill]??0),10-total));
 if(earned)progress[skill]=(progress[skill]??0)+earned;
}
export function awardBattlePractice(g:Game){
 const b=g.battle;if(!b||b.practiceAwarded||!['capture','ended'].includes(b.phase))return;
 b.practiceAwarded=true;
 if(b.ships[b.playerId].captain.injury>=6)return;
 const rewards=Object.entries(b.practice??{});
 for(const [skill,points] of rewards)g.skills=creditSkillPoints(g.skills,skill as Skill,points);
 if(rewards.length)g.log.unshift({hours:g.hours,text:`Combat practice: ${rewards.map(([s,p])=>`${skillName(s)} +${p}`).join(', ')}. Mastery applies to your next encounter.`});
}
export function encounterPractice(g:Game,skill:Skill,points=.5,creditCrew=true){
 const e=g.encounter!;const progress=e.practice??={};const earned=Math.max(0,Math.min(points,1-(progress[skill]??0)));
 if(!earned)return;progress[skill]=(progress[skill]??0)+earned;g.skills=creditSkillPoints(g.skills,skill,earned);
 g.log.unshift({hours:g.hours,text:`Encounter practice: ${skillName(skill)} +${earned}.`});
}
