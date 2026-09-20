import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {newGame,act,hoursTo,foodFor,shipPurchaseQuote,PORTS}=await server.ssrLoadModule('/src/game.ts');
 const {quoteBasket,aboard}=await server.ssrLoadModule('/src/trade.ts');
 const {ALL_GOODS,CATALOGUE}=await server.ssrLoadModule('/src/goods.ts');
 const {SHIPS,createShip}=await server.ssrLoadModule('/src/ships.ts');
 const {financialSummary}=await server.ssrLoadModule('/src/finance.ts');
 const {accessProblem}=await server.ssrLoadModule('/src/commerce.ts');
 const buy=(good,quantity)=>({good,quantity,side:'buy'}),sell=(good,quantity)=>({good,quantity,side:'sell'});
 const deal=(g,lines)=>act(g,{type:'trade',lines,expected:quoteBasket(g,lines).token},()=>.5);
 const results=[];
 for(const cash of [800,3000])for(const from of PORTS)for(const to of PORTS.filter(p=>p.id!==from.id)){
  const candidates=[];
  for(const good of ALL_GOODS.filter(id=>id!=='provisions')){
   let g=newGame('Balance',7);g.port=from.id;g.silver=cash;g.finances.openingSilver=cash;
   if(accessProblem(g,good)||accessProblem({...g,port:to.id},good))continue;
   let lo=0,hi=1800;
   while(lo<hi){const mid=Math.ceil((lo+hi)/2),q=quoteBasket(g,[buy(good,mid)]);if(q.errors.length||q.finalSilver<100)hi=mid-1;else lo=mid;}
   if(!lo)continue;
   g=deal(g,[buy(good,lo)]);
   if(g.provisions<foodFor(g,hoursTo(from.id,to.id,g))+1)continue;
   g=act(g,{type:'sail',to:to.id},()=>.5);if(g.failed)throw Error(g.failed);
   const sold=Math.floor(aboard(g,good)+1e-8);if(sold<1)continue;
   const q=quoteBasket(g,[sell(good,sold)]);if(q.errors.length)continue;
   g=deal(g,[sell(good,sold)]);
   const net=g.silver-cash-(120-g.provisions)*1.15;
   candidates.push({good:CATALOGUE[good].name,quantity:lo,sold,net:+net.toFixed(2),hours:g.hours-8});
  }
  candidates.sort((a,b)=>b.net-a.net);results.push({cash,from:from.name,to:to.name,best:candidates.slice(0,3)});
 }
 let g=newGame('Repeat route',7),upgradeLeg=null;const legs=[];
 for(let leg=1;leg<=24;leg++){
  const good=g.port==='bridgetown'?'sugar':'coffee',to=g.port==='bridgetown'?'saint-pierre':'bridgetown';
  const food=Math.ceil(Math.max(0,120-g.provisions)),base=food?[buy('provisions',food)]:[];
  let lo=0,hi=1800;while(lo<hi){const n=Math.ceil((lo+hi)/2),q=quoteBasket(g,[...base,buy(good,n)]);if(q.errors.length||q.finalSilver<100)hi=n-1;else lo=n;}
  if(lo===0)throw Error('Route cannot finance a cargo');g=deal(g,[...base,buy(good,lo)]);g=act(g,{type:'sail',to},()=>.5);if(g.failed)throw Error(g.failed);g=deal(g,[sell(good,lo)]);
  if(!upgradeLeg&&g.silver>=shipPurchaseQuote(g,'schooner-merchant').balance+1000)upgradeLeg=leg;
  legs.push({leg,silver:+g.silver.toFixed(2),day:+(g.hours/24).toFixed(2),tradeTier:g.skills.trade?.tier??0,sailingTier:g.skills.sailing.tier});
 }
 const tierCases=[];
 for(const id of ['tartana-merchant','schooner-merchant','fluyt-merchant','merchantman-merchant','galleon-merchant','grand-merchantman-merchant']){
  const spec=SHIPS.find(s=>s.id===id);let captain=newGame('Tier comparison',7);captain.ship=createShip(id);captain.crew=spec.optimalCrew;captain.provisions=spec.optimalCrew*5;captain.economy.lots.provisions=[{quantity:captain.provisions}];captain.port='saint-pierre';captain.silver=spec.price*.3;captain.finances.openingSilver=captain.silver;const opening=captain.silver,foodOpening=captain.provisions;
  let lo=0,hi=1000;while(lo<hi){const n=Math.ceil((lo+hi)/2),quote=quoteBasket(captain,[buy('coffee',n)]);if(quote.errors.length||quote.finalSilver<100)hi=n-1;else lo=n;}
  captain=deal(captain,[buy('coffee',lo)]);captain=act(captain,{type:'sail',to:'bridgetown'},()=>.5);if(captain.failed)throw Error(captain.failed);captain=deal(captain,[sell('coffee',lo)]);
  const cashFlow=captain.silver-opening;if(Math.abs(financialSummary(captain.finances.entries).cashFlow-cashFlow)>1e-6)throw Error('Ledger does not reconcile in tier scenario');
  tierCases.push({tier:spec.tier,ship:spec.label,capital:opening,quantity:lo,net:+(cashFlow-(foodOpening-captain.provisions)*1.15).toFixed(2),hours:captain.hours-8});
 }
 const data={assumptions:'Normal winds, no pirates, starting sloop and crew, 100 silver purchase reserve, finite stocks, real actions and skill/event rules. One-way net values subtract provision consumption at 1.15 silver/unit. Routes use perfect knowledge for balance testing, not player-visible forecasts. Perishable losses are applied by the engine; only remaining whole units are sold, with leftover fractional cargo excluded from net income. Repeated route refills to 120 provisions each departure. Upgrade threshold is Merchant Schooner exchange plus 1000 cash reserve; the simulation keeps the sloop.',routes:results,legs,upgradeLeg,tierCases};
 await writeFile('docs/trade-playtest.json',JSON.stringify(data,null,2)+'\n');
 const rows=results.map(r=>{const b=r.best[0];return `| ${r.cash} | ${r.from} → ${r.to} | ${b?.good??'No viable cargo'} | ${b?.quantity??'—'} | ${b?.net??'—'} | ${b?.hours??'—'} |`;});
 const report=`# Trade engine playtest\n\nRun with \`npm run balance:trade\`. This uses the playable rules, not the earlier analytical model.\n\n${data.assumptions}\n\n## Highest net single-good cargo among tested goods\n\n| Starting silver | Route | Goods | Quantity | Net silver | Hours |\n| ---: | --- | --- | ---: | ---: | ---: |\n${rows.join('\n')}\n\n## Repeated sugar / coffee route\n\n| Leg | Treasury | Game day | Trade tier | Sailing tier |\n| ---: | ---: | ---: | ---: | ---: |\n${legs.filter(x=>x.leg%2===0).map(x=>`| ${x.leg} | ${x.silver} | ${x.day} | ${x.tradeTier} | ${x.sailingTier} |`).join('\n')}\n\nMerchant Schooner exchange plus a 1,000-silver reserve is reached at leg **${upgradeLeg??'not reached in 24 legs'}**. This is a capital threshold, not an automatic purchase.\n\n## Ship-tier comparison\n\nCoffee: Saint-Pierre → Bridgetown; optimal crew, five days of food, capital equal to 30% of ship price, and quantities limited by origin stock, destination storage, capital and ship capacities. Ship purchase costs are excluded. Net includes wages and replacement value of consumed provisions. Each case also verifies cash-ledger reconciliation.\n\n| Tier | Ship | Capital | Coffee | Net silver | Hours |\n| ---: | --- | ---: | ---: | ---: | ---: |\n${tierCases.map(t=>`| ${t.tier} | ${t.ship} | ${t.capital} | ${t.quantity} | ${t.net} | ${t.hours} |`).join('\n')}\n\n## Limits\n\nThis is deterministic economic playtesting, not browser interaction testing or a guarantee of earnings with weather and pirate losses. These tier comparisons cover one route; broader fleet progression and player decision quality need further play sessions. Smuggling is deliberately costly and risky: inspections have 15/36 caught, 15/36 fined and 6/36 undetected outcomes, and are intended as access to restricted goods rather than a superior routine route. Event modifiers are bounded to 0.85–1.25 and leave provisions unchanged.\n`;
 await writeFile('docs/trade-playtest.md',report);console.log(JSON.stringify({upgradeLeg,final:legs.at(-1),routes:results.map(r=>({cash:r.cash,from:r.from,to:r.to,best:r.best[0]}))},null,2));
}finally{await server.close();}
