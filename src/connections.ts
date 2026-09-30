import type {Game} from './game';
import {foodFor,wageFor} from './game';
import {PORTS,port,type PortId} from './world';
import type {HarbourChoiceId,HarbourStoryMemory} from './adventures';
import {ensureEconomy,consumeLots} from './trade';
import {ensureCrew} from './crew';
import {attitude,reputation,changeStanding} from './commerce';
import {record,recordConsumption} from './finance';

export type ConnectionStage='offer'|'crossroads'|'settlement';
export type ConnectionChoice='accept'|'witness'|'bargain'|'deliver';
export type ConnectionAction={type:'connection';id:string;stage:ConnectionStage;port:PortId;choice:ConnectionChoice;expected:string};
export type ConnectionMemory={speaker:string;text:string};
export type ConnectionsState={
 version:1;id:string;source:PortId;originChoice:HarbourChoiceId;originCompletedAt:number;
 route:[PortId,PortId,PortId];stage:'crossroads'|'settlement'|'complete';acceptedAt:number;
 midpoint?:{choice:'witness'|'bargain';completedAt:number};completedAt?:number;
 memory:ConnectionMemory[];outcome:string;
};
type ConnectionGame=Game&{connections?:ConnectionsState};
export type ConnectionObjective={destination:PortId;title:string;detail:string};
export type ConnectionQuote={action:ConnectionAction;started:number;hours:number;wages:number;provisions:number;supplies:number;fee:number;reward:number;morale:number;attitude:number;reputation:number;errors:string[]};
export type ConnectionView={id:string;title:string;status:'offer'|'travel'|'scene'|'complete';chapter:1|2|3;scene:string|null;contact:{name:string;role:string};rival:{name:string;role:string};objective:ConnectionObjective|null;memory:ConnectionMemory[];options:{id:ConnectionChoice;label:string;description:string;action:ConnectionAction;quote:ConnectionQuote}[];outcome?:string};
type Context={id:string;source:PortId;originChoice:HarbourChoiceId;originCompletedAt:number;route:[PortId,PortId,PortId];stage:ConnectionStage;midpoint?:'witness'|'bargain'};
type Terms={choice:ConnectionChoice;label:string;description:string;hours:number;fee:number;reward:number;supplies:number;morale:number;attitude:number;reputation:number};
const CONTACT={name:'Inés Duarte',role:'Independent shipping agent'};
const RIVAL={name:'Captain Silas Rook',role:'A rival with a duplicate receipt'};
const TITLE='The Lantern Ledger';
const EPSILON=1e-8;
const isPort=(id:unknown):id is PortId=>PORTS.some(p=>p.id===id);
const distance=(a:PortId,b:PortId)=>Math.hypot(port(a).x-port(b).x,port(a).y-port(b).y);

/** Fixed nearby legs make every starting harbour usable without consuming travel RNG. */
function routeFor(source:PortId):[PortId,PortId,PortId]{
 const nearest=(from:PortId,excluded:PortId[])=>PORTS.filter(p=>!excluded.includes(p.id)).sort((a,b)=>distance(from,a.id)-distance(from,b.id)||(a.id<b.id?-1:1))[0].id;
 const second=nearest(source,[source]);return [source,second,nearest(second,[source,second])];
}
const identifier=(source:PortId,memory:Pick<HarbourStoryMemory,'completedAt'>)=>`lantern-ledger:${source}:${memory.completedAt}`;
function validOrigin(memory:HarbourStoryMemory|undefined,hours:number):memory is HarbourStoryMemory{
 return !!memory&&['aid','paid'].includes(memory.choice)&&Number.isFinite(memory.completedAt)&&memory.completedAt>=0&&memory.completedAt<=hours;
}
/** Bad or newer state is never silently reset into a farmable fresh offer. */
function validState(g:ConnectionGame,s:ConnectionsState):boolean{
 if(!s||s.version!==1||!isPort(s.source)||!validOrigin({choice:s.originChoice,completedAt:s.originCompletedAt},g.hours))return false;
 if(s.id!==identifier(s.source,{completedAt:s.originCompletedAt})||!Array.isArray(s.route)||JSON.stringify(s.route)!==JSON.stringify(routeFor(s.source)))return false;
 if(!['crossroads','settlement','complete'].includes(s.stage)||!Number.isFinite(s.acceptedAt)||s.acceptedAt<s.originCompletedAt||s.acceptedAt>g.hours)return false;
 if(!Array.isArray(s.memory)||s.memory.length>6||s.memory.some(m=>!m||typeof m.speaker!=='string'||typeof m.text!=='string')||typeof s.outcome!=='string')return false;
 if(s.stage==='crossroads')return !s.midpoint&&s.completedAt===undefined;
 if(!s.midpoint||!['witness','bargain'].includes(s.midpoint.choice)||!Number.isFinite(s.midpoint.completedAt)||s.midpoint.completedAt<s.acceptedAt||s.midpoint.completedAt>g.hours)return false;
 return s.stage==='settlement'?s.completedAt===undefined:Number.isFinite(s.completedAt)&&s.completedAt!>=s.midpoint.completedAt&&s.completedAt!<=g.hours;
}
function context(g:ConnectionGame):Context|null{
 const s=g.connections;
 if(s!==undefined){if(!validState(g,s)||s.stage==='complete')return null;return {...s,stage:s.stage,midpoint:s.midpoint?.choice};}
 const memory=g.harbourStories?.[g.port];if(!validOrigin(memory,g.hours))return null;
 return {id:identifier(g.port,memory),source:g.port,originChoice:memory.choice,originCompletedAt:memory.completedAt,route:routeFor(g.port),stage:'offer'};
}
function destination(c:Context):PortId{return c.route[c.stage==='offer'?0:c.stage==='crossroads'?1:2];}
function terms(c:Context):Terms[]{
 const base={fee:0,reward:0,supplies:0,morale:0,attitude:0,reputation:0};
 if(c.stage==='offer')return [{...base,choice:'accept',label:'Accept Inés’s introduction',description:`Spend an hour checking the disputed receipt, then meet Inés in ${port(c.route[1]).name}. You may sail there whenever you are ready.`,hours:1}];
 if(c.stage==='crossroads')return [
  {...base,choice:'witness',label:'Stand by the quay workers',description:'Help the witnesses copy their unloading tally and share provisions while they work. Keep an independent account of what happened.',hours:4,supplies:c.originChoice==='aid'?2:4,morale:2},
  {...base,choice:'bargain',label:'Buy Rook’s authenticated copy',description:'Pay for Rook’s certified duplicate and let him keep his commercial claim. Settle the dispute through a bargain.',hours:1,fee:c.originChoice==='aid'?24:36},
 ];
 const witness=c.midpoint==='witness',aid=c.originChoice==='aid';
 return [{...base,choice:'deliver',label:witness?'Present the workers’ tally':'Present the certified duplicate',description:witness?'Give Inés the independent account and receive the quay association’s agreed payment.':'Give Inés Rook’s certified copy and receive the factors’ agreed settlement.',hours:2,reward:witness?(aid?210:170):(aid?260:300),morale:witness?4:1,attitude:witness?3:1,reputation:witness?2:0}];
}
function token(g:ConnectionGame,c:Context):string{
 const rounded=(n:number)=>Math.round(n*1e8)/1e8;
 return JSON.stringify([c.id,c.stage,g.port,rounded(g.hours),rounded(g.silver),rounded(g.provisions),g.crew,g.contracts.filter(k=>k.type==='Passengers').map(k=>[k.id,k.amount]),g.connections??null,g.harbourStories?.[c.source]??null]);
}
function actionFor(g:ConnectionGame,c:Context,choice:ConnectionChoice):ConnectionAction{return {type:'connection',id:c.id,stage:c.stage,port:g.port,choice,expected:token(g,c)};}
function capGain(current:number,gain:number,max=100){return Math.max(0,Math.min(gain,max-current));}

/** Read-only and canonical: clients submit identity/choice, never prices or rewards. */
export function connectionQuote(g:ConnectionGame,action:ConnectionAction):ConnectionQuote{
 const c=context(g),errors:string[]=[];
 const picked=c?terms(c).find(t=>t.choice===action?.choice):undefined;
 if(!action||action.type!=='connection'||!picked)errors.push('Choose one of the offered journey actions.');
 if(!c)errors.push(g.connections?.stage==='complete'?'This journey is already complete.':'No connected journey is available here.');
 if(g.failed||g.voyage||g.battle)errors.push('Connected journeys are only available while safely in port.');
 if(c&&(action?.id!==c.id||action?.stage!==c.stage))errors.push('This journey has moved on. Review its current chapter.');
 if(c&&(action?.port!==g.port||g.port!==destination(c)))errors.push('Travel to the current chapter’s port first.');
 if(c&&action?.expected!==token(g,c))errors.push('The journey terms changed. Review the current choice.');
 const hours=picked?.hours??0,wages=wageFor(g,hours),supplies=picked?.supplies??0,provisions=foodFor(g,hours)+supplies,fee=picked?.fee??0;
 if(!Number.isFinite(g.silver)||g.silver+EPSILON<fee+wages)errors.push(`Keep ${(fee+wages).toFixed(2)} silver for this choice’s fee and crew wages.`);
 if(!Number.isFinite(g.provisions)||g.provisions+EPSILON<provisions)errors.push(`Keep ${provisions.toFixed(2)} provisions for upkeep and the chosen work.`);
 return {action,started:g.hours,hours,wages,provisions,supplies,fee,reward:picked?.reward??0,morale:capGain(g.crewState?.morale??50,picked?.morale??0),attitude:capGain(attitude(g),picked?.attitude??0),reputation:capGain(reputation(g),picked?.reputation??0),errors};
}

export function connectionObjective(g:ConnectionGame):ConnectionObjective|null{
 const c=context(g);if(!c||c.stage==='offer')return null;
 const next=destination(c),name=port(next).name;
 return {destination:next,title:c.stage==='crossroads'?`Meet Inés in ${name}`:`Bring the account to ${name}`,detail:c.stage==='crossroads'?`Inés Duarte is waiting on the quay in ${name}. Follow up on the receipt you accepted in ${port(c.source).name}.`:`Inés Duarte will settle the account on the quay in ${name}. Your ${c.midpoint==='witness'?'workers’ tally':'certified duplicate'} is ready.`};
}
function openingMemory(c:Context):ConnectionMemory{
 return {speaker:CONTACT.name,text:c.originChoice==='aid'?`You helped the ordinary harbour folk in ${port(c.source).name}. Inés remembers that you stayed for them.`:`You took the paid work in ${port(c.source).name}. Inés remembers a captain who honours a commercial agreement.`};
}
function scene(c:Context):string{
 const source=port(c.source).name;
 if(c.stage==='offer')return `Inés Duarte stops beside your boat. “${c.originChoice==='aid'?'The quay folk told me who stayed to help. I could use a captain they trust.':'The factor says you delivered exactly what you promised. I need that kind of captain.'} A relief lighter’s unloading receipt has been entered twice. Captain Silas Rook holds the duplicate and says the quay workers still owe his factors. Meet me in ${port(c.route[1]).name}; we can hear both accounts together.”`;
 if(c.stage==='crossroads')return `Inés meets you beside the tally shed. Captain Silas Rook is already there, one hand on a certified receipt. “${c.originChoice==='aid'?'Your friends in '+source+' speak well of you. I can lower my copying fee, but I will not surrender my claim for nothing.':'You know the value of paid work, Captain. My authenticated copy has its price.'}” The quay workers say the lighter was unloaded only once. ${c.originChoice==='aid'?'They remember your help and have gathered half the provisions needed to stay and copy their tally.':'They will open their tally if your crew helps with the copying and shares four provisions.'} Inés waits for your decision: preserve the workers’ independent account, or buy Rook’s certified duplicate.`;
 return c.midpoint==='witness'?`Inés spreads the workers’ tally across the quay office desk. “You gave them time to be heard${c.originChoice==='aid'?', just as you did in '+source:`, though you first came to us as a hired captain from ${source}`}. Their figures show one unloading, not two.” Rook arrives to find his duplicate claim challenged by named witnesses. The quay association is ready to settle your fee when you present the tally.`:`Inés sets a factors’ purse beside the quay office ledger. “Rook’s certified duplicate lets us close the account${c.originChoice==='paid'?'. Your businesslike approach in '+source+' helped secure a better settlement':', though the quay workers had hoped you would stand with them again after '+source}.” Rook tips his hat. “A captain who keeps a bargain. I will remember that.” Present the copy to collect the agreed fee.`;
}

/** Future scenes and choice terms never enter the view before their destination is reached. */
export function connectionsView(g:ConnectionGame):ConnectionView|null{
 if(g.connections!==undefined&&!validState(g,g.connections))return null;
 const s=g.connections;
 if(s?.stage==='complete')return {id:s.id,title:TITLE,status:'complete',chapter:3,scene:null,contact:{...CONTACT},rival:{...RIVAL},objective:null,memory:structuredClone(s.memory),options:[],outcome:s.outcome};
 const c=context(g);if(!c)return null;
 const reached=g.port===destination(c)&&!g.voyage&&!g.battle&&!g.failed;
 const objective=c.stage==='offer'?{destination:g.port,title:'Speak with Inés Duarte',detail:'An introduction is available after your harbour work. Accept when you are ready.'}:connectionObjective(g);
 return {id:c.id,title:TITLE,status:c.stage==='offer'?'offer':reached?'scene':'travel',chapter:c.stage==='offer'?1:c.stage==='crossroads'?2:3,scene:reached?scene(c):null,contact:{...CONTACT},rival:{...RIVAL},objective,memory:s?structuredClone(s.memory):[openingMemory(c)],options:reached?terms(c).map(t=>{const action=actionFor(g,c,t.choice);return {id:t.choice,label:t.label,description:t.description,action,quote:connectionQuote(g,action)};}):[],...(s?{outcome:s.outcome}:{})};
}

/** Called only on the reducer clone after normal advance() charged time, food and wages. */
export function completeConnection(g:ConnectionGame,quote:ConnectionQuote):string{
 const c=context(g),picked=c?terms(c).find(t=>t.choice===quote?.action?.choice):undefined;
 if(!c||!picked||g.failed||g.voyage||g.battle||destination(c)!==g.port)throw Error('This journey can no longer be completed.');
 // Rebuild the pre-upkeep quote. Nothing in a caller-supplied reward/fee field is trusted.
 const before={...g,hours:g.hours-picked.hours,silver:g.silver+wageFor(g,picked.hours),provisions:g.provisions+foodFor(g,picked.hours)};
 const checked=connectionQuote(before,quote.action);
 if(quote.errors.length||checked.errors.length||quote.started!==before.hours)throw Error('This journey can no longer be completed. Review its current chapter.');
 if(g.provisions+EPSILON<picked.supplies||g.silver+EPSILON<picked.fee)throw Error('Not enough stores or silver to complete this choice.');
 ensureEconomy(g);
 if(picked.supplies){recordConsumption(g,'provisions-used','provisions',picked.supplies);consumeLots(g,'provisions',picked.supplies);g.provisions=Math.max(0,g.provisions-picked.supplies);}
 if(picked.fee){g.silver-=picked.fee;record(g,'quest',-picked.fee);}
 if(picked.reward){g.silver+=picked.reward;record(g,'quest',picked.reward);}
 if(picked.morale){const crew=ensureCrew(g);crew.morale=Math.min(100,crew.morale+picked.morale);}
 changeStanding(g,picked.attitude,picked.reputation);
 let outcome:string;
 if(c.stage==='offer'){
  outcome=`You accepted Inés Duarte’s introduction. Meet her on the quay in ${port(c.route[1]).name}; the disputed receipt stays safely in your papers.`;
  g.connections={version:1,id:c.id,source:c.source,originChoice:c.originChoice,originCompletedAt:c.originCompletedAt,route:[...c.route],stage:'crossroads',acceptedAt:g.hours,memory:[openingMemory(c),{speaker:CONTACT.name,text:`Inés entrusted you with the receipt and arranged a meeting in ${port(c.route[1]).name}.`}],outcome};
 }else if(c.stage==='crossroads'){
  const s=g.connections!,witness=picked.choice==='witness';
  outcome=witness?`You shared ${picked.supplies} provisions and helped the quay workers copy their tally. Inés thanks you for hearing them; Rook remembers that you challenged his claim. Bring the tally to ${port(c.route[2]).name}.`:`You paid ${picked.fee} silver for Rook’s authenticated duplicate. He remembers that you kept his bargain; Inés accepts the commercial route. Bring the copy to ${port(c.route[2]).name}.`;
  s.midpoint={choice:witness?'witness':'bargain',completedAt:g.hours};s.stage='settlement';s.outcome=outcome;
  s.memory.push({speaker:CONTACT.name,text:witness?'Inés remembers that you stood beside the quay workers.':'Inés remembers that you chose a negotiated settlement.'},{speaker:RIVAL.name,text:witness?'Rook remembers the captain who challenged his duplicate claim.':'Rook remembers the captain who paid fairly for his copy.'});
 }else{
  const s=g.connections!,witness=c.midpoint==='witness';
  outcome=witness?`The independent tally settles the double entry. Inés pays ${picked.reward} silver for your work; the quay association welcomes your ship. Rook withdraws his claim, remembering who stood against it.`:`The certified duplicate closes the factors’ account. Inés pays ${picked.reward} silver for your work. Rook calls you a reliable business partner; the quay workers remember that their own tally went unheard.`;
  s.stage='complete';s.completedAt=g.hours;s.outcome=outcome;s.memory.push({speaker:CONTACT.name,text:`The Lantern Ledger is settled in ${port(g.port).name}. ${witness?'Your independent testimony restored the workers’ standing.':'Your commercial bargain preserved Rook’s claim.'}`});
 }
 return outcome;
}
