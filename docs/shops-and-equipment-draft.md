# Blacksmith, Weaver, and personal equipment — draft

Status: **proposal for review, 23 September 2026**. This covers the first "more items and buildings" feature. Values below are proposed balance, not yet implemented.

## Decisions from discussion

- Clothing changes the captain's visible appearance now. Social treatment based on dress is reserved for the later dialogue feature.
- The Blacksmith sells personal weapons, pistol cartridges, and armour. Existing weapon sales move out of the Store.
- The Harbour Master sells the spyglass and is the future home of navigation equipment.
- The Weaver sells clothing. Both new shops can buy eligible personal items back.
- Clothing has a steep resale loss; armour retains more value.
- Armour provides modest protection in Captain Duels with a drawback for heavy armour.
- Start with a balanced catalogue that gives useful choices in each slot, rather than a large list of near-duplicates.

## Equipment and appearance

The captain has Head, Body, and Feet slots, as anticipated by [stats.md](stats.md). A slot can hold one equipped clothing or armour piece. Owned pieces not equipped remain in personal inventory. Clothing and armour take no cargo space, following the existing personal-equipment baggage abstraction. Weapon and pistol preparation stays available in port; the Journal shows ownership, equipped pieces, and a short outfit description. No character portrait is required for this feature.

An ordinary new captain starts with the existing cutlass and plain travel clothes: a work shirt and worn shoes. Starting clothes have no resale value. Changing clothes costs no silver or game time and is allowed only in port. A neutral clothing choice can be worn at any port. A naval-style coat in this catalogue is generic; nation-specific colours, disguises, and their consequences wait for the dialogue/national-attitude design.

### Proposed Weaver catalogue

| Slot | Piece | Price | Appearance |
| --- | --- | ---: | --- |
| Head | Sailor's kerchief | 25 | Practical, working |
| Head | Felt hat | 60 | Tidy, ordinary |
| Head | Fine tricorn | 180 | Prosperous |
| Body | Sailor's jacket | 55 | Practical, working |
| Body | Linen coat | 130 | Tidy, ordinary |
| Body | Fine frock coat | 340 | Prosperous |
| Body | Naval-style coat | 260 | Military bearing, no national colours yet |
| Feet | Deck shoes | 45 | Practical, working |
| Feet | Sturdy boots | 100 | Tidy, ordinary |
| Feet | Polished boots | 190 | Prosperous |

Clothing is appearance only: no current modifiers to dialogue, combat, travel, prices, or reputation. Keep each piece's appearance tags as data so later dialogue can reference them without interpreting freeform item names.

### Proposed Blacksmith catalogue

Keep the current dagger, cutlass, boarding axe, three fine versions, pistol, and five-cartridge pack at their existing prices and combat effects. Add the following distinct choices:

| Item | Price | Effect |
| --- | ---: | --- |
| Sailor's knife | 45 | Standard light weapon; inexpensive alternative to the dagger |
| Naval sabre | 170 | Standard medium weapon; same combat class as the cutlass |
| Heavy mace | 180 | Standard heavy weapon; same combat class as the axe |
| Leather jerkin (Body) | 220 | 1 armour point per Captain Duel |
| Iron cap (Head) | 180 | 1 armour point per Captain Duel |
| Steel breastplate (Body) | 480 | 2 armour points per Captain Duel; −1 to Dodge rolls |

The additional standard weapons add variety of identity and price, not hidden power above their existing skill class. Fine weapons remain the quality +1 upgrades. No armoured feet in the first catalogue. The Blacksmith sells armour and weapons, while the Weaver sells clothing; both can equip pieces for inspection, but the Journal is the common place to see the outfit.

### Armour rule

At the start of a Captain Duel, add the equipped head and body armour points, capped at 2 total. When the captain would suffer injury from a landed attack, spend up to the remaining points to prevent that many Injury steps. Points do not replenish within the duel and reset for the next duel. Armour does not prevent fatigue, crew casualties, ship damage, or injuries already present. The steel breastplate applies −1 to the captain's Dodge roll while worn, even after its points are spent. This modifier affects the player's duel roll, within the existing dice modifier cap. Show spent protection and the avoided injury in the battle log and battle view. Snapshot the outfit and protection when the battle starts so changing equipment in port cannot alter an active battle.

## Shops and transactions

- Blacksmith: buy/sell weapons and armour, buy pistol and cartridge packs, equip owned weapons or armour. The pistol remains one owned item; cartridges retain their 20-round capacity including a loaded shot.
- Weaver: buy/sell clothing; equip an owned piece in Head, Body, or Feet.
- Harbour Master: buy the spyglass at its existing 150-silver price; no new navigation item in this feature.
- Store: continue cargo trading and provisions. Remove the Captain's outfitter panel and its sales from this location. Harbour preparation remains a convenient place to select a weapon, load a pistol, and prepare cannon batteries.
- One copy of each catalogue item may be owned. Purchases and outfit changes take no game time, matching current personal equipment purchases.
- Sell an eligible unequipped garment for **15%** of its original listed price, armour for **60%**, and weapons for **50%**, rounded down to whole silver. The Blacksmith does not buy used cartridges or a loaded pistol; the Weaver does not buy starting clothes. Do not sell the last available melee weapon. The spyglass remains non-resellable for now.
- Show the sale value and ownership before confirmation. Record buy and sell cash flows in Finance under Captain equipment, with sales as positive entries. Shop stock and prices are the same in all current towns for this first pass.

## Save and compatibility

Persist owned apparel, equipped slots, and armour alongside the existing optional equipment state. Old profiles and church checkpoints remain loadable. Existing purchased weapons, pistol status, cartridges, spyglass, and equipped melee weapon keep their current meaning; old captains gain only the non-resellable starting outfit. There is no retroactive refund or purchase. A saved active battle keeps its own protection snapshot. Do not store prose generated by the LLM in equipment state.

## Deferred dialogue hooks

The later dialogue feature can react to clothing appearance tags, the named merchant, and the port's nation. Fine dress may prompt deference or resentment; ragged dress may prompt class prejudice. A future nation-specific uniform could lead to refusal, suspicion, or a bribe in hostile towns. These are narrative possibilities, not active restrictions or price rules in this release. Define fixed NPC identities and their dialogue choices during the dialogue phase so names do not change on every visit.

## Implementation checks

- Blacksmith, Weaver, and Harbour Master each show only their assigned personal goods; Store remains the cargo market.
- Buy, equip, unequip/swap, and sell enforce ownership, affordability, slots, sale restrictions, and Finance entries.
- Injury protection is spent once per duel, the steel breastplate Dodge penalty applies, and the battle log explains both. No armour benefit leaks into deck or naval phases.
- Old saves and checkpoints load; newly bought/equipped items survive reopening and checkpoint restoration.
- Appearance is readable in the Journal and shops; keyboard and narrow-screen controls remain usable.

## Review questions

1. Are the catalogue and prices varied enough, or should any specific garment, weapon, or armour piece be exchanged?
2. Does the once-per-duel armour pool feel right, including the two-point cap and heavy breastplate Dodge penalty?
3. Are 15% clothing, 60% armour, and 50% weapon buyback values the right discounts?
