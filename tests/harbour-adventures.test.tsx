// @vitest-environment happy-dom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {act,foodFor,newGame,normalizeGame,offers,type Game} from '../src/game';
import {PORTS} from '../src/world';
import {HARBOUR_STORIES,harbourAdventureQuote,completeHarbourAdventure,visitedHarbours,type AdventureAction} from '../src/adventures';
import {CaptainsCompass,captainBearings} from '../src/CaptainsCompass';
import {visitNpc} from '../src/npcs';
afterEach(cleanup);
const choice=(g:Game,id:'paid'|'aid'='paid'):AdventureAction=>({type:'harbour-story',port:g.port,choice:id});
const props=(g:Game)=>({game:g,checkpointCount:1,busy:false,onNavigate:vi.fn(),onPlan:vi.fn(),onAction:vi.fn()});

describe('authored harbour adventures',()=>{
 it('gives each port a distinct incident with varied fixed costs and rewards',()=>{
  expect(new Set(PORTS.map(p=>HARBOUR_STORIES[p.id].title)).size).toBe(PORTS.length);
  expect(new Set(PORTS.map(p=>HARBOUR_STORIES[p.id].choices[0].hours)).size).toBeGreaterThan(2);
  expect(new Set(PORTS.map(p=>HARBOUR_STORIES[p.id].choices[0].silver)).size).toBeGreaterThan(5);
  for(const p of PORTS){expect(HARBOUR_STORIES[p.id].choices.map(c=>c.id)).toEqual(['paid','aid']);}
 });
 it('quotes without mutating, spends normal upkeep, records a real reward and cannot repeat',()=>{
  const g=newGame('Quays',7),before=structuredClone(g),q=harbourAdventureQuote(g,choice(g));
  expect(q.errors).toEqual([]);expect(g).toEqual(before);
  const next=act(g,choice(g));
  expect(next.hours).toBe(g.hours+q.hours);
  expect(next.provisions).toBeCloseTo(g.provisions-q.provisions);
  expect(next.silver).toBeCloseTo(g.silver-q.wages+q.choice.silver);
  expect(next.harbourStories?.bridgetown).toEqual({choice:'paid',completedAt:next.hours});
  expect(next.finances?.entries.some(e=>e.kind==='quest'&&e.cash===q.choice.silver)).toBe(true);
  expect(next.log[0].text).toBe(q.choice.outcome);
  expect(()=>act(next,choice(next))).toThrow(/already played/);
  expect(g).toEqual(before);expect(next.seed).toBe(g.seed);
 });
 it('supports provisioning choices with FIFO consumption and limited standing gains',()=>{
  const g=newGame('Relief',8);g.port='santo-domingo';
  const q=harbourAdventureQuote(g,choice(g,'aid'));
  expect(q.provisions).toBeCloseTo(foodFor(g,q.hours)+4);
  const next=act(g,choice(g,'aid'));
  expect(next.provisions).toBeCloseTo(g.provisions-q.provisions);
  expect(next.economy?.lots.provisions?.reduce((n,l)=>n+l.quantity,0)).toBeCloseTo(next.provisions);
  expect(next.economy?.commerce?.attitude.Spain).toBe(3);
  expect(next.economy?.commerce?.reputation).toBe(1);
  expect(next.finances?.entries.filter(e=>e.kind==='provisions-used').reduce((n,e)=>n+(e.quantity??0),0)).toBeCloseTo(q.provisions);
 });
 it('caps morale at 100 and does not change unrelated skill or crew counts',()=>{
  const g=newGame('Music',9);g.port='port-royal';g.crewState={fit:10,injured:0,dead:0,morale:99,discipline:50,experience:50,equipment:50};
  const next=act(g,choice(g,'aid'));
  expect(next.crewState?.morale).toBe(100);expect(next.crew).toBe(g.crew);expect(next.skills).toEqual(g.skills);
 });
 it('rejects insufficient food/wages, wrong port, invalid choices and unavailable states without rewarding',()=>{
  const g=newGame('Guard',10),before=structuredClone(g);
  expect(()=>act({...g,provisions:0},choice(g))).toThrow(/provisions/);
  expect(()=>act({...g,silver:0},choice(g))).toThrow(/wages/);
  expect(()=>act(g,{...choice(g),port:'havana'})).toThrow(/another port/);
  expect(()=>act(g,{...choice(g),choice:'invented'} as unknown as AdventureAction)).toThrow(/offered/);
  expect(harbourAdventureQuote({...g,failed:'Ended'},choice(g)).errors.join(' ')).toMatch(/safely in port/);
  expect(harbourAdventureQuote({...g,voyage:{to:'havana',hours:10,remaining:10,weather:'Calm',dice:[3,4]}},choice(g)).errors.join(' ')).toMatch(/safely in port/);
  expect(g).toEqual(before);
 });
 it('derives rewards from the catalogue and refuses premature or repeated resolution',()=>{
  const g=newGame('Terms',11),q=harbourAdventureQuote(g,choice(g));
  expect(()=>completeHarbourAdventure(g,q)).toThrow(/no longer/);
  const advanced={...structuredClone(g),hours:g.hours+q.hours};
  completeHarbourAdventure(advanced,{...q,choice:{...q.choice,silver:99999,attitude:100}});
  expect(advanced.silver).toBe(g.silver+HARBOUR_STORIES[g.port].choices[0].silver);
  expect(advanced.economy?.commerce?.attitude.England??0).toBe(0);
  expect(()=>completeHarbourAdventure(advanced,q)).toThrow(/no longer/);
 });
 it('preserves completed chapters through normalization and leaves older saves playable',()=>{
  const old=newGame('Old',12);delete old.harbourStories;
  expect(harbourAdventureQuote(normalizeGame(old),choice(old)).errors).toEqual([]);
  const next=act(old,choice(old,'aid'));
  expect(normalizeGame(next).harbourStories).toEqual(next.harbourStories);
  const another={...next,port:'saint-pierre' as const};
  expect(harbourAdventureQuote(another,choice(another)).errors).toEqual([]);
 });
});

describe('captain’s compass',()=>{
 it('counts evidence of visits, never remote market information or an unfinished voyage destination',()=>{
  let g=newGame('Discovery',13);g.economy!.memories.havana=structuredClone(g.economy!.memories.bridgetown!);
  g.finances!.voyages.push({id:1,from:'bridgetown',to:'havana',departure:8,openingSilver:800,currentSilver:800,status:'at-sea',partial:false});
  expect(visitedHarbours(g)).toEqual(['bridgetown']);
  g={...g,port:'saint-pierre'};g=visitNpc(g,'Store');g.port='bridgetown';
  expect(visitedHarbours(g)).toEqual(['bridgetown','saint-pierre']);
  g.finances!.voyages[0].arrival=100;
  expect(visitedHarbours(g)).toContain('havana');
 });
 it('prioritizes checkpoints and correct delivery buildings and keeps selection read-only',()=>{
  const g=newGame('Bearings',14);g.contracts=[{...offers(g).find(c=>c.type==='Freight')!,to:g.port}];
  const p=props(g);p.checkpointCount=0;const before=structuredClone(g);render(<CaptainsCompass {...p}/>);
  fireEvent.click(screen.getByRole('button',{name:'Visit Church'}));expect(p.onNavigate).toHaveBeenCalledWith('Church');
  fireEvent.click(screen.getByRole('button',{name:'Visit Store'}));expect(p.onNavigate).toHaveBeenCalledWith('Store');
  expect(g).toEqual(before);
 });
 it('plans the nearest unvisited harbour without sailing or promising hidden outcomes',()=>{
  const g=newGame('Horizon',15),p=props(g);render(<CaptainsCompass {...p}/>);
  fireEvent.click(screen.getByRole('button',{name:'Chart Saint-Pierre'}));expect(p.onPlan).toHaveBeenCalledWith('saint-pierre');
  expect(p.onAction).not.toHaveBeenCalled();expect(g.voyage).toBeNull();
  expect(screen.queryByText(HARBOUR_STORIES.bridgetown.choices[0].outcome)).toBeNull();
 });
 it('dispatches a single canonical choice and recalls the saved outcome after completion',()=>{
  const g=newGame('Choice',16),p=props(g),v=render(<CaptainsCompass {...p}/>);
  fireEvent.click(screen.getByRole('button',{name:'Choose: Move the merchant’s sugar'}));
  expect(p.onAction).toHaveBeenCalledExactlyOnceWith(choice(g));
  const next=act(g,choice(g));v.rerender(<CaptainsCompass {...p} game={next}/>);
  expect(screen.getByText(HARBOUR_STORIES.bridgetown.choices[0].outcome)).toBeTruthy();
  expect(screen.queryByRole('button',{name:/^Choose:/})).toBeNull();
 });
 it('disables choices while saving or short of supplies and hides harbour controls at sea',()=>{
  const g=newGame('Wait',17),p=props(g),v=render(<CaptainsCompass {...p} busy/>);
  for(const button of screen.getAllByRole('button'))expect((button as HTMLButtonElement).disabled).toBe(true);
  v.rerender(<CaptainsCompass {...p} game={{...g,provisions:0}}/>);
  for(const button of screen.getAllByRole('button',{name:/^Choose:/}))expect((button as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getAllByText(/provisions for upkeep/).length).toBe(2);
  v.rerender(<CaptainsCompass {...p} game={{...g,voyage:{to:'havana',hours:10,remaining:10,weather:'Calm',dice:[3,4]}}}/>);
  expect(screen.queryByRole('region',{name:'A captain’s bearings'})).toBeNull();
  expect(captainBearings({...g,failed:'Ended'},0)).toEqual([]);
 });
});
