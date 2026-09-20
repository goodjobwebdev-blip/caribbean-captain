import type {Game,PortId} from '../game';
import type {Nation} from '../commerce';
import type {OwnedShip,Battery} from '../ships';
import type {Snapshot} from '../trade';
export type Skill='sailing'|'lookout'|'deception'|'diplomacy'|'intimidation'|'boarding'|'aiming'|'reloading'|'demolitions'|'carpentry'|'sailmaking'|'doctoring'|'leadership'|'lightWeapons'|'mediumWeapons'|'heavyWeapons'|'athletics'|'shooting';
export type Role='Merchant'|'Local'|'Courier'|'Navy'|'Privateer'|'Pirate'|'Bounty Hunter';
export type Temperament='Cautious'|'Bold'|'Aggressive'|'Fanatical'|'Honorable';
export type Posture='Pass'|'Flee'|'Hail'|'Challenge'|'Demand'|'Threaten'|'Attack';
export type Ammo='round-shot'|'chain-shot'|'grapeshot'|'bombs';
export type Condition='fire'|'flooding'|'rigging'|'shock';
export type Crew={fit:number;injured:number;dead:number;morale:number;discipline:number;experience:number;equipment:number};
export type Captain={injury:number;fatigue:number;weapon:'lightWeapons'|'mediumWeapons'|'heavyWeapons';quality:number;pistol:boolean};
export type Combatant={ship:OwnedShip;crew:Crew;captain:Captain;skills:Partial<Record<Skill,number>>;cargo:Record<string,number>;x:number;y:number;heading:number;sails:number;states:Record<Condition,number>;batteries:Record<Battery,{loaded:number;ammo:Ammo|null;power:number}>;startHull:number;startSails:number;startFit:number;provisions:number;freight:number;passengers:number};
export type Npc={role:Role;faction:Nation;temperament:Temperament;level:number;origin:PortId;departed:number;market:Snapshot;ship:OwnedShip;crew:Crew;perceivedStrength:number};
export type Contact={at:number;npc:Npc};
export type Demand={kind:'silver'|'goods'|'passengers'|'surrender'|'fine';value:number;fraction:number};
export type Encounter={stage:'sighting'|'response'|'pursuit'|'counteroffer';npc:Npc;posture:Posture;demand?:Demand;responses:number;early:boolean;movementUsed:boolean;passengersRefused?:boolean;message:string};
export type Roll={label:string;dice:[number,number];parts:Record<string,number>;modifier:number;total:number;band:number};
export type Decision={assessment:string[];objective:string;risk:string;intent:string;action_ids:string[]};
export type Order={id:string;kind:string;cost:number;parts:Record<string,number>;battery?:Battery;ammo?:Ammo;angle?:number;setting?:number;target?:string;resources:Record<string,number>};
export type Scheduled=Order&{start:number;end:number;begun?:boolean;failed?:string};
export type Duel={initiative:string;exchange:number;control:number;firstRoll:boolean;demandedAt:number[];npcAttack?:string};
export type Battle={id:string;phase:'naval'|'deck'|'duel'|'capture'|'ended';playerId:string;npcId:string;ships:Record<string,Combatant>;npc:Npc;window:number;unit:number;wind:number;windStrength:number;hazards:{id:string;x:number;y:number;owner:string;armed:boolean}[];plans:Record<string,Scheduled[]>;committed?:string[];accepted?:Decision;decisionKey:number;status:'planning'|'waiting'|'reveal'|'playback'|'replacement'|'transition'|'finished';replacement?:string[];round:number;rounds:number;control:number;attacker:string;duel?:Duel;winner?:string;reason?:string;terms?:string;preloaded:string[];log:string[];rolls:Roll[];difficulty:'Easy'|'Normal'|'Hard';deception?:Record<string,{window:number;band:number}>;result?:{ships:Record<string,Combatant>;winner?:string;reason:string;terms?:string}};
export const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n));
export function rng(g:Pick<Game,'seed'>){g.seed=(g.seed+0x6D2B79F5)>>>0;let t=g.seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
export function weighted<T>(g:Pick<Game,'seed'>,items:[T,number][]):T{let n=rng(g)*items.reduce((s,i)=>s+i[1],0);for(const [item,w] of items){n-=w;if(n<0)return item;}return items[items.length-1][0];}
export function roll(g:Pick<Game,'seed'>,label:string,parts:Record<string,number>):Roll{const dice:[number,number]=[1+Math.floor(rng(g)*6),1+Math.floor(rng(g)*6)],natural=dice[0]+dice[1],modifier=clamp(Object.values(parts).reduce((a,b)=>a+b,0),-4,4),total=natural+modifier;return {label,dice,parts,modifier,total,band:natural===2?0:natural===12?2:total<=6?0:total<=9?1:2};}
export const mastery=(g:Game,id:Skill)=>clamp(g.skills?.[id]?.tier??0,0,10);
export const rank=(n:number)=>n<=3?'Novice':n<=7?'Capable':n<=11?'Experienced':n<=15?'Veteran':n<=18?'Elite':n===19?'Master':'Legendary';
export const crew=(fit:number,quality=50):Crew=>({fit,injured:0,dead:0,morale:quality,discipline:quality,experience:quality,equipment:quality});
export const captain=():Captain=>({injury:0,fatigue:0,weapon:'mediumWeapons',quality:0,pistol:false});
export const injuryNames=['Healthy','Lightly Injured','Injured','Severely Injured','Critically Injured','Incapacitated','Dead'];
export const fatigueNames=['Rested','Tired','Fatigued','Exhausted','Collapsed'];
export function casualties(g:Pick<Game,'seed'>,c:Crew,n:number){n=Math.min(c.fit,Math.ceil(n));for(let i=0;i<n;i++){c.fit--;if(rng(g)<.25)c.dead++;else c.injured++;}}
export function strength(s:Combatant){const c=s.crew;return c.fit*(.5+(c.experience+c.morale+c.discipline+c.equipment)/800)*(1+.05*(s.skills.boarding??0));}
export const ratioEdge=(r:number)=>r<.5?-2:r<.8?-1:r<1.25?0:r<2?1:2;
export const masteryEdge=(r:number)=>r<=-4?-2:r<=-2?-1:r<2?0:r<4?1:2;
export function report(b:Battle,text:string){b.log.unshift(text);b.log=b.log.slice(0,150);}
export function recordRoll(g:Game,b:Battle,r:Roll){b.rolls.unshift(r);b.rolls=b.rolls.slice(0,40);g.lastRoll={label:r.label,dice:r.dice,outcome:['Setback','Partial','Full success'][r.band]};}
export function finish(b:Battle,winner:string|undefined,reason:string,terms?:string){b.phase='capture';b.status='finished';b.winner=winner;b.reason=reason;b.terms=terms;b.result={ships:structuredClone(b.ships),winner,reason,terms};b.plans={};delete b.committed;delete b.accepted;report(b,reason);}
