# Encounter system

Status: agreed design with provisional balance values.

This document specifies ship-contact generation, information, NPC captain decision-making, social and pursuit actions, and the transition into detailed naval combat. It replaces the prototype's single pirate check and one-roll Flee / Negotiate / Fight encounter.

The detailed combat system is called **Naval Engagement**. Capture, imprisonment, prize handling, and fleet transfer belong to a future **Capture Resolution** phase.

## Design goals

- Encounters may involve enemies, neutral ships, friendly ships, or allies.
- Most contacts should not automatically become battles.
- NPC behavior should be explainable, reproducible, and testable.
- Roles, temperaments, and circumstances should create variety without arbitrary behavior.
- Player skills, ship performance, crew quality, reputation, and faction attitude should matter.
- NPCs should act on perceived information rather than unrestricted access to hidden player state.
- Rules and rolls remain authoritative; generated prose may describe outcomes but never decide them.
- An Encounter normally allows one player response and, when required, one final response or Pursue decision.

## Phase boundaries

A voyage may pass through these systems:

1. **Contact generation** determines whether and when ships are present.
2. **Detection and Early Sighting** determine what the player notices and whether contact can be avoided.
3. **Encounter** begins when contact is established. The NPC reveals an opening posture, then the player receives context-relevant actions.
4. **Pursuit** is an optional Encounter step when one ship flees and the other wishes to engage.
5. **Naval Engagement** is the future detailed battle system.
6. **Capture Resolution** is the future system for surrender, prizes, prisoners, ship transfer, and imprisonment.

A successful pursuit begins Naval Engagement at normal range. Surrender by either side ends Encounter and enters Capture Resolution.

## Contact generation

### Frequency

The game performs one seeded contact-generation calculation when a voyage begins. It may schedule multiple hidden contacts along the route.

A normal two-day voyage has approximately a **20%** chance of meeting at least one ship. The maximum number of contacts depends on voyage duration:

```text
maximum contacts = ceil(voyage days / 3)
```

A recommended single-calculation model is a capped Poisson draw:

```text
lambda = -ln(0.8) × (voyage hours / 48) × contact-rate modifiers
generated contacts = seeded Poisson draw(lambda)
scheduled contacts = min(generated contacts, maximum contacts)
```

The formula is provisional, but it must preserve the agreed 20% two-day baseline and duration-based cap. Scheduled contacts should be spaced along the voyage rather than occurring together. Faster voyages naturally create fewer contact opportunities.

### Baseline role mix

After a contact is generated, its role begins with the following normal-route weights:

| Role | Baseline weight |
| --- | ---: |
| Merchant | 25% |
| Fishing or local vessel | 20% |
| Passenger or courier vessel | 15% |
| Faction navy | 15% |
| Privateer | 10% |
| Pirate | 10% |
| Bounty hunter | 5% |

Adjusted weights are normalized back to 100%.

### Role-weight modifiers

```text
adjusted role weight =
    baseline role weight
  × regional pirate-danger modifier
  × player faction-attitude and reputation modifier
  × player-value modifier

final role probability =
    adjusted role weight / sum of all adjusted role weights
```

Each role's combined modifier is clamped to **×0.25 through ×3**.

Agreed effects:

- High regional pirate danger increases Pirate weight and reduces Faction Navy weight.
- High pirate danger directly reduces Merchant and Courier weights, but not Local-vessel weight.
- Very low faction attitude increases contacts from that faction's Navy, Privateers, and Bounty Hunters.
- Cargo, contracts, and passengers may increase the chance of profit-seeking or targeted contacts.
- Player Deception passively conceals part of that attractive value.
- Role generation changes probabilities softly; it never guarantees a particular encounter.

Regional pirate danger is a regional value. Its exact scale and update rules remain provisional.

### Passive value concealment

The value visible to contact generation is:

```text
perceived attractive value =
    actual cargo, contract, and passenger value
  × (1 − Deception concealment percentage)
```

The agreed Deception curve is:

| Deception mastery | Concealed value |
| ---: | ---: |
| 0 | 0% |
| 1 | 2% |
| 2 | 4% |
| 3 | 6% |
| 4 | 8% |
| 5 | 10% |
| 6 | 12% |
| 7 | 14% |
| 8 | 25% |
| 9 | 50% |
| 10 | 95% |

The same curve determines the percentage of silver hidden from pirate demands.

## Detection and Early Sighting

The baseline information shown after contact is:

- Apparent ship type or configuration
- Displayed flag

Player **Lookout** and a **Spyglass** improve identification range, detail, and confidence. Higher Lookout may reveal:

- Visible hull or sail condition
- Estimated speed and firepower
- Estimated captain rank
- Likely posture motives
- Several motives at high mastery, such as confidence in superior guns, protection of cargo, faction hostility, or fear of boarding

The captain's exact level remains hidden. Lookout reports a correct broad rank; proposed bands are:

| Level | Rank |
| ---: | --- |
| 1–3 | Novice |
| 4–7 | Capable |
| 8–11 | Experienced |
| 12–15 | Veteran |
| 16–18 | Elite |
| 19 | Master |
| 20 | Legendary |

These band boundaries are provisional.

An Early Sighting lets the player:

- Continue toward contact
- Investigate
- Attempt to avoid contact

A failed Avoid Contact attempt begins Encounter normally. Early Sighting also grants a mastery-based bonus to the first Flee or Pursue check. A provisional bonus scale is +0 at Lookout 0–2, +1 at 3–5, +2 at 6–8, and +3 at 9–10.

Lookout improves information flowing to the player. It does not directly reduce what the NPC learns. NPC observation is derived from role and level and is opposed by player Deception, false flags, documents, and concealment equipment.

## NPC captain model

Every NPC captain has:

- **Role**
- **Faction**
- **Temperament**
- **Level**, from 1 to 20

Everything else is derived from those properties, the selected ship, crew state, and current circumstances. NPCs do not use the player's full 24-skill sheet.

### Roles and objectives

| Role | Primary objective |
| --- | --- |
| Merchant | Protect cargo and reach the destination profitably |
| Pirate | Extract maximum value without unacceptable risk |
| Faction navy | Enforce faction law, defend allies, and oppose enemies |
| Privateer | Profit by legally preying on the sponsor's enemies |
| Passenger or courier | Deliver passengers, messages, or valuable documents |
| Fishing or local vessel | Continue ordinary work and survive |
| Bounty hunter | Obtain the target's surrender and capture the target alive |

Faction Navy duties include:

- Hunt pirates and faction enemies
- Inspect flags, cargo, and documents
- Protect friendly and allied ships
- Pursue captains with very low faction attitude

Privateers may legally attack:

- Ships belonging to enemy factions
- Pirates
- Captains wanted by the sponsoring faction

Bounty hunters normally seek surrender and live capture.

Encounter role and ship configuration class are separate concepts. For example, a Bounty Hunter may sail a Universal or Warship configuration; a Courier may use a fast Merchant or Universal configuration.

### Temperaments

Each captain has exactly one temperament:

| Temperament | Decision effect |
| --- | --- |
| Cautious | Avoids unfavorable contact, flees early, and rarely pursues |
| Bold | Accepts moderate disadvantages, resists threats, and readily pursues |
| Aggressive | Prefers threats and attacks but can retreat when clearly losing |
| Fanatical | Strong commitment; may ignore bad odds and cannot surrender while the crew can still fight |
| Honorable | Challenges before attacking, respects surrender, avoids deception, and follows faction rules |

Temperament changes priorities and thresholds, not competence.

### Level effects

NPC level improves:

- Accuracy of information and relative-strength estimates
- Crew effectiveness
- Resistance to Negotiation
- Resistance to Deception
- Resistance to Threats

Level does not directly determine aggression. It also does not guarantee a ship tier, although it softly biases ship selection toward stronger role-compatible configurations.

### Level generation

NPC levels use a low-biased roll with soft player-ship-tier scaling:

```text
base level = min(d20, d20)
tier bonus = random integer from 0 through 2 × (player ship tier − 1)
NPC level = clamp(base level + tier bonus, 1, 20)
```

Taking the lower d20 keeps high levels rare. The random tier bonus makes stronger captains more common as the player acquires higher-tier ships while preserving a chance of low-level or exceptional captains at every tier.

### Ship selection and starting condition

Role first filters compatible configurations. NPC level maps to a preferred tier:

| NPC level | Preferred ship tier |
| ---: | ---: |
| 1–3 | 1 |
| 4–7 | 2 |
| 8–11 | 3 |
| 12–15 | 4 |
| 16–18 | 5 |
| 19–20 | 6 |

The preferred tier changes weights rather than imposing a hard restriction. Adjacent tiers remain common; any role-compatible tier may be retained at low probability if balance testing supports it.

NPC ships begin mostly healthy, with occasional existing hull or sail damage. A provisional distribution is 80% healthy and 20% lightly or moderately damaged. NPCs evaluate their actual condition.

## NPC knowledge

An NPC always begins with the same observable baseline available to the player:

- Apparent ship type
- Displayed flag

Additional estimates depend on:

- NPC role
- NPC level
- Equipment and observation circumstances
- Distance, weather, and visibility
- Player Deception
- False flags and forged documents
- Player reputation and prior identification

NPCs use perceived rather than perfect hidden information. High-level captains estimate strength more accurately; low-level captains may overestimate or underestimate the player.

## Opening postures

All seven postures exist from the first version:

- **Pass** — continue without interaction
- **Flee** — attempt immediate escape
- **Hail** — request peaceful contact
- **Challenge** — order identification, inspection, or stopping
- **Demand** — request payment, cargo, passengers, a ship, surrender, or compliance
- **Threaten** — attempt coercion without immediately attacking
- **Attack** — seek Naval Engagement

Every role may technically select every posture. Role makes inappropriate postures score very poorly rather than forbidding them. Exceptional combinations of temperament, hostility, perceived advantage, and circumstances can still produce unusual behavior.

The NPC reveals its opening posture before the player chooses a response. Surprise or ambush may later become explicit exceptions; they are not the ordinary encounter flow.

## NPC posture scoring

Each posture receives a score:

```text
posture score =
    role preference
  + temperament preference
  + faction and legal duty
  + relationship and player reputation
  + perceived relative strength
  + NPC ship and crew condition
  + apparent player behavior
```

Mission value may inform role behavior, but it is not a selected direct input to Flee/Surrender scoring.

The NPC chooses the highest-scoring posture **90%** of the time. In the other 10%, it makes a seeded weighted choice among credible alternatives. The permitted score distance depends on temperament. Provisional normalized-score thresholds are:

| Temperament | Alternative within best score |
| --- | ---: |
| Fanatical | 4 points |
| Honorable | 6 points |
| Cautious | 7 points |
| Aggressive | 10 points |
| Bold | 15 points |

These thresholds require simulation and balancing.

## Context-relevant player actions

Only actions relevant to the NPC posture are shown.

| NPC posture | Typical player responses |
| --- | --- |
| Pass | Ignore, Attack |
| Flee | Let go, Pursue |
| Hail | Respond, Ignore, Threaten, Attack |
| Challenge | Comply, Negotiate, Deceive, Flee, Threaten, Attack |
| Demand | Comply, Negotiate, Deceive, Flee, Threaten, Attack, Surrender where relevant |
| Threaten | Ignore, Comply, Negotiate, Counter-threaten, Flee, Attack, Surrender |
| Attack | Flee, Surrender, Fight |

Attacking a friendly or allied ship requires confirmation and may reduce faction attitude and global reputation if the player is identified.

Attack itself does not require an Encounter roll. The target evaluates Fight, Flee, or Surrender. If it fights, Naval Engagement begins at normal range. If it flees, the attacker chooses Pursue or End Encounter.

## Common action-resolution system

Most uncertain Encounter actions use:

```text
raw advantage =
    primary skill contribution
  + ship-performance contribution
  + crew contribution
  + situational contribution
  − NPC resistance

net modifier = clamp(raw advantage, −4, +4)
modified total = 2d6 + net modifier
```

Outcome bands:

| Modified total | Result |
| ---: | --- |
| 6 or less | Setback |
| 7–9 | Partial or costly success |
| 10 or more | Full success |

Natural dice overrides:

- Natural 2 always produces a setback.
- Natural 12 always produces a full success.

The UI shows the complete bonus and penalty breakdown. NPC level may be represented through a derived resistance label or modifier without exposing the exact hidden level.

Typical inputs:

| Action | Primary inputs |
| --- | --- |
| Avoid / Flee / Pursue | Sailing & Navigation, relative speed, maneuverability, crew sailing efficiency, Early Sighting |
| Negotiate | Diplomacy, faction attitude, reputation, offered concession, NPC resistance |
| Deceive | Deception, false flag/documents/equipment, circumstances, NPC information accuracy |
| Threaten | Intimidation, apparent firepower, boarding strength, reputation, NPC resistance |

## Peaceful Hail

Responding peacefully to Hail provides market intelligence from the NPC ship's origin town:

- Exact legal buy prices
- Exact legal sell prices
- Exact legal stock for every good
- Observation date and departure time

The information is always an accurate dated snapshot. It is stored as remote market information in the Journal and may become stale. Smuggler-market information remains subject to separate access rules.

## Faction attitude and law

Faction attitude uses a visible numeric value from **−100 through +100** plus a descriptive rank.

Provisional rank thresholds:

| Value | Rank |
| ---: | --- |
| 76 to 100 | Allied |
| 41 to 75 | Friendly |
| 11 to 40 | Favorable |
| −10 to 10 | Neutral |
| −30 to −11 | Suspicious |
| −50 to −31 | Unfriendly |
| −75 to −51 | Hostile |
| −100 to −76 | Wanted |

"Wanted" is not a separate stat. It is the lowest faction-attitude rank.

Behavioral meaning:

- Suspicious: increased scrutiny
- Unfriendly: distrust and reduced cooperation
- Hostile: threaten, demand, or attack when advantageous
- Wanted: Navy and Bounty Hunters actively seek surrender and live capture

### Attribution

A hostile act is attributed through identification rather than magical global knowledge. Identification depends on:

- Displayed flag
- Player Deception
- False documents
- NPC derived observation, based on role and level
- Prior knowledge
- Visibility and circumstances

Only an identity that can be observed and reported should normally affect the true captain's faction attitude or reputation. Detailed witness and reporting persistence is deferred.

### Navy inspections

A Challenge may lead to three separate checks:

1. Wanted identity
2. False flag or documents
3. Illegal or contraband cargo

The player rolls each attempted concealment against NPC resistance using the common 2d6 system. Visible facts are not automatically bundled into one roll. Mixed results are possible.

If no actionable offense is found, the Navy releases the player. If an offense is found, the player receives one final response before the encounter ends or becomes Naval Engagement.

Provisional severity table:

| Discovery | Normal legal response |
| --- | --- |
| Minor document irregularity | Warning |
| Small contraband offense | Fine |
| Significant contraband | Confiscation plus fine |
| False flag or forged documents | Fine, confiscation, and attitude loss |
| Wanted identity | Demand surrender |
| Several offenses | Increase response by one severity step |

An outmatched Navy captain demands compliance but avoids initiating battle. Temperament and relative strength determine whether it maintains the demand, disengages, or reports the identification. Exact reporting persistence is deferred.

## Pirate behavior and demands

Pirates seek value without unnecessary combat. They estimate the player's wealth, cargo, passengers, ship value, and resistance; build weighted eligible demands; then make one seeded choice.

Pirate demands may include:

- All carried trade goods
- All passengers
- All exposed silver
- A ship, but only when the future fleet system gives the player more than one ship

Pirates do not demand crew. Trade goods exclude provisions, ammunition, ship equipment, and other materials.

Demand eligibility:

| Demand | Availability | Compliance |
| --- | --- | --- |
| All trade goods | At least one good is carried | Remove all goods |
| All passengers | At least one passenger is aboard | Remove passengers and fail their contracts |
| Exposed silver | Silver remains after Deception concealment | Remove exposed silver |
| A ship | Player owns multiple ships | Transfer one eligible ship in future Capture Resolution |

Surrendering passengers reduces both global reputation and the passengers' faction attitude. Refusing increases both only after the encounter ends with the passengers safe.

### Demand valuation and counteroffers

Every demand receives a visible pirate value:

- Silver: face value
- Goods: reference value
- Passengers: provisional ransom value based on contract reward and importance
- Ship: current sale value when fleets exist

On full Negotiation, the player may offer eligible assets whose pirate value reaches at least 50% of the original demand value.

### Negotiation

| Result | Outcome |
| --- | --- |
| Setback | Original demand remains; pirate becomes less patient |
| Partial | Original demand falls by 25% |
| Full | Player may counteroffer another eligible payment type worth 50% of the original demand |

### Deception against a demand

A full Deception success reduces the demand by 50%. Partial and setback consequences remain to be balanced; the intended direction is a smaller reduction on partial and increased suspicion on setback.

### Threaten against a pirate demand

| Result | Outcome |
| --- | --- |
| Setback | Naval Engagement begins |
| Partial | Pirate demand is halved |
| Full | Pirates flee and the encounter ends |

## Shared Flee and Pursue movement model

Flee and Pursue use the same opposed movement rating with attacker and defender reversed.

Primary inputs, in approximate order of importance:

1. Relative effective speed
2. Sailing & Navigation
3. Crew sailing experience or efficiency
4. Maneuverability
5. Naval Tactics
6. Early Sighting
7. Weather and current hull/sail condition
8. NPC level through derived crew effectiveness and resistance

### Pursue

Pursue is binary: caught or escaped. It has no partial result.

The implementation should convert the opposed movement advantage into a visible dynamic required raw roll. A recommended representation is:

```text
required raw 2d6 roll = 10 − final pursuit modifier
```

The final modifier remains capped at −4 through +4. Natural 2 fails and natural 12 succeeds. This exact conversion is provisional, but the agreed rule is that player skill, NPC level, relative speed, ship stats, and crew experience determine the threshold, with speed, Sailing, and crew experience carrying the most weight.

- Success: Naval Engagement begins at normal range.
- Failure: target escapes and four hours are added to the voyage.

### Flee

Flee uses the three normal outcome bands:

| Result | Outcome |
| --- | --- |
| Setback | Escape fails; Naval Engagement begins at normal range |
| Partial | Escape succeeds with a randomly selected additional cost |
| Full | Clean escape |

A player may voluntarily dump trade goods or one prepared gunpowder charge before rolling. Voluntarily dumped items are lost even if escape fails.

#### Dumped cargo

Dumped weight immediately recalculates speed and maneuverability. Against a profit-seeking pursuer, dumped reference value also grants:

| Dumped value relative to demand value | Bonus |
| ---: | ---: |
| 10% | +1 |
| 25% | +2 |
| 50% | +3 |

Value distraction does not affect a Navy ship determined to capture a wanted captain, although the reduced weight still improves movement.

#### Gunpowder distraction

The player commits one fixed prepared charge. Demolitions affects the Flee bonus; mishap risk remains a natural 2 at every mastery.

Provisional Demolitions bonus:

| Demolitions mastery | Bonus |
| ---: | ---: |
| 0–2 | +1 |
| 3–5 | +2 |
| 6–8 | +3 |
| 9–10 | +4 |

On a natural 2:

- The charge is lost.
- Flee fails.
- The player loses 10% of maximum hull.
- Naval Engagement begins at normal range if the ship remains operational.

#### Partial-escape cost

A modified total of 7 is severe, 8 is moderate, and 9 is light. The game builds a list of valid costs and selects one with the seeded generator:

- Hull damage
- Sail damage
- Loss of remaining trade goods
- Loss of gunpowder, if carried

Provisional magnitudes:

| Result | Hull | Sails | Goods | Gunpowder |
| --- | ---: | ---: | ---: | ---: |
| 7 severe | 15% maximum hull | 25 points | 50% | 50% |
| 8 moderate | 10% maximum hull | 15 points | 25% | 25% |
| 9 light | 5% maximum hull | 5 points | 10% | 10% |

Percentages round up so a selected cost cannot become zero. These values require balance testing.

## Flee and surrender decisions

NPC Flee and Surrender scores use:

- Hull condition
- Sail condition
- Fit crew and crew losses
- Morale
- Relative firepower
- Relative boarding strength
- Possibility of escape

General rule:

- Prefer Flee when defeat risk is high and escape remains plausible.
- Prefer Surrender when defeat risk is high and escape is unlikely.
- Fanatical captains never surrender while their crew can still fight.

Both player and NPC may offer surrender during Encounter before Naval Engagement. Accepted surrender ends Encounter and enters future Capture Resolution. The Encounter document does not decide prizes, imprisonment, ship transfer, or prisoner treatment.

## Determinism and persistence

All generation and decisions use the game's seeded random generator:

- Contact count and timing
- Contact role
- NPC role details, temperament, level, ship, and condition
- The 10% credible-alternative posture selection
- Dice
- Random partial-escape cost

Restoring the same church checkpoint and repeating the same actions should reproduce the same results, consistent with current checkpoint behavior.

## Explainability and UI requirements

The player should see:

- Apparent ship type and displayed flag
- NPC opening posture
- Only context-relevant actions
- Complete player-action modifier breakdowns
- Required Pursue roll
- Voluntary losses before confirming Flee
- Exact consequences after a result
- Faction attitude number and rank
- Dated market intelligence from Hail
- Lookout-derived motives without hidden numeric posture scores

The UI should confirm attacks on friendly or allied ships and explain likely faction and reputation consequences.

## Robustness rules

- The game, never generated prose, chooses actions and outcomes.
- NPCs evaluate perceived information, not omniscient truth.
- Role changes weights rather than creating large hard-coded decision trees.
- Temperament changes preferences rather than competence.
- Level changes competence rather than aggression.
- Randomness chooses only credible alternatives.
- Shared formulas are preferred for Flee/Pursue and social checks.
- Every numeric calculation shown to the player should be reproducible from displayed inputs, except deliberately hidden NPC information represented through a summarized resistance modifier.
- Invalid demand and cost categories are removed before random selection.
- Encounter cannot loop indefinitely; it allows at most two player decisions before resolution, Pursuit, Naval Engagement, or Capture Resolution.

## Deferred and provisional work

The following are intentionally not final:

- Detailed Naval Engagement rules
- Capture Resolution, prizes, imprisonment, and fleet transfer
- Exact score values for role and temperament posture biases
- Exact temperament alternative-score thresholds
- Exact faction-attitude rank boundaries
- Regional pirate-danger scale and update rules
- Witness and delayed-report persistence
- Contraband catalogue and offense values
- NPC starting-condition percentages
- Exact skill-to-modifier conversion
- Exact Pursue threshold conversion
- Partial Deception consequences
- Prepared gunpowder charge size and inventory representation
- Partial-escape damage and loss magnitudes
- Passenger ransom valuation
- False-flag and document equipment
- Simulations and balance targets

These should be tuned with deterministic simulations before implementation values are treated as final.
