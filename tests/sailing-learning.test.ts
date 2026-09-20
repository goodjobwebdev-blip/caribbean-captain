import {legacyVoyage} from './legacy-voyage';
import {it,expect} from 'vitest';
import {creditSailing} from '../src/skills';
import {act,newGame} from '../src/game';
const rng=(...v:number[])=>{let i=0;return()=>v[i++]??.5;};
it('carries practice hours and points across voyages and tier boundaries',()=>{
 const first=creditSailing(undefined,49);
 expect(first.skills.sailing).toEqual({tier:0,points:2,sailingHours:1});
 const next=creditSailing(first.skills,23);expect(next.earned).toBe(1);expect(next.skills.sailing.sailingHours).toBe(0);
 const promoted=creditSailing({sailing:{tier:0,points:9,sailingHours:23}},49);
 expect(promoted.skills.sailing).toEqual({tier:1,points:2,sailingHours:0});
 expect(first.skills.sailing.points).toBe(2);
});
it('supports multiple tiers and stops progression at mastery ten',()=>{
 expect(creditSailing(undefined,24*35).skills.sailing).toEqual({tier:2,points:5,sailingHours:0});
 const max=creditSailing({sailing:{tier:9,points:5119}},72);
 expect(max.skills.sailing).toEqual({tier:10,points:0,sailingHours:0});
 expect(creditSailing(max.skills,72).earned).toBe(0);
});
it('awards once on arrival, excludes escape delays, and does not shorten the current voyage on promotion',()=>{
 const initial=newGame('Anne',42);initial.skills={sailing:{tier:0,points:9}};
 const midway=legacyVoyage(initial);
 expect(midway.skills?.sailing.points).toBe(9);
 const arrived=act(midway,{type:'encounter',choice:'flee'},rng(0,0));
 expect(arrived.hours-initial.hours).toBe(73);
 expect(arrived.skills?.sailing).toEqual({tier:1,points:1,sailingHours:1});
 expect(()=>act(arrived,{type:'encounter',choice:'flee'})).toThrow();
 const slept=act(arrived,{type:'sleep'});expect(slept.skills).toEqual(arrived.skills);
});
it('does not award points for failed voyages',()=>{
 const g=newGame('Anne',42);g.provisions=1;
 const lost=act(g,{type:'sail',to:'saint-pierre'},rng(.5,.5,.5));
 expect(lost.failed).toBeTruthy();expect(lost.skills).toEqual(g.skills);
});
