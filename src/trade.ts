import {attitude,reputation,eventFactor,localEvent,accessProblem,smugglerOpen,type Channel,type Commerce,type MarketEvent} from './commerce';
import {ALL_GOODS,CATALOGUE,type GoodId} from './goods';
import type {Game,PortId} from './game';
import {cargoSpaceUsed,loadBreakdown} from './performance';
import {resolveShip,shipDefinition} from './ships';
import {creditTrade,tradeProgress} from './skills';
export type Role='Export'|'Neutral'|'Import';
export type Listing={stock:number;hour:number};
export type Snapshot={event?:MarketEvent|null;channel?:Channel;hour:number;tier:number;goods:Record<GoodId,{stock:number;buy:number;sell:number;role:Role;controlled:boolean;available?:boolean;target?:number;buyFactor?:number;sellFactor?:number}>};
export type Lot={quantity:number;port?:PortId;stock?:number;target?:number;factor?:number;paidPerUnit?:number};
export type Economy={commerce?:Commerce;blackMarkets?:Record<PortId,Record<GoodId,Listing>>;blackMemories?:Partial<Record<PortId,Snapshot>>;markets:Record<PortId,Record<GoodId,Listing>>;memories:Partial<Record<PortId,Snapshot>>;lots:Partial<Record<GoodId,Lot[]>>};
export type BasketLine={good:GoodId;side:'buy'|'sell';quantity:number};
import {PORT_IDS} from './world';
const roles:Record<PortId,{Export:GoodId[];Import:GoodId[]}>= {
 bridgetown:{Export:['sugar','molasses','rum','cotton','salted-fish','hides'],Import:['tools','cloth','timber','medicine','coffee','fine-cloth','iron','paper','books','tea','porcelain']},
 'saint-pierre':{Export:['coffee','cocoa','tobacco','fruit','timber','planks','pitch-and-tar','wine'],Import:['sugar','molasses','cloth','iron','tools','salt','copper','ceramics','glassware','silverware']},
 willemstad:{Export:['cloth','fine-cloth','tools','iron','copper','salt','sailcloth','rope','paper','books','glassware','ceramics','tea','perfume','porcelain','jewelry','silverware','spices'],Import:['coffee','cocoa','tobacco','sugar','molasses','cotton','fruit','hides','timber','planks','grain','salted-meat']},
 "basse-terre":{"Export": ["fruit", "cocoa", "timber", "planks", "rum"], "Import": ["grain", "medicine", "tools", "wine", "cloth"]},
 "capsterville":{"Export": ["sugar", "salted-meat", "salted-fish", "cloth", "gunpowder"], "Import": ["coffee", "cocoa", "tobacco", "cotton", "timber", "pitch-and-tar"]},
 "st-johns":{"Export": ["sailcloth", "tobacco", "rope"], "Import": ["grain", "medicine", "wine", "rum", "tools"]},
 "philipsburg":{"Export": ["cotton", "sailcloth", "salt", "sugar", "rum", "cloth"], "Import": ["grain", "medicine", "wine", "tools", "iron"]},
 "san-juan":{"Export": ["tobacco", "spices", "sailcloth", "rum"], "Import": ["grain", "gunpowder", "medicine", "wine", "tools"]},
 "santo-domingo":{"Export": ["hides", "tobacco", "planks", "salted-meat"], "Import": ["medicine", "wine", "rum", "tools", "iron"]},
 "port-au-prince":{"Export": ["coffee", "hides", "timber", "tobacco"], "Import": ["medicine", "wine", "rum", "cloth", "paper"]},
 "havana":{"Export": ["coffee", "sugar", "cloth", "silverware"], "Import": ["timber", "pitch-and-tar", "cocoa", "hides", "cotton"]},
 "santiago":{"Export": ["tobacco", "hides", "planks", "salted-meat"], "Import": ["gunpowder", "medicine", "wine", "rum", "tools"]},
 "port-royal":{"Export": ["tools", "medicine", "planks", "rum", "rope"], "Import": ["cotton", "hides", "coffee", "cocoa", "sugar", "tobacco"]},
 "tortuga":{"Export": ["tobacco", "fruit", "sugar", "rum", "sailcloth"], "Import": ["grain", "gunpowder", "medicine", "wine", "iron"]},
 "san-jose":{"Export": ["coffee", "cocoa", "pitch-and-tar", "timber"], "Import": ["grain", "gunpowder", "medicine", "wine", "rum", "cloth"]},
};
function defineMarketRule(port:PortId,good:GoodId,channel:Channel){
 const role:Role=roles[port].Export.includes(good)?'Export':roles[port].Import.includes(good)?'Import':'Neutral';
 const normalTarget=good==='provisions'?100000:({Export:4000,Neutral:2000,Import:1000}[role])*(CATALOGUE[good].category==='Luxury'?.02:1);
 const target=normalTarget*(channel==='smuggler'?.05:1);
 return {role,target,max:target*2,tau:good==='provisions'?20:({Export:5,Neutral:7,Import:10}[role]),factor:CATALOGUE[good].base*({Export:.7,Neutral:1,Import:1.4}[role]),controlled:['weapons','gunpowder','cannons','bombs'].includes(good)};
}
// Rules are static: cache them once instead of rebuilding them for every saved listing.
const MARKET_RULES=Object.fromEntries(PORT_IDS.map(p=>[p,Object.fromEntries(ALL_GOODS.map(id=>[id,{
 legal:Object.freeze(defineMarketRule(p,id,'legal')),smuggler:Object.freeze(defineMarketRule(p,id,'smuggler'))
}]))])) as Record<PortId,Record<GoodId,Record<Channel,Readonly<ReturnType<typeof defineMarketRule>>>>>;
export const marketRule=(p:PortId,id:GoodId,channel:Channel='legal')=>MARKET_RULES[p][id][channel==='smuggler'?'smuggler':'legal'];
export const aboard=(g:Game,id:GoodId)=>id==='provisions'?g.provisions:(g.cargo[id]??0);
function setAboard(g:Game,id:GoodId,n:number){if(id==='provisions')g.provisions=n;else g.cargo[id]=n;}
function initialMarket(p:PortId,hour:number,channel:Channel='legal'){
 const market={} as Record<GoodId,Listing>;
 for(const id of ALL_GOODS)market[id]={stock:marketRule(p,id,channel).target,hour};
 return market;
}
export function ensureEconomy(g:Game){
 const fresh=!g.economy;
 g.economy??={markets:{} as Economy['markets'],memories:{},lots:{}};
 const e=g.economy;
 e.commerce??={seed:g.seed,started:g.hours,permits:{},attitude:{},reputation:0,contacts:{}};
 e.blackMemories??={};e.blackMarkets??={} as Economy['markets'];
 // Populate only missing ports; never rewrite saved stocks or observations.
 for(const p of PORT_IDS){
  e.markets[p]??=initialMarket(p,g.hours);
  e.blackMarkets[p]??=initialMarket(p,g.hours,'smuggler');
 }
 if(fresh){
  for(const id of ALL_GOODS)if(aboard(g,id)>0)e.lots[id]=[{quantity:aboard(g,id)}];
  if(!g.voyage)observeMarket(g);
 }
}
export function stockAt(g:Game,id:GoodId,p:PortId=g.port,channel:Channel='legal'){
 const rule=marketRule(p,id,channel),entry=(channel==='legal'?g.economy?.markets:g.economy?.blackMarkets)?.[p]?.[id];
 return entry?rule.target+(entry.stock-rule.target)*Math.exp(-Math.max(0,g.hours-entry.hour)/(24*rule.tau)):rule.target;
}
export const spread=(g:Game,channel:Channel='legal')=>channel==='legal'?Math.max(.05,Math.min(.22,.15-.01*tradeProgress(g.skills).tier-.02*attitude(g)/100-.01*reputation(g)/100)):Math.max(.15,.30-.01*tradeProgress(g.skills).tier-.02*Math.max(0,-reputation(g))/100);
export const reference=(s:number,t:number)=>Math.max(.65,Math.min(1.5,1.4-.4*s/t));
/** Integrate the piecewise linear stock price without iterating through goods. */
export function integral(a:number,b:number,target:number){
 const primitive=(s:number)=>{const k=1.875*target,x=Math.min(s,k);return 1.4*x-.2*x*x/target+Math.max(0,s-k)*.65;};
 return primitive(b)-primitive(a);
}
export function observeMarket(g:Game,channel:Channel='legal'){
 if(g.voyage)return;ensureEconomy(g);
 if(channel==='smuggler'&&(!g.economy!.commerce!.contacts[g.port]||!smugglerOpen(g)))return;
 const snapshot=marketSnapshot(g,channel);
 if(channel==='legal')g.economy!.memories[g.port]=snapshot;else g.economy!.blackMemories![g.port]=snapshot;
}
/** Read-only market observation, also used for encounter intelligence. */
export function marketSnapshot(g:Game,channel:Channel='legal'):Snapshot{
 return {hour:g.hours,tier:tradeProgress(g.skills).tier,event:localEvent(g),channel,goods:Object.fromEntries(ALL_GOODS.map(id=>{const r=marketRule(g.port,id,channel),stock=stockAt(g,id,g.port,channel),factor=r.factor*eventFactor(g,id),buyFactor=factor*(1+spread(g,channel)),sellFactor=factor*(1-spread(g,channel));return [id,{stock,buy:buyFactor*reference(stock,r.target),sell:sellFactor*reference(stock,r.target),role:r.role,controlled:r.controlled,available:!accessProblem(g,id,channel),target:r.target,buyFactor,sellFactor}];})) as Snapshot['goods']};
}
/** FIFO consumption also removes the cost provenance of food eaten at sea or in port. */
export function consumeLots(g:Game,id:GoodId,quantity:number){
 const lots=g.economy?.lots[id];if(!lots)return;
 let remaining=quantity;
 while(remaining>1e-9&&lots.length){const lot=lots[0],take=Math.min(remaining,lot.quantity);lot.quantity-=take;remaining-=take;if(lot.stock!==undefined)lot.stock-=take;if(lot.quantity<1e-9)lots.shift();}
}
function saleLearning(g:Game,id:GoodId,quantity:number,stock:number,factor:number,target:number){
 let offset=0,profit=0;
 for(const lot of g.economy?.lots[id]??[]){const n=Math.min(quantity-offset,lot.quantity);if(n<=0)break;
  if(lot.port&&lot.port!==g.port&&lot.stock!==undefined&&lot.factor!==undefined&&lot.target!==undefined){
   const s=stock+offset,c=lot.stock,t=lot.target,f=lot.factor;
   const cuts=[0,n,1.875*target-s,c-1.875*t].filter(x=>x>=0&&x<=n).sort((a,b)=>a-b);
   const margin=(x:number)=>factor*reference(s+x,target)-f*reference(c-x,t);
   for(let i=1;i<cuts.length;i++){const a=cuts[i-1],b=cuts[i],u=margin(a),v=margin(b);if(u>=0&&v>=0)profit+=(u+v)*(b-a)/2;else if(u>0||v>0)profit+=(b-a)*Math.max(u,v)**2/(2*Math.abs(u-v));}
  }offset+=n;
 }
 return profit/100;
}
export function quoteBasket(original:Game,lines:BasketLine[],channel:Channel='legal'){
 const g=structuredClone(original);ensureEconomy(g);const errors:string[]=[];if(!['legal','smuggler'].includes(channel))errors.push('Unknown market.');
 const quoted:{good:GoodId;side:'buy'|'sell';quantity:number;total:number;stock:number;xp:number}[]=[];
 if(!Array.isArray(lines)||!lines.length||lines.length>ALL_GOODS.length)errors.push('Add goods to your basket.');
 const seen=new Set<string>();let buys=0,sales=0,xp=0;
 for(const line of Array.isArray(lines)?lines:[]){
  if(!line||!ALL_GOODS.includes(line.good)||!['buy','sell'].includes(line.side)||!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>200000||seen.has(line.good)){errors.push('Choose one valid buy or sell quantity per good.');continue;}
  const {good,side,quantity:q}=line;seen.add(good);const r=marketRule(g.port,good,channel),stock=stockAt(g,good,g.port,channel),buy=side==='buy';
  const restriction=accessProblem(g,good,channel);if(restriction)errors.push(`${CATALOGUE[good].name}: ${restriction}`);
  if(buy&&q>stock+1e-8)errors.push(`Not enough ${CATALOGUE[good].name} in stock.`);
  if(!buy&&q>aboard(g,good)+1e-8)errors.push(`Not enough ${CATALOGUE[good].name} aboard.`);
  if(!buy&&stock+q>r.max+1e-8)errors.push(`The market cannot take that much ${CATALOGUE[good].name}.`);
  const factor=r.factor*eventFactor(g,good)*(1+(buy?1:-1)*spread(g,channel));
  const raw=factor*integral(buy?stock-q:stock,buy?stock:stock+q,r.target);
  const total=buy?Math.ceil(raw-1e-9):Math.floor(raw+1e-9);
  const learning=buy?0:saleLearning(g,good,q,stock,factor,r.target);xp+=learning;
  if(buy)buys+=total;else sales+=total;
  setAboard(g,good,aboard(g,good)+(buy?q:-q));quoted.push({...line,total,stock,xp:learning});
 }
 const balance=g.silver+sales-buys,wages=g.crew*2/24,food=(g.crew+g.contracts.filter(c=>c.type==='Passengers').reduce((n,c)=>n+c.amount,0))/24;
 const space=cargoSpaceUsed(g),weight=loadBreakdown(g).total,spec=shipDefinition(resolveShip(g).configurationId);
 if(balance<0)errors.push('Not enough silver for the complete deal.');
 if(space>spec.capacity+1e-8)errors.push('Not enough room in the hold.');
 if(weight>spec.deadweight+1e-8)errors.push('Not enough available deadweight.');
 if(g.provisions+1e-8<food)errors.push('Keep provisions for the hour spent trading.');
 if(g.failed||g.voyage)errors.push('Trading is only available in port.');
 const token=JSON.stringify([original,lines,channel]);
 return {lines:quoted,buys,sales,balance,finalSilver:balance-wages,space,weight,xp,errors,token};
}
export function settleBasket(g:Game,lines:BasketLine[],expected?:string,channel:Channel='legal'){
 const quote=quoteBasket(g,lines,channel);
 if(expected!==undefined&&expected!==quote.token)throw new Error('The deal changed. Review the updated basket.');
 if(quote.errors.length)throw new Error(quote.errors.join(' '));
 ensureEconomy(g);
 for(const line of quote.lines){const {good,side,quantity:q,stock}=line,r=marketRule(g.port,good,channel),buy=side==='buy';
  if(buy){const lots=g.economy!.lots[good]??=[];lots.push({quantity:q,port:g.port,stock,target:r.target,factor:r.factor*eventFactor(g,good)*(1+spread(g,channel)),paidPerUnit:line.total/q});g.economy!.lots[good]=lots;}
  else consumeLots(g,good,q);
  setAboard(g,good,aboard(g,good)+(buy?q:-q));(channel==='legal'?g.economy!.markets:g.economy!.blackMarkets!)[g.port][good]={stock:stock+(buy?-q:q),hour:g.hours};
 }
 g.silver=quote.balance;g.skills=creditTrade(g.skills,quote.xp);return quote;
}

/** Exact allocated silver paid for newer purchases, curve cost for pre-ledger lots. Unknown cost is never zero profit. */
export function cargoCost(g:Game,id:GoodId,quantity=aboard(g,id)){
 let remaining=quantity,known=0,total=0;
 for(const lot of g.economy?.lots[id]??[]){const n=Math.min(remaining,lot.quantity);if(n<=0)break;
  if(lot.paidPerUnit!==undefined){known+=n;total+=lot.paidPerUnit*n;}
  else if(lot.stock!==undefined&&lot.target!==undefined&&lot.factor!==undefined){known+=n;total+=lot.factor*integral(lot.stock-n,lot.stock,lot.target);}
  remaining-=n;
 }
 return {known,unknown:Math.max(0,quantity-known),total,average:known>0?total/known:null};
}
export function rememberedSale(g:Game,id:GoodId,p:PortId,quantity:number,channel:Channel='legal'){
 const snapshot=(channel==='legal'?g.economy?.memories:g.economy?.blackMemories)?.[p],row=snapshot?.goods[id];
 if(!snapshot||!row||row.available===false||row.target===undefined||row.sellFactor===undefined||quantity<1)return null;
 if(quantity>Math.floor(row.target*2-row.stock+1e-8))return null;
 const revenue=Math.floor(row.sellFactor*integral(row.stock,row.stock+quantity,row.target)+1e-9),cost=cargoCost(g,id,quantity);
 return {revenue,profit:cost.unknown<1e-8?revenue-cost.total:null,cost,hour:snapshot.hour};
}
