import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {newGame} from '../src/game';
import {SkillCards,SKILL_DEFINITIONS} from '../src/SkillCards';
import {PLAYER_SKILLS} from '../src/skills';

it('defines and renders a complete information card for every player skill',()=>{
 const ids=SKILL_DEFINITIONS.map(skill=>skill.id);
 expect(ids).toEqual([...PLAYER_SKILLS]);
 expect(new Set(ids).size).toBe(24);
 const html=renderToStaticMarkup(<SkillCards game={newGame('Anne',42)}/>);
 for(const skill of SKILL_DEFINITIONS){
  expect(html).toContain(`data-skill="${skill.id}"`);
  expect(html).toContain(skill.name.replace('&','&amp;'));
 }
 expect(html.match(/<h3>Books/g)).toHaveLength(24);
 expect(html.match(/<h3>Planned quests/g)).toHaveLength(24);
 expect(html.match(/QUEST TBD/g)).toHaveLength(24);
 expect(html).toContain('0 / 24 sailing hours');
 expect(html).toContain('Letter delivery commissions award points');
 expect(html).toContain('Book names, rarity, required level');
});
