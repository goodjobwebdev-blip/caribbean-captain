import {ALL_GOODS,CATALOGUE,type GoodId} from './goods';
import type {Game,PortId} from './game';
import {cargoSpaceUsed,loadBreakdown} from './performance';
import {resolveShip,shipDefinition} from './ships';
import {creditTrade,tradeProgress} from './skills';
export type Role='Export'|'Neutral'|'Import';
export type Listing={stock:number;hour:number};
export type Snapshot={hour:number;tier:number;goods:Record<GoodId,{stock:number;buy:number;sell:number;role:Role;controlled:boolean}>};
export type Lot={quantity:number;port?:PortId;stock?:number;target?:number;factor?:number};
export type Economy={markets:Record<PortId,Record<GoodId,Listing>>;memories:Partial<Record<PortId,Snapshot>>;lots:Partial<Record<GoodId,Lot[]>>};
export type BasketLine={good:GoodId;side:'buy'|'sell';quantity:number};
const PORT_IDS:PortId[]=['bridgetown','saint-pierre','willemstad'];
const roles:Record<PortId,{Export:string[];Import:string[]}>= {
 bridgetown:{Export:['sugar','molasses','rum','cotton','salted-fish','hides'],Import:['tools','cloth','timber','medicine','coffee','fine-cloth','iron','paper','books','tea','porcelain']},
 'saint-pierre':{Export:['coffee','cocoa','tobacco','fruit','timber','planks','pitch-and-tar','wine'],Import:['sugar','molasses','cloth','iron','tools','salt','copper','ceramics','glassware','silverware']},
 willemstad:{Export:['cloth','fine-cloth','tools','iron','copper','salt','sailcloth','rope','paper','books','glassware','ceramics','tea','perfume','porcelain','jewelry','silverware','spices'],Import:['coffee','cocoa','tobacco','sugar','molasses','cotton','fruit','hides','timber','planks','grain','salted-meat']},
};
export function marketRule(port:PortId,good:GoodId){
 const role:Role=roles[port].Export.includes(good)?'Export':roles[port].Import.includes(good)?'Import':'Neutral';
 const target=good==='provisions'?100000:({Export:4000,Neutral:2000,Import:1000}[role])*(CATALOGUE[good].category==='Luxury'?.02:1);
 return {role,target,max:target*2,tau:good==='provisions'?20:({Export:5,Neutral:7,Import:10}[role]),factor:CATALOGUE[good].base*({Export:.7,Neutral:1,Import:1.4}[role]),controlled:['weapons','gunpowder','cannons','bombs'].includes(good)};
}
export const aboard=(g:Game,id:GoodId)=>id==='provisions'?g.provisions:(g.cargo[id]??0);
function setAboard(g:Game,id:GoodId,n:number){if(id==='provisions')g.provisions=n;else g.cargo[id]=n;}
export function ensureEconomy(g:Game){
 if(g.economy)return;
 const markets=Object.fromEntries(PORT_IDS.map(p=>[p,Object.fromEntries(ALL_GOODS.map(id=>[id,{stock:marketRule(p,id).target,hour:g.hours}]))])) as Economy['markets'];
 g.economy={markets,memories:{},lots:{}};
 for(const id of ALL_GOODS)if(aboard(g,id)>0)g.economy.lots[id]=[{quantity:aboard(g,id)}];
 if(!g.voyage)observeMarket(g);
}
export function stockAt(g:Game,id:GoodId,p:PortId=g.port){
 const rule=marketRule(p,id),entry=g.economy?.markets[p][id];
 return entry?rule.target+(entry.stock-rule.target)*Math.exp(-Math.max(0,g.hours-entry.hour)/(24*rule.tau)):rule.target;
}
export const spread=(g:Game)=>Math.max(.05,.15-.01*tradeProgress(g.skills).tier);
export const reference=(s:number,t:number)=>Math.max(.65,Math.min(1.5,1.4-.4*s/t));
/** Integrate the piecewise linear stock price without iterating through goods. */
export function integral(a:number,b:number,target:number){
 const primitive=(s:number)=>{const k=1.875*target,x=Math.min(s,k);return 1.4*x-.2*x*x/target+Math.max(0,s-k)*.65;};
 return primitive(b)-primitive(a);
}
export function observeMarket(g:Game){
 if(g.voyage)return;ensureEconomy(g);
 g.economy!.memories[g.port]={hour:g.hours,tier:tradeProgress(g.skills).tier,goods:Object.fromEntries(ALL_GOODS.map(id=>{const r=marketRule(g.port,id),stock=stockAt(g,id),price=r.factor*reference(stock,r.target);return [id,{stock,buy:price*(1+spread(g)),sell:price*(1-spread(g)),role:r.role,controlled:r.controlled}];})) as Snapshot['goods']};
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
export function quoteBasket(original:Game,lines:BasketLine[]){
 const g=structuredClone(original);ensureEconomy(g);const errors:string[]=[];
 const quoted:{good:GoodId;side:'buy'|'sell';quantity:number;total:number;stock:number;xp:number}[]=[];
 if(!Array.isArray(lines)||!lines.length||lines.length>ALL_GOODS.length)errors.push('Add goods to your basket.');
 const seen=new Set<string>();let buys=0,sales=0,xp=0;
 for(const line of Array.isArray(lines)?lines:[]){
  if(!line||!ALL_GOODS.includes(line.good)||!['buy','sell'].includes(line.side)||!Number.isSafeInteger(line.quantity)||line.quantity<1||line.quantity>200000||seen.has(line.good)){errors.push('Choose one valid buy or sell quantity per good.');continue;}
  const {good,side,quantity:q}=line;seen.add(good);const r=marketRule(g.port,good),stock=stockAt(g,good),buy=side==='buy';
  if(r.controlled)errors.push(`${CATALOGUE[good].name} is controlled; legal access is not yet available.`);
  if(buy&&q>stock+1e-8)errors.push(`Not enough ${CATALOGUE[good].name} in stock.`);
  if(!buy&&q>aboard(g,good)+1e-8)errors.push(`Not enough ${CATALOGUE[good].name} aboard.`);
  if(!buy&&stock+q>r.max+1e-8)errors.push(`The market cannot take that much ${CATALOGUE[good].name}.`);
  const factor=r.factor*(1+(buy?1:-1)*spread(g));
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
 const token=JSON.stringify([original,lines]);
 return {lines:quoted,buys,sales,balance,finalSilver:balance-wages,space,weight,xp,errors,token};
}
export function settleBasket(g:Game,lines:BasketLine[],expected?:string){
 const quote=quoteBasket(g,lines);
 if(expected!==undefined&&expected!==quote.token)throw new Error('The deal changed. Review the updated basket.');
 if(quote.errors.length)throw new Error(quote.errors.join(' '));
 ensureEconomy(g);
 for(const line of quote.lines){const {good,side,quantity:q,stock}=line,r=marketRule(g.port,good),buy=side==='buy';
  if(buy){const lots=g.economy!.lots[good]??=[];lots.push({quantity:q,port:g.port,stock,target:r.target,factor:r.factor*(1+spread(g))});g.economy!.lots[good]=lots;}
  else consumeLots(g,good,q);
  setAboard(g,good,aboard(g,good)+(buy?q:-q));g.economy!.markets[g.port][good]={stock:stock+(buy?-q:q),hour:g.hours};
 }
 g.silver=quote.balance;g.skills=creditTrade(g.skills,quote.xp);return quote;
}
