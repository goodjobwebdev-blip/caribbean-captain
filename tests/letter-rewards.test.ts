import {it,expect} from 'vitest';
import {act,newGame,offers,letterReward} from '../src/game';
it('rounds distance rewards up and fixes them in offered letter terms',()=>{
 const g=newGame('Anne',1);
 expect(letterReward('bridgetown','saint-pierre')).toBe(1);
 expect(letterReward('bridgetown','willemstad')).toBe(3);
 expect(offers(g).filter(c=>c.type!=='Letter').every(c=>c.sailingReward===0)).toBe(true);
 const letter=offers(g).find(c=>c.type==='Letter')!;
 const accepted=act(g,{type:'accept',contract:{...letter,sailingReward:999}});
 expect(accepted.contracts[0].sailingReward).toBe(1);
 expect(accepted.skills?.sailing.points).toBe(0);
});
it('grants silver and skill reward once on delivery, carries overflow, and preserves practice hours',()=>{
 let g=newGame('Anne',1);
 const letter=offers(g).find(c=>c.type==='Letter')!;
 g=act(g,{type:'accept',contract:letter});g.port=letter.to;
 g.skills={sailing:{tier:0,points:9,sailingHours:13}};
 const silver=g.silver;
 const result=act(g,{type:'deliver'});
 expect(result.skills?.sailing).toEqual({tier:1,points:0,sailingHours:13});
 expect(result.silver).toBeCloseTo(silver+letter.reward-20/24);
 expect(result.archive?.[0].sailingReward).toBe(1);
 expect(()=>act(result,{type:'deliver'})).toThrow();
 expect(g.contracts).toHaveLength(1);
});
it('supports old active letters, wrong-port rejection, and maximum mastery',()=>{
 let g=newGame('Anne',1);const letter=offers(g).find(c=>c.type==='Letter')!;delete letter.sailingReward;
 g.contracts=[letter];expect(()=>act(g,{type:'deliver'})).toThrow();
 g.port=letter.to;expect(act(g,{type:'deliver'}).skills?.sailing.points).toBe(1);
 g.skills={sailing:{tier:10,points:0}};
 expect(act(g,{type:'deliver'}).skills?.sailing).toEqual({tier:10,points:0});
});
