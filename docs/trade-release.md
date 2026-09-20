# Implemented trade release

This records the first trade release. [Trade phase two](trade-phase-two.md) supersedes the locked-access limitations, adds standing-based spreads, permits, smuggling, local events and planning tools.

This release implements the accepted scope in `trade-release-draft.md`, with the adjustments recommended by `trade-validation.md`. Those documents remain the planning and offline validation record.

## Store and Journal

All 45 catalogue goods are present, with fictional prices, hold space and weight in `src/goods.ts`. Common Cloth retains the old `cloth` save identifier. Provisions remain the ship's food inventory and can also be sold.

The Store supports name/category filtering and one basket containing purchases and sales. Each good can occur once, in one direction. Exact integrated line totals, purchase/sale totals, final silver including hourly wages, transferred hold load, weight and Trade learning are shown before confirmation. Sales fund purchases and free space within the deal. Confirmation takes one game hour, with normal wages and food consumption. Keep at least that hour's food aboard; the deal cannot starve the crew immediately.

Settlement rechecks all quantities, stock, access, silver and both ship capacities. Invalid or stale deals change nothing. Prices and skill tier are fixed for the whole quote; learning is applied afterward. The Store resets the basket following a successful action.

Journal Skills includes Trade. Journal Markets contains dated observations from visited ports, including the Trade tier at observation. Unvisited ports have no remembered prices. Port actions refresh local observations; time passing at sea never refreshes remote memories. Cargo displays occupied goods with actual hold/weight usage. Journal remains read-only.

## Markets and balance

Each captain has independent market state. Initial ordinary stock targets are Export 4,000, Neutral 2,000, Import 1,000; storage maximum is twice target. Luxury stock uses 2% of those amounts. Provisions start at 100,000, max 200,000, Neutral everywhere. There is no infinite or emergency supply exception.

Elapsed in-game time recovers stock toward target exponentially: `target + (stock - target) * exp(-days / tau)`. Recovery constants are 5 days for exports, 7 for neutral, 10 for imports, and 20 for provisions. Fractional stocks are retained internally. Repeated observations do not reset recovery.

Reference price = catalogue base × role multiplier (0.70 / 1.00 / 1.40) × scarcity. Scarcity = clamp(`1.4 - 0.4 * stock / target`, 0.65, 1.50). Spread = max(5%, 15% - Trade tier × 1%). Buys add spread, sales subtract it. The quote integrates prices across the quantity's stock path, then rounds each complete buy line up and sale line down. Indicative unit prices are therefore not a promise of a fixed price for the entire quantity.

Initial specialization is fictional game balance:

| Port | Exports | Imports |
| --- | --- | --- |
| Bridgetown | Sugar, Molasses, Rum, Cotton, Salted Fish, Hides | Tools, Common Cloth, Timber, Medicine, Coffee, Fine Cloth, Iron, Paper, Books, Tea, Porcelain |
| Saint-Pierre | Coffee, Cocoa, Tobacco, Fruit, Timber, Planks, Pitch and Tar, Wine | Sugar, Molasses, Common Cloth, Iron, Tools, Salt, Copper, Ceramics, Glassware, Silverware |
| Willemstad | Common Cloth, Fine Cloth, Tools, Iron, Copper, Salt, Sailcloth, Rope, Paper, Books, Glassware, Ceramics, Tea, Perfume, Porcelain, Jewelry, Silverware, Spices | Coffee, Cocoa, Tobacco, Sugar, Molasses, Cotton, Fruit, Hides, Timber, Planks, Grain, Salted Meat |

All other listings are Neutral. Weapons, Gunpowder, Cannons and Bombs are Controlled in all three ports; their legal trading is unavailable until access mechanics exist. Access and role are independent.

## Trade learning

Trade tiers run from 0 to 10, with the same `10 * 2^tier` next-tier threshold as Sailing. Fractional points and overflow carry forward. Each tier improves the spread by one percentage point.

Purchased cargo retains compact FIFO lots with port and acquisition price curve. Sale learning is 1 point per 100 silver of positive marginal resale profit on cargo purchased at another port, before voyage expenses. Each matched portion earns max(0, resale price minus acquisition price), using unrounded prices. Unprofitable portions earn nothing, even if they belong to an otherwise profitable basket. Gift/starting cargo, unknown legacy cost and same-port resale earn nothing. This attribution prevents splitting an identical stock path into smaller deals from earning extra points. Different elapsed time or an intervening tier gain can legitimately change prices.

Provisions consumed in port or at sea also consume their FIFO provenance. This prevents selling and learning again from food already eaten.

## Contracts and existing saves

New rewards, rounded to nearest silver:

- Letter: `20 + distance * 1.04`.
- Freight: `20 + distance * quantity * 0.0432`.
- Passengers: `30 + distance * count * 0.69`.

Letter Sailing rewards remain `ceil(distance / 100)`. Accepted contracts retain their stored silver and skill rewards.

Older saves initialize independent markets at their current game time and remember their current port, if ashore. Existing quantities and ship state remain intact; old cargo has unknown acquisition cost and earns no Trade points. Checkpoints contain stock epochs, price memories, FIFO lots and skills. Restoring a checkpoint restores all of them, without overwriting other checkpoints.

## Deferred

Smugglers, permits, reputation-based access/pricing, market events, spoilage, new uses for medicine/materials/ammunition, and combat changes remain deferred. Shipyards continue to include their own materials in service prices. Spare cannon goods cannot be installed or converted into the ship's mounted guns.

## Verification

Automated tests cover atomic mixed baskets, stale and malformed deals, stock/capacity limits, recovery, same-port round trips, fractional/FIFO learning, split-sale invariance, provision consumption, tier changes, old quest rewards, checkpoint restoration, and component rendering. Production TypeScript/Vite compilation is also required. An interactive browser visual check was not available in this environment.
