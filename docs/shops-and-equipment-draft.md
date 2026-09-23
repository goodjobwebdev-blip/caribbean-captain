# Blacksmith, Weaver, and personal equipment — draft

Status: **revised proposal for review, 23 September 2026**. This covers the first "more items and buildings" feature. Catalogue prices and armour numbers are proposed balance, not yet implemented.

## Agreed direction

- Clothing changes the captain's visible appearance now. A later dialogue feature can react to dress, status, and national colours.
- The Blacksmith sells personal weapons, pistol cartridges, and armour. Existing weapon sales move out of the Store.
- The Harbour Master sells the spyglass and can later offer navigation equipment.
- The Weaver sells clothing. Both shops buy eligible gear back, with a steep discount for clothing and a smaller discount for armour.
- Armour protects the captain modestly in a duel. Luxurious armour is distinct from stronger armour: a costly fine fit can remove a movement penalty without increasing injury protection.
- Every item has a fixed written description. These are authored game content and do not require an LLM or change between visits.

## Luxury tiers and outfit index

Every wearable piece and personal weapon has one integer **luxury tier**, separate from combat stats and price. The equipped melee weapon and an owned, visibly holstered pistol contribute to the outfit index; cartridges and the spyglass do not.

| Tier | Label | What people can see |
| ---: | --- | --- |
| 0 | Rough | Patched, dented, or visibly worn |
| 1 | Working | Sound, plain, made for daily use |
| 2 | Respectable | Well kept or professionally tailored |
| 3 | Fine | Expensive materials and careful finish |
| 4 | Opulent | Rare materials, jewellery, or conspicuous custom work |

Price depends on material, protection, and luxury: a rough iron plate can cost more than a plain leather jerkin, while comparable workmanship becomes much dearer at higher tiers. Tier does not itself grant a roll modifier. Tiers 3–4 are aspirational purchases: the 14,000-silver tailored cuirass costs more than a 12,000-silver Universal Sloop, while the 28,000-silver jewelled cuirass approaches a 30,000-silver Brigantine. These are comparisons with current provisional ship catalogue prices, not promises of permanent balance.

The captain has **Head, Body, and Feet** outfit slots, as anticipated by [stats.md](stats.md), plus a **visible weapons** component. Clothing and armour compete for an outfit slot. The weapons component is the equipped melee weapon's tier when no pistol is owned; if a pistol is owned, it is treated as visibly holstered and the component is the average of the melee and pistol tiers. Pistol loading does not change its appearance. Compute **appearance index = (Head tier + Body tier + Feet tier + visible weapons component) / 4**, preserving the fraction and displaying one decimal in the Journal. An empty clothing slot scores 0. A new captain begins with three plain, non-resellable tier-1 pieces and a tier-1 cutlass, so the initial index is **1.0**. Only equipped clothing and the equipped melee weapon count; a fine sword kept in inventory has no effect. Examples: rough head (0), fine body (3), working feet (1), fine cutlass (3), no pistol = **1.75** (shown as 1.8); with the tier-2 pistol, the weapons component becomes 2.5 and the index becomes **1.625** (shown as 1.6). A complete fine outfit and fine weapon score **3.0**. Later dialogue can use the unrounded numeric index and inspect individual slots or tags. It should never infer status by reading item names or prose.

Each item may carry authored tags such as `military-style` or `jewelled`. This feature has no national uniform items or current dialogue, trade, reputation, or access effects. Nation-specific colours, refusal, and bribes await the dialogue/national-attitude design. The player's outfit, visible weapons, item tiers, and resulting appearance index are visible in the Journal and the two shops; no portrait is required yet.

## Weaver catalogue

All entries have fixed names, prose descriptions, prices, and tiers. The starter outfit is separate from these purchasable entries and cannot be sold.

| Slot | Piece | Tier | Silver | Authored description |
| --- | --- | ---: | ---: | --- |
| Head | Frayed headcloth | 0 | 8 | A strip of sailcloth tied against the sun, its old seams showing where the dye has washed away. |
| Head | Sailor's kerchief | 1 | 25 | A clean knot of sturdy cotton that keeps wind and loose hair out of a working sailor's eyes. |
| Head | Felt hat | 2 | 60 | Its brim has held its shape through rain and spray; someone has taken care to brush the salt away. |
| Head | Fine tricorn | 3 | 180 | Dark felt, a narrow silk edging, and a sharp crease made for an arrival people will remember. |
| Head | Jewelled tricorn | 4 | 900 | A small stone catches the harbour light above the braid; its wearer need not raise their voice to be noticed. |
| Body | Patched shirt | 0 | 15 | Three kinds of thread hold the elbows together, with each repair telling of another voyage paid for in work. |
| Body | Sailor's jacket | 1 | 55 | Thick canvas keeps off spray, and the pockets sit where a deckhand can reach them in a hurry. |
| Body | Linen coat | 2 | 130 | Cool linen and even stitching give an ordinary captain the air of someone whose accounts are in order. |
| Body | Naval-style coat | 2 | 260 | Brass buttons and a disciplined cut suggest service at sea, without claiming the colours of any nation. |
| Body | Fine frock coat | 3 | 340 | The lining is soft, the cuffs are exact, and the tailor allowed room for a captain's long stride. |
| Body | Brocade coat | 4 | 1,600 | Silk flowers climb the sleeves above costly braid; even in a crowd, the coat makes its owner an event. |
| Feet | Split deck shoes | 0 | 10 | Salt has opened a seam near the toe, but the soles still know how to grip a wet plank. |
| Feet | Deck shoes | 1 | 45 | Plain leather and rough soles, comfortable on timber and unremarkable in a busy quay. |
| Feet | Sturdy boots | 2 | 100 | Oiled leather and firm heels carry a captain from the wharf to a merchant's counting room. |
| Feet | Polished boots | 3 | 190 | Their shine survives the street dust long enough for a formal call. |
| Feet | Silver-buckled boots | 4 | 750 | Bright buckles and supple leather announce a purse that has never had to count the cobbles. |

Clothing has no present mechanical effect. Its tier and tags are kept as structured data for later dialogue.

## Blacksmith catalogue

### Weapons and supplies

Current weapons and prices remain unchanged; the three additional weapons offer identity and price choices within the existing light, medium, and heavy skill classes. Weapon quality still changes attacks and defenses exactly as before. A more luxurious standard weapon does not gain quality +1 merely because it looks better. The tier of the equipped weapon contributes to appearance; weapons in inventory do not.

| Item | Tier | Silver | Combat meaning | Authored description |
| --- | ---: | ---: | --- | --- |
| Sailor's knife | 0 | 45 | Light, standard | Its narrow blade has opened more rope knots than throats, though it can do either. |
| Dagger | 1 | 60 | Light, standard | A compact blade sits close to the belt, ready before a longer weapon clears its scabbard. |
| Cutlass | 1 | 90 | Medium, standard | Short enough for a crowded deck and heavy enough to make a defender respect the edge. |
| Boarding axe | 1 | 120 | Heavy, standard | Made to bite timber and rigging; in a boarding fight it is a fearsome burden to swing. |
| Naval sabre | 2 | 170 | Medium, standard | A curved officer's blade bears a maker's mark worn smooth by careful practice. |
| Heavy mace | 2 | 180 | Heavy, standard | Its blunt iron head answers armour with force rather than finesse. |
| Fine dagger | 3 | 300 | Light, quality +1 | A slim, balanced blade slips from a tooled sheath without a sound. |
| Fine cutlass | 3 | 400 | Medium, quality +1 | The edge holds true from guard to tip, and the hilt has been shaped for one practiced hand. |
| Fine boarding axe | 3 | 450 | Heavy, quality +1 | Polished steel and a fitted haft turn a rough shipboard tool into a captain's chosen weapon. |
| Pistol | 2 | 200 | Existing single-shot pistol | A flintlock with a reliable grip; one loaded shot may settle a duel before steel meets steel. |
| Five cartridges | — | 25 | Existing ammunition pack | Five paper-wrapped charges, kept dry and counted twice before putting to sea. |

The pistol and cartridge text describes existing mechanics; it does not guarantee a successful shot. A new captain still owns a standard cutlass. The spyglass stays at 150 silver and moves to the Harbour Master: “Brass tubes draw a distant sail into focus, while the sea beyond it keeps its secrets.” It is navigation gear rather than part of the outfit index.

### Armour

Armour occupies the same Head or Body slots as clothing. Luxury tier describes visible finish; the protection points and Dodge penalty are separate fields.

| Slot | Piece | Tier | Silver | Protection / penalty | Authored description |
| --- | --- | ---: | ---: | --- | --- |
| Body | Rough breastplate | 0 | 300 | 1 point; Dodge −1 | A battered iron plate has been hammered back into shape, with old dents still visible beneath the soot. |
| Body | Leather jerkin | 1 | 220 | 1 point; none | Dark leather has been stitched in overlapping panels, flexible enough to follow a quick turn. |
| Head | Iron cap | 1 | 180 | 1 point; none | A plain iron crown hides under a hat or sits openly above a sailor's salt-stiff hair. |
| Body | Steel breastplate | 2 | 480 | 2 points; Dodge −1 | Sound plate and stout straps protect the chest, though their weight resists a sudden sidestep. |
| Head | Polished morion | 3 | 1,800 | 1 point; none | Its swept brim gleams above an exacting fit, as useful against a blade as it is hard to ignore. |
| Body | Tailored cuirass | 3 | 14,000 | 2 points; none | A master smith fitted every plate to its owner; steel follows the body instead of fighting it. |
| Body | Jewelled cuirass | 4 | 28,000 | 2 points; none | Tiny stones lie in the chased metal like captive stars; the armour protects no better than its plainer fine cousin. |

No armoured Feet item is offered yet. The expensive cuirasses remove the heavy breastplate's penalty through fit, rather than granting more protection. The jewelled cuirass pays for display. This keeps combat power capped while making high luxury possible.

### Armour rule

At the start of a Captain Duel, add the equipped head and body protection points, capped at **2 total**. When the captain would suffer injury from a landed attack, spend up to the remaining points to prevent that many Injury steps. Points do not replenish within the duel and reset for a later duel. Armour does not prevent fatigue, crew casualties, ship damage, or existing injury. A Body piece with Dodge −1 applies that penalty to the player's Dodge roll while worn, even after its protection is spent, within the existing dice modifier cap. Show the remaining points and prevented injury in the battle view and log. Snapshot the outfit and points when a battle begins so a later saved battle is independent of port equipment changes.

## Shops and transactions

- Blacksmith: buy/sell weapons and armour; buy a pistol and cartridge packs; equip owned weapons or armour. The pistol remains one owned item, with the existing 20-cartridge limit including a loaded shot.
- Weaver: buy/sell clothing; equip owned clothing. Either shop can swap an owned item into its slot, displacing the old piece into inventory.
- Harbour Master: buy the spyglass for its existing 150 silver; navigation gear can be added later.
- Store: retain cargo trading and provisions. Remove the Captain's outfitter panel and its sales. Harbour preparation still allows weapon selection, pistol loading, and battery presets.
- One of each catalogue item may be owned. Equipment purchases and outfit changes take no game time, as existing personal purchases do.
- Sell eligible **unequipped** clothing for **15%**, armour for **60%**, and weapons for **50%** of listed price, rounded down to whole silver. The starting outfit and last melee weapon cannot be sold. The Blacksmith does not buy used cartridges or a loaded pistol; an unloaded pistol may be sold at the weapon rate. The spyglass remains non-resellable for now.
- Show sale values and ownership clearly. Record equipment purchases as negative and sales as positive Captain equipment entries in Finance. All present towns use the same personal catalogue and prices in this pass.

## Save and compatibility

Persist owned clothing, armour, equipped Head/Body/Feet, and their item IDs alongside the optional equipment state. Existing profiles and church checkpoints remain loadable. Old captains retain their weapons, pistol, cartridges, spyglass, and equipped melee selection, and gain only the non-resellable tier-1 starter outfit. No refund or historical purchase is added. A saved active battle retains the outfit/protection snapshot needed to finish it. No LLM prose is stored in equipment state.

## Deferred dialogue hooks

Later dialogue can use the numeric outfit index and structured tags for deliberate NPC reactions. The average should be a cue, not the only input: a fine coat under a rough helmet gives a mixed impression. An NPC might be impressed by a fine cuirass, sneer at torn shoes, or distrust a foreign uniform. A future nation-specific coat or armour can carry a nation tag; hostility, refusal, and bribes require explicit game rules in that feature. NPC names and response choices are fixed when that feature is designed, rather than regenerated on each visit.

## Implementation checks

- The right shops display their assigned personal goods and fixed descriptions; the Store remains a cargo market.
- Buying, swapping, and selling enforce ownership, affordability, slots, restrictions, and Finance entries.
- The Journal shows the three equipped slots, equipped melee weapon, visible pistol, fixed item descriptions, luxury tiers, and the calculated appearance index.
- Duel armour spends its capped pool once per duel, applies the specified Dodge penalty, and reports avoided injuries; deck/naval combat gets no armour bonus.
- Old saves and checkpoints load; new gear survives reopening and checkpoint restoration. Keyboard and narrow-screen controls remain usable.

## Decisions to review

1. Are the five tier names and four-component appearance average a good basis for later dialogue? In particular, should an owned pistol always count as visibly holstered?
2. Is it right for tailored armour to remove the Dodge penalty at ship-level cost while protection stays capped at two?
3. Which descriptions or item names feel out of place in Caribbean Captain's voice?
