# Caribbean Captain

A single-player text-based browser game about sailing, trading, and keeping a small ship afloat.

[Play the game](https://goodjobwebdev-blip.github.io/caribbean-captain/)

## First playable version

Create a captain in Bridgetown. Visit the church to make your first checkpoint, buy provisions and trade goods, take a Harbour Master contract, and sail to Saint-Pierre or Willemstad. Pirate encounters use two six-sided dice and let you flee, negotiate, or fight. Repair at the shipyard and hire crew or sleep at the tavern.

Failure is recoverable only from a church checkpoint. Profiles and checkpoints are local to your browser. Current-session resume includes failed voyages; it is not an undo button. There is no artificial profile/checkpoint limit, but browser storage capacity applies.

Optional NanoGPT dialogue can be enabled in Settings with your own API key and model. Keys stay in tab memory and clear on refresh. The game works with predefined text when AI is disabled or unavailable. AI never determines prices, rewards, rolls, or actions.

## Development

Node.js 22.12+ (CI uses Node 24).

```sh
npm ci
npm run dev
npm test
npm run build
```

Vite serves the app under `/caribbean-captain/`. Production output is `dist/`.

Stack: React, TypeScript, Vite, plain CSS, IndexedDB. Game rules live in `src/game.ts`, separate from the interface and optional LLM calls. Vitest covers travel, economy, failure, and checkpoint persistence.

## Documentation

- [Game design](docs/game-design.md)
- [Player skill system](docs/skills.md)
- [Game stats](docs/stats.md)
- [Provisional balance and world coordinates](docs/balance.md)
- [Remaining decisions](docs/open-decisions.md)
- [Deployment](docs/deployment.md)
