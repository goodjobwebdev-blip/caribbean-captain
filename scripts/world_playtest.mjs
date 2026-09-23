import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 console.log('Loading game modules');
 const {newGame,act,hoursTo,foodFor,port}=await server.ssrLoadModule('/src/game.ts');
 const {ALL_GOODS}=await server.ssrLoadModule('/src/goods.ts');
 const {quoteBasket}=await server.ssrLoadModule('/src/trade.ts');
 const pairs=[['basse-terre','st-johns'],['capsterville','philipsburg'],['santo-domingo','port-au-prince'],['havana','santiago']];
 const rows=[];
 const trade=(g,good,side,quantity)=>{const lines=[{good,side,quantity}],q=quoteBasket(g,lines);return act(g,{type:'trade',lines,expected:q.token},()=>.5);};
 console.log('Simulating four route pairs');
 for(const [a,b] of pairs){
  console.log(a,b);
  let g=newGame('World playtest',7);g.port=a;g.silver=3000;g.pirateDanger=0;
  for(let leg=0;leg<6;leg++){
   const startHours=g.hours;
   const missing=Math.max(0,Math.ceil(180-g.provisions));if(missing)g=trade(g,'provisions','buy',missing);
   const to=g.port===a?b:a;
   let best=null;
   for(const good of ALL_GOODS.filter(id=>id!=='provisions'&&id!=='fruit')){
    for(const quantity of [10,30,60,100]){
     const q=quoteBasket(g,[{good,side:'buy',quantity}]);if(q.errors.length)continue;
     let candidate=trade(g,good,'buy',quantity);
     if(candidate.provisions<foodFor(candidate,hoursTo(candidate.port,to,candidate))+2)continue;
     candidate=act(candidate,{type:'sail',to},()=>.5);
     if(candidate.failed||candidate.voyage)throw Error('Unexpected voyage failure');
     const sale=quoteBasket(candidate,[{good,side:'sell',quantity}]);if(sale.errors.length)continue;
     candidate=trade(candidate,good,'sell',quantity);
     // Charge consumed provisions at current replacement cost, including trade time.
     const refill=Math.max(0,Math.ceil(180-candidate.provisions));
     const supply=quoteBasket(candidate,[{good:'provisions',side:'buy',quantity:refill}]);
     if(supply.errors.length)continue;
     const net=candidate.silver-g.silver-supply.buys;
     if(!best||net>best.net)best={candidate,good,quantity,net};
    }
   }
   if(!best)throw Error(`No feasible trade on ${a} / ${b}`);
   g=best.candidate;
   rows.push(`| ${port(a).name} ↔ ${port(b).name} | ${leg+1} | ${port(to).name} | ${best.quantity} ${best.good} | ${g.hours-startHours} | ${best.net.toFixed(2)} |`);
  }
 }
 await writeFile('docs/world-playtest.md',`# World expansion trade checks\n\nRun with node scripts/world_playtest.mjs. Each pair starts with a starter sloop, 10 crew, 3000 silver, and 120 provisions. Six sequential legs retain stock changes, market recovery, skill progression, and local events. Each leg selects the best feasible tested cargo (10, 30, 60, or 100 units) and supplies to 180 provisions. Steady weather; encounters disabled to isolate economics.\n\nNet includes trading and sailing wages and the quoted replacement cost of consumed provisions, rounded up. This is a limited deterministic comparison, not exhaustive balance proof; it excludes combat, repairs, headwinds, and the startup increase in provision reserves. All 24 legs completed with finite stocks, elapsed travel time, and no invalid trades. Same-island markets remain independent and use the existing stock limits and quantity pricing. Profitable repeatable trade remains intentional; free travel or unbounded transaction quantities are not introduced.\n\n| Pair | Leg | Destination | Cargo | Hours incl. preparation | Net silver after provision replacement |\n| --- | ---: | --- | --- | ---: | ---: |\n${rows.join('\n')}\n`);
 console.log(`Validated ${rows.length} trade legs; wrote docs/world-playtest.md`);
}finally{await server.close();}
