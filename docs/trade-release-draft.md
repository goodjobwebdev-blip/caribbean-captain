# Trade release: decisions and draft balance

Status: design preparation only; no game implementation in this update.
The structure in [trade.md](trade.md) remains the source of the planned system.
Values marked as drafts below need balancing against voyage costs and contract
income before implementation.

## Confirmed decisions

- First release: all 45 goods, legal markets, finite stock, supply/demand prices,
  Trade skill, and remembered market information.
- Smugglers, permits, reputation effects, events, and spoilage follow later.
  Controlled listings remain visibly restricted until access rules exist.
- Operational goods can be traded. Their new repair/healing/ammunition uses
  remain deferred. Shipyards continue supplying materials in quoted services.
  Provisions remain consumable and become sellable.
- Trade progress comes from profitable sales of goods purchased in another
  port, proportional to trading profit before voyage expenses. Purchases alone
  grant nothing. Fractional progress accumulates across transactions.
- Prices should move during large transactions, with batching and deals.
  The precise meaning of a deal is still to be settled.
- Merchants respect available stock and remaining storage, and show limits.
- Provisions use ordinary finite stock, starting in huge quantities so shortages
  are extremely unlikely but still possible. There is no emergency supply
  exception or infinite stock.
- Rebalance future contract rewards alongside trade while preserving the
  rewards of already accepted contracts.

## Proposed deal interaction — awaiting clarification

A deal is one basket of buy and sell lines with the current merchant.
The player adjusts quantities, sees each line total, stock effects, resulting
cargo space/weight, and the final silver balance, then confirms once.

Suggested rules:
- One good has either a buy line or a sell line in a basket, not both.
- Buying/selling prices change as quantity moves stock within the quote.
- All lines settle together, or none do. No partial execution.
- Selling goods in a basket can fund purchases and release cargo space.
- A confirmed basket takes one hour, independent of the number of goods.
- Stock, access, funds, inventory, and final ship capacity are rechecked at
  confirmation. Failure does not consume time or change stock.
- Batching is how the price is calculated; it should not require the player
  to split a purchase into many clicks.

Alternative: a deal contains just one good and quantity. Confirm which meaning
is intended before implementing the interface.

## Draft pricing and skill settings

| Setting | Draft value |
| --- | --- |
| Export reference multiplier | 0.70 |
| Neutral reference multiplier | 1.00 |
| Import reference multiplier | 1.40 |
| Starting merchant spread | 15% |
| Spread reduction per Trade tier | 1 percentage point |
| Minimum spread | 5% |
| Trade starting mastery | Tier 0 |
| Trade progression | Same 10, 20, 40… tier thresholds as Sailing, carrying overflow |
| Trade point award | 1 point per 100 silver eligible realized trading profit |
| Scarcity multiplier | clamp(1 + 0.4 × (1 − stock / target), 0.65, 1.50) |
| Event / faction / reputation modifiers | Neutral until implemented |

Proposed quantity pricing: integrate or sum marginal unit prices along the stock
curve, with the same price path for buying and selling and a positive spread.
A midpoint/band implementation needs tests for reversibility and transaction
splitting. Merely quoting the opening price for a whole batch is insufficient.

The document's current per-unit integer rounding is problematic for low-price
goods: provisions with reference price 1 would buy for 2 and sell for 0.
Propose retaining fractional prices internally and rounding each completed buy
line total up and sell line total down, showing both the indicative unit price
and exact quoted line total. This is a proposed clarification, not an implemented
change to trade.md.

Record acquisition port and cost by inventory lot. Match sold and consumed
units consistently (proposed FIFO). Initial gifts and legacy inventory with
unknown cost grant no Trade profit points; newly purchased units do. Same-port
resales grant no Trade points. Retain fractional learning credit to prevent
extra points from splitting sales. Small rounding losses across separate deals
are acceptable; splitting must not produce extra profit or learning.

## Draft goods values

These are fictional balance values, not historical prices or measures.
Preserve the current Sugar, Rum, Cloth, and Provisions space/weight values.
Migrate the existing Cloth inventory to Common Cloth without quantity loss.
Existing installed cannons keep their weight of 5. A carried spare cannon uses
hold space; an installed cannon uses its dedicated mount.

| Category | Good | Base silver | Space | Weight |
| --- | --- | ---: | ---: | ---: |
| Supplies | Provisions | 1 | 1 | 0.25 |
| Supplies | Medicine | 40 | 0.5 | 0.25 |
| Supplies | Rum | 18 | 1 | 1.5 |
| Supplies | Planks | 12 | 2 | 2 |
| Supplies | Sailcloth | 20 | 1 | 0.5 |
| Supplies | Rope | 10 | 1 | 0.75 |
| Supplies | Tools | 30 | 1 | 2 |
| Supplies | Gunpowder | 24 | 1 | 1 |
| Supplies | Cannons | 200 | 5 | 5 |
| Ammunition | Round Shot | 8 | 0.5 | 2 |
| Ammunition | Chain Shot | 12 | 0.5 | 2 |
| Ammunition | Grapeshot | 10 | 0.5 | 1.5 |
| Ammunition | Bombs | 24 | 1 | 3 |
| Agricultural | Sugar | 10 | 1 | 2 |
| Agricultural | Molasses | 8 | 1 | 1.5 |
| Agricultural | Coffee | 28 | 1 | 0.75 |
| Agricultural | Cocoa | 24 | 1 | 0.75 |
| Agricultural | Tobacco | 32 | 1 | 0.5 |
| Agricultural | Cotton | 12 | 2 | 0.5 |
| Agricultural | Indigo | 45 | 0.5 | 0.5 |
| Agricultural | Spices | 60 | 0.5 | 0.25 |
| Agricultural | Grain | 5 | 1 | 1 |
| Agricultural | Fruit | 7 | 1 | 0.75 |
| Preserved food | Salt | 5 | 1 | 1.5 |
| Preserved food | Salted Fish | 10 | 1 | 1 |
| Preserved food | Salted Meat | 14 | 1 | 1.25 |
| Materials | Timber | 8 | 3 | 3 |
| Materials | Iron | 18 | 1 | 3 |
| Materials | Copper | 30 | 1 | 3 |
| Materials | Pitch and Tar | 12 | 1 | 1.5 |
| Materials | Hides | 16 | 2 | 0.75 |
| Manufactured | Common Cloth | 24 | 1 | 0.5 |
| Manufactured | Fine Cloth | 65 | 1 | 0.5 |
| Manufactured | Weapons | 80 | 1 | 2 |
| Manufactured | Furniture | 45 | 4 | 2 |
| Manufactured | Ceramics | 25 | 2 | 1 |
| Manufactured | Glassware | 40 | 2 | 1 |
| Manufactured | Paper | 18 | 1 | 0.5 |
| Manufactured | Books | 50 | 1 | 0.75 |
| Luxury | Wine | 35 | 1 | 1.5 |
| Luxury | Tea | 55 | 0.5 | 0.25 |
| Luxury | Perfume | 90 | 0.25 | 0.25 |
| Luxury | Porcelain | 75 | 1 | 0.75 |
| Luxury | Jewelry | 300 | 0.1 | 0.1 |
| Luxury | Silverware | 150 | 0.5 | 1 |

Spare-cannon commodity pricing is independent of the existing installed-cannon
replacement service until player-supplied cannon installation is implemented.
That later integration must reconcile service and commodity prices, rather
than granting free resale value from repeatedly installing/removing cannons.

## Draft stock profiles

| Listing | Initial / target stock | Maximum stock | Recovery time scale |
| --- | ---: | ---: | --- |
| Ordinary Export | 4,000 | 8,000 | 5 game days |
| Ordinary Neutral | 2,000 | 4,000 | 7 game days |
| Ordinary Import | 1,000 | 2,000 | 10 game days |
| Luxury/rare | 10% of ordinary profile | 10% of ordinary profile | Same initial time scale |
| Provisions, every port | 100,000 | 200,000 | 20 game days |

Draft supply/consumption model: supply = target / recoveryDays per day;
consumption = currentStock / recoveryDays per day. This approaches target
smoothly instead of resetting every visit or drifting permanently to maximum.
Calculate elapsed-time changes consistently so many short actions and one long
action yield the same result in the absence of intervening transactions.
Recovery time scale means about 63% of a stock disturbance is recovered in that
period; it is not a scheduled full reset.

Market state uses in-game elapsed hours only. Real-world time while the game is
closed does not advance stocks. Church checkpoints include market state and
remembered prices; restoring a checkpoint restores that economic timeline too.

## Draft port specializations

These are fictional game assignments, with no claim of historical accuracy.
Final per-good role/access matrices will be specified after the deal model.

| Port | Proposed export emphasis | Proposed import emphasis |
| --- | --- | --- |
| Bridgetown | Sugar, molasses, rum, cotton | Tools, common cloth, timber, medicine |
| Saint-Pierre | Coffee, cocoa, tobacco, fruit | Sugar, molasses, common cloth, iron |
| Willemstad | Cloth, tools, metals, salt | Coffee, cocoa, tobacco, sugar |

Other goods can fill secondary export/import routes; avoid making all high-value
goods profitable in only one direction. Each listing's access classification is
separate from its role. Provisions remain Open in all ports. Controlled-listing
assignments and rare goods' exact stock profiles still need a final pass.

## Draft new contract rewards

Use fixed route distance, not the player's actual sailing time:
- Letter: round(20 + distance × 1.04).
- Freight: round(20 + distance × amount × 0.0432).
- Passengers: round(30 + distance × passengerCount × 0.69).

On the short route these give approximately 80 silver for a letter, 120 for
40 freight units, and 150 for three passengers, matching the earlier economic
targets. Larger freight scales in quantity without multiplying the fixed fee.
Accepted old contracts keep their stored rewards and quantities.
No changes to battle, encounter chance, or Sailing rewards are part of this work.

## Next review

Settle the deal/basket meaning and rounding, then test route profits, working
capital, cargo/weight limits, stock movement, and upgrade pace against these
draft values. Do not treat the draft price and stock tables as validated balance.
