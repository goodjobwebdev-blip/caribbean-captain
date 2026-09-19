# First playable balance

These are provisional implementation values for playtesting, not historical claims. The user approved approximately two days for the short voyage, straight-line distances, the 2d6 bands, and church-only recovery.

## World and ship

| Anchorage | X | Y |
| --- | ---: | ---: |
| Bridgetown | 0 | 0 |
| Saint-Pierre | -29 | 50 |
| Willemstad | -285 | -25 |

These are simplified game positions with approximate geographic relationships, not surveyed coordinates. Distances use `Math.hypot(dx, dy)`. Reference speed is 1 unit/hour; The Wayfarer sails at 1.2 units/hour. The short voyage is 49 hours in normal weather. There are no waypoint or coastline checks.

The starting Universal Sloop has 300 hold units, 100 hull points, and 5 minimum / 10 optimal / 20 maximum crew. Shipyards offer 28 configurations; selected ship specifications replace these starting limits. See [ship catalogue](ship-catalogue.md). A new captain has 800 silver, 10 crew, and 120 provisions. Crew experience, seasons, and speed effects from damage are deferred.

The calendar starts at 08:00 on 1 January, Year 1. Months have 30 days and years 360 days. This fictional calendar avoids selecting a historical year prematurely.

## Costs and trade

Every person aboard consumes 1 provision/day. Crew cost 2 silver/person/day. These accrue proportionally to hours everywhere, including port. Passengers consume provisions but earn no wages. Wages may produce a negative treasury (arrears); purchases require sufficient silver, and future income repays arrears. This is a provisional soft-debt rule, not a rescue system.

Goods and freight occupy one hold unit each; provisions occupy one each, including fractional remaining provisions. Passenger berths are separate from the cargo hold; the starting sloop has six, and other configurations have their own limits.

| Item | Bridgetown buy | Saint-Pierre buy | Willemstad buy |
| --- | ---: | ---: | ---: |
| Sugar | 8 | 12 | 17 |
| Rum | 16 | 10 | 20 |
| Cloth | 22 | 25 | 14 |
| Provisions | 1 | 1 | 1 |

Selling yields 85% of local buy price, rounded down. Provisions cannot be sold. Every transaction takes 1 hour. Quantities available are 1, 10, 25, and 50. Goods supply is unlimited for this prototype.

Hire one sailor: 25 silver and 1 hour. Sleep: 8 silver and 8 hours. Hull repair: ship tier in silver per missing hull point, at 5 hull points/hour rounded up. This retains 2 silver/point on the starting tier 2 sloop. Sail repair: ship tier in silver per missing percentage point, at 5 percentage points/hour rounded up. Missing default cannons cost 100 × ship tier each and take one hour each. Each service restores its own component in one action. Wages and provisions continue during these actions. Visiting locations and creating checkpoints take no time.

## Contracts

Up to three active tasks. Each other port offers a letter, 40-unit freight, and three passengers each game day. An offer can only be accepted once that day; unused offers refresh the next day. Existing contracts never expire in this version.

Rewards: `round(normal voyage hours × rate + 60)`, with rates 3 for letters, 5 for freight, 4 for passengers. Acceptance and delivery each consume an hour. Payment requires visiting the destination Harbour Master and delivering; arrival alone grants no silver. Contract terms come from game data, never NPC prose.

## Sailing and encounter rolls

Weather: 20% fair winds (duration × 0.85), 60% steady winds (× 1), 20% headwinds (× 1.25), rounded up to whole hours. One 2d6 voyage roll: exactly 2 means pirates, all other totals clear passage.

Damage numbers below are percentage points of maximum hull, preserving the prototype consequence bands across ship sizes. Guns and protection do not yet modify encounters.

Pirates appear halfway through the weather-adjusted voyage. The player chooses an action, then rolls a separate 2d6. No action modifiers yet.

| Action | 2–6 setback | 7–9 partial success | 10–12 success |
| --- | --- | --- | --- |
| Flee | 25 damage, +24 hours | 10 damage, +8 hours | Escape, no cost |
| Negotiate | 150 silver demanded | 60 silver demanded | Passage without payment |
| Fight | 50 damage, 3 crew lost | 20 damage, 1 crew lost, 60 silver loot | 5 damage, 150 silver loot |

Negotiation takes available silver up to the demand. Failure to pay it in full causes 15 damage; it does not create new debt. After resolving, the remaining voyage is completed unless the ship has sunk, crew falls below the owned ship’s minimum, or provisions run out. Delays consume provisions and wages. Defeat has no rescue and no new checkpoint: restore a previous church checkpoint or start another profile.

The departure panel shows normal-weather costs, the weather duration range, and a provision reserve for headwinds plus 24 hours. Players can choose to sail with insufficient supplies after seeing the warning.

## Persistence and random results

IndexedDB stores current profiles and separate checkpoints. A checkpoint captures the entire game state, including random seed. Restoring it replaces current progress but preserves all other checkpoints. Names need not be unique; internal identifiers are unique. The first checkpoint must be created explicitly at church. Session resume cannot undo defeat. No cross-device synchronization or save export/import yet.
