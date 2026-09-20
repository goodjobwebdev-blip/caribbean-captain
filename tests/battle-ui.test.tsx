import {it,expect} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {BattlePanel} from '../src/BattlePanel';
import {newGame} from '../src/game';
import {generateNpc,beginEncounter} from '../src/battle/encounter';
import {createBattle} from '../src/battle/naval';
import {enterBoarding} from '../src/battle/boarding';
it('renders the encounter and every battle stage with model suspension and explicit capture boundary',()=>{
 const g=newGame('Anne',42),npc=generateNpc(g);beginEncounter(g,npc);
 const render=()=>renderToStaticMarkup(<BattlePanel game={g} busy={false} apiKey="" model="" onAction={async()=>{}} onSettings={()=>{}}/>);
 expect(render()).toContain(npc.faction);g.battle=createBattle(g,npc);expect(render()).toContain('Naval Engagement');expect(render()).toContain('Projected course');
 g.battle.status='waiting';expect(render()).toContain('Combat is suspended');expect(render()).toContain('Change Model');
 enterBoarding(g.battle,g.battle.playerId);expect(render()).toContain('Deck Battle');g.battle.phase='duel';g.battle.duel={initiative:g.battle.npcId,exchange:3,control:-1,firstRoll:true,demandedAt:[],npcAttack:'pistol'};g.battle.status='planning';const duel=render();expect(duel).toContain('Captain Duel');expect(duel).toContain('dodge');expect(duel).not.toContain('>block<');
 g.battle.phase='capture';g.battle.status='finished';expect(render()).toContain('Confirm settlement');
});
