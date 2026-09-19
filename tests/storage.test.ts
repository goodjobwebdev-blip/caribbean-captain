import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {newGame, act} from '../src/game';
import {saveProfile,profiles,saveCheckpoint,checkpoints,restoreCheckpoint,type Profile} from '../src/storage';
it('persists profiles and separate church checkpoints, restores complete state, and isolates captains',async()=>{
 const p:Profile={id:'captain-one',name:'Anne',game:newGame('Anne',12),updated:1};await saveProfile(p);
 await expect(saveCheckpoint(p,'Forbidden','Tavern')).rejects.toThrow('church');
 const first=await saveCheckpoint(p,'First chapter','Church');
 p.game=act(p.game,{type:'buy',good:'sugar',quantity:10});await saveProfile(p);await saveCheckpoint(p,'Second chapter','Church');
 expect((await checkpoints(p.id))).toHaveLength(2);expect((await profiles()).find(x=>x.id===p.id)?.game.cargo.sugar).toBe(10);
 const restored=restoreCheckpoint(p,first);expect(restored.game.cargo.sugar).toBe(0);expect(restored.game.seed).toBe(12);expect(restored.game.silver).toBe(800);
 expect(()=>restoreCheckpoint({...p,id:'someone-else'},first)).toThrow('belong');
 p.game.failed='Lost';await expect(saveCheckpoint(p,'After defeat','Church')).rejects.toThrow('church');
 expect(await checkpoints('someone-else')).toHaveLength(0);
});
it('preserves player skill metrics in checkpoints and supports older skill-less saves',async()=>{
 const p:Profile={id:'skills-captain',name:'Mary',game:newGame('Mary',2),updated:1};
 p.game.skills={sailing:{tier:2,points:7}};
 const saved=await saveCheckpoint(p,'Sailing record','Church');
 p.game.skills.sailing.points=9;
 expect(restoreCheckpoint(p,saved).game.skills?.sailing).toEqual({tier:2,points:7});
 const legacy=structuredClone(saved);delete legacy.game.skills;
 expect(restoreCheckpoint(p,legacy).game.captain).toBe('Mary');
});
