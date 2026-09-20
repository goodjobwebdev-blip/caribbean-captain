# Remaining design decisions

The first playable version uses the provisional numbers in [balance.md](balance.md). The three ports, straight-line coordinate system, 2d6 bands, and church-only recovery are agreed.

Topics to revisit after playing:

- Economic balance: starting money, prices, wage rates, and contract rewards.
- Whether unpaid-wage consequences should escalate beyond the implemented morale and discipline penalties.
- Whether to block underprovisioned departures or keep the current explicit warning.
- Historical year and calendar; current months are a simple 30-day abstraction.
- Seasonal weather, tuning the implemented crew experience rates, and further balancing of the implemented ship-performance formulas.
- Contract deadlines, market stock, and price changes.
- Checkpoint deletion, save export/import, and cross-device support.
- Further towns, anchorages, national reputation, and treasure hunting.

The current NanoGPT integration uses direct browser calls, a searchable model selector, tab-memory keys, and predefined fallback prose. Authenticated generation must still be checked with the player's key; browser/API restrictions may require revisiting the integration.
