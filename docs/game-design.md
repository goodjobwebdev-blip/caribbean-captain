# Agreed game design

Recorded 2026-09-19 from the project discussion. Updated with the first playable implementation. Numerical values are provisional; see [balance](balance.md).

## Experience and scope

The player is a captain in a single-player browser game. The interface uses prose, action buttons, and clear status information. Economic planning leads the first version. Crew stories, exploration, and richer danger can grow in later versions. A visual map is deferred.

The long-term ambition is to sail, earn money, and improve a fleet. The current game allows one owned ship, purchased by selling the previous ship in the same exchange. There are 28 predefined configurations across six tiers; fleets and custom outfitting are deferred. See [ships](ships.md).

## Starting situation and world

The player starts in Bridgetown with The Wayfarer, a Universal Sloop, 10 crew, 120 provisions, and 800 silver.

| Island | Town | Status |
| --- | --- | --- |
| Barbados | Bridgetown | Agreed starting location |
| Martinique | Saint-Pierre | Agreed first town |
| Curaçao | Willemstad | Agreed first town |

Use real islands. The historical year has not been chosen; the calendar uses a fictional Year 1. The broader concept includes England, France, the Dutch, Spain, and pirates; national reputation and flag-changing mechanics are not part of the agreed initial feature set.

## Port services

Each town provides the following services:

| Location | Actions |
| --- | --- |
| Tavern | Sleep; hire crew |
| Store | Buy and sell trade goods; buy provisions |
| Harbour Master | Accept freight, letter-delivery, and passenger tasks for silver |
| Shipyard | Compare and exchange ships; repair hull or sails; replace missing default cannons |
| Church | Create checkpoints for the current profile |

Ships track hull points, sail condition, and operational cannons separately. The prototype encounters currently damage the hull only, by percentage of maximum hull. Ship speed, hold capacity, crew limits, and passenger berths depend on the purchased configuration. Weight, hull condition, sails, and crew count now affect performance; detailed combat effects remain deferred. See [ship performance](ship-performance.md).

## Time and sailing

Track months, days, and hours. Time advances through player actions, without real-world waiting. Some actions cost hours; voyages take days.

Route distances are calculated as straight lines between anchorage coordinates in fictional distance units. Bridgetown is (0, 0); X increases east and Y increases north. The reference speed is 1 unit per hour. Travel time is distance divided by ship speed, rounded up to an hour. Weather and encounters can change duration. Coastlines and waypoints are ignored. Seasons are deferred. See [balance](balance.md) for provisional coordinates.

Opening hours and other time-dependent availability are deferred. Later, shipyards may open only during the day, making sleep at a tavern or aboard the ship useful. Tavern sleep itself is included now.

## Economy

Silver is the currency. The player earns it by trading and completing contracts, and spends it on provisions, crew costs, and repairs.

Provisions are consumed according to crew size and elapsed game time. Crew wages create an additional ongoing expense. Trade cargo, provisions, and freight compete for limited hold capacity.

Goods can be bought in one port and sold in another. Freight, letters, and passengers are distinct contract types offered by the Harbour Master. Exact prices, goods, wages, rewards, capacity rules for passengers, deadlines, and failure penalties are not yet agreed.

Economic decisions should revolve around expected earnings, hold space, provisions, travel time, and possible setbacks.

## Dice and sea encounters

Use 2d6: roll two six-sided dice and add the results.

There are two separate roll stages:

1. Every port-to-port voyage gets an encounter roll. A total of **2 triggers a pirate attack**. Totals 3–12 mean clear passage in this version.
2. During an encounter, the player chooses **flee**, **negotiate**, or **fight** before a new roll resolves that action and its consequences.

The voyage roll must not be confused with the action-resolution roll. With fair independent dice, the pirate trigger has a probability of 1/36 per voyage, approximately 2.78%.

The user approved the action bands: 2–6 setback, 7–9 partial success, and 10–12 success. There are no dice modifiers in the first version. Each of flee, negotiate, and fight has its own provisional consequence table in [balance](balance.md).

The first version does not implement tactical naval combat. Provisions running out, ship loss, or losing the minimum sailing crew ends play. There is no rescue: recovery is only through an existing church checkpoint.

## Profiles and checkpoints

Support unlimited profiles and unlimited checkpoints within each profile: no artificial game-defined count limit, subject to the practical capacity of the chosen storage system.

A church in every town provides checkpoint creation. The player can continue from a chosen checkpoint after a setback. Checkpoints must belong to their corresponding profile and restore its game state.

Checkpoints are free and can only be created at church while alive and in port. The initial captain begins at the church, but no checkpoint is created automatically. Current-session progress is persisted separately after each action so reopening the browser resumes that state, including defeat; it is not an additional recovery checkpoint. Profiles and independent checkpoints use IndexedDB, without an artificial count limit. Checkpoints include the random generator state so restoring repeats the same future rolls for the same actions.

## Optional LLM dialogue

Settings allow the player to enter a nano-gpt.com API key and select a model from a searchable dropdown.

The core dialogue, available actions, and underlying answers are predefined. The LLM dresses those answers in NPC prose, such as a trader's response, tavern keeper's greeting, or Harbour Master's offer. Distinct personalities and voices for individual NPCs are not required initially.

The game, not the LLM, determines prices, contract terms, inventory, available actions, dice outcomes, and rewards. Fixed UI details remain authoritative. Generated text must not execute actions or change game state.

The game remains playable using predefined text without an API key or when generation fails. The UI fetches available models and filters them by search. With AI enabled, entering an NPC location requests a short rephrasing with a timeout. Keys remain in tab memory only and are never persisted. Browser/API failures use the predefined text. A live authenticated response still needs verification with the player’s own key. Never put actual API keys into repository content or game checkpoints.

## Deferred ideas

- Custom outfitting, configuration conversion, and managing a fleet.
- Officers, perks, experience, and deeper crew systems.
- Tactical naval combat beyond the initial action rolls.
- National allegiance, reputation, and changing flags.
- Untowned islands, bays, beaches, coves, and anchoring outside towns.
- Treasure maps bought in taverns, found in captured-ship chests, or awarded by rare quests; treasure expeditions.
- A visual Caribbean map.
- Business opening hours and sleeping aboard the ship.
- More islands and towns, richer encounters, and distinct NPC personalities.

These preserve the broader vision without making them requirements for the first playable version.
