import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {Shipyard} from '../src/Shipyard';
import {Journal} from '../src/Journal';
import {newGame,act} from '../src/game';
it('renders shipyard offers and the Journal for a purchased configuration',()=>{
 let g=newGame('Mary',42);g.silver=20000;g=act(g,{type:'buy-ship',configurationId:'schooner-universal'});
 const yard=renderToStaticMarkup(<Shipyard game={g} busy={false} perform={()=>{}}/>);
 expect(yard).toContain('Universal Schooner');expect(yard).toContain('28');expect(yard).toContain('id="ship-tier"');expect(yard).toContain('id="ship-class"');expect(yard).toContain('Compare Merchant Fluyt');
 const journal=renderToStaticMarkup(<Journal game={g}/>);
 expect(journal).toContain('Universal Schooner');expect(journal).toContain('1.45 distance units/hour');expect(journal).toContain('110 / 110');expect(journal).toContain('120.0 / 240');expect(journal).toContain('9');expect(journal).toContain('future loading and combat');
 expect(journal).not.toContain('The Wayfarer');
});
it('renders legacy ship records without losing damaged hull information',()=>{
 const g=newGame('Mary',42);g.version=1;delete g.ship;g.condition=43;
 const journal=renderToStaticMarkup(<Journal game={g}/>);
 expect(journal).toContain('The Wayfarer');expect(journal).toContain('43 / 100');expect(journal).toContain('Universal Sloop');
});
