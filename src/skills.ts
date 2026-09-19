/** Player-only skill progress. Learning and gameplay effects are not enabled yet. */
export type SkillProgress = { tier: number; points: number };
export type PlayerSkills = { sailing: SkillProgress };
export const initialSkills = ():PlayerSkills => ({sailing:{tier:0,points:0}});
export function sailingProgress(skills?:PlayerSkills):SkillProgress {
  return skills?.sailing ?? {tier:0,points:0};
}
export function nextTierRequirement(tier:number):number|null {
  return tier>=10?null:10*2**tier;
}
