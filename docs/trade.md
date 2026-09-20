# Trade system

This document defines the planned trade system: goods, port markets, stock, access restrictions, pricing, and market information.

The playable core is documented in [trade release](trade-release.md). The next release adds [planning tools, permits, reputation, smugglers and events](trade-phase-two.md). The following [supply mechanics release](trade-phase-three.md) adds fruit spoilage, food conversion and repairs using cargo materials. This document retains the broader design, including other deferred operational uses.

## Design goals

The trade system should:

- Give every port a recognizable economy.
- Reward moving goods between export and import markets.
- Make operational supplies part of the economy.
- Connect prices to the Trade skill, faction attitude, and global reputation.
- Support legal and illegal trading.
- Prevent immediate buy-and-resell exploits.
- Create changing opportunities through finite stock and events.
- Connect cargo space and Current Deadweight to trading decisions.

## Goods catalog

The initial catalog contains 45 goods.

Every listed good can be bought and sold for profit where market access and stock permit.

### Operational supplies

| Good | Operational use |
| --- | --- |
| **Provisions** | Consumed by crew and passengers |
| **Medicine** | Used to treat the captain and injured crew |
| **Rum** | Trade commodity; may later influence morale or events |
| **Planks** | Used to repair Hull Points |
| **Sailcloth** | Used to repair Sail Condition |
| **Rope** | Used for ship maintenance and future rigging mechanics |
| **Tools** | Used for repairs and crew Equipment Quality |
| **Gunpowder** | Required when firing cannons and firearms |
| **Cannons** | Can be installed or used to replace destroyed cannons |

Sailcloth is the trade-good name for spare sail material. Timber and Planks remain separate: Timber is raw material, while Planks are prepared repair material.

Cannons are heavy cargo. Installed cannons also contribute to Current Deadweight.

### Cannon ammunition

#### Round Shot

- Standard baseline cannon ammunition
- Longest effective range
- Balanced damage against Hull Points
- Used as the reference ammunition for cannon formulas

#### Chain Shot

- Shorter range than Round Shot
- Primarily damages sails and rigging
- Reduces Sail Condition

#### Grapeshot

- Shortest effective range
- Primarily targets exposed crew
- Useful before boarding

#### Bombs

- Cause greater hull damage than Round Shot
- Have shorter effective range
- Are heavier and more expensive
- May be Controlled in many ports
- May eventually introduce an explosion risk while stored or fired

A cannon attack is expected to consume both Gunpowder and one unit of the selected ammunition. Exact consumption rules belong to naval combat design.

### Agricultural goods

- Sugar
- Molasses
- Coffee
- Cocoa
- Tobacco
- Cotton
- Indigo
- Spices
- Grain
- Fruit

### Preserved food goods

- Salt
- Salted Fish
- Salted Meat

These are trade cargo rather than immediately usable Provisions. A future service or skill may allow suitable food goods to be converted into Provisions.

### Raw and industrial materials

- Timber
- Iron
- Copper
- Pitch and Tar
- Hides

### Manufactured goods

- Common Cloth
- Fine Cloth
- Weapons
- Furniture
- Ceramics
- Glassware
- Paper
- Books

Weapons represent crates of trade weapons. They are separate from weapons equipped in the captain's personal equipment slots.

### Luxury goods

- Wine
- Tea
- Perfume
- Porcelain
- Jewelry
- Silverware

## Goods data

Each good should eventually define the following data:

| Field | Purpose |
| --- | --- |
| **ID** | Stable internal identifier |
| **Name** | Player-facing name |
| **Category** | Supplies, ammunition, agricultural, preserved food, industrial, manufactured, or luxury |
| **Base Price** | Starting point for market-price calculations |
| **Cargo Space** | Hold space consumed per unit |
| **Weight** | Contribution to Current Deadweight per unit |
| **Default Access** | Whether the good is normally Open or commonly Controlled |
| **Perishable** | Whether the good deteriorates over time |
| **Operational Use** | Repair material, medicine, provision, gunpowder, ammunition, or other use |
| **Rarity** | Helps determine stock and restocking |
| **Volatility** | Controls sensitivity to shortages and events |

Cargo Space and Weight are separate.

A bulky, light good may fill Cargo Capacity before reaching Deadweight Capacity. A compact, heavy good may reach Deadweight Capacity while cargo space remains.

## Port markets

Each port defines a market listing for every good it handles.

A listing has two independent classifications:

1. **Market Role** — Export, Neutral, or Import
2. **Access** — Open or Controlled

Controlled is not a market role. A Controlled good can still be an Export, Neutral good, or Import.

Goods not listed by a port are Unavailable there.

## Market roles

### Export

The good is produced locally or regularly supplied.

Exports generally have:

- Higher Target Stock
- Higher Maximum Stock
- Faster restocking
- Lower reference prices

Ports are usually good places to buy their exports.

### Neutral

The good has ordinary local supply and demand.

Neutral goods generally have:

- Moderate stock
- Moderate restocking
- Prices close to Base Price

### Import

The good is locally demanded and not produced in sufficient quantity.

Imports generally have:

- Lower stock
- Strong consumption
- Higher reference prices

Ports are usually good places to sell their imports.

## Market access

### Open

Any player who can use the port market may legally buy and sell the good.

### Controlled

Legal trading requires one or more of:

- Sufficient attitude from the port's faction or nation
- A permit
- A special status or quest outcome

A player who lacks legal access may attempt to trade through Smugglers.

A Controlled listing initially applies to both buying and selling. Direction-specific restrictions may be added later if needed.

### Unavailable

The port does not trade the good through its normal market.

Availability through quests, captured ships, or Smugglers remains possible.

## Smugglers

Smugglers can provide access to Controlled or otherwise unavailable goods.

Smuggler trading may involve:

- Higher buying prices
- Lower selling prices
- Limited stock
- Irregular availability
- Discovery risk
- Confiscation
- Fines
- Faction-attitude loss
- Global reputation changes
- Arrest or combat encounters

Trade skill may improve Smuggler prices.

Positive legal reputation may help in legal markets but provide little benefit with Smugglers. Negative or notorious reputation may harm legal prices while improving access or terms in criminal markets.

Exact Smuggler rules will be defined separately.

## Finite stock

Every port-good listing tracks:

| Field | Meaning |
| --- | --- |
| **Current Stock** | Quantity currently available |
| **Target Stock** | Normal stock level |
| **Maximum Stock** | Storage or market limit |
| **Daily Supply** | Quantity added through local production or background trade |
| **Daily Consumption** | Quantity removed through local demand |
| **Last Updated** | Game time when stock was last recalculated |

Buying reduces Current Stock.

Selling increases Current Stock, up to Maximum Stock.

Stock changes as game time advances. Ports move gradually toward their characteristic market conditions:

- Export goods replenish quickly.
- Neutral goods replenish and consume at moderate rates.
- Import goods are consumed quickly and depend more heavily on incoming trade.

A port cannot sell more than its Current Stock.

A port may refuse to buy beyond Maximum Stock. Alternatively, the final units may receive a very poor price; that behavior will be chosen during balancing.

## Price calculation

Every market displays separate prices for buying and selling.

### Market reference price

The market first calculates a reference price:

**Reference Price = Base Price × Market Role Modifier × Scarcity Modifier × Event Modifier**

### Market Role Modifier

- Export modifier is less than 1.
- Neutral modifier is 1.
- Import modifier is greater than 1.

Exact values will be balanced separately.

### Scarcity Modifier

Scarcity compares Current Stock with Target Stock.

- Stock below Target Stock increases price.
- Stock near Target Stock keeps price near normal.
- Stock above Target Stock decreases price.
- Volatile goods react more strongly.
- The modifier must have minimum and maximum limits.

### Event Modifier

Temporary events may change the price of one good, a category, a port, or an entire region.

Examples include:

- Good or failed harvests
- Storms
- Epidemics
- War
- Blockades
- Festivals
- Construction projects
- Military demand
- Pirate activity
- Shipwreck salvage

## Merchant spread

The market applies a spread around the Reference Price.

The player pays above the Reference Price when buying and receives below it when selling.

**Effective Spread = Base Spread − Trade Effect − Attitude Effect − Reputation Effect**

The result is limited between a Minimum Spread and Maximum Spread.

### Legal-market prices

**Buy Price = ceil(Reference Price × (1 + Effective Spread))**

**Sell Price = floor(Reference Price × (1 − Effective Spread))**

This structure prevents buying and immediately reselling the same good for guaranteed profit.

### Trade skill

The player's Trade mastery tier narrows the spread:

- Buy prices become lower.
- Sell prices become higher.
- The effect has a cap.
- Trade skill cannot reduce the spread below Minimum Spread.

Trade skill may also improve price information, Smuggler negotiations, and large-transaction quotes later.

### Faction attitude

Faction attitude affects legal-market terms in ports controlled by that faction or nation.

- Positive attitude narrows the spread.
- Negative attitude widens the spread.
- Very negative attitude may block legal trading.
- High positive attitude may unlock Controlled goods.

### Global reputation

Global reputation affects how merchants trust and treat the captain.

- Positive reputation can improve legal-market terms.
- Negative reputation can worsen legal-market terms.
- Notorious or criminal reputation may improve Smuggler access or terms.
- Reputation effects should remain smaller than the effect of a port's Market Role and current stock.

### Smuggler prices

Smugglers use a wider base spread and an additional risk premium.

**Smuggler Spread = Smuggler Base Spread − Trade Effect − Underworld Reputation Effect**

Faction attitude does not normally improve Smuggler prices, although local criminal relationships may be added later.

## Quantity and price movement

Transactions immediately change Current Stock.

Large transactions therefore change later prices:

- Buying a large quantity creates scarcity and raises subsequent prices.
- Selling a large quantity creates surplus and lowers subsequent prices.

The market should quote the complete transaction before confirmation.

The implementation may calculate one price for the full transaction or use price bands for batches. Exact bulk-pricing behavior will be defined during balancing.

## Market information

At the current port, the player sees live:

- Buy Price
- Sell Price
- Current Stock
- Market Role
- Access status

For other visited ports, the player sees the last known:

- Buy Price
- Sell Price
- Observed Stock or stock description
- Observation date and time

Remote information does not update automatically.

Visiting a port refreshes its market information. Smuggler prices are recorded only after the player gains access to that port's Smuggler market.

Old information remains visible but is clearly marked with its observation date.

## Historical subject policy

Slavery may be acknowledged as part of the historical setting, society, quests, and narrative.

Enslaved people are never represented as player-traded goods or cargo.

Any future narrative treatment should be deliberate and handled in a separate design discussion.

## Design parameters and remaining decisions

The core numerical values, inventories, bulk pricing, permits, smuggler rules and initial events below now have initial implementations in the linked release documents. Other operational uses and additional perishable goods remain deferred; balance values can still be revised.

The following details will be defined separately:

- Base prices
- Cargo Space and Weight values
- Exact port inventories
- Export, Neutral, and Import assignments
- Controlled-good assignments
- Initial, Target, and Maximum Stock
- Daily Supply and Consumption
- Market Role multipliers
- Scarcity formula and limits
- Merchant spreads
- Trade-skill modifiers
- Faction-attitude modifiers
- Reputation modifiers
- Smuggler prices and risks
- Event frequency and effects
- Perishable-goods rules
- Bulk-pricing behavior
- Conversion of food goods into Provisions
- Repair-material consumption
- Cannon and ammunition weights
- Naval-combat ammunition consumption
- Permits and inspections

## First release planning

See [confirmed release decisions and draft balance](trade-release-draft.md) for the agreed initial scope, large finite provision stocks, and proposed deal/price/stock rules. The multi-good basket deal is agreed: one combined quote and confirmation for purchases and sales. The core trade system and the subsequent planning/access/event phase are implemented. See [current additions and rules](trade-phase-two.md) and [game-engine playtest results](trade-playtest.md).
