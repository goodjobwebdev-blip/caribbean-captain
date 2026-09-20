# Perishability and operational supplies

This release builds on [trade planning and market access](trade-phase-two.md). Values are fictional initial balance settings.

## Fruit spoilage

Fruit aboard loses **5% of its remaining quantity per game day**. All other goods, including provisions and preserved foods, remain stable in this first perishability release.

`remaining = quantity * 0.95 ^ (elapsedHours / 24)`

Loss applies to elapsed game time at sea and in port, including encounter delays, sleep, repairs and trading. It does not depend on wall-clock time, page refreshes or how an interval is split into actions. If a voyage fails partway through an action, only the hours actually elapsed cause spoilage. Existing cargo is not aged retroactively when loading a save.

Fractional cargo is retained internally; trading still uses whole units. For purchase-record accounting, losses remove the oldest cargo and its cost provenance first. Spoiled cargo cannot be sold or earn Trade points. Losses release hold space and deadweight. Existing voyage durations remain based on the departure performance snapshot; lightening the hold mid-voyage does not recalculate that voyage's schedule.

The Store labels Fruit as perishable. Journal Cargo shows a seven-day forecast. The voyage review shows expected fruit remaining in normal weather and warns that delays cause additional spoilage. Losses are recorded in the captain's log. Port market stocks continue to use their existing supply/recovery system; this spoilage model applies to the player's carried fruit, not contract freight or every port's inventory.

## Prepare provisions at the Store

Food preparation is a separate quoted Gamespace action using cargo already aboard. It does not automatically buy ingredients.

| Input | Provisions per input unit |
| --- | ---: |
| Grain | 4 |
| Fruit | 3 |
| Salted Fish | 6 |
| Salted Meat | 8 |

The fee is **1 silver per input unit**. Time is **one hour per 20 input units, rounded up**. Input quantities must be positive whole units. Prepared provisions are available to feed the crew during the service. Usual wages and provision consumption apply.

The quote shows consumed cargo, output, fee, hours, final silver, final provisions, and both load limits. The expanded provisions must fit before service-time crew meals are deducted; the player cannot use those meals to bypass hold/deadweight limits. Invalid or stale quotes do not consume goods, silver, or time.

The conversion is an alternative supply service, not a promise to beat ordinary provision prices. Export prices, stock shortages, cargo already owned and available hold space determine whether it is useful. Large provision stocks remain unchanged.

Recorded input costs and the preparation fee are allocated to the output. Unknown acquisition costs stay unknown. Conversion grants no skill points, and converted provisions do not earn Trade learning on resale, preventing a conversion loop from generating extra practice. They remain normally sellable and edible.

## Supply materials at the Shipyard

Full-service paid repairs remain available and continue to supply their own materials. A second quote lets the captain provide cargo materials and reduce the cash bill.

| Repair | Materials per restored amount |
| --- | --- |
| Hull | Planks: 1 unit per 20 hull points; Tools: 1 per 100 hull points |
| Sails | Sailcloth: 1 per 20 percentage points; Rope: 1 per 40 percentage points; Tools: 1 per 100 percentage points |

Supply units can be fractional; a remainder stays aboard. Cargo and its acquisition records are consumed together. Repairs restore the selected system fully. Their time is unchanged: one hour per five missing hull points or sail-condition percentage points, rounded up.

Material credit is the smaller of:

- 60% of the full-service silver quote, rounded down;
- supplied quantities multiplied by catalogue base prices, summed and rounded down.

The remaining bill is paid in silver. The quote shows full-service price, material credit, remaining cash, time, inventory requirements and the materials' recorded purchase cost when known. Providing materials is not always cheaper; purchasing them at export prices can make the option worthwhile. Very small repairs with zero material credit use full service instead.

The materials, remaining cash and enough provisions for the entire repair must be aboard before confirming. Confirmation verifies the quote against current state. Materials are never pulled automatically from the port market. This service grants no new skill progression and introduces no repairs during encounters.

## Saves, checks and remaining scope

Church checkpoints already include all quantities, cost lots and ship condition; restoring them restores spoilage and consumption outcomes exactly. No new database migration or retroactive decay is required.

Automated tests cover fractional decay, time-splitting equivalence, port time, travel/encounter delays, early failure, input cost transfer, unknown costs, conversion resale learning, stale/malformed quotes, capacity limits, material consumption, full-service compatibility, checkpoint restoration and rendered service controls. The engine playtest script sells the remaining whole quantity after spoilage.

Still deferred: perishability for additional goods, per-good price volatility, medicine/injury treatment, ammunition consumption and cannon installation, additional repair skills, and the naval combat redesign. Interactive desktop/mobile visual testing remains unavailable in this environment; component rendering and production compilation are checked.
