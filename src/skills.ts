/** Player-only skill progress. Sailing practice is credited on successful arrival. */
export type SkillProgress = { tier: number; points: number; sailingHours?: number };
export type PlayerSkills = { sailing: SkillProgress };
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
