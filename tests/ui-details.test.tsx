// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import {it,expect,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,within,waitFor} from '@testing-library/react';
import {StatusMeter,ShipMeters,readyCount,DeliveryBadge,actionFeedback} from '../src/GameDetails';
import {CrewSummary} from '../src/CrewServices';
import {SkillCards} from '../src/SkillCards';
import {act,newGame,offers,type Action} from '../src/game';
import {App} from '../src/main';
import * as storage from '../src/storage';
afterEach(()=>{cleanup();vi.restoreAllMocks();});
it('keeps exact overload text while bounding accessible meter values',()=>{
 render(<StatusMeter label="Hold" value={120} max={100} detail="120 / 100 · 20 over capacity" tone="danger"/>);
 const meter=screen.getByRole('meter',{name:'Hold'});expect(meter.getAttribute('aria-valuenow')).toBe('100');expect(meter.getAttribute('aria-valuetext')).toContain('20 over capacity');expect(screen.getByText('120 / 100 · 20 over capacity')).toBeTruthy();
});
it('shows crew specialties, low morale and maximum captain mastery',()=>{
 const g=newGame('Bars',1);g.crewState={fit:10,injured:0,dead:0,morale:15,discipline:35,experience:50,equipment:50,expertise:{sailing:75,gunnery:60,fighting:40}};g.skills!.sailing={tier:10,points:0};
 const v=render(<CrewSummary game={g}/>);expect(screen.getAllByRole('progressbar')).toHaveLength(3);expect(screen.getByRole('meter',{name:'Morale'}).getAttribute('aria-valuetext')).toContain('Critical');expect(screen.getByRole('meter',{name:'Discipline'}).getAttribute('aria-valuetext')).toContain('Low');v.unmount();
 render(<SkillCards game={g}/>);expect(screen.getByRole('progressbar',{name:'Sailing & Navigation mastery'}).getAttribute('aria-valuetext')).toBe('Maximum mastery');
});
it('shows critical condition and overloaded capacity without changing game state',()=>{
 const g=newGame('Ship',2);g.ship!.hullPoints=15;g.ship!.sailCondition=0;g.cargo.iron=1000;const before=structuredClone(g);
 render(<ShipMeters game={g}/>);expect(screen.getByRole('meter',{name:'Hull condition'}).getAttribute('aria-valuetext')).toContain('Critical');expect(screen.getByRole('meter',{name:'Sail condition'}).getAttribute('aria-valuetext')).toContain('Disabled');expect(screen.getByRole('meter',{name:'Deadweight'}).getAttribute('aria-valuetext')).toContain('over capacity');expect(g).toEqual(before);
});
it('counts only ready local contracts at their actual building, including legacy work',()=>{
 const g=newGame('Jobs',3),freight=offers(g).find(c=>c.type==='Freight')!;
 g.contracts=[{...freight,to:g.port},{...freight,id:'legacy',building:undefined,to:g.port},freight];
 expect(readyCount(g,'Store')).toBe(1);expect(readyCount(g,'Harbour Master')).toBe(1);expect(readyCount(g,'Church')).toBe(0);
 const v=render(<DeliveryBadge game={g} building="Store"/>);expect(screen.getByLabelText('1 ready to deliver')).toBeTruthy();v.unmount();
 expect(readyCount({...g,failed:'Ended'})).toBe(0);expect(readyCount({...g,voyage:{to:freight.to,hours:2,remaining:2,weather:'Calm',dice:[3,3]}})).toBe(0);
});
it('reports real net cash and tier rollover rather than inventing rewards',()=>{
 const g=newGame('Feedback',4);g.skills!.sailing={tier:0,points:9};g.contracts=[{id:'ready',from:'saint-pierre',to:g.port,type:'Letter',amount:0,reward:100,sailingReward:2}];
 const action:Action={type:'deliver'},next=act(g,action),items=actionFeedback(g,next,action);
 expect(items.map(x=>x.text)).toContain('+99.17 silver net');expect(items.map(x=>x.text)).toContain('Sailing reached tier 1!');expect(items.map(x=>x.text)).toContain('+2.00 Sailing practice');
 expect(actionFeedback(g,g,{type:'difficulty',value:'Easy'})).toEqual([]);
 expect(actionFeedback(g,g,{type:'deliver'})).toEqual([]);
});
it('announces saved delivery results, clears badges, and does not celebrate restores or failed saves',async()=>{
 const g=newGame('Details',5);g.skills!.sailing={tier:0,points:9};g.contracts=[{id:'ui-letter',from:'saint-pierre',to:g.port,type:'Letter',amount:0,reward:100,sailingReward:1}];
 const p={id:'ui-details-profile',name:'UI details integration',game:g,updated:Date.now()};await storage.saveProfile(p);await storage.saveCheckpoint(p,'Before delivery','Church');
 render(<App/>);fireEvent.click(await screen.findByRole('button',{name:/UI details integration/}));
 expect(screen.queryByLabelText('Last action result')).toBeNull();const nav=await screen.findByRole('navigation',{name:'Town locations'});
 fireEvent.click(within(nav).getByRole('button',{name:/Harbour Master/}));await screen.findByText('Edmund Price');fireEvent.click(screen.getByRole('button',{name:/Have you work for a reliable captain/}));
 fireEvent.click(screen.getByRole('button',{name:'Deliver completed tasks'}));await screen.findByText('Sailing reached tier 1!');expect(within(nav).queryByLabelText('1 ready to deliver')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Dismiss action result'}));expect(screen.queryByLabelText('Last action result')).toBeNull();
 fireEvent.click(within(nav).getByRole('button',{name:/Church/}));await screen.findByText('Samuel Hale');fireEvent.click(screen.getByRole('button',{name:/Let us record this chapter/}));fireEvent.click(await screen.findByRole('button',{name:'Restore'}));fireEvent.click(screen.getByRole('button',{name:'Confirm restore'}));await screen.findByText('Church checkpoint restored.');expect(screen.queryByLabelText('Last action result')).toBeNull();
 fireEvent.click(within(nav).getByRole('button',{name:/Harbour Master/}));await screen.findByText('Edmund Price');fireEvent.click(screen.getByRole('button',{name:/Have you work for a reliable captain/}));
 vi.spyOn(storage,'saveProfile').mockRejectedValueOnce(new Error('Storage full'));
 fireEvent.click(screen.getByRole('button',{name:'Deliver completed tasks'}));await screen.findByText('Storage full');expect(screen.queryByLabelText('Last action result')).toBeNull();expect(within(nav).getByLabelText('1 ready to deliver')).toBeTruthy();
});
