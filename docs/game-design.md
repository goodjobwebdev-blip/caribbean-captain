# Agreed game design

Recorded 2026-09-19 from the project discussion. This is a requirements baseline, not a claim that the game is implemented.

## Experience and scope

The player is a captain in a single-player browser game. The interface uses prose, action buttons, and clear status information. Economic planning leads the first version. Crew stories, exploration, and richer danger can grow in later versions. A visual map is deferred.

The long-term ambition is to sail, earn money, and improve a fleet. The first version deliberately uses one predefined ship: no ship purchases, upgrades, outfitting, or multiple-ship management.

## Starting situation and world

The player starts in Bridgetown with a small predefined ship, minimum crew, initial provisions, and enough silver for a first trading voyage. Exact amounts and ship statistics are undecided.

| Island | Town | Status |
| --- | --- | --- |
| Barbados | Bridgetown | Agreed starting location |
| Martinique | To be selected | One town in the first version |
| Curaçao | To be selected | One town in the first version |

Use real islands. The historical year and the other town names have not been chosen. The broader concept includes England, France, the Dutch, Spain, and pirates; national reputation and flag-changing mechanics are not part of the agreed initial feature set.

## Port services

Each town provides the following services:

| Location | Actions |
| --- | --- |
| Tavern | Sleep; hire crew |
| Store | Buy and sell trade goods; buy provisions |
| Harbour Master | Accept freight, letter-delivery, and passenger tasks for silver |
| Shipyard | Repair the ship through one simple repair action |
| Church | Create checkpoints for the current profile |

The ship has a single overall condition rather than separate hull, sail, or cannon damage. Repair pricing, duration, and quantity remain to be balanced.

## Time and sailing

Track months, days, and hours. Time advances through player actions, without real-world waiting. Some actions cost hours; voyages take days.

Port-to-port routes have predefined base sailing times. Weather and encounters can change voyage duration. Seasonal influences belong to the original sailing concept, but their initial implementation scope and numerical rules still need to be selected.

Opening hours and other time-dependent availability are deferred. Later, shipyards may open only during the day, making sleep at a tavern or aboard the ship useful. Tavern sleep itself is included now.

## Economy

Silver is the currency. The player earns it by trading and completing contracts, and spends it on provisions, crew costs, and repairs.

Provisions are consumed according to crew size and elapsed game time. Crew wages create an additional ongoing expense. Trade cargo, provisions, and freight compete for limited hold capacity.

Goods can be bought in one port and sold in another. Freight, letters, and passengers are distinct contract types offered by the Harbour Master. Exact prices, goods, wages, rewards, capacity rules for passengers, deadlines, and failure penalties are not yet agreed.

Economic decisions should revolve around expected earnings, hold space, provisions, travel time, and possible setbacks.

## Dice and sea encounters

Use 2d6: roll two six-sided dice and add the results.

There are two separate roll stages:

1. Every port-to-port voyage gets an encounter roll. A total of **2 triggers a pirate attack**. The meaning of 3–12 has not yet been assigned.
2. During an encounter, the player chooses **flee**, **negotiate**, or **fight** before a new roll resolves that action and its consequences.

The voyage roll must not be confused with the action-resolution roll. With fair independent dice, the pirate trigger has a probability of 1/36 per voyage, approximately 2.78%.

The earlier proposed action bands were 2–6 setback, 7–9 mixed outcome, and 10–12 success, with possible small ship/crew modifiers. The user's explicit confirmation established the three actions and their rolls; the bands, modifiers, and exact consequences remain provisional rather than locked rules.

The first version does not implement tactical naval combat. Consequences such as lost silver, cargo, provisions, time, crew, or ship condition need an explicit action table before implementation. No specific consequence amounts are currently approved.

## Profiles and checkpoints

Support unlimited profiles and unlimited checkpoints within each profile: no artificial game-defined count limit, subject to the practical capacity of the chosen storage system.

A church in every town provides checkpoint creation. The player can continue from a chosen checkpoint after a setback. Checkpoints must belong to their corresponding profile and restore its game state.

This replaces the earlier suggestion of one overwritten checkpoint. Saving is intended to be free, as proposed and accepted in the church discussion. Preserving the current session when the browser closes is also part of the accepted save proposal; its exact autosave behavior and persistence technology remain to be designed.

## Optional LLM dialogue

Settings allow the player to enter a nano-gpt.com API key and select a model from a searchable dropdown.

The core dialogue, available actions, and underlying answers are predefined. The LLM dresses those answers in NPC prose, such as a trader's response, tavern keeper's greeting, or Harbour Master's offer. Distinct personalities and voices for individual NPCs are not required initially.

The game, not the LLM, determines prices, contract terms, inventory, available actions, dice outcomes, and rewards. Fixed UI details remain authoritative. Generated text must not execute actions or change game state.

The game remains playable using predefined text without an API key or when generation fails. Request timing and limits, the model-list API, browser access support, and credential persistence are implementation decisions still to be checked. Never put actual API keys into repository content or game checkpoints.

## Deferred ideas

- Buying better ships, outfitting, and managing a fleet.
- Officers, perks, experience, and deeper crew systems.
- Tactical naval combat beyond the initial action rolls.
- National allegiance, reputation, and changing flags.
- Untowned islands, bays, beaches, coves, and anchoring outside towns.
- Treasure maps bought in taverns, found in captured-ship chests, or awarded by rare quests; treasure expeditions.
- A visual Caribbean map.
- Business opening hours and sleeping aboard the ship.
- More islands and towns, richer encounters, and distinct NPC personalities.

These preserve the broader vision without making them requirements for the first playable version.
