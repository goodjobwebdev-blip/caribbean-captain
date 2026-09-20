/** Player-only skill progress. Sailing practice is credited on successful arrival. */
export type SkillProgress = { tier: number; points: number; sailingHours?: number };
export type PlayerSkills = { sailing: SkillProgress; trade?:SkillProgress } & Partial<Record<import('./battle/types').Skill,SkillProgress>>;
export const initialSkills = ():PlayerSkills => ({sailing:{tier:0,points:0}});
export function sailingProgress(skills?:PlayerSkills):SkillProgress {
  return skills?.sailing ?? {tier:0,points:0};
}
export function nextTierRequirement(tier:number):number|null {
  return tier>=10?null:10*2**tier;
}

/** Applies quest or practice points using the same mastery thresholds. */
export function creditSailingPoints(skills:PlayerSkills|undefined,points:number){
  const next=structuredClone(skills??initialSkills());
  const sailing=next.sailing;
  if(sailing.tier>=10)return {skills:next,earned:0,tiers:0};
  sailing.points+=points;
  const before=sailing.tier;
  while(sailing.tier<10&&sailing.points>=nextTierRequirement(sailing.tier)!){
    sailing.points-=nextTierRequirement(sailing.tier)!;
    sailing.tier++;
  }
  if(sailing.tier===10){sailing.points=0;sailing.sailingHours=0;}
  return {skills:next,earned:points,tiers:sailing.tier-before};
}
/** Encounter delays and time in port are not practice. */
export function creditSailing(skills:PlayerSkills|undefined,hours:number){
  const next=structuredClone(skills??initialSkills());
  if(next.sailing.tier>=10)return {skills:next,earned:0,tiers:0};
  const total=(next.sailing.sailingHours??0)+hours;
  next.sailing.sailingHours=total%24;
  return creditSailingPoints(next,Math.floor(total/24));
}

export const tradeProgress=(skills?:PlayerSkills):SkillProgress=>skills?.trade??{tier:0,points:0};
export function creditTrade(skills:PlayerSkills|undefined,points:number):PlayerSkills{
 const next=structuredClone(skills??initialSkills()),trade={...tradeProgress(next)};next.trade=trade;
 if(trade.tier>=10)return next;
 trade.points+=points;
 while(trade.tier<10&&trade.points+1e-10>=nextTierRequirement(trade.tier)!){trade.points=Math.max(0,trade.points-nextTierRequirement(trade.tier)!);trade.tier++;}
 if(trade.tier===10)trade.points=0;
 return next;
}

export const COMBAT_SKILLS = ['lookout','deception','diplomacy','intimidation','boarding','aiming','reloading','demolitions','carpentry','sailmaking','doctoring','leadership','lightWeapons','mediumWeapons','heavyWeapons','athletics','shooting'] as const;
export const skillName=(id:string)=>id.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
export function creditSkillPoints(skills:PlayerSkills|undefined,id:import('./battle/types').Skill,points:number):PlayerSkills {
 if(!Number.isFinite(points)||points<0)throw Error('Practice must be finite and nonnegative.');
 const next=structuredClone(skills??initialSkills()),progress=next[id]??{tier:0,points:0};next[id]=progress;
 if(progress.tier>=10)return next;
 progress.points+=points;
 while(progress.tier<10&&progress.points>=nextTierRequirement(progress.tier)!){progress.points-=nextTierRequirement(progress.tier)!;progress.tier++;}
 if(progress.tier===10)progress.points=0;
 return next;
}
