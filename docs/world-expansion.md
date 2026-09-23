# Caribbean Captain — geography expansion

Agreed 23 September 2026: add the 12 colonial towns below; defer the three pirate settlements. This release implements the agreed geography, markets, destination navigation, national integration, and save migration.

## Agreed direction

- Use Sea Dogs / Caribbean Legend as the reference for islands, towns, bays, coves, and other locations. Do not silently substitute modern towns for game locations.
- Support multiple towns on one island. Most new colonial towns initially share the existing building list.
- Differentiate ports through trade and atmosphere. Record postponed differences explicitly.
- Work feature by feature: discussion, agreed documentation, implementation and testing, then the next feature.
- Equipment, Blacksmith, and Weaver are completed according to the user. This work starts with geography.

## Evidence and naming

The researched atlas is Mauris's guide to **Sea Dogs: To Each His Own**. It is a third-party guide, not an official Caribbean Legend location database. Its trade tables identify version 1.7.3. The mappings below are verified against that atlas; exact parity with current Caribbean Legend is not yet established. This is a researched starting catalogue, not a claim to cover every game location.

The remembered “kapstvil” is **Capsterville, Saint Christopher**, a French colony in the atlas. [Source](https://corsairslegacy.com/article/saint_christopher_sea_dogs_to_each_his_own).

Keep the app's existing Bridgetown / Barbados, Saint-Pierre / Martinique, and Willemstad / Curaçao identifiers. Use stable island IDs separate from settlement IDs. Names can change without breaking saves. Retain the fictional Year 1 calendar unless separately agreed.

## Agreed playable expansion

Add these **12 colonial towns across 10 island groups**, bringing the app from 3 to 15 playable towns. The user approved this scope. The original list contains four islands; all four are included.

| Island or island group | Town(s) added | Allegiance in reference | Source |
| --- | --- | --- | --- |
| Guadeloupe | Basse-Terre | France | [Atlas](https://corsairslegacy.com/en/article/guadelupa_sea_dogs_to_each_his_own) |
| Saint Christopher | Capsterville | France | [Atlas](https://corsairslegacy.com/article/saint_christopher_sea_dogs_to_each_his_own) |
| Antigua | St. John's | England | [Atlas](https://corsairslegacy.com/en/article/antigua_sea_dogs_to_each_his_own) |
| Saint Martin | Philipsburg | Dutch | [Atlas](https://corsairslegacy.com/en/article/saint_maartin_sea_dogs_to_each_his_own) |
| Puerto Rico | San Juan | Spain | [Atlas](https://corsairslegacy.com/en/article/puerto_rico_sea_dogs_to_each_his_own) |
| Hispaniola | Santo Domingo; Port-au-Prince | Spain; France respectively | [Atlas](https://corsairslegacy.com/en/article/hispaniola_sea_dogs_to_each_his_own) |
| Cuba | Havana; Santiago | Spain | [Atlas](https://corsairslegacy.com/en/article/cuba_sea_dogs_to_each_his_own) |
| Jamaica | Port Royal | England | [Atlas](https://corsairslegacy.com/en/article/jamaica_sea_dogs_to_each_his_own) |
| Tortuga | Tortuga | France | [Atlas](https://corsairslegacy.com/en/article/tortuga_sea_dogs_to_each_his_own) |
| Trinidad and Tobago | San Jose | Spain | [Atlas](https://corsairslegacy.com/en/article/trinidad_tobago_sea_dogs_to_each_his_own) |

“Trinidad and Tobago” is retained as the source's game-region label; do not infer a second town or treat the source's singular-island wording as real-world geography.

### Other verified settlements

| Island | Settlement | Reference identity | Proposed status |
| --- | --- | --- | --- |
| Cuba | Puerto Principe | Pirate settlement | Deferred pending service design |
| Hispaniola | La Vega | Pirate settlement | Deferred pending service design |
| Jamaica | Maroon Town | Pirate settlement | Deferred pending service design |

Sources: the Cuba, Hispaniola, and Jamaica atlas pages above. Including these would make **15 new settlements, 18 total**. They should not automatically inherit colonial governors, forts, official commissions, or churches. Their access from the coast also needs defining before treating them as directly dockable ports.

## Gameplay in this release

- Sailing, existing contract types, trading, supplies, repairs, and checkpoints work at every new colonial town.
- Each town gets original arrival prose and a distinct economic profile using the app's supported goods, stock, replenishment, and price mechanisms. Exact profiles and coordinates are recorded in [world port data](world-port-data.md).
- Implemented identities: Basse-Terre as a produce/timber supplier; Capsterville as a provisioning port; St. John's as a sailcloth/tobacco supplier; Philipsburg as a cotton/textile trading port. These are original adaptations inspired by the atlas.
- Multiple towns on one island have distinct markets and anchorage coordinates. Sea travel remains available between them. Overland travel is deferred.
- Group destination choices by island and show town, allegiance, travel time, and preparation needs. Avoid an unstructured list as the world grows.
- Continue the app's abstract travel units. Coordinates preserve the existing scale and approximate regional positions; the atlas alone does not provide calibrated app coordinates.
- Preserve existing saves, checkpoints, accepted contracts, and existing port IDs. New markets must initialize safely in older saves.

## Deferred work register

All entries below are design backlog items, not implemented features.

| Deferred item | Reason / dependency | Return to it when |
| --- | --- | --- |
| Pirate settlements listed above | Need coastal access, services, allegiance, and checkpoint rules | Pirate-town design is agreed, or scope is expanded now |
| Playable bays, coves, beaches, and non-town anchorages | Need landing, departure, local travel, and available-action rules | Exploration / smuggling / treasure work |
| Full named coastal-location catalogue | English names and connections require map inspection or game verification | Before activating each coastal location |
| Marie-Galante near Guadeloupe | Atlas identifies it as a separate visitable location; no town established here | Non-town island exploration |
| Cape Camaguey, Cuba | Named by the atlas; landing and inland links not yet specified | Coastal exploration |
| Port-au-Prince lighthouse islet | Named location in atlas; needs local travel model | Coastal exploration |
| Remaining atlas regions | Additional research and scope selection needed | A later geography batch |
| Different shipyard inventories and local upgrades | Requires shipyard/outfitting rules | Roadmap item 6 |
| Different Blacksmith / Weaver inventories | Requires stock and rarity policy | Equipment availability follow-up |
| Named NPCs and LLM building introductions | Requires stable NPC roster and dialogue navigation | Roadmap item 3 |
| Building-specific quest sources | Already outlined in town-buildings.md | Roadmap item 4 |
| Two or three additional quests | Depends on chosen quest mechanics and sources | Roadmap item 5 |
| Overland travel between towns | Needs costs, risks, and ship-location rules | Exploration design |
| Visual world map and location artwork | Requires UI and art direction | Roadmap items 7–8 |

The coastal examples are supported respectively by the Guadeloupe, Cuba, and Hispaniola pages above. Remaining atlas regions include Dominica, Cayman, Turks, Isla Tesoro, and mainland areas; their presence in the atlas index is not evidence of a playable town. [Atlas index and overview](https://corsairslegacy.com/article/archipelago_map_sea_dogs_to_each_his_own).

## Implementation acceptance criteria

1. Every agreed town is selectable and reachable, with correct island association and allegiance.
2. Colonial services and existing quest delivery work at all new towns; no destination relies on a three-port assumption.
3. Spain is handled explicitly wherever nation behavior is required, including permits, reputation, inspections, and encounters where applicable. Do not let it fall through to another nation's defaults.
4. Old saves and church checkpoints still load; new markets initialize without resetting old ones.
5. Multiple towns on one island have independent markets and nonzero route durations.
6. Trade opportunities are checked after wages, provisions, elapsed time, and market impact. Short same-island routes must not create a trivial unlimited-profit loop.
7. New destinations and any deferred functionality are explained in the project docs and in-game reference where appropriate.

## Recorded decisions

1. The user approved the 12-town colonial expansion.
2. The user agreed to defer Puerto Principe, La Vega, and Maroon Town.
3. Existing buildings remain shared. Shipyard and equipment specialization remain deferred as recorded above.

The existing three ports retain their identifiers, coordinates, trade profiles, and event seed positions. A shared world catalogue now drives geography, nationality, market initialization, and encounter origins. Migration fills missing legal and smuggler markets at the saved hour without inventing observations or resetting stocks, lots, contracts, reputation, or random state. Existing in-progress encounters remain stored; newly generated encounters can originate from any colonial town.

Harbour routes are grouped by island and searchable. Commissions are grouped into expandable destination lists so the larger offer pool stays navigable. All existing services remain available at new colonial ports.

No new historical year, copied story quests, or full parity with Caribbean Legend is implied by adopting its geography as a reference.

## Validation

- All 205 automated tests pass, including migration of three-port saves, Spanish permits and passenger reputation, every destination and contract kind, independent same-island markets, checkpoint restoration, and route rendering.
- TypeScript and production build pass. Vite reports a bundle-size advisory for the main JavaScript chunk.
- [Repeated trade playtest](world-playtest.md): 24 legs across four pairs, including both multi-town islands, with wages, provisions, finite stocks, and market recovery. The nearby rum route remains profitable while later legs earn less; longer same-island legs can lose money. These limited scenarios do not establish full-world balance.
- Browser interaction and visual layout have not been manually playtested in this change; route markup is covered by server-rendered component tests.
