# Building commissions

Agreed 23 September 2026, roadmap item 4. The player approved both the destination-building split and keeping already accepted work at the Harbour Master.

| Work | Accept and deliver at |
| --- | --- |
| New small freight, 40 units | Store |
| New medium freight, 200 units | Store |
| Large freight, 800 units | Harbour Master |
| Letters and passengers | Harbour Master |
| Previously accepted contracts without a building | Harbour Master |

The Store host offers “Have you any work for my ship?” Both buildings show their own active and available commissions, grouped by destination. Delivery pays only matching commissions in the current town. The selected service panel stays open. The receiving NPC remembers completed work. Offers and the Journal identify the delivery building; arrival directs the captain to the Journal.

New offers carry a persisted building field. Missing fields always mean Harbour Master, including old saves, archives and restored checkpoints. Normalization does not reassign work by cargo size. Offer IDs and accepted-ID history are unchanged, preventing duplicate acceptance during the transition. The engine derives accepted terms from the canonical offer, not client-supplied contract details.

Rewards, three-contract global limit, daily offer refresh, hold and weight rules, reputation, skill rewards, and action time remain unchanged. One delivery action takes one hour per building, even if it completes several jobs. No automatic payment on arrival.

This document records item 4. Roadmap item 5 now adds medical deliveries, monk passengers, garrison supplies, official dispatches, and donations: see [easy commissions](easy-commissions.md). Escorts remain deferred.

Validation covers mixed old/new contracts, duplicate-payment prevention, building filtering, canonical acceptance, NPC completion memory, journal destinations, checkpoint-compatible normalization, and delivery through the service panel. Existing voyage tests now deliver new freight at the Store.
