import {expect,it} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import {BuildingPlaceholder,PLANNED_BUILDINGS} from '../src/buildings';

it('renders every planned building as a non-actionable TBD preview',()=>{
 expect(PLANNED_BUILDINGS).toHaveLength(9);
 for(const building of PLANNED_BUILDINGS){
  const html=renderToStaticMarkup(<BuildingPlaceholder building={building}/>);
  expect(html).toContain(`${building.name.replace('&','&amp;')} planned features`);
  expect(html).toContain('BUILDING TBD');
  expect(html).toContain('Buy and sell');
  expect(html).toContain('Services');
  expect(html).toContain('Quests');
  expect(html).not.toContain('<button');
  expect(html.match(/>TBD</g)).toHaveLength(3);
 }
});
