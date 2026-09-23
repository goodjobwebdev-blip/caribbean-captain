// @vitest-environment happy-dom
import {afterEach,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,cleanup,waitFor,act} from '@testing-library/react';
import {NpcDialogue} from '../src/NpcDialogue';
import {newGame} from '../src/game';
import {visitNpc} from '../src/npcs';
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.useRealTimers();});
const props=()=>({game:visitNpc(newGame('Anne',2),'Store'),place:'Store' as const,topic:null as string|null,reaction:false,busy:false,enabled:true,apiKey:'fake-key',model:'fake-model',onTopic:vi.fn(),onHarbour:vi.fn()});
it('keeps choices usable while generating, cancels obsolete requests, and ignores stale responses',async()=>{
 const pending:{resolve:(value:unknown)=>void;signal:AbortSignal}[]=[];
 vi.stubGlobal('fetch',vi.fn((_url,options)=>new Promise(resolve=>pending.push({resolve,signal:options.signal}))));
 const p=props(),view=render(<NpcDialogue {...p}/>);expect(screen.getByText('Elias Ward')).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:/Let me see your wares/}));expect(p.onTopic).toHaveBeenCalledWith('trade');
 view.rerender(<NpcDialogue {...p} topic="trade"/>);expect(pending[0].signal.aborted).toBe(true);
 await act(async()=>pending[1].resolve({ok:true,json:async()=>({choices:[{message:{content:'Fresh service response.'}}]})}));
 expect(screen.getByText('Fresh service response.')).toBeTruthy();
 await act(async()=>pending[0].resolve({ok:true,json:async()=>({choices:[{message:{content:'Obsolete greeting.'}}]})}));
 expect(screen.queryByText('Obsolete greeting.')).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Back to harbour'}));expect(p.onHarbour).toHaveBeenCalledOnce();
});
it('falls back on errors and timeouts and makes no request when disabled',async()=>{
 const fetchMock=vi.fn().mockRejectedValue(new Error('offline'));vi.stubGlobal('fetch',fetchMock);
 const p=props(),view=render(<NpcDialogue {...p}/>);await waitFor(()=>expect(screen.getByText('Using written dialogue')).toBeTruthy());
 expect(screen.getByRole('button',{name:/Let me see your wares/}).hasAttribute('disabled')).toBe(false);
 view.unmount();fetchMock.mockClear();render(<NpcDialogue {...p} enabled={false}/>);expect(fetchMock).not.toHaveBeenCalled();cleanup();
 vi.useFakeTimers();fetchMock.mockImplementation(()=>new Promise(()=>{}));render(<NpcDialogue {...p}/>);
 await act(async()=>{vi.advanceTimersByTime(12001);});expect(screen.getByText('Using written dialogue')).toBeTruthy();expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
});
it('reuses identical context during a visit and only offers real placeholder actions',async()=>{
 const fetchMock=vi.fn().mockResolvedValue({ok:true,json:async()=>({choices:[{message:{content:'Good day, Captain.'}}]})});vi.stubGlobal('fetch',fetchMock);
 const p=props(),view=render(<NpcDialogue {...p}/>);await screen.findByText('Good day, Captain.');
 view.rerender(<NpcDialogue {...p} topic="trade"/>);await waitFor(()=>expect(fetchMock).toHaveBeenCalledTimes(2));await waitFor(()=>expect(screen.queryByText('Listening…')).toBeNull());
 view.rerender(<NpcDialogue {...p}/>);expect(fetchMock).toHaveBeenCalledTimes(2);
 view.rerender(<NpcDialogue {...p} place="Bank" enabled={false}/>);expect(screen.queryByRole('button',{name:/Let me see/})).toBeNull();expect(screen.getByText(/not receiving business/)).toBeTruthy();
});
