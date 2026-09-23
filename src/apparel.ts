export type OutfitSlot='head'|'body'|'feet';
export type Apparel={id:string;name:string;slot:OutfitSlot;kind:'clothing'|'armour';tier:number;price:number;description:string;protection:number;dodgePenalty:number;starter?:boolean;tags?:string[]};
export const TIER_NAMES=['Rough','Working','Respectable','Fine','Opulent'] as const;
const piece=(id:string,name:string,slot:OutfitSlot,kind:Apparel['kind'],tier:number,price:number,description:string,protection=0,dodgePenalty=0,starter=false,tags:string[]=[]):Apparel=>({id,name,slot,kind,tier,price,description,protection,dodgePenalty,starter,tags});
export const APPAREL:Apparel[]=[
 piece('plain-kerchief','Plain kerchief','head','clothing',1,0,'A faded but clean square of cloth, knotted neatly against the sea wind.',0,0,true),
 piece('work-shirt','Work shirt','body','clothing',1,0,'The cuffs are worn smooth from ropes and ledgers, but every seam is sound.',0,0,true),
 piece('worn-deck-shoes','Worn deck shoes','feet','clothing',1,0,'Soft leather has learned the shape of the deck beneath your feet.',0,0,true),
 piece('frayed-headcloth','Frayed headcloth','head','clothing',0,8,'A strip of sailcloth tied against the sun, its old seams showing where the dye has washed away.'),
 piece('sailors-kerchief',"Sailor's kerchief",'head','clothing',1,25,"A clean knot of sturdy cotton that keeps wind and loose hair out of a working sailor's eyes."),
 piece('felt-hat','Felt hat','head','clothing',2,60,'Its brim has held its shape through rain and spray; someone has taken care to brush the salt away.'),
 piece('fine-tricorn','Fine tricorn','head','clothing',3,180,'Dark felt, a narrow silk edging, and a sharp crease made for an arrival people will remember.'),
 piece('jewelled-tricorn','Jewelled tricorn','head','clothing',4,900,'A small stone catches the harbour light above the braid; its wearer need not raise their voice to be noticed.',0,0,false,['jewelled']),
 piece('patched-shirt','Patched shirt','body','clothing',0,15,'Three kinds of thread hold the elbows together, with each repair telling of another voyage paid for in work.'),
 piece('sailors-jacket',"Sailor's jacket",'body','clothing',1,55,'Thick canvas keeps off spray, and the pockets sit where a deckhand can reach them in a hurry.'),
 piece('linen-coat','Linen coat','body','clothing',2,130,"Cool linen and even stitching give an ordinary captain the air of someone whose accounts are in order."),
 piece('naval-coat','Naval-style coat','body','clothing',2,260,'Brass buttons and a disciplined cut suggest service at sea, without claiming the colours of any nation.',0,0,false,['military-style']),
 piece('fine-frock-coat','Fine frock coat','body','clothing',3,340,"The lining is soft, the cuffs are exact, and the tailor allowed room for a captain's long stride."),
 piece('brocade-coat','Brocade coat','body','clothing',4,1600,'Silk flowers climb the sleeves above costly braid; even in a crowd, the coat makes its owner an event.'),
 piece('split-deck-shoes','Split deck shoes','feet','clothing',0,10,'Salt has opened a seam near the toe, but the soles still know how to grip a wet plank.'),
 piece('deck-shoes','Deck shoes','feet','clothing',1,45,'Plain leather and rough soles, comfortable on timber and unremarkable in a busy quay.'),
 piece('sturdy-boots','Sturdy boots','feet','clothing',2,100,"Oiled leather and firm heels carry a captain from the wharf to a merchant's counting room."),
 piece('polished-boots','Polished boots','feet','clothing',3,190,'Their shine survives the street dust long enough for a formal call.'),
 piece('silver-buckled-boots','Silver-buckled boots','feet','clothing',4,750,'Bright buckles and supple leather announce a purse that has never had to count the cobbles.'),
 piece('rough-breastplate','Rough breastplate','body','armour',0,300,'A battered iron plate has been hammered back into shape, with old dents still visible beneath the soot.',1,-1),
 piece('leather-jerkin','Leather jerkin','body','armour',1,220,'Dark leather has been stitched in overlapping panels, flexible enough to follow a quick turn.',1),
 piece('iron-cap','Iron cap','head','armour',1,180,"A plain iron crown hides under a hat or sits openly above a sailor's salt-stiff hair.",1),
 piece('steel-breastplate','Steel breastplate','body','armour',2,480,'Sound plate and stout straps protect the chest, though their weight resists a sudden sidestep.',2,-1),
 piece('polished-morion','Polished morion','head','armour',3,1800,'Its swept brim gleams above an exacting fit, as useful against a blade as it is hard to ignore.',1),
 piece('tailored-cuirass','Tailored cuirass','body','armour',3,14000,'A master smith fitted every plate to its owner; steel follows the body instead of fighting it.',2),
 piece('jewelled-cuirass','Jewelled cuirass','body','armour',4,28000,'Tiny stones lie in the chased metal like captive stars; the armour protects no better than its plainer fine cousin.',2,0,false,['jewelled']),
];
export const STARTER_OUTFIT:Record<OutfitSlot,string>={head:'plain-kerchief',body:'work-shirt',feet:'worn-deck-shoes'};
export const apparel=(id:string)=>APPAREL.find(item=>item.id===id);

export const apparelResaleValue=(item:Apparel)=>Math.floor(item.price*(item.kind==='clothing'?.15:.6));
