import 'fake-indexeddb/auto';
import {it,expect} from 'vitest';
import {newGame, act} from '../src/game';
import {saveProfile,profiles,saveCheckpoint,checkpoints,restoreCheckpoint,deleteCheckpoint,type Profile} from '../src/storage';
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

it('restores market stock, remembered prices, purchase provenance and Trade progress together',async()=>{
 const p:Profile={id:'trade-captain',name:'Trader',game:newGame('Trader',3),updated:1};
 p.game=act(p.game,{type:'buy',good:'sugar',quantity:10});
 p.game.skills!.trade={tier:2,points:3.25};
 const saved=await saveCheckpoint(p,'Before trading voyage','Church');
 p.game=act(p.game,{type:'sell',good:'sugar',quantity:5});
 const restored=restoreCheckpoint(p,saved);
 expect(restored.game.economy).toEqual(saved.game.economy);
 expect(restored.game.skills!.trade).toEqual({tier:2,points:3.25});
 expect(restored.game.cargo.sugar).toBe(10);
 expect((await checkpoints(p.id))[0].game.economy).toEqual(saved.game.economy);
});

it('deletes only the selected checkpoint and preserves current progress, sibling saves and other captains',async()=>{
 const p:Profile={id:'delete-captain',name:'Anne',game:newGame('Anne',51),updated:1};await saveProfile(p);
 const first=await saveCheckpoint(p,'Delete this','Church'),keep=await saveCheckpoint(p,'Keep this','Church');
 const other:Profile={...p,id:'other-delete-captain'};const foreign=await saveCheckpoint(other,'Other captain','Church');
 await expect(deleteCheckpoint(p.id,foreign.id)).rejects.toThrow('does not belong');
 await deleteCheckpoint(p.id,first.id);
 expect((await checkpoints(p.id)).map(c=>c.id)).toEqual([keep.id]);expect((await checkpoints(other.id)).map(c=>c.id)).toEqual([foreign.id]);
 expect((await profiles()).find(x=>x.id===p.id)?.game).toEqual(p.game);
 await deleteCheckpoint(p.id,first.id); // Repeated deletion is harmless.
 await deleteCheckpoint(p.id,keep.id);expect(await checkpoints(p.id)).toEqual([]);
 expect((await profiles()).find(x=>x.id===p.id)?.game).toEqual(p.game);
});
