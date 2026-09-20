# Trade engine playtest

Run with `npm run balance:trade`. This uses the playable rules, not the earlier analytical model.

Normal winds, no pirates, starting sloop and crew, 100 silver purchase reserve, finite stocks, real actions and skill/event rules. One-way net values subtract provision consumption at 1.15 silver/unit. Routes use perfect knowledge for balance testing, not player-visible forecasts. Perishable losses are applied by the engine; only remaining whole units are sold, with leftover fractional cargo excluded from net income. Repeated route refills to 120 provisions each departure. Upgrade threshold is Merchant Schooner exchange plus 1000 cash reserve; the simulation keeps the sloop.

## Highest net single-good cargo among tested goods

| Starting silver | Route | Goods | Quantity | Net silver | Hours |
| ---: | --- | --- | ---: | ---: | ---: |
| 800 | Bridgetown → Saint-Pierre | Sugar | 86 | 236.81 | 55 |
| 800 | Bridgetown → Willemstad | Hides | 54 | 205.69 | 241 |
| 800 | Saint-Pierre → Bridgetown | Coffee | 30 | 248.06 | 51 |
| 800 | Saint-Pierre → Willemstad | Tobacco | 27 | 29.69 | 225 |
| 800 | Willemstad → Bridgetown | Common Cloth | 36 | 6.69 | 241 |
| 800 | Willemstad → Saint-Pierre | Common Cloth | 36 | 27.69 | 225 |
| 3000 | Bridgetown → Saint-Pierre | Sugar | 180 | 518.31 | 63 |
| 3000 | Bridgetown → Willemstad | Hides | 90 | 532.44 | 245 |
| 3000 | Saint-Pierre → Bridgetown | Coffee | 127 | 1174.75 | 52 |
| 3000 | Saint-Pierre → Willemstad | Tobacco | 111 | 959.06 | 227 |
| 3000 | Willemstad → Bridgetown | Fine Cloth | 55 | 1004.69 | 241 |
| 3000 | Willemstad → Saint-Pierre | Glassware | 89 | 976.5 | 232 |

## Repeated sugar / coffee route

| Leg | Treasury | Game day | Trade tier | Sailing tier |
| ---: | ---: | ---: | ---: | ---: |
| 2 | 1420.67 | 4.75 | 0 | 0 |
| 4 | 2544.33 | 9.42 | 1 | 0 |
| 6 | 4656.17 | 14.13 | 2 | 1 |
| 8 | 6290.67 | 18.75 | 2 | 1 |
| 10 | 7562.17 | 23.38 | 3 | 1 |
| 12 | 9257.67 | 28 | 3 | 1 |
| 14 | 10868.17 | 32.63 | 3 | 2 |
| 16 | 12413.83 | 37.04 | 3 | 2 |
| 18 | 13126.5 | 41.46 | 3 | 2 |
| 20 | 14375.17 | 45.88 | 4 | 2 |
| 22 | 15950.83 | 50.29 | 4 | 2 |
| 24 | 18876.5 | 54.71 | 4 | 2 |

Merchant Schooner exchange plus a 1,000-silver reserve is reached at leg **12**. This is a capital threshold, not an automatic purchase.

## Ship-tier comparison

Coffee: Saint-Pierre → Bridgetown; optimal crew, five days of food, capital equal to 30% of ship price, and quantities limited by origin stock, destination storage, capital and ship capacities. Ship purchase costs are excluded. Net includes wages and replacement value of consumed provisions. Each case also verifies cash-ledger reconciliation.

| Tier | Ship | Capital | Coffee | Net silver | Hours |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | Merchant Tartana | 1350 | 55 | 534.92 | 63 |
| 2 | Merchant Schooner | 4800 | 206 | 1831.25 | 44 |
| 3 | Merchant Fluyt | 10800 | 463 | 3189.8 | 62 |
| 4 | Merchant Merchantman | 22500 | 948 | 3027.83 | 61 |
| 5 | Merchant Galleon | 48000 | 1000 | 2676.67 | 61 |
| 6 | Merchant Grand Merchantman | 90000 | 1000 | 2638.22 | 63 |

## Limits

This is deterministic economic playtesting, not browser interaction testing or a guarantee of earnings with weather and pirate losses. These tier comparisons cover one route; broader fleet progression and player decision quality need further play sessions. Smuggling is deliberately costly and risky: inspections have 15/36 caught, 15/36 fined and 6/36 undetected outcomes, and are intended as access to restricted goods rather than a superior routine route. Event modifiers are bounded to 0.85–1.25 and leave provisions unchanged.
