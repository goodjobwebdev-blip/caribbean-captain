# Boarding System

This document defines the **Boarding** phase that follows a successful Grapple during Naval Engagement. It covers the crew-level Deck Battle, the final Captain Duel, surrender, casualties, NPC decision-making, user-interface requirements, and the transition to Capture Resolution.

Related systems:

- [Naval Engagement](naval-engagement-system.md)
- [Encounter](encounter-system.md)
- [Skills](skills.md)
- [Game stats](stats.md)

# Scope and design goals

The first implementation supports one player ship and one NPC ship, while all state and relationships continue to use ship IDs for future fleets.

Boarding should:

- resolve a grappled fight in a small, readable number of turns;
- make ship size, crew numbers, crew quality, captain skill, NPC level, and equipment matter;
- preserve the common player-facing 2d6 resolution model;
- end with a personal duel between captains;
- use the established NPC role, temperament, level, and difficulty model;
- preserve seeded, reproducible combat results;
- transition cleanly into Capture Resolution.

The first version does not include:

- selectable boarding-party sizes;
- individual crew members;
- subordinate officers who can replace a captain;
- Cut Grapples or voluntary disengagement after Grapple;
- detailed weapon and armor catalogs;
- fleet-scale Boarding;
- Capture Resolution itself.

# Entry from Naval Engagement

A successful Grapple completes after all other effects at the same Naval Engagement unit resolve.

Then:

1. Cancel every unfinished and later Naval Engagement action.
2. Do not apply effects from cancelled actions.
3. Release or preserve resources according to the Naval Engagement cancellation rules.
4. Create a fresh Boarding phase state.
5. Clear the Naval Engagement timeline and Action Pool.
6. Begin Deck Battle.

Boarding choices use rounds and exchanges rather than Naval Engagement timeline units. No Naval Engagement action survives the transition.

A successful Grapple commits both sides to Boarding. Neither side may withdraw or Cut Grapples in the first implementation.

# Boarding flow

Boarding has two stages:

1. **Deck Battle** — the two crews fight for control across the grappled ships.
2. **Captain Duel** — the captains fight personally until surrender, incapacitation, collapse, or death.

The normal flow is:

Deck Battle → Captain Duel → Capture Resolution

The Captain Duel may be skipped by an automatic or voluntary surrender condition.

# Shared resolution rules

Boarding uses player-facing rolls:

**2d6 + final net modifier**

The final net modifier is capped at **−4 to +4**.

Natural dice results override modifiers:

- natural 2 always fails;
- natural 12 always succeeds.

The interface shows the complete bonus and penalty breakdown. Deliberately hidden NPC information is represented by a summarized resistance modifier rather than exposing exact NPC level or mastery.

All random results use the battle seed. Saving and restoring a checkpoint must preserve the random state and every accepted NPC decision.

# Deck Battle

## Participating crew

All current **Fit Crew** on both ships contribute to Deck Battle.

This is an abstraction of the full struggle across and between the grappled ships. It does not mean that every sailor has literally abandoned all shipboard duties. Minimum Crew does not restrict participation during Boarding.

Crew members are not assigned individually and the player does not select a separate boarding party.

## Number of rounds

The number of Deck Battle rounds depends on both ship tiers:

**Deck Battle rounds = ceil((attacker ship tier + defender ship tier) / 2)**

With ship tiers from 1 through 6, Deck Battle lasts from 1 through 6 rounds.

The ship that initiated the successful Grapple is the **boarding attacker**. The other ship is the **boarding defender**.

## Boarding Strength

First calculate average crew quality:

**Crew Quality = (Fighting Experience + Morale + Discipline + Equipment Quality) / 4**

For this formula, each crew-quality input is normalized to a 0–100 scale.

Player Boarding Strength is:

**Boarding Strength = Fit Crew × (0.5 + Crew Quality / 200) × (1 + 0.05 × Boarding mastery)**

NPC Boarding mastery is derived from captain level:

**NPC Boarding mastery = floor(NPC level / 2)**

This produces a value from 0 through 10 for NPC levels 1 through 20. The NPC uses the same Boarding Strength formula.

Boarding Strength is recalculated whenever Fit Crew or another input changes.

## Relative-strength modifier

Divide player Boarding Strength by NPC Boarding Strength:

| Player-to-NPC strength ratio | Player modifier |
| ---: | ---: |
| Below 0.50 | −2 |
| 0.50–0.79 | −1 |
| 0.80–1.24 | 0 |
| 1.25–1.99 | +1 |
| 2.00 or more | +2 |

If NPC Boarding Strength is zero, the NPC crew cannot continue fighting and surrenders automatically.

## Home-deck advantage

The crew defending its own ship receives a +1 home-deck advantage.

Because rolls are player-facing:

- player defending: +1;
- NPC defending: −1 to the player roll.

## Crew orders

At the beginning of every Deck Battle round, both sides secretly choose one order. After both choices are committed, reveal them simultaneously.

### Assault

- No roll modifier.
- May gain Boarding Control normally.
- Uses normal casualty rules.

### Guard

- Choosing side receives +1.
- NPC Guard applies −1 to the player-facing roll.
- Halves that side's casualties.
- The choosing side cannot gain Boarding Control during that round.
- It can still lose Boarding Control.

### Breakthrough

- Choosing side receives −1.
- NPC Breakthrough applies +1 to the player-facing roll.
- A winning Breakthrough shifts Boarding Control by 2 instead of 1.
- A losing Breakthrough multiplies that side's casualties by 1.5.

After relative strength, home-deck advantage, orders, and other effects are combined, clamp the final modifier to −4 through +4.

## Deck Battle roll

The player rolls once for the round.

| Modified result | Outcome |
| ---: | --- |
| 6 or less | NPC wins; Boarding Control shifts 1 toward the NPC; player suffers normal losing-side casualties |
| 7–9 | Clash; Boarding Control does not change; both sides suffer reduced casualties |
| 10 or more | Player wins; Boarding Control shifts 1 toward the player; NPC suffers normal losing-side casualties |

Natural results are decisive:

- natural 2: decisive NPC win and a Control shift of 2;
- natural 12: decisive player win and a Control shift of 2.

Breakthrough and Guard still modify the result:

- a winning Breakthrough uses a shift of 2;
- Guard cannot produce a positive Control shift for its choosing side;
- Guard does not prevent a negative Control shift;
- decisive results do not increase a shift beyond 2.

## Boarding Control

Boarding Control begins at 0:

- positive values favor the player;
- negative values favor the NPC.

Control is not a health track and does not end Deck Battle early in the first implementation.

After the final Deck Battle round, clamp Boarding Control to **−2 through +2**. Apply that value once as a player-facing modifier to the player's first Captain Duel roll. Then consume it.

Boarding Control has no further duel effect after that first roll.

## Casualties

Casualties use the losing side's current Fit Crew before the round's casualties are applied.

Base casualty rates:

| Result | Casualties |
| --- | ---: |
| Normal losing result | 5% of losing side's current Fit Crew |
| Decisive natural result | 10% of losing side's current Fit Crew |
| Clash | 2.5% of each side's current Fit Crew |

Order effects apply to the base amount:

- Guard multiplies its choosing side's casualties by 0.5.
- A failed Breakthrough multiplies its choosing side's casualties by 1.5.

Calculate all percentage and order modifiers first, then round the final casualty count up. A positive casualty result therefore removes at least one Fit Crew.

For each casualty, make an independent seeded check:

- 25%: dead;
- 75%: injured.

A dead crew member is removed from Fit Crew and Total Crew. An injured crew member moves from Fit Crew to Injured Crew but remains in Total Crew.

Recalculate Boarding Strength after casualties.

## Automatic surrender during Deck Battle

A side automatically surrenders if it has no Fit Crew remaining.

The player may surrender voluntarily between rounds. NPC voluntary surrender follows its role, temperament, level, perceived situation, and existing surrender rules.

A Fanatical captain does not surrender voluntarily while their crew can still fight.

# Transition to Captain Duel

After the last Deck Battle round, the Captain Duel normally occurs regardless of the final Boarding Control value.

Skip the duel when:

- one side has no Fit Crew and surrenders automatically;
- a side already surrendered voluntarily;
- a captain is Dead;
- a captain is Incapacitated;
- a captain is Collapsed;
- a future story rule explicitly makes a captain unavailable.

Until subordinate officers are implemented, a side without an able captain loses Boarding and surrenders.

# Captain Duel

## Duel state

Track:

- current Initiative holder;
- player and NPC Injury conditions;
- player and NPC Fatigue conditions;
- equipped melee weapon class and quality;
- whether each pistol is loaded and unused;
- exchange count;
- final Boarding Control modifier until consumed;
- legal actions;
- accepted NPC decision and structured intent.

## Starting Initiative

The side favored by final Boarding Control begins with Initiative.

- positive Control: player begins;
- negative Control: NPC begins;
- Control 0: the boarding attacker begins.

The final Boarding Control modifier is still applied to the player's first roll even if the player begins as defender.

## Exchange structure

One captain holds Initiative and is the attacker.

1. The attacker announces an attack.
2. The defender chooses Block, Parry, or Dodge from the legal responses.
3. The player makes one player-facing 2d6 roll.
4. Apply the attack, defense, injury, and Initiative result.
5. Check surrender, incapacitation, collapse, death, and fatigue.
6. Begin the next exchange if the duel continues.

When the NPC attacks, its attack is revealed before the player chooses a response. When the player attacks, the NPC receives the declared attack and chooses a legal response.

## Combat mastery

NPC Combat Mastery is:

**NPC Combat Mastery = floor(NPC level / 2)**

Compare the relevant player mastery with NPC Combat Mastery:

| Player mastery advantage | Modifier |
| ---: | ---: |
| −4 or less | −2 |
| −3 to −2 | −1 |
| −1 to +1 | 0 |
| +2 to +3 | +1 |
| +4 or more | +2 |

Relevant player skills:

- melee attack: Light Weapons, Medium Weapons, or Heavy Weapons according to the equipped weapon;
- Block: the equipped melee weapon's skill;
- Parry: the equipped melee weapon's skill;
- Dodge: Athletics;
- pistol attack: Shooting;
- Demand Surrender: Intimidation.

NPC weapon, defense, shooting, athletic, and resistance capability use NPC Combat Mastery unless a later character system supplies more specific values.

## Condition modifiers

### Injury

| Injury condition | Modifier |
| --- | ---: |
| Healthy | 0 |
| Lightly Injured | 0 |
| Injured | −1 |
| Severely Injured | −2 |
| Critically Injured | −3 |
| Incapacitated | Cannot act |
| Dead | Cannot act |

### Fatigue

| Fatigue condition | Modifier |
| --- | ---: |
| Rested | 0 |
| Tired | 0 |
| Fatigued | −1 |
| Exhausted | −2 |
| Collapsed | Cannot act |

### Weapon quality

| Weapon quality | Modifier |
| --- | ---: |
| Poor | −1 |
| Standard | 0 |
| Superior | +1 |

Item-specific weapon effects are deferred. The first version needs only weapon class, quality, and whether a pistol is loaded.

Combine mastery edge, action or reaction modifier, conditions, equipment, first-roll Boarding Control, and situational effects. Clamp the final modifier to −4 through +4.

## Melee attacks

### Quick Attack

- +1 to the roll.
- Causes one Injury step on a hit.
- Initiative passes to the defender after resolution even when the attack hits.

### Standard Attack

- No modifier.
- Causes one Injury step on a normal hit.
- The attacker retains Initiative on a hit.

### Heavy Attack

- −2 to the roll.
- Causes two Injury steps on a hit.
- The attacker retains Initiative on a hit.

## Defensive reactions

### Block

- +1 when used by the player.
- NPC Block applies −1 to the player-facing attack roll.
- Legal only against melee attacks.
- On a player defensive result of 7–9, reduce incoming damage by one Injury step.
- On 10 or more, prevent all damage and take Initiative.

### Parry

- No base modifier.
- Legal only against melee attacks.
- A Heavy Attack gives Parry an additional −1.
- On a player defensive result of 7 or more, prevent all damage and take Initiative.

### Dodge

- No base modifier.
- Legal against melee attacks and pistol shots.
- On a player defensive result of 7–9, prevent all damage but the attacker retains Initiative.
- On 10 or more, prevent all damage and take Initiative.

## Pistol

Each captain may begin the duel with one loaded pistol if their equipment and ammunition state permits it.

A pistol attack:

- uses Shooting;
- consumes the loaded shot;
- causes two Injury steps on a hit;
- may be answered only with Dodge;
- cannot be reloaded during the duel.

A natural 2 pistol attack is a misfire. It consumes the shot and passes Initiative to the defender without causing the automatic melee counterattack.

## Player attack results

When the player attacks:

| Modified result | Outcome |
| ---: | --- |
| 6 or less | Attack fails; defender takes Initiative |
| 7–9 | Attack hits for its normal Injury steps |
| 10 or more | Attack hits with +1 Injury step, to a maximum of two |

A successful Standard Attack, Heavy Attack, or pistol attack retains Initiative. Quick Attack passes Initiative after resolution.

NPC defensive action modifiers and legal-response restrictions apply to the player roll. The engine resolves any response-specific mitigation before applying Injury steps.

## Player defense results

When the NPC attacks and the player defends:

| Modified result | Outcome |
| ---: | --- |
| 6 or less | Defense fails; apply the NPC attack |
| 7–9 | Apply the chosen defense's partial result |
| 10 or more | Prevent all damage and take Initiative |

Defense-specific rules may alter the 7–9 result.

## Natural 12

When the player attacks with a natural 12:

- the attack succeeds;
- inflict two Injury steps;
- Quick Attack still passes Initiative afterward.

When the player defends with a natural 12:

- prevent all damage;
- take Initiative;
- inflict an immediate one-step counterattack.

## Natural 2

When the player makes a melee attack with a natural 2:

- the attack fails;
- suffer an immediate one-step counterattack;
- the NPC takes Initiative.

When the player fires a pistol with a natural 2:

- the pistol misfires;
- consume the loaded shot;
- the NPC takes Initiative;
- do not apply the automatic melee counterattack.

When the player defends with a natural 2:

- the defense fails;
- increase the incoming attack by one Injury step, to a maximum of two;
- the NPC retains Initiative.

These player-facing results also represent decisive NPC execution. The engine does not make a separate NPC dice roll.

# Injury, defeat, and death

Apply Injury steps along the existing track:

Healthy → Lightly Injured → Injured → Severely Injured → Critically Injured → Incapacitated → Dead

Reaching Incapacitated ends the duel alive.

A multi-step injury can pass through Incapacitated and reach Dead. For example:

- Critically Injured + one step = Incapacitated;
- Critically Injured + two steps = Dead.

Execution of an Incapacitated or surrendered captain is not part of Boarding. It belongs to Capture Resolution.

# Duel fatigue and maximum duration

After every five completed exchanges, worsen both captains' Fatigue condition by one step.

A captain who reaches Collapsed loses the duel alive.

If both captains Collapse at the same fatigue checkpoint:

1. the side with better final Boarding Control wins;
2. if final Control is tied, the captain defending their own ship wins.

This rule guarantees that a duel cannot continue indefinitely.

# Surrender

Surrender is a terminal decision, not a timed action.

- The player may surrender before any exchange without spending Initiative.
- The NPC evaluates voluntary surrender after suffering an injury and before making an attack.
- An accepted surrender is always honored.
- Surrender ends Boarding and enters Capture Resolution.
- Fanatical captains never surrender voluntarily while their crew can still fight.

## Demand Surrender

While holding Initiative, the player may choose **Demand Surrender** instead of attacking.

The player may attempt it once per NPC Injury condition. The opportunity refreshes only when the NPC's Injury condition worsens.

Roll:

**2d6 + Intimidation edge + Injury Pressure + Crew Pressure**

Intimidation edge uses the duel mastery-difference table.

### Injury Pressure

| NPC Injury condition | Modifier |
| --- | ---: |
| Healthy | −2 |
| Lightly Injured | −1 |
| Injured | 0 |
| Severely Injured | +1 |
| Critically Injured | +2 |

### Crew Pressure

Crew Pressure uses the current player-to-NPC Boarding Strength ratio table:

- below 0.50: −2;
- 0.50–0.79: −1;
- 0.80–1.24: 0;
- 1.25–1.99: +1;
- 2.00 or more: +2.

Clamp the complete Demand Surrender modifier to −4 through +4.

| Modified result | Outcome |
| ---: | --- |
| 6 or less | NPC refuses and takes Initiative |
| 7–9 | Conditional surrender; record the requested condition for Capture Resolution |
| 10 or more | Unconditional surrender |

Natural results:

- natural 2: refusal; another demand is forbidden until the NPC's Injury condition worsens;
- natural 12: unconditional surrender.

A Fanatical captain automatically refuses Demand Surrender while their crew can still fight.

Typical conditional terms include personal safety or honorable treatment. Boarding records the term but does not resolve its long-term consequences.

# NPC decision-making

Boarding uses the same mandatory LLM boundary as Naval Engagement. There is no deterministic Boarding-AI fallback.

The LLM chooses:

- Assault, Guard, or Breakthrough during Deck Battle;
- Quick Attack, Standard Attack, Heavy Attack, or pistol during the Captain Duel;
- Block, Parry, or Dodge when defending;
- voluntary surrender when permitted.

The game engine remains authoritative for:

- legal actions;
- concrete action IDs;
- Boarding Strength;
- modifiers and caps;
- dice and seeded random results;
- casualties;
- Injury and Fatigue changes;
- Initiative;
- surrender eligibility;
- phase transitions;
- all state mutation.

The LLM may not invent actions, calculate authoritative values, roll dice, alter state, see secret player orders, or receive hidden player information unavailable to the NPC.

## Behavioral hierarchy

1. Role defines the strategic objective.
2. Temperament changes aggression, defense, and surrender tolerance.
3. Captain level controls estimate accuracy and tactical sophistication.
4. Game difficulty changes effective planning level, not combat stats.
5. Current injuries, crew losses, Initiative, and emergencies may override ordinary preferences.

Examples:

- Cautious captains prefer Guard, Block, Dodge, and earlier surrender.
- Aggressive captains prefer Assault, Heavy Attack, Parry, and continued pressure.
- Fanatical captains prefer risky attacks and do not voluntarily surrender while their crew can fight.
- Honorable captains respect surrender and avoid unnecessary killing.
- Bold captains prefer Breakthrough, pistol shots, Heavy Attack, and high-payoff choices.

## Difficulty

Use the established effective-planning-level offsets:

- Easy: −4;
- Normal: 0;
- Hard: +4.

Clamp effective planning level to 1 through 20. Difficulty changes prompt information quality and tactical sophistication, not NPC combat statistics or access to hidden state.

## Prompt payload

Use a compact, versioned JSON payload containing:

- rules version and current Boarding stage;
- NPC role, temperament, actual level band, effective planning band, and objective;
- exact NPC state;
- public player state and level-appropriate estimates;
- ship IDs, attacker and defender identities, ship tiers, and home-deck status;
- Deck Battle round, remaining rounds, orders, visible casualties, Boarding Control, and strength estimates;
- Captain Duel Initiative, visible conditions, fatigue, weapons, pistol status, exchange count, and history;
- concrete legal action IDs with descriptions;
- the strict output schema.

Expected response fields include:

- concise assessment;
- objective;
- risk;
- concise tactical intent;
- one legal action ID.

Assessment and intent are public tactical justification, not hidden chain-of-thought.

## Validation and correction

For every NPC decision:

1. Start the NPC stopwatch and attempt counter.
2. Request a structured decision.
3. Validate JSON, action ID, ownership, legality, equipment, and current state.
4. If invalid, return exact validation errors and request correction.
5. After ten invalid attempts, suspend Boarding and offer Retry or Change Model.
6. If the API is unavailable, keep Boarding suspended with Retry or Change Model.
7. Save the accepted decision before reveal or resolution.

Do not substitute a deterministic action.

Checkpoint restoration reuses the saved accepted decision and never regenerates the same decision.

# Boarding result

Boarding ends when a captain:

- surrenders;
- becomes Incapacitated;
- Collapses;
- dies;
- or loses automatically because no able captain or Fit Crew remains.

Then:

1. The losing side's remaining crew surrender.
2. The winning side controls the grappled ships for purposes of the next phase.
3. Record both ships, captains, surviving crew, injured crew, dead crew, cargo, equipment, ammunition, and all conditions.
4. Enter Capture Resolution.

In the first one-versus-one implementation, no hostile ship remains and the battle ends after Capture Resolution.

In a future fleet battle, return to Naval Engagement with a fresh Action Pool if other hostile ship IDs remain after Boarding and Capture Resolution.

# User interface

## Deck Battle

Show:

- current round and total rounds;
- player order choices;
- committed-order state without revealing the NPC order;
- simultaneous order reveal;
- complete roll and modifier breakdown;
- summarized hidden NPC resistance;
- casualties divided into injured and dead;
- current visible Fit Crew information or estimates;
- Boarding Control and its change;
- NPC stopwatch, attempt count, assessment, risk, and tactical intent.

## Captain Duel

Show:

- Initiative holder;
- attacker action before the defender responds;
- legal attacks or defensive reactions;
- complete modifier breakdown;
- both captains' visible Injury and Fatigue conditions;
- equipped weapon class and visible quality;
- loaded-pistol status;
- exchange count and next fatigue checkpoint;
- remaining Demand Surrender eligibility;
- NPC stopwatch, attempt count, assessment, risk, and tactical intent.

Exact NPC level and raw NPC mastery remain hidden. Represent their mechanical effect through a derived resistance modifier.

## Resolution

Always pause for:

- surrender;
- conditional surrender terms;
- incapacitation;
- collapse;
- death;
- transition to Captain Duel;
- transition to Capture Resolution;
- LLM validation suspension.

# Persistence and reproducibility

A Boarding checkpoint stores:

- battle seed and random state;
- participating ship IDs;
- stage, round, and exchange;
- crew states and casualties;
- Boarding Strength inputs and current values;
- Boarding Control;
- Initiative;
- captain Injury and Fatigue;
- equipment and pistol state;
- Demand Surrender eligibility;
- accepted NPC actions and public intent;
- pending phase transition.

Restoring a checkpoint must reproduce the same unresolved random results and must not ask the LLM to regenerate an already accepted decision.

# Deferred decisions

The following remain outside this first Boarding specification:

- Capture Resolution choices and consequences;
- detailed melee weapons, firearms, armor, and item durability;
- musket use during personal duels;
- multiple carried pistols;
- subordinate officers and replacement duelists;
- selectable boarding parties;
- Cut Grapples and Boarding withdrawal;
- fleet-scale simultaneous Boarding;
- character-specific combat abilities and perks;
- skill-point rewards and progression from Boarding;
- execution, ransom, imprisonment, recruitment, prize crews, and captured-ship management.
