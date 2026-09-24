# Ship outfitting

Agreed 24 September 2026: mixed outfitting, permanent hull reinforcement and replaceable sails/guns. Guns use 6, 12, 18, 24 and 32-pound calibres. Each battery is uniform but batteries may differ. Exactly two types: cannon and culverin. Culverins sacrifice damage for accuracy, with an extra long-range advantage within existing ammunition/engagement limits. Reinforcement remains with a sold/captured ship and increases resale value.

## Provisional balance

| Calibre | Damage multiplier | Weight per gun | Price multiplier |
| --- | --- | --- | --- |
| 6 | 1 | 5 | 1 |
| 12 | 1.25 | 7 | 1.6 |
| 18 | 1.5 | 9 | 2.3 |
| 24 | 1.75 | 11 | 3 |
| 32 | 2 | 14 | 4 |

Cannon price = 100 × ship tier × price multiplier. Culverins cost 25% more, inflict 20% less packet damage, gain +1 accuracy and a further +1 at distances of 300 or more. No change to ammunition range limits, reload times, or resource quantities: one ammunition and powder unit per gun. Calibre affects all ammunition packet damage, not the number of guns destroyed by collateral effects directly. Maximum calibre by tier: 6 / 12 / 18 / 24 / 32 / 32. New ships and old saves default to 6-pound cannons to preserve baseline balance.

| Sails | Speed | Maneuverability | Incoming sail damage | Price |
| --- | --- | --- | --- | --- |
| Standard canvas | ×1 | ×1 | ×1 | 200 × tier |
| Reinforced canvas | ×0.97 | ×0.97 | ×0.75 | 350 × tier |
| Cotton | ×1.05 | ×1.03 | ×1 | 500 × tier |
| Silk | ×1.10 | ×1.05 | ×1.25 | 900 × tier |

Sail changes fit a new set at 100% condition. Old sails sell for 60% of list price scaled by condition. Upgraded sail repairs scale with relative sail price. Existing sailcloth repair services still work.

One permanent hull reinforcement: +10 protection, extra weight equal to 5% of deadweight capacity, price 15% of ship list price, 24 hours. Protection reduces hull and battery damage through the existing defense formula; maximum hull points are unchanged. Resale adds 70% of reinforcement price. Cannot remove or stack reinforcement.

## Transactions and ownership

Shipyard dialogue offers outfitting with previews of cost, buyback, time, weight, loaded speed and protection. User confirms the selected refit. Gun counts cannot exceed battery mounts or the ship's calibre limit. Removing guns gives 60% buyback; unchanged guns are retained without rebuying. Changing type/calibre sells the old battery and buys the replacement. Destroyed guns have no buyback value. Fitted counts persist independently of surviving guns, so repairs restore the chosen outfit rather than undoing deliberate removals.

Each changed/removed/installed gun takes one hour (minimum one hour per transaction); replacing a sail set takes eight hours. All jobs require enough silver including wages, provisions for the entire job, and legal final deadweight. Quotes are validated against current state. Work is port-only and blocked during combat. Finance records refit spending/buybacks separately.

Ship exchange sells all installed equipment and reinforcement with the old vessel. The replacement has default fittings. Capture retains the captured ship's fittings; checkpoints preserve them. No spare-equipment storage. Normal cargo cannons are not mountable guns.

Resale preserves legacy values for stock ships and stock losses. Surviving guns credit their stock-equivalent value up to the default count and 60% of additional value. Missing stock value is deducted. Nonstandard sails adjust value by 60% of their list-price difference; condition repair deductions still apply. This prevents stripping equipment for profit before exchanging a ship.

## Scope

Renaming, paint, extra accommodation/cargo fittings, spare storage, and broader NPC loadout variety remain future discussion. These were suggestions, not part of the agreed outfitting set. NPCs use default guns unless they already carry stored custom fittings.

## Validation

237 tests pass across 27 files; TypeScript and the production build pass. Added coverage exercises real volleys (calibre damage, culverin accuracy and range limits, sail durability, hull defense), refit validation and stale quotes, upkeep and finance, fitted-gun repairs, removal/resale, ship exchange, capture, checkpoint restoration, confirmation/cancellation, and shipwright dialogue access. Stock-save behavior remains covered by the existing suite. Visual browser QA and live model playtesting were not performed; the existing Vite bundle-size advisory remains.
