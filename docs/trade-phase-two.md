# Trade planning, access and changing markets

Implemented as the next trade release. These are initial gameplay values for iteration, not historical economic claims. The core finite-stock and basket rules in `trade-release.md` still apply unless superseded below.

## Planning and usability

- Journal Cargo has a purchase ledger: recorded quantities, unknown quantities, allocated silver paid and average recorded cost.
- Purchases from this release allocate the rounded line payment across units. Older acquired lots retain their price-curve estimate; starting/legacy cargo without cost records stays unknown. Cargo profit is separate from the unrounded marginal attribution used for Trade learning.
- Store sale lines show estimated cargo profit before upkeep and fines, or say the cost is unknown.
- Journal Markets compares a selected good and quantity across all ports. Estimates integrate the remembered stock curve and remembered spread/event terms. No live remote state enters the estimate. Unknown/unavailable records cannot produce an actionable estimate. A selected quantity beyond owned recorded cargo has unknown profit even when a hypothetical sale total can be shown.
- Store adds quantity shortcuts (1 / 10 / 50), Sell all, and Aboard only. Sell all respects market storage and keeps one hour of food when selling provisions. It does not reserve food for a future voyage.
- Search/filter and market selection remain after a deal; the basket clears on game-state changes.

## National permits and standing

A permanent national trade permit costs **750 silver and one hour** at the Harbour Master. It unlocks Weapons, Gunpowder, Cannons and Bombs in that nation's legal markets, while local attitude remains at least −30. England, France and the Dutch have ports in the current map; the nation type also allows Spain and Pirates for future ports.

Local attitude and global reputation range from −100 to +100, starting at zero. Each delivered commission grants +2 attitude with the receiving port's nation and +1 global reputation. Existing accepted rewards are unchanged. There is no repeated-delivery reward.

At attitude −60 or below, legal trading other than provisions is barred. Commissions remain available to rebuild trust. Legal spread is:

`clamp(0.15 - 0.01 * Trade tier - 0.02 * attitude / 100 - 0.01 * reputation / 100, 0.05, 0.22)`

Reputation/attitude effects are deliberately smaller than regional role multipliers.

Jewelry is unavailable through Bridgetown's legal market; Perfume is unavailable through Saint-Pierre's. Permits do not override Unavailable status. These goods can be obtained legally elsewhere or through local smugglers. Old cargo is retained; the player can transport it to a legal buyer or use a local contact.

## Smugglers

A tavern introduction costs **50 silver and one hour**, permanently establishing a contact in that port. The Store then offers a separate Smugglers view. Contacts handle Controlled goods and locally Unavailable goods only. They are absent every fifth calendar day (days 5, 10, 15, …), a simple initial availability schedule.

Stocks are independent of legal markets. Targets are 5% of the corresponding legal targets, maxima twice target, with the same recovery constants. Smuggler spread is:

`max(0.15, 0.30 - 0.01 * Trade tier - 0.02 * max(0, -reputation) / 100)`

Positive legal reputation and national permits give no smuggler discount. Remembered smuggler prices are stored separately, only after contact access and when the contact is available.

Every valid confirmed smuggler basket takes one hour and then receives a 2d6 inspection roll. All thresholds and consequences are disclosed before confirmation:

| Roll | Result | Fine | Local attitude / global reputation |
| --- | --- | --- | --- |
| 2–6 | Purchases in this deal are confiscated | 25% of gross purchases + sales, rounded up; minimum 50 silver | −10 / −5 |
| 7–9 | Cargo retained, suspicious transaction | 10% of gross purchases + sales, rounded up; minimum 25 silver | −3 / −1 |
| 10–12 | Undetected, cargo retained | None | No change |

The deal itself settles; sold goods stay sold. Confiscation removes only newly purchased lots, never previously held cargo or its cost records. Fines can create debt. The quote shows both possible fined balances. Trade learning from sales is calculated before inspection fines, as with other voyage expenses. No arrest or new combat system is introduced. Invalid/stale deals have no roll or side effect.

## Local market events

Events use a persistent captain-specific seed independent of voyage RNG. The first ten days after initializing this feature are calm. Subsequent ten-day periods can have a five-day local event; periods can also be calm. Browsing or restoring does not reroll a period.

| Event | Category | Price multiplier |
| --- | --- | ---: |
| Poor harvest | Agricultural | 1.20 |
| Bountiful harvest | Agricultural | 0.85 |
| Shipyard orders | Materials | 1.20 |
| Festival demand | Luxury | 1.25 |
| Merchant convoy | Manufactured | 0.85 |

These first events modify prices, not stock recovery. Provisions are unaffected. Events have a named end time in the current market; remote records retain the observed event and its scheduled end as historical information. No unvisited-port event news is disclosed.

## Save compatibility and validation

Existing economic state, inventories, provenance and observations remain intact. New standing starts neutral; no free permits or contacts are granted. The event timeline begins at the save's current hour. Old remembered quotes lacking curve data remain visible but require revisiting before quantity estimates are available. Church checkpoints contain permissions, contacts, standing, events' seed/epoch, both market stocks and both sets of price memories.

Tests cover atomic restrictions and quotes, permit scope, standing bounds, each inspection outcome, confiscation provenance, unavailable days, channel tampering, event determinism/expiry, remembered estimates, and migration. `npm run balance:trade` runs [economic scenarios through the game engine](trade-playtest.md), including 24 repeat trading legs. Browser automation is unavailable in this environment; desktop/mobile interaction and visual verification remain outstanding. Responsive CSS and rendered component checks are included, but are not a substitute for that visual check.

## Still deferred

Spoilage and per-good volatility, repair-material consumption, medicine use, ammunition consumption, installed-cannon conversion, food-to-provisions conversion, arrests, and new naval combat rules. These require their respective gameplay systems; cargo remains usable as trade goods in the meantime. Further balance testing with larger ships and adverse encounters remains ongoing work rather than a claim of final balance.
