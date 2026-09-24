# Caribbean Captain

A single-player text-based browser game about sailing, trading, and keeping a small ship afloat.

[Play the game](https://goodjobwebdev-blip.github.io/caribbean-captain/)

## First playable version

Create a captain in Bridgetown. Visit the church to make your first checkpoint, buy provisions and trade goods, take a Store or Harbour Master contract, and sail to any of 14 other colonial towns. Routes are grouped by island and searchable by town, island, or nation. Seeded ship contacts may be peaceful or hostile. Encounters can lead to naval schedules, crew Deck Battle, and Captain Duels. Compare 28 ship configurations across six tiers at the shipyard, sell your current ship toward a replacement, and repair hull, sails, or missing default cannons. Hire or release crew at the tavern. Load, hull, sails, and crew now affect sailing; check the Journal breakdown and carry 40, 200, or 800-unit freight jobs.

Failure is recoverable only from a church checkpoint. Profiles and checkpoints are local to your browser. Current-session resume includes failed voyages; it is not an undo button. There is no artificial profile/checkpoint limit, but browser storage capacity applies.

Optional NanoGPT dialogue can be enabled in Settings with your own API key and model. Keys stay in tab memory and clear on refresh. Port dialogue works with predefined text when prose AI is disabled. Naval Engagement and Boarding require the separate Battle model: it selects validated NPC actions while the engine controls costs, rolls, and outcomes. Missing or unavailable models suspend combat with Retry / Change Model. Capture Resolution now supports loot, release/ransom, a single-ship exchange, defeat losses, and return-to-port recovery. See [aftermath rules](docs/capture-resolution.md). Combat actions now earn capped skill practice. Buy personal weapons, a pistol and armour at the Blacksmith, clothes at the Weaver, and a spyglass at the Harbour Master; prepare weapons and cannon loadouts at the Harbour. The Journal shows your equipped outfit and appearance index. See [shops and equipment](docs/shops-and-equipment.md). The Journal tracks combat mastery, equipment and injuries. See [progression and equipment](docs/combat-progression-equipment.md). Crews now develop separate sailing, gunnery and fighting experience. The Tavern offers training, medical care and shore leave; battles and unpaid wages affect morale and discipline. See [crew development](docs/crew-development.md). See [battle release scope and validation](docs/battle-release.md).

Trade 45 goods through a basket with exact totals, finite stock, supply/demand pricing, and Trade skill progression. The Journal’s Markets tab remembers dated prices from visited ports. Provisions can be bought and sold. Buy national permits at the Harbour Master for Controlled goods, or meet a smuggler contact at the tavern. Local events and reputation affect prices. Compare remembered prices and cargo costs in the Journal. Fruit spoils over game time; prepare provisions from food cargo at the Store or supply your own repair materials at the Shipyard. See [implemented trade rules](docs/trade-release.md), [planning/access/events](docs/trade-phase-two.md), [spoilage and supplies](docs/trade-phase-three.md), and [engine playtests](docs/trade-playtest.md).

Journal → Finance now records automatic port-to-port voyage accounts and trade history, separating cash flow from cargo profit. Departure review adds a forecast using remembered prices. See [voyage finances](docs/voyage-finances.md).

Settings → Wiki contains the searchable in-game handbook, including rules, worked mechanics, and goods/ship reference tables. It is available without a captain profile and requires no AI connection.

## Development

Node.js 22.12+ (CI uses Node 24).

```sh
npm ci
npm run dev
npm test
npm run build
```

Vite serves the app under `/caribbean-captain/`. Production output is `dist/`.

Stack: React, TypeScript, Vite, plain CSS, IndexedDB. Game rules live in `src/game.ts` and `src/battle/`, separate from the interface and LLM requests. Vitest covers travel, economy, failure, and checkpoint persistence.

## Documentation

- [Capture Resolution and recovery](docs/capture-resolution.md)
- [Battle release](docs/battle-release.md)
- [Encounters](docs/encounter-system.md)
- [Naval Engagement](docs/naval-engagement-system.md)
- [Boarding and Captain Duels](docs/boarding-system.md)
- [Game design](docs/game-design.md)
- [Player skill system](docs/skills.md)
- [Game stats](docs/stats.md)
- [Ships and ownership design](docs/ships.md)
- [Implemented ship catalogue](docs/ship-catalogue.md)
- [Ship release behavior and limits](docs/ship-release.md)
- [Ship performance, loading, and freight](docs/ship-performance.md)
- [Trade system](docs/trade.md)
- [Trade economy and revised ship prices (proposal)](docs/economy-proposal.md)
- [Provisional balance and world coordinates](docs/balance.md)
- [Remaining decisions](docs/open-decisions.md)
- [Deployment](docs/deployment.md)

Trade implementation planning: [confirmed decisions and draft balance](docs/trade-release-draft.md), [balance validation](docs/trade-validation.md).

The world now includes 15 colonial towns across 13 island groups, with independent markets and Spanish national permits. See [world expansion and deferred locations](docs/world-expansion.md) and [port coordinates and market profiles](docs/world-port-data.md).

Buildings now open with a named host and dialogue choices. Hosts remember visits and completed dealings; service panels stay open after transactions. Optional AI prose adds contextual greetings and reactions without blocking the authored fallback. See [NPC dialogue](docs/npc-dialogues.md).

Small and medium freight jobs are accepted and delivered at Stores. Letters, passengers, large freight, and previously accepted contracts stay at Harbour Masters. The Journal records the delivery building. See [building commissions](docs/building-commissions.md).

Repeatable work now includes Church monk passages and parish donations, Pharmacy medical freight, Fort & Garrison supply deliveries, and Governor dispatches. See [easy commissions](docs/easy-commissions.md) and the [full quest difficulty roadmap](docs/quest-roadmap.md).

Shipyard outfitting now supports 6–32-pound cannons and culverins per battery, replaceable sail sets, and permanent hull reinforcement. Refits affect sailing, naval combat, repairs, and resale. See [ship outfitting](docs/ship-outfitting.md).
