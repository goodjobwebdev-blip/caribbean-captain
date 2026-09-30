// @vitest-environment happy-dom
import {afterEach,describe,expect,it,vi} from 'vitest';
import {act as reactAct,cleanup,fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import {act,newGame,type Game} from '../src/game';
import {port} from '../src/world';
import {connectionsView,type ConnectionChoice} from '../src/connections';
import {ConnectedEncounters} from '../src/ConnectedEncounters';

afterEach(cleanup);
const harbour=(choice:'paid'|'aid'='paid')=>act(newGame('Marisol',121),{type:'harbour-story',port:'bridgetown',choice});
const choose=(game:Game,choice?:ConnectionChoice)=>act(game,connectionsView(game)!.options.find(option=>!choice||option.id===choice)!.action);
const arrive=(game:Game):Game=>({...game,port:connectionsView(game)!.objective!.destination});
const crossroads=(origin:'paid'|'aid'='paid')=>arrive(choose(harbour(origin)));
const props=(game:Game)=>({game,busy:false,onAction:vi.fn(),onPlan:vi.fn()});

describe('connected journey presentation',()=>{
 it('waits for completed harbour work and reveals only the current authored chapter',()=>{
  const p=props(newGame('Unintroduced',12)),v=render(<ConnectedEncounters {...p}/>);
  expect(screen.queryByRole('region',{name:'The Lantern Ledger'})).toBeNull();
  const g=harbour('aid');v.rerender(<ConnectedEncounters {...p} game={g}/>);
  expect(screen.getByRole('heading',{name:'The Lantern Ledger'})).toBeTruthy();
  expect(screen.getByText('Chapter 1 of 3')).toBeTruthy();
  expect(screen.getByText('Inés Duarte',{selector:'.connected-person strong'})).toBeTruthy();
  expect(screen.getByText('Captain Silas Rook',{selector:'.connected-person strong'})).toBeTruthy();
  expect(screen.getByText(/The quay folk told me who stayed to help/)).toBeTruthy();
  expect(screen.getByRole('button',{name:'Choose: Accept Inés’s introduction'})).toBeTruthy();
  expect(screen.queryByRole('button',{name:/Stand by the quay workers/})).toBeNull();
  expect(screen.queryByText(/certified duplicate closes/)).toBeNull();
  expect(screen.queryByText(/260|300/)).toBeNull();
 });
 it('quotes all immediate costs before accepting and links them to the choice',()=>{
  const g=harbour(),p=props(g),q=connectionsView(g)!.options[0].quote;render(<ConnectedEncounters {...p}/>);
  const button=screen.getByRole('button',{name:'Choose: Accept Inés’s introduction'}),article=button.closest('article')!;
  const value=(label:string)=>within(article).getByText(label).nextElementSibling?.textContent;
  expect(value('Time ashore')).toBe(`${q.hours}h`);
  expect(value('Provisions used')).toBe(q.provisions.toFixed(2));
  expect(value('Crew wages')).toBe(`${q.wages.toFixed(2)} silver`);
  expect(value('Silver needed first')).toBe((q.wages+q.fee).toFixed(2));
  expect(value('Payment after the work')).toBe(`${q.reward.toFixed(2)} silver`);
  expect(document.getElementById(button.getAttribute('aria-describedby')!)).toBe(article.querySelector('dl'));
  expect(p.onAction).not.toHaveBeenCalled();
 });
 it('charts the objective without sailing and conceals unreached dialogue and choices',()=>{
  const g=choose(harbour()),p=props(g),before=structuredClone(g);render(<ConnectedEncounters {...p}/>);
  const destination=connectionsView(g)!.objective!.destination;
  fireEvent.click(screen.getByRole('button',{name:`Review route to ${port(destination).name}`}));
  expect(p.onPlan).toHaveBeenCalledExactlyOnceWith(destination);
  expect(p.onAction).not.toHaveBeenCalled();expect(g).toEqual(before);
  expect(screen.queryByRole('button',{name:/^Choose:/})).toBeNull();
  expect(screen.queryByText(/Inés meets you beside the tally shed/)).toBeNull();
  expect(screen.getByText('Captain Silas Rook',{selector:'.connected-person strong'})).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe(connectionsView(g)!.outcome);
 });
 it('recalls the earlier aid choice and shows its real current advantage without later rewards',()=>{
  const g=crossroads('aid'),p=props(g),v=render(<ConnectedEncounters {...p}/>);
  expect(screen.getByText('Chapter 2 of 3')).toBeTruthy();
  expect(screen.getByText(/have gathered half the provisions/)).toBeTruthy();
  const witness=screen.getByRole('button',{name:'Choose: Stand by the quay workers'}).closest('article')!;
  expect(within(witness).getByText('Provisions above include 2.00 shared from your stores.')).toBeTruthy();
  expect(within(witness).getByText('Net silver: -3.33')).toBeTruthy();
  const bargain=screen.getByRole('button',{name:'Choose: Buy Rook’s authenticated copy'}).closest('article')!;
  expect(within(bargain).getByText('Additional payment').nextElementSibling?.textContent).toBe('24.00 silver');
  expect(screen.queryByText(/210|260/)).toBeNull();
  v.rerender(<ConnectedEncounters {...p} game={crossroads('paid')}/>);
  expect(screen.getByText('Provisions above include 4.00 shared from your stores.')).toBeTruthy();
  expect(screen.getByText('Additional payment').nextElementSibling?.textContent).toBe('36.00 silver');
 });
 it('disables unaffordable choices with associated reasons and disables every action while saving',()=>{
  const g={...crossroads(),silver:0,provisions:0},p=props(g),v=render(<ConnectedEncounters {...p}/>);
  for(const button of screen.getAllByRole('button',{name:/^Choose:/})){
   expect((button as HTMLButtonElement).disabled).toBe(true);
   const reasons=button.getAttribute('aria-describedby')!.split(' ').map(id=>document.getElementById(id)?.textContent).join(' ');
   expect(reasons).toMatch(/silver/);expect(reasons).toMatch(/provisions for upkeep/);
   fireEvent.click(button);
  }
  expect(p.onAction).not.toHaveBeenCalled();
  v.rerender(<ConnectedEncounters {...p} game={choose(harbour())} busy/>);
  for(const button of screen.getAllByRole('button'))expect((button as HTMLButtonElement).disabled).toBe(true);
 });
 it('locks both alternatives synchronously and announces only the saved result with focus',async()=>{
  const g=crossroads(),p=props(g);let finish!:()=>void;
  p.onAction=vi.fn(()=>new Promise<void>(resolve=>{finish=resolve;}));
  const v=render(<ConnectedEncounters {...p}/>),button=screen.getByRole('button',{name:'Choose: Stand by the quay workers'});
  fireEvent.click(button);fireEvent.click(button);fireEvent.click(screen.getByRole('button',{name:'Choose: Buy Rook’s authenticated copy'}));
  expect(p.onAction).toHaveBeenCalledExactlyOnceWith(connectionsView(g)!.options[0].action);
  expect(screen.getByRole('status').textContent).toBe('Recording your choice…');
  const next=choose(g,'witness');v.rerender(<ConnectedEncounters {...p} game={next} busy/>);
  expect(screen.getByRole('status').textContent).toBe('Recording your choice…');
  await reactAct(async()=>{finish();});
  v.rerender(<ConnectedEncounters {...p} game={next}/>);
  await waitFor(()=>expect(document.activeElement).toBe(screen.getByRole('status')));
  expect(screen.getByRole('status').textContent).toBe(connectionsView(next)!.outcome);
  expect(screen.getByRole('status').getAttribute('aria-live')).toBe('polite');
  expect(screen.queryByRole('button',{name:/^Choose:/})).toBeNull();
  expect(screen.queryByText(/independent tally settles/)).toBeNull();
 });
 it('releases a failed save for retry and never invents a success from callback completion',async()=>{
  const g=crossroads(),p=props(g);p.onAction=vi.fn().mockResolvedValue(undefined);
  render(<ConnectedEncounters {...p}/>);
  const previous=screen.getByRole('status').textContent;
  fireEvent.click(screen.getByRole('button',{name:'Choose: Stand by the quay workers'}));
  await waitFor(()=>expect((screen.getByRole('button',{name:'Choose: Stand by the quay workers'}) as HTMLButtonElement).disabled).toBe(false));
  expect(screen.getByRole('status').textContent).toBe(previous);
  expect(screen.getAllByRole('button',{name:/^Choose:/})).toHaveLength(2);
  fireEvent.click(screen.getByRole('button',{name:'Choose: Buy Rook’s authenticated copy'}));
  await waitFor(()=>expect(p.onAction).toHaveBeenCalledTimes(2));
 });
 it('handles thrown callback failures accessibly and enables retry',async()=>{
  const p=props(harbour());p.onAction=vi.fn().mockRejectedValueOnce(new Error('The saved captain could not be written.'));
  render(<ConnectedEncounters {...p}/>);
  fireEvent.click(screen.getByRole('button',{name:'Choose: Accept Inés’s introduction'}));
  await waitFor(()=>expect(screen.getByRole('status').textContent).toBe('The saved captain could not be written.'));
  expect(document.activeElement).toBe(screen.getByRole('status'));
  expect((screen.getByRole('button',{name:'Choose: Accept Inés’s introduction'}) as HTMLButtonElement).disabled).toBe(false);
 });
 it('restores the settled outcome and relationship memories without offering repeated rewards',()=>{
  const g=choose(arrive(choose(crossroads('paid'),'bargain'))),saved=JSON.parse(JSON.stringify(g)),p=props(saved);
  render(<ConnectedEncounters {...p}/>);
  expect(screen.getByText('Journey complete')).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe(connectionsView(saved)!.outcome);
  expect(screen.getByText('Rook remembers the captain who paid fairly for his copy.')).toBeTruthy();
  expect(screen.getByText('Inés remembers that you chose a negotiated settlement.')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.getByText('Your story so far').closest('details')).toBeTruthy();
 });
 it('never exposes harbour actions during travel, battle, or a failed voyage',()=>{
  const g=harbour(),p=props(g),v=render(<ConnectedEncounters {...p}/>);
  const unavailable:Game[]=[{...g,failed:'Voyage ended'},{...g,voyage:{to:'havana',hours:10,remaining:10,weather:'Calm',dice:[3,4]}},{...g,battle:{} as NonNullable<Game['battle']>}];
  for(const game of unavailable){v.rerender(<ConnectedEncounters {...p} game={game}/>);expect(screen.queryByRole('region',{name:'The Lantern Ledger'})).toBeNull();}
 });
});
