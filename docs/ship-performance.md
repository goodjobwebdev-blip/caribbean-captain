# Ship performance and larger freight

Status: implemented with provisional balance values. Battle rules are unchanged.

## Weight and space

All values use fictional game units, not real-world measurements. The current
three trade goods retain their prices and one-space-unit quantities. The planned
45-good market in trade.md remains separate future work.

| Item | Cargo space per unit | Weight per unit |
| --- | ---: | ---: |
| Sugar | 1 | 2 |
| Rum | 1 | 1.5 |
| Cloth | 1 | 0.5 |
| Provisions | 1 | 0.25 |
| Contract freight | 1 | 1 |
| Crew member | Separate crew accommodation | 1 |
| Passenger | Separate passenger berth | 1 |
| Captain | Separate accommodation | 1 |
| Installed operational cannon | Dedicated gun mount | 5 |

Current deadweight is the sum of these carried items. Empty hull structure does
not count. Future ammunition, equipment, and trade goods will need explicit
weights when implemented. Cannon types and ammunition rules are not introduced
by this release. Destroyed cannons no longer contribute weight; replacing them
adds it back.

The starting sloop carries 61 weight units: 120 provisions × 0.25, 10 crew,
one captain, and four cannons × 5. Its deadweight capacity is 500.
Provision consumption remains the existing one per crew member/passenger per day;
no additional captain consumption charge is introduced.

## Performance formulas

Let clamp(x) mean limited to 0–1, and define:

- L = current deadweight / deadweight capacity.
- H = clamp(current hull points / maximum hull points).
- S = clamp(sail condition / 100).
- C = current crew; Cmin = minimum crew; Copt = optimal crew.
- T = captain's Sailing mastery tier.

Factors:

| Factor | Formula |
| --- | --- |
| Load, speed | 1 − 0.25 × clamp((L − 0.20) / 0.80) |
| Load, maneuverability | 1 − 0.35 × clamp((L − 0.20) / 0.80) |
| Hull | 0 when H = 0; otherwise 0.50 + 0.50 × H |
| Sails | 0 when S = 0; otherwise 0.20 + 0.80 × S |
| Crew | 0 below Cmin; otherwise 0.60 + 0.40 × clamp((C − Cmin) / (Copt − Cmin)) |
| Sailing mastery | 1 + 0.05 × T |

If Cmin equals Copt, sufficient crew gives a crew factor of 1.
All crew are currently treated as fit; injuries, morale, discipline, and collective
experience are separate future work.

Current speed = base speed × speed-load factor × hull × sails × crew × mastery.
Current maneuverability = base maneuverability × maneuver-load factor × hull × sails × crew.

The existing mastery bonus applies to speed only. Factors multiply, not add.
Cannons affect movement only through deadweight, without another cannon penalty.

Up to 20% loading has no penalty, preserving the starting sloop's healthy,
normally supplied pace. At the weight limit, load alone reduces speed by 25%
and maneuverability by 35%. Half hull gives a 25% penalty; half sails gives a
40% penalty. Zero hull or zero sails blocks departure. Minimum crew gives 60%
crew effectiveness; optimal crew gives 100%. Extra crew has no further
performance bonus but still adds weight, provisions, and wages.

These are bounded first-pass game formulas, not historical simulation claims.
Maneuverability is calculated and displayed, but does not affect combat yet.
Protection, firepower, encounters, dice modifiers, damage bands, and capture
mechanics have not changed.

## Voyages and loading guards

Normal hours = ceil(distance / current speed), followed by the existing weather
duration multiplier and another round up. Departure stores the duration and
speed snapshot. Consuming provisions, taking damage, losing crew, or gaining
mastery does not rewrite a voyage already underway. Fixed encounter delays
still add time and consume resources, without granting extra Sailing practice.

Journal and Harbour show the multiplicative breakdown. Harbour forecasts use
the current load; adding supplies or cargo can change forecasts. Contract cards
estimate duration with that proposed contract aboard. Underprovisioned departures
still use the existing warning rather than an automatic rescue.

New purchases, recruits, contracts, and replacement cannons cannot exceed safe
weight. Ship exchange checks the transferred load plus the new default cannons.
Departures also check weight and cargo space. Failed attempts do not change the
state or advance its random seed/time. Store quantities now include 100, 250,
500, and 1,000 for larger holds; prices and one-hour transaction time are unchanged.

Existing overweight saves retain their cargo. They can sell it at the store,
deliver commissions where eligible, or exchange into a suitable ship. Pending
voyages, including those in old church checkpoints, finish with their stored
duration. No checkpoint is rewritten and no items are silently discarded.

## Shipyard comparison

Design specifications remain visible. A separate comparison evaluates the current
ship in its actual condition against the fully repaired offered ship with its
default cannons, using the same captain, current crew, provisions, goods, freight,
and passengers. It shows loaded speed, maneuverability, weight, and crew
performance. The calculation used for the preview is also used after purchase.

## Freight sizes

Every other port offers 40, 200, and 800-unit freight jobs each game day, alongside
the existing letter and passenger offers. All sizes remain visible; jobs that
cannot fit show the reason and cannot be accepted. The three-active-contract
limit remains unchanged.

Freight silver = round(baseline route hours × 5 × amount / 40 + 60).
Baseline route hours continue to use the original 1.2-unit/hour reference ship,
not actual captain speed, load, damage, weather, or mastery.

For Bridgetown–Saint-Pierre (49 baseline hours), freight pays 305 / 1,285 / 4,960
silver for 40 / 200 / 800 units. These values extend the original freight formula;
they are provisional and do not implement the separate economy proposal's
reduced payouts or revised trading margins.

The original 40-unit job keeps its ID and reward. Additional sizes have distinct
IDs. Accepted contracts retain their agreed amounts and rewards, including in
old saves. Delivery pays once and archives the actual quantity. Freight has no
bonus Sailing reward; letter rewards and sailing practice remain unchanged.
