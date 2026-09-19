# Trade economy and ship price proposal

Status: design proposal, not implemented. The agreed direction is that planned,
skilled trading should provide more income than routine contracts. Numerical
values below remain playtesting targets. Current mechanics are in [balance.md](balance.md).

## Income targets

Contracts provide dependable income without requiring the captain to purchase
trade cargo. Trading rewards working capital, route choice, cargo allocation,
and eventually Trading skill. Skill bonuses should be modest enough that route
planning still matters.

For Bridgetown–Saint-Pierre, propose:
- Letter: 80 silver.
- Freight: 120 silver for 40 cargo units.
- Passengers: 150 silver for three people.
- Favorable trade: 250–400 silver margin per 100 goods units, before operating expenses.

These are short-route targets, not flat rewards for every destination.
Freight should scale with quantity and distance; passengers with count and
distance; letters with distance. Exact route formulas remain to be defined.
Keep contract prices independent of the player's actual sailing time so faster
ships do not receive smaller rewards.

At 49 hours, ten crew cost 40.83 silver in wages. Thirteen people consume
26.54 provisions worth the same amount of silver. All three proposed contracts
therefore yield 282.63 silver after sailing expenses, before port time, damage,
encounters, or additional delays.

Adding 100 units of personal goods at the target margin produces approximately
533–683 silver per successful leg before those extra costs. The combined
departure load with 120 provisions and 40 freight units occupies 260 of the
starting sloop's 300 cargo-space units. Cargo capital must be preserved for the
next voyage; sale revenue is not all disposable profit.

The current sugar trade from Bridgetown to Saint-Pierre earns only 200 silver
per 100 units, so the target margin requires a goods-price revision. Existing
regional prices are not yet changed. The 800-silver starting purse also limits
initial cargo investment: higher earnings assume reinvesting early profits.

## Revised ship prices

Prices include each configuration's default installed cannons and full repairs.
The starting Universal Sloop is already owned and does not cost the new captain
silver. These prices supersede the earlier conversational 3,000-silver sloop
proposal. Rows represent anchor configurations, not every supported variant.

| Tier | Configuration | Purchase price (silver) |
| --- | --- | ---: |
| 1 | Universal Tartana | 4,000 |
| 1 | Universal Cutter | 6,000 |
| 2 | Universal Sloop | 12,000 |
| 2 | Universal Schooner | 14,000 |
| 3 | Universal Brigantine | 30,000 |
| 3 | Merchant Fluyt | 36,000 |
| 4 | Universal Brig | 65,000 |
| 4 | War Corvette | 80,000 |
| 4 | Merchantman | 75,000 |
| 5 | Universal Galleon | 150,000 |
| 5 | War Frigate | 180,000 |
| 6 | Grand Merchantman | 300,000 |
| 6 | Universal War Galleon | 360,000 |
| 6 | Man-of-war | 500,000 |

Tier and class labels do not themselves multiply prices or performance.
Individual configurations have explicit prices and specifications.
Upper-tier prices are provisional progression anchors, not validated against
a complete late-game economy. Large freight jobs and meaningful combat
performance are needed to assess merchant and warship earning potential.

## Sale value and first replacement

Proposed sale value for the default loadout:
max(0, floor(0.70 × purchase price − quoted repair cost)).

Installed equipment stays with the sold ship initially. Valuation of altered
loadouts and missing cannons must be defined before outfitting is implemented,
so destroyed or removed equipment cannot retain full resale value.
Prevent repair costs or equipment valuation from creating profitable buy/sell loops.

Example, fully repaired Universal Sloop to Universal Schooner:
- Schooner purchase price: 14,000 silver.
- Sloop sale value: 8,400 silver.
- Net payment: 5,600 silver.
- Additional suggested cash reserve: 1,000 silver, separate from trade inventory.
- Two additional sailors to reach the proposed optimal crew: 50 silver at the current hire rate.

Building 6,650 silver at the illustrative 533–683 surplus takes about 10–13
successful short voyage legs. This is a planning estimate, not a simulated
progression guarantee: port time, early capital constraints, repairs, weather,
and route direction can lengthen it. Existing disposable cash can shorten it.
A voyage here is one port-to-port leg, not a round trip.

The schooner is a speed-focused alternative with less cargo in the proposed
specifications; it is not a mandatory upgrade for a trader. A captain can keep
the sloop and save for a brigantine or fluyt. Balance the larger cargo options
against realized profits from repeated outbound and return trade runs.

## Before implementation

1. Define revised regional buy/sell prices and route-scaled contract formulas.
2. Check profitable trade in both directions, capital requirements, port time,
   weather reserves, and provision capacity on long routes.
3. Simulate several voyage sequences, including contract-only and mixed trading.
4. Adjust prices and progression from those results, then implement replacement
   purchases and save migration.

Supply/demand variation and Trading skill effects are future mechanics.
Fixed regional prices are sufficient for the first pass. Ship capture remains deferred.
