# Naval Engagement system

Status: agreed design. Numerical balance values are provisional unless stated otherwise.

This document defines the tactical **Naval Engagement** phase that follows the Encounter system. Encounter determines whether ships fight, flee, pursue, surrender, or avoid one another. Naval Engagement begins when ships enter tactical combat. A successful pursuit enters Naval Engagement at normal range.

The first implementation supports one ship against one ship. State and relationships must use ship IDs so later fleet combat can reuse the model. Detailed Boarding is defined in the [Boarding System](boarding-system.md). Capture Resolution, deliberate Ramming, and multi-ship execution remain deferred.

## Design goals

- Make order timing, wind, bearing, ammunition, damage, and emergencies tactically meaningful.
- Let both captains commit secret plans before seeing the opposing plan.
- Keep the simulation deterministic after schedules and random rolls are fixed.
- Use existing ship, crew, cargo, and player-skill data.
- Give NPC captains recognizable role-, temperament-, and level-based behavior.
- Let an LLM construct NPC schedules while the game remains authoritative over rules and validation.
- Preserve data structures needed for future fleets without implementing fleets in the first release.

## Phase boundaries

Naval Engagement may begin from an Encounter outcome, including mutual combat or a successful pursuit. Suggested opening presets are:

| Source | Initial position |
| --- | --- |
| Successful pursuit | Long range, about 450 combat-distance units; pursuer behind the fleeing ship; broadly parallel headings |
| Mutual decision to fight | Long range, about 450 units; opposing or crossing headings |
| Future ambush | Medium range with advantageous bearing for the ambusher |

Small seeded variation may change exact coordinates and headings without removing the scenario advantage.

Naval Engagement ends or changes phase when:

- no hostile ships remain: end the battle;
- a ship surrenders: enter future Capture Resolution;
- Grapple succeeds: cancel Naval Engagement schedules and enter the [Boarding System](boarding-system.md);
- separation exceeds 1,000 combat-distance units at a window boundary: the fleeing ship escapes;
- otherwise: begin another Naval Engagement planning window.

After [Boarding](boarding-system.md), return to Naval Engagement with a fresh Action Pool if hostile ships remain. If none remain, end the battle.

## Core state

Each combatant stores at least:

- stable ship ID and side/faction;
- internal 2D position and heading;
- displayed range band and relative bearing;
- current sail setting;
- hull, sails, operational cannons, and battery states;
- crew condition, Morale, Discipline, and calculated efficiencies;
- cargo resources used by combat;
- Fire, Flooding, Rigging Damage, and Crew Shock states;
- current action, queued actions, completion unit, and reservations;
- observed and estimated enemy information;
- surrender, sinking, escape, and phase-transition state.

Relationships such as target, grapple, and hostility refer to ship IDs. The first implementation permits only one opponent and transitions immediately to Boarding on Grapple, but the schema must not embed player-versus-single-NPC assumptions.

# Action Pool and shared timeline

## Window

Every planning window contains exactly **1,000 Action Pool units**. Units are abstract combat time; they do not map to minutes or hours.

- Both captains secretly queue a full-window schedule.
- Both first actions begin at unit 0.
- An action's calculated cost is also its duration.
- When an action ends, it resolves and the next action begins immediately.
- One ship may execute only one queued action at a time.
- Crew allocation is abstracted into action costs; there is no separate crew-assignment layer.
- An action cannot be queued unless it can finish by unit 1,000.
- Unused units become Idle. The ship continues passive movement from its current heading and sail setting.
- There is no reserve pool. Reload, repairs, maneuvers, and other preparations are ordinary actions.

Example: costs of 250, 400, and 300 create intervals 0-250, 250-650, and 650-950. The ship is idle from 950-1,000.

## Completion-only actions

Actions do not create effects while their cost is being spent. Every action changes state or resolves once, at completion. Examples:

- Fire resolves at completion.
- Reload sets battery state and consumes reserved resources at completion.
- Turn changes heading at completion.
- Adjust Sails changes sail setting at completion.
- Repair and Doctoring apply their restoration at completion.

Continuous movement is not an active action effect. It follows the ship's already-established speed, heading, sail setting, and wind relationship during every Action Pool unit.

There is no Defense action.

## Same-unit resolution

All actions completing at the same Action Pool unit use the pre-event state and resolve simultaneously. State changes are committed together, after which new actions begin and validate against the updated state.

This permits mutual destruction. A Turn completing at the same unit as enemy Fire does not retroactively change the bearing used by that shot.

## Invalid actions and replacement

An action is validated when it begins and, where relevant, when it completes.

- If invalid at its start, pause the simulation and let that captain choose exactly one replacement.
- The replacement starts at the current unit and may use any remaining units.
- Existing later actions keep their order but shift according to the replacement cost.
- Remove actions from the end until the remaining schedule fits by unit 1,000.
- If an action becomes invalid after it starts, it consumes its full duration and fails at completion. No replacement is offered for that spent action.
- Fire and Reload continue with surviving cannons if some cannons are destroyed while the action is running.

The player selects a replacement manually. The NPC LLM selects NPC replacements; no deterministic fallback planner is used. If both captains need replacements at the same unit, the player commits secretly, the LLM chooses without seeing that replacement, and both replacements are revealed together.

## Cost formula

Each action has a base cost. Add all percentage bonuses and penalties, then apply them once:

```text
calculated cost = base cost × (1 + total penalties - total bonuses)
```

Clamp final cost to **50%-200%** of base cost and round to the nearest whole Action Pool unit. The player sees the complete modifier breakdown.

Action-specific inputs may include relevant mastery, crew efficiency, ship condition, critical states, equipment, sail setting, and wind. Do not apply the same derived factor twice. For example, Current Maneuverability already includes load, hull, sails, and crew sufficiency.

# Geometry, range, and bearing

## Internal and displayed position

The engine stores continuous 2D coordinates and headings. The interface normally presents abstract range bands and relative bearing arcs.

| Distance or state | Display |
| ---: | --- |
| Grapple completed | Grappled, followed immediately by Boarding |
| 0-99 | Close |
| 100-299 | Medium |
| 300-599 | Long |
| 600-1,000 | Distant |
| Above 1,000 | Outside engagement |

Grappled is a phase-transition state, not simply distance zero.

Range above 1,000 is checked at the end of the window. A brief mid-window crossing does not cancel committed schedules.

## Bearing arcs

Relative bearing is calculated separately for every observer ship.

| Battery | Arc relative to ship heading |
| --- | --- |
| Bow | -45 degrees to +45 degrees |
| Starboard | 45 degrees to 135 degrees |
| Stern | 135 degrees to 225 degrees |
| Port | 225 degrees to 315 degrees |

Use deterministic half-open boundaries so exactly one battery owns a boundary bearing. A battery may Fire only when its target is within that battery's arc at the relevant runtime checks.

Ordinary ship paths do not cause collision. Physical impact is reserved for a future deliberate Ram action. Ships also do not grapple merely because their paths cross.

# Movement, sails, and wind

## Combat movement

Combat uses an abstract distance scale:

```text
distance moved during u units
  = Combat Speed × 250 × (u / 1000)

Combat Speed
  = Current Calculated Speed
  × Sail Setting factor
  × Wind Heading factor
  × Wind Strength factor
  × active critical-state factors
```

Current Calculated Speed continues to use the existing load, hull, sail condition, crew, and Sailing mastery formula.

## Sail settings

| Setting | Speed factor | Notes |
| --- | ---: | --- |
| Furled | 0 | No normal movement; ship cannot begin Turn |
| Battle Sail | 0.50 | Safer combat setting and normal Turn cost |
| Full Sail | 1.00 | Maximum movement; Turn cost +20% |

Adjust Sails has base cost **150 per setting step**: Furled <-> Battle <-> Full. A direct Furled-to-Full change costs two steps. Apply Sailing mastery -3% per tier plus crew-insufficiency, sail-condition, and Rigging Damage modifiers.

The new setting applies only when Adjust Sails completes.

## Wind heading

| Heading relative to wind | Speed factor |
| --- | ---: |
| Directly into wind | 0 |
| Close-hauled, +/-45 degrees | 0.60 |
| Beam reach, +/-90 degrees | 1.00 |
| Broad reach, +/-135 degrees | 1.10 |
| Directly downwind, 180 degrees | 0.90 |

## Wind strength

| Strength | Factor |
| --- | ---: |
| Calm | 0.25 |
| Light | 0.75 |
| Moderate | 1.00 |
| Strong | 1.20 |

Wind direction and strength remain fixed within a window. At each boundary there is a 20% chance that direction shifts one 45-degree sector and a 10% chance that strength changes one adjacent category. Use the saved game RNG.

## Turn

Turn may change heading by 45, 90, 135, or 180 degrees to port or starboard. The old heading remains active until completion.

```text
base Turn cost = 100 × abs(turn angle) / 45 degrees
maneuverability modifier = 50 - Current Maneuverability
```

Additional initial modifiers:

- Sailing mastery: -3% per tier;
- Full Sail: +20%;
- Battle Sail: 0%;
- turning through the wind: +20%;
- Rigging Damage: its severity penalty.

A Furled ship cannot begin Turn.

# Batteries, ammunition, and gunpowder

## Battery state

Port, starboard, bow, and stern batteries operate independently. Each stores:

- operational cannon count;
- loaded cannon count;
- one ammunition type for all loaded cannons;
- current Fire, Reload, or Unload action and resource reservations.

Mixed ammunition in one battery is not supported. Reload fills the complete operational battery or cannot be queued. Fire discharges every loaded operational cannon.

Before the first schedule, both captains may choose one free full preload per battery. Preloading consumes normal resources. If resources cannot preload every battery, the captain chooses priority.

## Resource use

Every firing cannon requires:

- one unit of the selected ammunition; and
- one unit of Gunpowder.

The relevant goods are existing cargo goods: Round Shot, Chain Shot, Grapeshot, Bombs, and Gunpowder.

Reserve planned Reload resources when the schedule is accepted. Consume them when Reload completes. Release reservations when an action is cancelled or fails. This prevents several planned Reload actions from promising the same inventory.

If loaded cannons are destroyed, their loaded ammunition and powder are lost. If cannons are destroyed during Reload, load and consume resources only for survivors and release excess reservations. Fire similarly discharges surviving loaded cannons.

## Battery actions

| Action | Base cost | Completion |
| --- | ---: | --- |
| Aim and Fire | 150 | Resolve one battery volley; empty surviving firing cannons |
| Reload | 350 | Consume reservations and fully load the operational battery |
| Reload Bombs | 437.5 before rounding and other modifiers | Reload base cost +25% |
| Unload | 200 | Return surviving loaded ammunition and powder to inventory |

Fire uses Cannon Aiming -3% per mastery tier for cost. Reload and Unload use Cannon Reloading -3% per tier. Gunnery Efficiency, Crew Shock, and battery damage also modify the relevant cost.

Changing ammunition requires Unload followed by Reload. A failed Fire because no target is valid keeps the battery loaded. In future fleets, Fire automatically retargets another valid ship; if none exists, it fails and remains loaded. In the one-versus-one implementation, this normally means retaining the load.

## Ammunition ranges and accuracy

| Ammunition | Distant | Long | Medium | Close | Grappled/Boarding boundary |
| --- | ---: | ---: | ---: | ---: | ---: |
| Round Shot | -2 | -1 | 0 | +1 | +2 |
| Chain Shot | illegal | -2 | 0 | +1 | +2 |
| Bombs | illegal | illegal | -1 | +1 | +2 |
| Grapeshot | illegal | illegal | illegal | 0 | +2 |

Range changes accuracy, not the damage of a successful hit. Bombs fired when ships are at Grapple distance damage both ships.

# Cannon resolution and damage

## Accuracy roll

Every battery volley makes one roll:

```text
2d6 + net modifier, clamped to -4 through +4
```

| Modified result | Outcome |
| ---: | --- |
| 6 or less | Miss |
| 7-8 | Glancing Hit |
| 9-10 | Solid Hit |
| 11 or more | Critical Hit |

Natural 2 always misses. Natural 12 always critically hits.

One accuracy outcome applies to all firing shot packets in the volley. Each cannon contributes one packet, but a packet damages only one stat.

Initial modifiers include:

- Cannon Aiming: +1 at mastery tiers 3, 6, and 9;
- ammunition and range from the table above;
- crew Gunnery Efficiency, equipment, visibility, and temporary state;
- target size: tiers 1-2 are -1, tiers 3-4 are 0, tiers 5-6 are +1;
- target transverse movement below 25 units/window is +1, 25-99 is 0, 100-199 is -1, and 200 or more is -2.

Show the complete modifier calculation.

## Outcome multipliers

| Outcome | Damage multiplier |
| --- | ---: |
| Miss | 0 |
| Glancing | 0.50 |
| Solid | 1.00 |
| Critical | 1.50 plus one critical result |

This is the only ordinary roll for a volley. Do not make a separate damage roll.

## Packet targets and provisional damage

Round-shot packets independently choose a target using provisional weights: 50% Hull, 20% Sails, 20% Fit Crew, and 10% operational cannons. Chain Shot, Grapeshot, and Bombs have fixed primary targets.

| Ammunition | Packet target | Base damage per cannon |
| --- | --- | ---: |
| Round Shot | Hull | 4 Hull Points |
| Round Shot | Sails | 2 Sail Condition points |
| Round Shot | Crew | 1 casualty |
| Round Shot | Cannons | 1 operational cannon |
| Chain Shot | Sails | 5 Sail Condition points |
| Grapeshot | Crew | 2 casualties |
| Bomb | Hull | 8 Hull Points |

All installed cannons initially have equal shot power. The data model includes a `power` field for future light, medium, and heavy cannon types.

Combine packets assigned to one stat, apply the outcome multiplier, apply mitigation once, then round to the nearest whole unit with a minimum of 1 when at least one damaging packet hit. This avoids per-packet rounding inflation.

## Passive mitigation

- Hull and cannon damage use calculated ship Defense.
- Crew damage uses Crew Equipment Quality.
- Sail damage is normally unmitigated.
- Morale effects use checks rather than armor.

```text
damage after mitigation = raw damage × 100 / (100 + rating)
```

## Crew casualties

Each casualty independently has a 75% chance to become Injured Crew and a 25% chance to die. Dead crew cannot be restored. The game RNG determines the split.

Any Grapeshot volley that causes casualties triggers one Morale check. The penalty depends on the percentage of Fit Crew lost to that volley:

| Fit Crew lost | Modifier |
| ---: | ---: |
| Below 5% | 0 |
| 5%-14% | -1 |
| 15%-29% | -2 |
| 30% or more | -3 |

# Critical hits and persistent states

## Severity

```text
critical ratio = firing cannons / target ship tier
```

| Ratio | Severity |
| ---: | --- |
| 1 or less | Minor |
| More than 1 and at most 3 | Major |
| More than 3 | Severe |

One critical volley creates one additional critical result, not one per cannon.

## Weighted critical tables

| Round Shot | Weight |
| --- | ---: |
| Flooding | 35% |
| Battery smash: additional cannon damage | 25% |
| Crew Shock | 20% |
| Rigging Damage | 20% |

| Chain Shot | Weight |
| --- | ---: |
| Rigging Damage | 60% |
| Additional sail damage | 25% |
| Crew Shock | 15% |

| Grapeshot | Weight |
| --- | ---: |
| Crew Shock | 65% |
| Additional crew casualties | 35% |

| Bombs | Weight |
| --- | ---: |
| Fire | 55% |
| Flooding | 30% |
| Additional hull damage | 15% |

Immediate additional-damage results add 25% for Minor, 50% for Major, and 100% for Severe, using the volley's relevant pre-mitigation damage.

For a matching existing state, set severity to the greater of the incoming severity or one level above the current severity, capped at Severe.

## State effects

| State | Minor | Major | Severe |
| --- | --- | --- | --- |
| Fire | Lose 1% Max Hull per window | Lose 2% | Lose 4% |
| Flooding | Lose 0.5% Max Hull; Speed and Maneuverability x0.90 | Lose 1%; x0.75 | Lose 2%; x0.50 |
| Rigging Damage | Speed and Maneuverability x0.90; related costs +10% | x0.75; costs +25% | x0.50; costs +50% |
| Crew Shock | crew-action costs +10%; Morale checks -1 | costs +25%; checks -2 | costs +50%; checks -3 |

Round continuing Hull loss up to at least 1. Fire and Flooding apply once at the end of each window. States do not worsen automatically; matching critical results increase them.

# Dumped explosives

Dump Explosives is a completion action that consumes **one Bomb and one Gunpowder**, then places a visible fixed hazard at the ship's exact completion position.

- Base action cost: 250.
- Demolitions cost bonus: -3% per mastery tier.
- Core radius: 20 combat-distance units.
- Outer radius: 50 units.
- Core damage: 24 raw Hull damage.
- Outer damage: 12 raw Hull damage.
- Passive ship Defense applies.
- The hazard persists until detonated or the engagement ends and cannot be recovered.

The charge remains unarmed until the deploying ship leaves the outer radius. Once armed, any ship entering the core/outer trigger area detonates it. An unarmed or armed charge may be deliberately targeted by cannon fire. Hitting the small hazard requires an accuracy roll.

An explosion detonates other charges within its outer radius, including unarmed charges. This permits chain reactions. Proximity detonation has no separate critical roll. If a deliberate shot critically hits the charge, ships in the core radius also receive Minor Fire.

# Grapple and Boarding transition

Grapple may begin while the target is in Close range.

- Base cost: 200.
- At completion, distance must be at most 25 units.
- Relative movement must be at most 50 combat-distance units per full window.
- If positional requirements hold, roll `2d6 + capped net modifier` against 9.
- Natural 2 fails and natural 12 succeeds.
- Failure has no additional penalty.

The modifier compares attacker Boarding Strength and Maneuverability with defender Boarding Strength and Maneuverability and includes relative position and crew state.

Success immediately transitions to the [Boarding System](boarding-system.md) after all other effects completing at that same unit resolve. Cancel every unfinished and later Naval Engagement action without applying its effect. Completion-consumed resources for cancelled actions remain unspent or are released. Boarding begins with a fresh phase state.

Cut Grapples is not a Naval Engagement action and is deferred beyond the first Boarding implementation.

# Support actions

Support effects are deterministic. Relevant mastery reduces cost by 3% per tier. Crew Readiness, equipment, and critical conditions may add penalties. Tools are required where listed but are not consumed.

| Action | Base cost | Goods | Completion effect |
| --- | ---: | --- | --- |
| Patch Hull | 300 | Planks; Tools required | Restore `Max Hull × (2% + 0.5% × Carpentry tier)` |
| Repair Sails/Rigging | 250 | Sailcloth and Rope; Tools required | Restore `5 + Sailmaking tier` Sail Condition |
| Extinguish Fire | 200 | none | Reduce Fire by one severity |
| Control Flooding | 250 | Planks; Tools required | Reduce Flooding by one severity |
| Rally Crew | 150 | none | Reduce Crew Shock by one severity |
| Doctoring | 300 | Medicine | Return Injured Crew to Fit status |

Consumed repair goods per action equal `ceil(ship tier / 2)` units of every listed consumable.

Doctoring restores:

```text
ceil(Total Crew × (2% + 0.5% × Doctoring tier))
```

Cap Doctoring by available Injured Crew and the ship's Fit Crew at engagement start.

Patch Hull and Repair Sails cannot restore condition above its engagement-start value. Combat actions cannot restore destroyed cannons or dead crew.

## Deception

Deception has base cost 200 and affects the opponent's observations for the next planning window. It does not change coordinates, heading, visible sail setting, or other physical truth.

Roll `2d6 + capped net modifier`, comparing Deception mastery and crew Discipline against opponent Lookout and NPC level:

| Result | Effect next window |
| ---: | --- |
| 6 or less | No effect |
| 7-9 | Hidden-state estimates become wider and lower-confidence |
| 10 or more | Estimates widen and one plausible false assessment is inserted |

Natural 2 always fails and natural 12 always gives full success. Deception lasts one planning window. Repeated success refreshes but does not stack.

For an NPC target, modify the observation JSON sent to its LLM. For the player, modify Lookout estimates and uncertainty labels, never underlying state.

# Morale, surrender, sinking, and escape

## Morale and Discipline

Morale and Discipline each use 0-100.

| Value | Check modifier |
| ---: | ---: |
| 0-19 | -2 |
| 20-39 | -1 |
| 40-69 | 0 |
| 70-89 | +1 |
| 90-100 | +2 |

Leadership adds +1 at mastery tiers 3, 6, and 9.

Combat Morale checks roll `2d6 + capped net modifier` against 9. Failure upgrades Crew Shock by one severity; success causes no change. Natural 2 fails and natural 12 succeeds.

Morale never forces the player to surrender. NPCs may choose voluntary surrender at their next planning decision. Fanatical captains do not voluntarily surrender unless the crew can no longer fight.

## Surrender

Surrender is a terminal decision outside the Action Pool, not a timed action.

- The player may surrender before planning a window.
- The NPC LLM may return `surrender` instead of a schedule.
- Surrender is automatically honored and enters future Capture Resolution.

## Disablement and sinking

- Hull 0: sink after all simultaneous effects at that unit resolve; cancel unfinished actions.
- Sail Condition 0: no normal movement, but the ship may continue fighting.
- Fit Crew below Minimum Crew: crew actions take severe penalties and actions whose requirements cannot be met become invalid.
- Fit Crew 0: automatic surrender because the crew can no longer fight.

# End-of-window order

At unit 1,000:

1. Resolve all actions completing at 1,000 simultaneously.
2. Commit their state changes.
3. Apply continuing Fire and Flooding damage.
4. Resolve sinking, automatic surrender, and other terminal conditions.
5. Resolve the outside-engagement escape check.
6. If combat continues, roll permitted wind changes and prepare the next planning window.

# NPC LLM planner

## Authority boundary

The LLM constructs NPC schedules. The deterministic game engine remains authoritative over:

- visible and hidden information;
- action availability, descriptions, parameters, and calculated costs;
- inventory and reservations;
- schedule validation;
- dice and random selection;
- state changes, damage, movement, and phase transitions.

The LLM may not invent actions, calculate authoritative costs, make rolls, alter state, or see the player's secret schedule.

This design intentionally changes the current project's AI boundary: LLM access becomes mandatory for Naval Engagement even though dialogue AI remains optional elsewhere. There is no deterministic combat-AI fallback.

## Behavioral hierarchy

1. Role defines the strategic objective.
2. Temperament changes method and risk tolerance.
3. Captain level controls estimate accuracy and tactical sophistication.
4. Game difficulty changes effective planning level, not combat stats or forbidden knowledge.
5. Current emergencies may override ordinary priorities.

| Role | Default objective |
| --- | --- |
| Merchant | Escape while preserving cargo and crew |
| Pirate | Disable and capture rather than sink |
| Faction navy | Force surrender and satisfy faction duty |
| Privateer | Capture valuable legal prizes |
| Courier/passenger vessel | Escape and protect passengers, documents, or contracts |
| Fishing/local vessel | Survive and disengage |
| Bounty hunter | Capture the wanted captain alive |

| Temperament | Tactical influence |
| --- | --- |
| Cautious | Preserve hull and crew, keep distance, repair early |
| Aggressive | Maintain pressure and maximize immediate damage |
| Fanatical | Never voluntarily surrender; accept extreme losses for the objective |
| Honorable | Respect surrender and legal limits; avoid unnecessary casualties |
| Bold | Prefer high-payoff maneuvers, explosives, and boarding opportunities |

## Level and difficulty

| NPC level | Planning input |
| ---: | --- |
| 1-5 | Coarse estimates and basic tactics |
| 6-10 | Better estimates and ordinary multi-action combinations |
| 11-15 | Good estimates, resource forecasting, advanced combinations |
| 16-20 | Highly accurate estimates and full tactical vocabulary |

Effective planning level applies a difficulty offset and clamps to 1-20:

- Easy: -4;
- Normal: 0;
- Hard: +4.

Difficulty changes prompt detail and tactical vocabulary, not actual NPC stats.

## Prompt payload

Use a compact, versioned JSON payload rather than inserting this full document. It contains:

- rules version and 1,000-unit budget;
- NPC role, temperament, actual level band, effective planning band, and objective;
- exact own state and resource inventory;
- public enemy state plus level-appropriate hidden-state estimates;
- uncertainty as honest ranges and confidence labels;
- wind, 2D geometry, bearing, range, hazards, and critical states;
- derived forecasts such as expected range if courses hold, likely range transitions, batteries soon bearing, escape likelihood, and hazard intersections;
- concrete action instances with unique IDs, descriptions, calculated costs, requirements, target, and resource cost;
- the strict output schema.

Player-controlled names and every state string are untrusted data, never prompt instructions.

The engine enumerates concrete instances such as `turn_starboard_45`, `fire_port_chain_player`, and `reload_port_chain`. This keeps costs authoritative while allowing the LLM to construct a schedule.

Expected response shape:

```json
{
  "assessment": [
    "The target is faster but its sails are damaged.",
    "The port battery can bear after a 45-degree turn."
  ],
  "objective": "cripple_sails",
  "risk": "moderate",
  "intent": "turn for a chain-shot broadside, reload, then keep distance",
  "action_ids": [
    "turn_starboard_45",
    "fire_port_chain_player",
    "reload_port_chain"
  ]
}
```

`assessment`, `objective`, `risk`, and `intent` are concise public tactical justification, not a request for hidden chain-of-thought.

## Planning and correction loop

1. The player commits a secret schedule.
2. Start the NPC planning stopwatch and attempt counter.
3. Request the structured NPC plan.
4. Validate JSON, IDs, parameters, total cost, resource reservations, loading sequence, and NPC-owned state.
5. Permit target-dependent future actions even when their range or bearing is not currently valid; check those conditions at runtime.
6. If invalid, send exact validation errors back to the LLM and request correction.
7. After ten invalid attempts, suspend the battle and offer Retry or Change Model. Do not substitute a fallback schedule.
8. If the API is unavailable, keep the battle suspended with Retry or Change Model.
9. Save a validated schedule before reveal or simulation.

Checkpoint restoration reuses the saved accepted schedule and never regenerates it for the same window.

An NPC action invalid at runtime uses the same LLM correction principle for one replacement action. The existing later order remains fixed and shifts; this is not a full replan. After ten invalid replacement attempts, suspend the battle.

# Player interface and playback

## Planning

Before commitment, show:

- the player's complete 0-1,000 timeline;
- calculated action costs and the full modifier breakdown;
- completion units and resource reservations;
- projected own 2D path;
- expected range and bearing if the enemy maintains its visible course;
- validation warnings and actions that will be removed if a replacement overflows the window.

The preview is advisory because the enemy schedule is secret.

## NPC planning display

After the player commits:

- display a live elapsed-time stopwatch and attempt count;
- display structured NPC assessment and intent when returned;
- display validation errors and corrections for subsequent attempts;
- do not require or expose private hidden reasoning.

## Reveal

After both schedules validate, reveal:

- every action in both schedules;
- cost, start unit, completion unit, and declared target;
- reservations and public action parameters.

Hidden stats and resource quantities remain hidden unless Lookout or another rule reveals them.

## Simulation controls

Play events on the shared timeline with:

- Pause;
- Normal speed;
- Fast speed;
- Resolve Instantly.

Always pause for replacement decisions, phase transitions, sinking, and surrender.

# Action catalogue summary

| Category | Action | Initial base cost |
| --- | --- | ---: |
| Maneuver | Turn 45 degrees | 100 |
| Maneuver | Adjust Sails one step | 150 |
| Attack | Aim and Fire | 150 |
| Attack | Reload | 350 |
| Attack | Unload | 200 |
| Attack | Dump Explosives | 250 |
| Attack | Grapple | 200 |
| Support | Patch Hull | 300 |
| Support | Repair Sails/Rigging | 250 |
| Support | Extinguish Fire | 200 |
| Support | Control Flooding | 250 |
| Support | Rally Crew | 150 |
| Support | Doctoring | 300 |
| Support | Deception | 200 |

Idle has no action object; it is unused schedule space.

# Deferred design

The following are explicit later phases or extensions:

- Cut Grapples and voluntary Boarding disengagement;
- Capture Resolution, prizes, prisoners, cargo transfer, and ship ownership;
- deliberate Ramming and collision damage;
- execution details for multiple simultaneous ships and fleets;
- mixed cannon sizes and cannon-specific power;
- officers and individual crew;
- terrain, coastlines, shoals, and fortifications;
- detailed post-sinking rescue and cargo-loss resolution.

Numerical values in this document require simulation and playtesting. The structural rules, state transitions, LLM authority boundary, and first-version scope are agreed.
