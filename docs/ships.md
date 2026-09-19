# Ships: catalogue and ownership design

Status: design decisions and proposed catalogue; not yet implemented.
The current playable game still uses its original single-ship mechanics.
[Game stats](stats.md) defines the base, current, and calculated ship statistics.
[Trade economy and ship prices](economy-proposal.md) records the proposed income targets and revised price anchors.

## Agreed direction

- Loosely historical Caribbean; invented hull types and modified variants are allowed.
- Six ship tiers provide orientation by general scale. Tier 1 is the smallest and tier 6 the largest in the proposed catalogue.
- Three classes: Merchant, Warship, Universal. Tier and class are descriptive labels, not automatic stat bonuses or purchase restrictions.
- Some hull types support several class configurations; others support only one.
- New captains start with a **Universal Sloop**, not a Tartana.
- Initially, shipyards sell predefined configurations. Conversion between supported configurations is deferred.
- The captain owns only one ship. Purchasing a replacement includes selling the current ship.
- Offers show the full purchase price, current ship sale value, and net amount payable (or received).
- Cargo space and deadweight use separate fictional units, not real-world tonnage.
- Capturing ships is deferred.

## Data concepts

A hull type identifies a family of ships and its supported configurations.
A configuration is a purchasable variant with a class, specifications, price, and default equipment.
An individual ship has an identity/name, configuration, current hull points, sail condition, installed and operational cannons, and carried load.

Use the same ship model for shipyard offers, player ownership, and eventually encountered ships.
Keep hull type, configuration, and individual ship identifiers distinct.
Ship tiers are separate from the captain's Sailing skill tiers.

## Proposed starting catalogue

This roster and its tier assignments are a design proposal for numerical balancing.
The confirmed starting configuration is Universal Sloop.
Names and roles are game-oriented rather than historical specifications.

| Tier | Hull type | Supported configurations |
| --- | --- | --- |
| 1 | Tartana | Merchant; Universal |
| 1 | Cutter | Universal; Warship |
| 2 | Sloop | Merchant; Universal; Raider (Warship) |
| 2 | Schooner | Merchant; Universal; Patrol (Warship) |
| 3 | Brigantine | Merchant; Universal; Raider (Warship) |
| 3 | Fluyt | Merchant |
| 4 | Brig | Merchant; Universal; Warship |
| 4 | Corvette | Warship |
| 4 | Merchantman | Merchant; Armed (Universal) |
| 5 | Galleon | Merchant; Universal |
| 5 | Frigate | Universal; Warship |
| 6 | Grand Merchantman | Merchant |
| 6 | War Galleon | Universal; Warship |
| 6 | Man-of-war | Warship |

Merchant configurations prioritize cargo and economical operation.
Warship configurations prioritize gun capacity, protection, and combat crew.
Universal configurations balance trading and combat.
Small ships should remain useful for affordable operation and deliveries.
Starting with a tier 2 ship does not require players to purchase tier 1 ships first.

## Statistics and units

Configuration specifications use the base characteristics from stats.md:
maximum hull points, base speed, base maneuverability, cargo capacity,
deadweight capacity, cannon capacities for each battery, minimum/optimal/maximum
crew, passenger capacity, and hull protection.

Individual ships track hull points, sail condition, and operational cannons
separately. Repairs and cannon replacement should follow those distinctions.

Cargo-space units describe occupied hold space; weight units describe carried
deadweight. They are independent limits. Item weights and space requirements
still need numerical definitions. Crew, passengers, equipment, and cannons count
toward deadweight as specified in stats.md.

Base movement assumes full hull, full sails, no cargo or cannons, and optimal
crew. Shipyard comparisons should also show calculated performance for the
actual offered loadout. Cannon weight must not incur a second arbitrary movement
penalty. Weather modifies voyage performance separately.

## Replacement purchase

Confirmed: one owned ship, with mandatory sale during replacement purchase.

Proposed transaction rules:
- Calculate purchase price, sale value, and net silver change before confirmation.
- Account for the current ship's condition and installed equipment in sale value.
- Transfer cargo, provisions, crew, and passengers only when the replacement can accommodate them.
- Explain capacity problems and block purchase rather than silently deleting cargo or people.
- Apply the ship exchange and silver adjustment together.

Sale valuation, equipment transfer details, transaction time, and port stock
rules remain to be specified.

## Implementation phases

1. **Catalogue and specifications:** settle numerical stats, prices, unit weights,
   and supported configurations; use the Universal Sloop as the starting baseline.
2. **Ownership and shipyards:** implement replacement purchase/sale, transfer
   checks, Journal information, and migration of existing captains and church
   checkpoints.
3. **Performance and outfitting:** implement separate repairs, cannon equipment,
   deadweight, crew effectiveness, and calculated movement.

Capture, fleets, stored spare ships, and configuration conversion are deferred.
Future enemy ships should use the catalogue, but encounter integration is not
part of the initial purchasing phase.

## Remaining balance decisions

- Numerical specifications and prices for every configuration.
- Repair prices and duration, sale valuation, and shipyard availability.
- Cargo-space and weight values, including equipment, people, and provisions.
- Movement penalties, crew effectiveness, and overloading rules.
- Equipment handling during replacement purchases.
- Existing-save migration details that preserve playable captains and checkpoints.
- Future ship-dependent Sailing progression limits, including whether letter
  rewards count toward such limits. These require an explicit progression rule;
  descriptive ship tier labels alone do not impose a skill cap.
