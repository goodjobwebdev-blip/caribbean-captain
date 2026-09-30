// @vitest-environment happy-dom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {BattlePanel} from '../src/BattlePanel';
import {act,newGame} from '../src/game';
import {generateNpc} from '../src/battle/encounter';
import {createBattle,schedule,stepNaval} from '../src/battle/naval';
import {createShip} from '../src/ships';
import {crew} from '../src/battle/types';
afterEach(cleanup);
function fixture(){const g=newGame('Test captain',42);g.ship!.id='player';g.cargo={'round-shot':100,gunpowder:150,planks:20,tools:2};const npc=generateNpc(g);npc.ship=createShip('sloop-universal','Test opponent','npc');npc.crew=crew(10);npc.role='Pirate';g.battle=createBattle(g,npc);return g;}
it('prepares an opponent without a network request and accepts only once during save',async()=>{
 let g=fixture();const fetch=vi.spyOn(globalThis,'fetch');let release!:()=>void;
 const onAction=vi.fn(()=>new Promise<void>(resolve=>{release=resolve;}));
 const props={busy:false,apiKey:'',model:'',onAction,onSettings:()=>{}};
 const {rerender}=render(<BattlePanel {...props} game={g}/>);
 // Commit preserves the same public observations; the already-prepared reply can be reused.
 g=act(g,{type:'battle-commit',ids:[]});rerender(<BattlePanel {...props} game={g}/>);
 const button=await screen.findByRole('button',{name:'Reveal opponent’s orders'});
 await waitFor(()=>expect(button.hasAttribute('disabled')).toBe(false));
 fireEvent.click(button);fireEvent.click(button);
 expect(onAction).toHaveBeenCalledTimes(1);expect(onAction.mock.calls[0]).toBeTruthy();expect(fetch).not.toHaveBeenCalled();release();fetch.mockRestore();
});
it('asks before replacing edited orders and cancellation retains the original plan',()=>{
 const g=fixture();render(<BattlePanel game={g} busy={false} apiKey="" model="" onAction={async()=>{}} onSettings={()=>{}}/>);
 fireEvent.change(screen.getByLabelText('Orders'),{target:{value:'turn_45'}});
 const plans=screen.getAllByRole('button').filter(button=>button.closest('.maneuver-grid'));
 expect(plans.length).toBeGreaterThan(0);fireEvent.click(plans[0]);
 expect(screen.getByRole('button',{name:'Replace orders'})).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Keep my orders'}));
 expect(screen.getByRole('button',{name:'Remove order 1'})).toBeTruthy();expect(screen.queryByRole('button',{name:'Replace orders'})).toBeNull();
});
it('allows abandoning an impossible replacement tail without spending resources',()=>{
 let g=fixture();const b=g.battle!;b.plans.player=schedule(b,b.playerId,['reload_port_round-shot','fire_port']);b.plans.npc=[];b.status='playback';b.ships.player.cargo.gunpowder=0;stepNaval(g,b);expect(b.status).toBe('replacement');const before=structuredClone(b.ships.player.cargo);
 g=act(g,{type:'battle-commit',ids:['cancel-remaining-orders']});g=act(g,{type:'battle-reveal'});g=act(g,{type:'battle-instant'});
 expect(g.battle!.status).not.toBe('replacement');expect(g.battle!.ships.player.cargo).toEqual(before);
});

it('cancels queued local planning on unmount and replaces stale observations',async()=>{
 vi.useFakeTimers();
 try{
  const planner=await import('../src/battle/local-planner');const spy=vi.spyOn(planner,'localBattleDecision');
  const props={busy:false,apiKey:'',model:'',onAction:async()=>{},onSettings:()=>{}};
  const g=fixture();const mounted=render(<BattlePanel {...props} game={g}/>);mounted.unmount();vi.runAllTimers();expect(spy).not.toHaveBeenCalled();
  const next=render(<BattlePanel {...props} game={g}/>);const changed=structuredClone(g);changed.battle!.wind=180;next.rerender(<BattlePanel {...props} game={changed}/>);
  const {act:reactAct}=await import('@testing-library/react');await reactAct(async()=>{vi.runAllTimers();});
  expect(spy).toHaveBeenCalledTimes(1);expect(spy.mock.calls[0][0].wind).toBe(180);spy.mockRestore();
 }finally{vi.useRealTimers();}
});
it('reuses a prepared local decision after secret naval orders are committed',async()=>{
 const planner=await import('../src/battle/local-planner');const spy=vi.spyOn(planner,'localBattleDecision');
 try{
  let g=fixture();const props={busy:false,apiKey:'',model:'',onAction:async()=>{},onSettings:()=>{}};
  const {rerender}=render(<BattlePanel {...props} game={g}/>);await waitFor(()=>expect(spy).toHaveBeenCalledTimes(1));
  g=act(g,{type:'battle-commit',ids:['turn_45']});rerender(<BattlePanel {...props} game={g}/>);
  await screen.findByRole('button',{name:'Reveal opponent’s orders'});expect(spy).toHaveBeenCalledTimes(1);
 }finally{spy.mockRestore();}
});
it('can suspend an optional AI request and use the local captain without losing the turn',async()=>{
 const fetch=vi.spyOn(globalThis,'fetch').mockImplementation((_url,options)=>new Promise((_resolve,reject)=>{options?.signal?.addEventListener('abort',()=>reject(new Error('Request suspended.')));}));
 try{
  const g=act(fixture(),{type:'battle-commit',ids:[]}),onAction=vi.fn(async()=>{});
  render(<BattlePanel game={g} busy={false} apiKey="test-only" model="test-model" onAction={onAction} onSettings={()=>{}}/>);
  fireEvent.click(screen.getByText('Optional AI opponent'));
  fireEvent.click(screen.getByRole('button',{name:'Request Battle model decision'}));
  fireEvent.click(await screen.findByRole('button',{name:'Suspend request'}));
  const local=await screen.findByRole('button',{name:'Reveal opponent’s orders'});await waitFor(()=>expect(local.hasAttribute('disabled')).toBe(false));
  fireEvent.click(local);expect(onAction).toHaveBeenCalledTimes(1);expect(fetch).toHaveBeenCalledTimes(1);
 }finally{fetch.mockRestore();}
});
