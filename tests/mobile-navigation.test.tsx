// @vitest-environment happy-dom
import 'fake-indexeddb/auto';
import {afterEach,expect,it} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {App} from '../src/main';
import {profiles} from '../src/storage';
afterEach(cleanup);
it('focuses saved story outcomes and returns from cancelled departure to its trigger',async()=>{
 render(<App/>);
 const create=screen.getByRole('button',{name:'Create captain'});await waitFor(()=>expect(create.hasAttribute('disabled')).toBe(false));
 fireEvent.change(screen.getByLabelText('Captain’s name'),{target:{value:'Narrow navigation test'}});fireEvent.click(create);
 fireEvent.click(await screen.findByRole('button',{name:'Back to harbour'}));
 fireEvent.click(await screen.findByRole('button',{name:'Choose: Move the merchant’s sugar'}));
 const outcome=await screen.findByRole('status',{name:'Harbour story outcome'});await waitFor(()=>expect(document.activeElement).toBe(outcome));
 const before=(await profiles()).find(p=>p.name==='Narrow navigation test')!.game;
 const chart=screen.getByRole('button',{name:'Chart Saint-Pierre'});chart.focus();fireEvent.click(chart);
 const departure=await screen.findByLabelText('Departure review');await waitFor(()=>expect(document.activeElement).toBe(departure));
 fireEvent.click(screen.getByRole('button',{name:'Stay in port'}));await waitFor(()=>expect(document.activeElement).toBe(chart));
 expect(screen.queryByLabelText('Departure review')).toBeNull();
 const after=(await profiles()).find(p=>p.name==='Narrow navigation test')!.game;
 expect(after.hours).toBe(before.hours);expect(after.silver).toBe(before.silver);expect(after.provisions).toBe(before.provisions);expect(after.voyage).toBeNull();
 // Opening the same route again must still move focus to the review.
 fireEvent.click(chart);await waitFor(()=>expect(document.activeElement).toBe(screen.getByLabelText('Departure review')));
 fireEvent.click(screen.getByRole('button',{name:'Confirm departure'}));
 await waitFor(()=>expect(screen.queryByLabelText('Departure review')).toBeNull());
 await waitFor(()=>expect(document.activeElement).toBe(screen.getByRole('region',{name:'Current scene'})));
});
