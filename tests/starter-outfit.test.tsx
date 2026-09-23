import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {act,newGame} from '../src/game';
import {equipment} from '../src/equipment';
import {apparel,type OutfitSlot} from '../src/apparel';
import {Weaver} from '../src/PersonalShops';

it.each([
 ['head','plain-kerchief','sailors-kerchief'],
 ['body','work-shirt','sailors-jacket'],
 ['feet','worn-deck-shoes','deck-shoes'],
] as [OutfitSlot,string,string][])('keeps starter %s clothing accessible after selling an upgrade',(slot,starter,upgrade)=>{
 let g=newGame('Review',1);
 g=act(g,{type:'buy-apparel',id:upgrade});
 g=act(g,{type:'equip-apparel',id:upgrade});
 g=act(g,{type:'unequip-apparel',slot});
 g=act(g,{type:'sell-apparel',id:upgrade});
 expect(equipment(g).wardrobe).toContain(starter);
 expect(equipment(g).outfit?.[slot]).toBeUndefined();
 const html=renderToStaticMarkup(<Weaver game={g} busy={false} perform={()=>{}}/>);
 const card=html.match(/<article class="shop-item">[\s\S]*?<\/article>/g)?.find(article=>article.includes(`<h3>${apparel(starter)!.name}</h3>`));
 expect(card).toBeDefined();
 expect(card).toContain('<button>Equip</button>');
 expect(card).not.toContain('>Buy</button>');
 expect(card).not.toContain('Sell ·');
 g=act(g,{type:'equip-apparel',id:starter});
 expect(equipment(g).outfit?.[slot]).toBe(starter);
});
