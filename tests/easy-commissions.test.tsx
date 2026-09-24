// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import {afterEach,it,expect} from 'vitest';
import {render,screen,fireEvent,cleanup,within,waitFor} from '@testing-library/react';
import {act,newGame,offers,contractProblems,contractBuilding,foodFor,wageFor,questSkillReward,type Contract} from '../src/game';
import {cargoSpaceUsed,loadBreakdown} from '../src/performance';
import {createShip} from '../src/ships';
import {PORTS,port} from '../src/world';
import {financialSummary} from '../src/finance';
import {rememberService} from '../src/npcs';
import {saveCheckpoint,restoreCheckpoint,profiles} from '../src/storage';
import {App,Commissions} from '../src/main';
import {Journal} from '../src/Journal';
afterEach(cleanup);
const assignment=(g:ReturnType<typeof newGame>,name:Contract['assignment'])=>offers(g).find(c=>c.assignment===name)!;

it('offers every easy type deterministically and restricts official work to the same nation',()=>{
 for(const town of PORTS){
  const g=newGame('Offers',3);g.port=town.id;const before=structuredClone(g),jobs=offers(g);
  expect(offers(g)).toEqual(jobs);expect(g).toEqual(before);expect(new Set(jobs.map(c=>c.id)).size).toBe(jobs.length);
  expect(jobs.filter(c=>c.assignment==='Monk passage')).toHaveLength(PORTS.length-1);
  expect(jobs.filter(c=>c.assignment==='Medical supplies')).toHaveLength(PORTS.length-1);
  const allies=PORTS.filter(p=>p.id!==g.port&&p.nation===town.nation);
  expect(jobs.filter(c=>c.assignment==='Garrison supplies')).toHaveLength(allies.length);
  const dispatches=jobs.filter(c=>c.assignment==='Official dispatch');expect(dispatches).toHaveLength(Math.min(1,allies.length));
  for(const c of jobs.filter(c=>['Garrison supplies','Official dispatch'].includes(c.assignment??'')))expect(port(c.to).nation).toBe(town.nation);
  if(dispatches.length){const c=dispatches[0],ordinary=jobs.find(x=>x.type==='Letter'&&!x.assignment&&x.to===c.to)!;expect(c.reward).toBe(Math.round(ordinary.reward*1.25));expect(questSkillReward(c)).toBe(questSkillReward(ordinary));}
  expect(jobs.filter(c=>c.type==='Donation')).toHaveLength(1);
 }
});

it.each(['Monk passage','Medical supplies','Garrison supplies','Official dispatch'] as const)('carries %s through a real voyage and pays fixed terms once at its building',name=>{
 let g=newGame('Voyager',9);g.ship=createShip('brigantine-merchant');g.crew=16;g.provisions=590;g.silver=10000;g.pirateDanger=0;
 const c=assignment(g,name);expect(c).toBeTruthy();
 expect(()=>act(g,{type:'accept',contract:c,building:'Store'})).toThrow('another building');
 g=act(g,{type:'accept',contract:{...c,reward:999999,amount:0},building:c.building});
 expect(g.contracts[0]).toEqual(c);expect(()=>act(g,{type:'accept',contract:c})).toThrow('no longer available');
 expect(()=>act(g,{type:'deliver',building:c.building})).toThrow('No contracts');
 g=act(g,{type:'sail',to:c.to},()=>.5);expect(g.failed).toBeNull();expect(g.port).toBe(c.to);
 expect(()=>act(g,{type:'deliver',building:'Harbour Master'})).toThrow('No contracts');
 const before=g;g=act(g,{type:'deliver',building:c.building});
 expect(g.silver).toBeCloseTo(before.silver+c.reward-wageFor(before,1));expect(g.contracts).toHaveLength(0);
 expect(g.archive![0]).toMatchObject({...c,sailingReward:questSkillReward(c)});
 expect(g.economy!.commerce!.attitude[port(c.to).nation]).toBe(2);
 expect(()=>act(g,{type:'deliver',building:c.building})).toThrow('No contracts');
 rememberService(before,g,c.building!,{type:'deliver',building:c.building});expect(g.npcMemories![`${g.port}:${c.building}`]!.completedWork).toBe(1);
});

it('accounts for sealed cargo and monks in capacity, weight, provisions and the shared task limit',()=>{
 const g=newGame('Load',2),medical=assignment(g,'Medical supplies'),monks=assignment(g,'Monk passage');
 const packed={...g,contracts:[medical,monks]};
 expect(cargoSpaceUsed(packed)-cargoSpaceUsed(g)).toBe(20);expect(loadBreakdown(packed).total-loadBreakdown(g).total).toBe(22);
 expect(foodFor(packed,24)-foodFor(g,24)).toBe(2);
 const full={...g,cargo:{planks:300}};expect(contractProblems(full,medical).join(' ')).toContain('hold');
 const crowded={...g,contracts:[{...monks,amount:999}]};expect(contractProblems(crowded,monks).join(' ')).toContain('berths');
 const three={...g,contracts:offers(g).filter(c=>c.type==='Letter').slice(0,3)};expect(contractProblems(three,medical).join(' ')).toContain('three active');
 expect(contractProblems(three,assignment(three,'Parish donation'))).toEqual([]);
 const after=act(g,{type:'accept',contract:medical,building:'Pharmacy'});expect(after.cargo).toEqual(g.cargo);
});

it('completes a donation atomically, accounts for it, and blocks repeat or unaffordable gifts',()=>{
 const g=newGame('Donor',2),c=assignment(g,'Parish donation'),before=structuredClone(g);
 expect(()=>act(g,{type:'accept',contract:c,building:'Governor'})).toThrow('another building');
 for(const poor of [{...g,silver:100},{...g,provisions:0}])expect(()=>act(poor,{type:'accept',contract:c,building:'Church'})).toThrow();
 const next=act(g,{type:'accept',contract:{...c,amount:0,reward:9999},building:'Church'});
 expect(g).toEqual(before);expect(next.contracts).toHaveLength(0);expect(next.hours).toBe(g.hours+1);
 expect(next.silver).toBeCloseTo(g.silver-100-wageFor(g,1));expect(next.provisions).toBeCloseTo(g.provisions-foodFor(g,1));
 expect(next.archive![0]).toMatchObject({...c,completedAt:next.hours});expect(next.economy!.commerce!.reputation).toBe(1);
 expect(next.skills).toEqual(g.skills);expect(financialSummary(next.finances!.entries).cashExpenses).toBeCloseTo(100+wageFor(g,1));
 rememberService(g,next,'Church',{type:'accept',contract:c,building:'Church'});
 expect(next.npcMemories!['bridgetown:Church']!.completedWork).toBe(1);expect(next.npcMemories!['bridgetown:Church']!.lastAction!.text).toContain('donation');
 expect(assignment(next,'Parish donation')).toBeUndefined();expect(()=>act(next,{type:'accept',contract:c})).toThrow('no longer available');
 next.hours=24;expect(assignment(next,'Parish donation').id).not.toBe(c.id);
 next.port='saint-pierre';expect(assignment(next,'Parish donation')).toBeTruthy();
});

it('refreshes dispatch offers while preserving accepted terms and restores donation history with checkpoints',async()=>{
 let g=newGame('Checkpoint',3);const dispatch=assignment(g,'Official dispatch');g=act(g,{type:'accept',contract:dispatch});
 g=act(g,{type:'accept',contract:assignment(g,'Parish donation')});
 const p={id:'easy-checkpoint',name:'Checkpoint',game:g,updated:1},cp=await saveCheckpoint(p,'Easy jobs','Church');
 const later=structuredClone(g);later.hours=48;expect(assignment(later,'Official dispatch').id).not.toBe(dispatch.id);expect(later.contracts[0]).toEqual(dispatch);
 const restored=restoreCheckpoint({...p,game:later},cp).game;expect(restored).toEqual(g);expect(assignment(restored,'Parish donation')).toBeUndefined();
 expect(contractBuilding({...dispatch,building:undefined})).toBe('Harbour Master');
});

it('shows donation completion in the service panel and Journal archive',()=>{
 let g=newGame('Panel',7);const perform=(a:Parameters<typeof act>[1])=>{g=act(g,a);panel.rerender(<Commissions game={g} building="Church" busy={false} perform={perform}/>);};
 const panel=render(<Commissions game={g} building="Church" busy={false} perform={perform}/>);
 fireEvent.click(screen.getByRole('button',{name:'Donate 100 silver'}));expect(screen.queryByRole('button',{name:'Donate 100 silver'})).toBeNull();
 expect(screen.getByRole('heading',{name:'Available work'})).toBeTruthy();expect(screen.getByText(/donation request is fulfilled/)).toBeTruthy();panel.unmount();
 render(<Journal game={g}/>);fireEvent.click(screen.getByRole('tab',{name:'Quests'}));fireEvent.click(screen.getByRole('tab',{name:'archived (1)'}));
 expect(screen.getByRole('heading',{name:'Parish donation in Bridgetown'})).toBeTruthy();expect(screen.getByText('Donation given')).toBeTruthy();expect(screen.getByText('100 silver')).toBeTruthy();
});

it('opens all four buildings through their named hosts and preserves Church checkpoints',async()=>{
 render(<App/>);const create=screen.getByRole('button',{name:'Create captain'});await waitFor(()=>expect(create.hasAttribute('disabled')).toBe(false));
 fireEvent.change(screen.getByLabelText('Captain’s name'),{target:{value:'Easy quest integration'}});fireEvent.click(create);await screen.findByText('Samuel Hale');
 fireEvent.click(screen.getByRole('button',{name:/Does the parish need/}));fireEvent.click(screen.getByRole('button',{name:'Donate 100 silver'}));await screen.findByText(/donation is received with thanks/);
 expect(screen.getByRole('heading',{name:'Available work'})).toBeTruthy();fireEvent.click(screen.getByRole('button',{name:'Speak to Samuel Hale'}));
 fireEvent.click(screen.getByRole('button',{name:/Let us record this chapter/}));expect(screen.getByRole('button',{name:'Create church checkpoint'})).toBeTruthy();
 const cases=[['Pharmacy','Judith Moss',/Have you remedies/,'Accept medical supplies'],['Fort & Garrison','Henry Pike',/Does another garrison/,'Accept garrison supplies'],['Governor','Margaret Ashby',/May I carry a dispatch/,'Accept official dispatch']] as const;
 for(const [building,host,choice,button] of cases){
  fireEvent.click(within(screen.getByRole('navigation',{name:'Town locations'})).getByText(building,{exact:true}));await screen.findByText(host);
  expect(screen.queryByText(/This location is visible for planning only/)).toBeNull();fireEvent.click(screen.getByRole('button',{name:choice}));
  fireEvent.click(screen.getAllByRole('button',{name:button,hidden:true})[0]);await screen.findByText(/Your commission has been accepted/);
  expect(screen.getByRole('heading',{name:'Available work'})).toBeTruthy();
 }
 const saved=(await profiles()).find(p=>p.name==='Easy quest integration')!;expect(saved.game.contracts).toHaveLength(3);expect(saved.game.archive![0].assignment).toBe('Parish donation');
});
