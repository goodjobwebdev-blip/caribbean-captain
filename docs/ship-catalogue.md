# Implemented ship catalogue

All values are fictional, provisional game balance. Source: src/ships.ts.
Purchase prices include full repairs and default cannons. See [release behavior](ship-release.md) for active and deferred mechanics.

## Movement, cargo, and price

| Tier | Configuration | Class | Silver | Hull HP | Speed (units/hour) | Cargo space | Deadweight capacity |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| 1 | Universal Tartana | Universal | 4,000 | 60 | 0.95 | 140 | 230 |
| 1 | Merchant Tartana | Merchant | 4,500 | 60 | 0.95 | 180 | 270 |
| 1 | Universal Cutter | Universal | 6,000 | 70 | 1.30 | 100 | 200 |
| 1 | Patrol Cutter | Warship | 7,000 | 70 | 1.30 | 70 | 200 |
| 2 | Universal Sloop | Universal | 12,000 | 100 | 1.20 | 300 | 500 |
| 2 | Merchant Sloop | Merchant | 13,000 | 100 | 1.20 | 390 | 580 |
| 2 | Universal Schooner | Universal | 14,000 | 110 | 1.45 | 240 | 450 |
| 2 | Raider Sloop | Warship | 15,000 | 120 | 1.20 | 210 | 500 |
| 2 | Merchant Schooner | Merchant | 16,000 | 110 | 1.45 | 310 | 530 |
| 2 | Patrol Schooner | Warship | 18,000 | 130 | 1.45 | 170 | 450 |
| 3 | Universal Brigantine | Universal | 30,000 | 180 | 1.30 | 500 | 850 |
| 3 | Merchant Brigantine | Merchant | 33,000 | 180 | 1.30 | 650 | 1000 |
| 3 | Merchant Fluyt | Merchant | 36,000 | 200 | 1.00 | 900 | 1300 |
| 3 | Raider Brigantine | Warship | 38,000 | 210 | 1.30 | 350 | 850 |
| 4 | Universal Brig | Universal | 65,000 | 300 | 1.20 | 800 | 1500 |
| 4 | Merchant Brig | Merchant | 70,000 | 300 | 1.20 | 1040 | 1750 |
| 4 | Merchant Merchantman | Merchant | 75,000 | 340 | 1.05 | 1500 | 2200 |
| 4 | Warship Corvette | Warship | 80,000 | 320 | 1.45 | 350 | 1200 |
| 4 | War Brig | Warship | 82,000 | 350 | 1.20 | 560 | 1500 |
| 4 | Armed Merchantman | Universal | 85,000 | 380 | 1.05 | 1150 | 2200 |
| 5 | Universal Galleon | Universal | 150,000 | 550 | 1.00 | 1800 | 3200 |
| 5 | Merchant Galleon | Merchant | 160,000 | 550 | 1.00 | 2340 | 3800 |
| 5 | Universal Frigate | Universal | 165,000 | 460 | 1.40 | 950 | 2400 |
| 5 | Warship Frigate | Warship | 180,000 | 500 | 1.40 | 650 | 2400 |
| 6 | Merchant Grand Merchantman | Merchant | 300,000 | 700 | 0.95 | 3500 | 5000 |
| 6 | Universal War Galleon | Universal | 360,000 | 900 | 1.05 | 2200 | 4500 |
| 6 | Battle Galleon | Warship | 430,000 | 1050 | 1.05 | 1540 | 4500 |
| 6 | Warship Man-of-war | Warship | 500,000 | 1200 | 1.10 | 900 | 5000 |

## Crew and design ratings

| Configuration | Crew min / optimal / max | Passenger berths | Base maneuverability | Protection¹ |
| --- | --- | ---: | ---: | ---: |
| Universal Tartana | 3 / 5 / 10 | 3 | 85 | 5 |
| Merchant Tartana | 3 / 4 / 10 | 3 | 85 | 5 |
| Universal Cutter | 3 / 6 / 12 | 3 | 95 | 6 |
| Patrol Cutter | 3 / 8 / 16 | 3 | 95 | 6 |
| Universal Sloop | 5 / 10 / 20 | 6 | 80 | 10 |
| Merchant Sloop | 5 / 8 / 20 | 6 | 80 | 10 |
| Universal Schooner | 6 / 12 / 24 | 9 | 85 | 10 |
| Raider Sloop | 5 / 13 / 26 | 6 | 80 | 14 |
| Merchant Schooner | 6 / 10 / 24 | 9 | 85 | 10 |
| Patrol Schooner | 6 / 16 / 32 | 9 | 85 | 14 |
| Universal Brigantine | 10 / 20 / 40 | 12 | 70 | 15 |
| Merchant Brigantine | 10 / 16 / 40 | 12 | 70 | 15 |
| Merchant Fluyt | 8 / 16 / 32 | 12 | 45 | 12 |
| Raider Brigantine | 10 / 26 / 52 | 12 | 70 | 20 |
| Universal Brig | 16 / 32 / 64 | 18 | 60 | 22 |
| Merchant Brig | 16 / 26 / 64 | 18 | 60 | 22 |
| Merchant Merchantman | 14 / 28 / 56 | 24 | 40 | 18 |
| Warship Corvette | 20 / 45 / 90 | 6 | 75 | 25 |
| War Brig | 16 / 42 / 84 | 18 | 60 | 28 |
| Armed Merchantman | 14 / 36 / 72 | 24 | 40 | 23 |
| Universal Galleon | 30 / 65 / 130 | 30 | 35 | 30 |
| Merchant Galleon | 30 / 52 / 130 | 30 | 35 | 30 |
| Universal Frigate | 40 / 70 / 140 | 12 | 60 | 27 |
| Warship Frigate | 40 / 90 / 180 | 12 | 60 | 32 |
| Merchant Grand Merchantman | 25 / 55 / 110 | 42 | 25 | 25 |
| Universal War Galleon | 55 / 120 / 240 | 36 | 30 | 40 |
| Battle Galleon | 55 / 156 / 312 | 36 | 30 | 46 |
| Warship Man-of-war | 80 / 180 / 360 | 12 | 25 | 50 |

## Cannon layouts¹

Each battery is shown as default installed / maximum capacity.

| Configuration | Port | Starboard | Bow | Stern | Total default / capacity |
| --- | ---: | ---: | ---: | ---: | ---: |
| Universal Tartana | 1 / 1 | 1 / 1 | 0 / 0 | 0 / 0 | 2 / 2 |
| Merchant Tartana | 0 / 1 | 0 / 1 | 0 / 0 | 0 / 0 | 0 / 2 |
| Universal Cutter | 1 / 2 | 1 / 2 | 0 / 0 | 0 / 1 | 2 / 5 |
| Patrol Cutter | 2 / 3 | 2 / 3 | 0 / 1 | 0 / 1 | 4 / 8 |
| Universal Sloop | 2 / 4 | 2 / 4 | 0 / 0 | 0 / 2 | 4 / 10 |
| Merchant Sloop | 1 / 2 | 1 / 2 | 0 / 0 | 0 / 1 | 2 / 5 |
| Universal Schooner | 2 / 4 | 2 / 4 | 0 / 1 | 0 / 1 | 4 / 10 |
| Raider Sloop | 4 / 6 | 4 / 6 | 0 / 0 | 0 / 2 | 8 / 14 |
| Merchant Schooner | 1 / 2 | 1 / 2 | 0 / 0 | 0 / 1 | 2 / 5 |
| Patrol Schooner | 4 / 6 | 4 / 6 | 1 / 2 | 1 / 2 | 10 / 16 |
| Universal Brigantine | 4 / 7 | 4 / 7 | 0 / 1 | 0 / 1 | 8 / 16 |
| Merchant Brigantine | 2 / 4 | 2 / 4 | 0 / 0 | 0 / 1 | 4 / 9 |
| Merchant Fluyt | 2 / 4 | 2 / 4 | 0 / 0 | 0 / 2 | 4 / 10 |
| Raider Brigantine | 7 / 10 | 7 / 10 | 1 / 2 | 1 / 2 | 16 / 24 |
| Universal Brig | 6 / 10 | 6 / 10 | 1 / 2 | 1 / 2 | 14 / 24 |
| Merchant Brig | 3 / 6 | 3 / 6 | 0 / 1 | 0 / 1 | 6 / 14 |
| Merchant Merchantman | 3 / 6 | 3 / 6 | 0 / 0 | 0 / 2 | 6 / 14 |
| Warship Corvette | 10 / 12 | 10 / 12 | 1 / 2 | 1 / 2 | 22 / 28 |
| War Brig | 10 / 14 | 10 / 14 | 1 / 2 | 1 / 2 | 22 / 32 |
| Armed Merchantman | 6 / 10 | 6 / 10 | 0 / 1 | 1 / 2 | 13 / 23 |
| Universal Galleon | 12 / 18 | 12 / 18 | 1 / 2 | 2 / 4 | 27 / 42 |
| Merchant Galleon | 5 / 10 | 5 / 10 | 0 / 1 | 1 / 2 | 11 / 23 |
| Universal Frigate | 10 / 16 | 10 / 16 | 1 / 2 | 1 / 2 | 22 / 36 |
| Warship Frigate | 18 / 22 | 18 / 22 | 2 / 2 | 2 / 2 | 40 / 48 |
| Merchant Grand Merchantman | 5 / 10 | 5 / 10 | 0 / 0 | 2 / 4 | 12 / 24 |
| Universal War Galleon | 22 / 30 | 22 / 30 | 2 / 4 | 2 / 4 | 48 / 68 |
| Battle Galleon | 30 / 42 | 30 / 42 | 2 / 4 | 2 / 4 | 64 / 92 |
| Warship Man-of-war | 40 / 48 | 40 / 48 | 2 / 4 | 2 / 4 | 84 / 104 |

¹ Cannon and protection effects on battle remain deferred. Deadweight and crew performance are active; current maneuverability is calculated from load, condition, and crew. See [performance formulas](ship-performance.md). Cannon state and default replacement are stored, but do not modify current dice rolls. Protection and maneuverability are ratings out of 100, not percentages applied to damage or rolls.
