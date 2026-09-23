# World expansion trade checks

Run with node scripts/world_playtest.mjs. Each pair starts with a starter sloop, 10 crew, 3000 silver, and 120 provisions. Six sequential legs retain stock changes, market recovery, skill progression, and local events. Each leg selects the best feasible tested cargo (10, 30, 60, or 100 units) and supplies to 180 provisions. Steady weather; encounters disabled to isolate economics.

Net includes trading and sailing wages and the quoted replacement cost of consumed provisions, rounded up. This is a limited deterministic comparison, not exhaustive balance proof; it excludes combat, repairs, headwinds, and the startup increase in provision reserves. All 24 legs completed with finite stocks, elapsed travel time, and no invalid trades. Same-island markets remain independent and use the existing stock limits and quantity pricing. Profitable repeatable trade remains intentional; free travel or unbounded transaction quantities are not introduced.

| Pair | Leg | Destination | Cargo | Hours incl. preparation | Net silver after provision replacement |
| --- | ---: | --- | --- | ---: | ---: |
| Basse-Terre ↔ St. John's | 1 | St. John's | 100 rum | 34 | 596.50 |
| Basse-Terre ↔ St. John's | 2 | Basse-Terre | 100 tobacco | 32 | 62.17 |
| Basse-Terre ↔ St. John's | 3 | St. John's | 100 rum | 34 | 525.50 |
| Basse-Terre ↔ St. John's | 4 | Basse-Terre | 100 tobacco | 32 | 64.17 |
| Basse-Terre ↔ St. John's | 5 | St. John's | 100 rum | 34 | 504.50 |
| Basse-Terre ↔ St. John's | 6 | Basse-Terre | 100 sailcloth | 32 | 57.17 |
| Capsterville ↔ Philipsburg | 1 | Philipsburg | 60 medicine | 35 | -2.33 |
| Capsterville ↔ Philipsburg | 2 | Capsterville | 60 cotton | 35 | 217.67 |
| Capsterville ↔ Philipsburg | 3 | Philipsburg | 100 salted-meat | 37 | -3.00 |
| Capsterville ↔ Philipsburg | 4 | Capsterville | 60 cotton | 35 | 200.67 |
| Capsterville ↔ Philipsburg | 5 | Philipsburg | 60 tools | 37 | -15.00 |
| Capsterville ↔ Philipsburg | 6 | Capsterville | 60 cotton | 35 | 187.67 |
| Santo Domingo ↔ Port-au-Prince | 1 | Port-au-Prince | 100 salted-meat | 89 | -72.33 |
| Santo Domingo ↔ Port-au-Prince | 2 | Santo Domingo | 100 coffee | 86 | -21.83 |
| Santo Domingo ↔ Port-au-Prince | 3 | Port-au-Prince | 60 cloth | 84 | -83.17 |
| Santo Domingo ↔ Port-au-Prince | 4 | Santo Domingo | 100 coffee | 82 | -41.50 |
| Santo Domingo ↔ Port-au-Prince | 5 | Port-au-Prince | 100 salted-meat | 84 | -70.17 |
| Santo Domingo ↔ Port-au-Prince | 6 | Santo Domingo | 100 iron | 94 | 304.50 |
| Havana ↔ Santiago | 1 | Santiago | 100 coffee | 184 | -151.50 |
| Havana ↔ Santiago | 2 | Havana | 60 hides | 180 | 115.83 |
| Havana ↔ Santiago | 3 | Santiago | 100 cloth | 171 | -146.67 |
| Havana ↔ Santiago | 4 | Havana | 100 tobacco | 170 | 269.17 |
| Havana ↔ Santiago | 5 | Santiago | 100 coffee | 171 | -85.67 |
| Havana ↔ Santiago | 6 | Havana | 100 tobacco | 160 | 482.50 |
