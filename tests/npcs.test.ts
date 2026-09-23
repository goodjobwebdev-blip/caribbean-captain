import 'fake-indexeddb/auto';
import {expect,it,vi,afterEach} from 'vitest';
import {NPC_PLACES,npcAt,visitNpc,rememberService,dialogueContext} from '../src/npcs';
import {PORTS} from '../src/world';
import {act,newGame,normalizeGame,offers} from '../src/game';
import {saveCheckpoint,restoreCheckpoint} from '../src/storage';
import {dressDialogue} from '../src/nanogpt';
afterEach(()=>vi.unstubAllGlobals());
it('defines stable, unique identities for every building in every town',()=>{
 const npcs=PORTS.flatMap(p=>NPC_PLACES.map(place=>npcAt(p.id,place)));
 expect(npcs).toHaveLength(210);expect(new Set(npcs.map(n=>n.id)).size).toBe(210);expect(new Set(npcs.map(n=>n.name)).size).toBe(210);
 for(const npc of npcs){expect(npc.name).toBeTruthy();expect(npc.voice).toBeTruthy();}
 expect(npcAt('bridgetown','Store').name).toBe('Elias Ward');
});
it('records visits without charging time, altering random state, or mutating the original',()=>{
 const g=newGame('Captain',9),before=structuredClone(g),next=visitNpc(g,'Store');
 expect(g).toEqual(before);expect(next.hours).toBe(g.hours);expect(next.seed).toBe(g.seed);expect(next.economy).toEqual(g.economy);
 expect(dialogueContext(next,'Store',null).canonical).toContain('Welcome, Captain');
 const back=visitNpc(next,'Store');expect(dialogueContext(back,'Store',null).canonical).toContain('Welcome back');
 back.port='san-juan';expect(dialogueContext(back,'Store',null).memory).toBeNull();expect(newGame('Other',9).npcMemories).toBeUndefined();
 expect(normalizeGame(g).npcMemories).toBeUndefined();
});
it('persists successful trade and work memories and restores them with checkpoints',async()=>{
 const before=visitNpc(newGame('Captain',9),'Store'),action={type:'buy' as const,good:'sugar' as const,quantity:1};
 const after=act(before,action);rememberService(before,after,'Store',action);
 const profile={id:'npc-memory',name:'Captain',game:after,updated:1},cp=await saveCheckpoint(profile,'After trade','Church');
 const later=visitNpc(after,'Store');expect(later.npcMemories!['bridgetown:Store']!.visits).toBe(2);
 expect(restoreCheckpoint({...profile,game:later},cp).game.npcMemories).toEqual(after.npcMemories);
 expect(dialogueContext(after,'Store','trade',true).canonical).toContain('purchase is complete');
 const failed={...after,failed:'Voyage ended'};rememberService(after,failed,'Store',action);expect(failed.npcMemories).toEqual(after.npcMemories);
 let g=visitNpc(newGame('Work',3),'Harbour Master');const job=offers(g).find(c=>c.type==='Letter')!;g.contracts=[{...job,to:g.port}];
 const delivered=act(g,{type:'deliver'});rememberService(g,delivered,'Harbour Master',{type:'deliver'});expect(delivered.npcMemories!['bridgetown:Harbour Master']!.completedWork).toBe(1);
});
it('limits model context to fixed identity, real memory, and allowed services',async()=>{
 const g=visitNpc(newGame('Captain',1),'Store');g.ship!.hullPoints=20;
 const context=dialogueContext(g,'Store','trade');expect(context.conditions.hullDamaged).toBe(true);expect(context.phase).toBe('service');
 const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({choices:[{message:{content:'A clear voice welcomes you.'}}]})});vi.stubGlobal('fetch',fetchMock);
 expect(await dressDialogue('test-key','test-model',context,new AbortController().signal)).toBe('A clear voice welcomes you.');
 const request=JSON.parse(fetchMock.mock.calls[0][1].body);expect(request.messages[0].content).toContain('Never invent');expect(JSON.parse(request.messages[1].content).npc.name).toBe('Elias Ward');
 expect(request.messages[1].content).not.toContain('test-key');expect(request.messages[1].content).not.toContain('contracts');
 fetchMock.mockResolvedValue({ok:true,json:async()=>({choices:[{message:{content:' '}}]})});await expect(dressDialogue('x','y',context,new AbortController().signal)).rejects.toThrow('Invalid');
});
