import {hoursTo,effectiveSpeed,type Game} from '../src/game';
import {beginAccount,finishAccounting} from '../src/finance';
/** Explicit pre-upgrade save fixture: new voyages no longer generate prototype pirate events. */
export function legacyVoyage(source:Game,factor=1):Game{
 const g=structuredClone(source),hours=Math.ceil(hoursTo(g.port,'saint-pierre',g)*factor);
 beginAccount(g,'saint-pierre');g.voyage={to:'saint-pierre',hours,remaining:hours,departureSpeed:effectiveSpeed(g),weather:factor>1?'Headwinds':factor<1?'Fair winds':'Steady winds',dice:[1,1]};
 g.lastRoll={label:'Voyage encounter',dice:[1,1],outcome:'Pirates sighted'};finishAccounting(g);return g;
}
