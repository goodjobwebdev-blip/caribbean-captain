# Screens and actions

## Main navigation

The icon navigation has four destinations, each with a tooltip, accessible name, and selected state:

- **Gamespace** (compass): port interactions, sailing, encounters, and checkpoint creation/recovery.
- **Journal** (book): read-only inspection of the current captain and ship.
- **Captains** (captain silhouette): create or switch profiles.
- **Settings** (gear): appearance and optional AI dialogue.

Gamespace and Journal require an active captain. Journal remains accessible during encounters and after defeat. Navigating between screens never advances game time or resolves an encounter.

## Gamespace

Compact statistics appear only here: silver, provisions and days of food, crew and passenger count, hull percentage and ship name, hold usage, and current deadweight. The line above shows the captain, location, and game date.

A fixed bottom strip shows the latest captain's log entry. Expand it upward to read the scrollable history (the latest 60 stored entries). The strip is absent from other screens. Its expanded state does not alter game state. Escape closes the expanded log when keyboard focus is inside its history.

## Journal

Text-labeled, keyboard-navigable tabs:

- **Ship stats:** configuration, tier/class, hull points, sails, speed, hold, sale value, crew/berth limits, per-battery cannons, and design ratings; plus the captain's record. Multiplicative performance and weight breakdowns are visible; deferred combat effects are labeled.
- **Crew stats:** crew limits, wages, food consumption, and days of provisions.
- **Cargo:** trade goods, provisions, and contract freight.
- **Passengers:** occupied berths, provision needs, and passage destinations.
- **Quests:** Active and Archived views, including routes, payment, cargo/passenger requirements, and completion dates.

The archive retains completed contracts from this update onward. Older saves without an archive load with an empty archive; historical completions are not invented. Failed voyages show unfinished tasks in Archived as failed, without modifying the saved contracts. Restoring a checkpoint restores its corresponding quest history too.

## Terminology

**Gamespace actions** change the world through play: buying, selling, hiring, repairing, sailing, and taking or delivering quests.

**Journal actions** will later manage possessions and people, such as dumping cargo. No Journal actions exist yet; all tabs are informational. Personal skills and other management sections can be added later.
