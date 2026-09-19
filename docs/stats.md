# Game stats

This document defines the terminology and structure for Personal, Ship, and Crew stats.

It defines what each stat represents and which systems it may influence. Exact formulas, balance values, thresholds, and progression rules will be defined separately.

## Stat groups

The game has three stat groups:

1. **Personal stats** — the captain's condition, reputation, wealth, and equipment.
2. **Ship stats** — the ship's design, current condition, load, and calculated performance.
3. **Crew stats** — the collective condition, experience, upkeep, and effectiveness of the crew.

Resources and inventory values may contribute to calculations without being condition or performance stats themselves.

# Personal stats

## Injury condition

The captain's physical injuries use the following ordered conditions:

1. **Healthy**
2. **Lightly Injured**
3. **Injured**
4. **Severely Injured**
5. **Critically Injured**
6. **Incapacitated**
7. **Dead**

Injury condition may influence physical actions, personal combat, recovery requirements, and whether the captain can act.

## Fatigue condition

The captain's exhaustion uses a separate ordered track:

1. **Rested**
2. **Tired**
3. **Fatigued**
4. **Exhausted**
5. **Collapsed**

Injury and fatigue are independent. A captain can be Healthy and Exhausted, or Severely Injured and Rested.

Fatigue may influence physical actions, combat, travel, and the need to sleep.

## Global reputation

Global reputation represents how the captain is generally perceived throughout the world.

From most positive to most negative:

1. **Hero**
2. **Champion**
3. **Honored**
4. **Respected**
5. **Neutral**
6. **Questionable**
7. **Notorious**
8. **Villain**
9. **Devil**

A new captain begins at Neutral.

Global reputation may influence encounters, dialogue, prices, recruitment, contracts, and how strangers react to the captain.

## Faction attitude

Faction Attitude is separate from Global Reputation.

Global Reputation represents the captain's broad public image. Faction Attitude represents how one particular nation, organization, or group feels about the captain.

Factions and faction-attitude ranks have not yet been defined.

## Money

The captain can hold two currencies:

- **Silver** — the ordinary currency used by the current game.
- **Gold** — a rarer currency reserved for future use.

The exchange rules and uses of gold remain undefined.

## Equipment slots

### Tools and weapons

- **Spyglass**
- **Melee Weapon**
- **Pistol**
- **Musket**

### Clothing and armor

- **Head**
- **Body**
- **Feet**

Equipment effects and item restrictions will be defined separately.

# Ship stats

Ship data is divided into Base Characteristics, Current Stats, and Calculated Stats.

## Base characteristics

Base Characteristics describe the ship design. They do not normally change during a voyage.

| Characteristic | Meaning | Influences |
| --- | --- | --- |
| **Maximum Hull Points** | Structural durability when fully repaired | Repair ceiling, survival, Defense |
| **Base Speed** | Speed in ideal reference conditions | Calculated Speed |
| **Base Maneuverability** | Handling in ideal reference conditions | Calculated Maneuverability |
| **Cargo Capacity** | Physical cargo-space limit | Cargo, provisions, and freight |
| **Deadweight Capacity** | Maximum safe carried weight | Loading and performance penalties |
| **Port Cannon Capacity** | Maximum cannons mounted on the port side | Port loadout and Firepower |
| **Starboard Cannon Capacity** | Maximum cannons mounted on the starboard side | Starboard loadout and Firepower |
| **Bow Cannon Capacity** | Maximum forward-facing cannons | Bow loadout and Firepower |
| **Stern Cannon Capacity** | Maximum rear-facing cannons | Stern loadout and Firepower |
| **Minimum Crew** | Smallest crew that can operate the ship | Whether the ship can sail |
| **Optimal Crew** | Crew required for full performance | Calculated ship performance |
| **Maximum Crew** | Maximum crew accommodated | Recruitment limit |
| **Passenger Capacity** | Number of passenger berths | Passenger contracts |
| **Hull Protection** | Protection provided by construction or armor | Calculated Defense |

Base Speed and Base Maneuverability assume:

- Full Hull Points
- 100% Sail Condition
- No cargo
- No installed cannons
- An optimal crew

**Total Cannon Capacity** is calculated by adding the four battery capacities.

Cargo Capacity and Deadweight Capacity represent different limits:

- Cargo Capacity measures available space.
- Deadweight Capacity measures safe carried weight.

A ship may run out of space before reaching its weight limit, or reach its weight limit while cargo space remains.

## Current stats

Current Stats represent the ship's present physical state and installed armament.

| Current stat | Meaning | Influences |
| --- | --- | --- |
| **Hull Points** | Current structural integrity | Defense, Speed, Maneuverability, and Seaworthiness |
| **Sail Condition** | Current sails and rigging condition, expressed as a percentage | Speed and Maneuverability |
| **Operational Port Cannons** | Working cannons on the port side | Port Firepower |
| **Operational Starboard Cannons** | Working cannons on the starboard side | Starboard Firepower |
| **Operational Bow Cannons** | Working forward-facing cannons | Bow Firepower |
| **Operational Stern Cannons** | Working rear-facing cannons | Stern Firepower |

Hull Points cannot exceed Maximum Hull Points. Sail Condition ranges from 0% to 100%. Operational cannon counts cannot exceed their corresponding battery capacities.

A cannon explosion reduces the operational count for its battery.

Shipyards can:

- Repair Hull Points
- Repair Sail Condition
- Replace destroyed cannons up to the appropriate battery capacity

**Total Operational Cannons** is calculated by adding all four operational cannon counts.

## Calculated stats

Calculated Stats are recalculated when ship condition, load, equipment, crew, or other inputs change.

| Calculated stat | Main inputs | Influences |
| --- | --- | --- |
| **Current Deadweight** | Everything carried aboard | Speed, Maneuverability, and Seaworthiness |
| **Load Ratio** | Current Deadweight divided by Deadweight Capacity | Load penalties and overload warnings |
| **Speed** | Base Speed, Hull Points, Sail Condition, Load Ratio, and crew effectiveness | Voyage duration, pursuit, and escape |
| **Maneuverability** | Base Maneuverability, Hull Points, Sail Condition, Load Ratio, and crew effectiveness | Positioning, dodging, boarding, and escape |
| **Port Firepower** | Port cannons, cannon types, ammunition, crew, and skills | Port-side attacks |
| **Starboard Firepower** | Starboard cannons, cannon types, ammunition, crew, and skills | Starboard-side attacks |
| **Bow Firepower** | Bow cannons, cannon types, ammunition, crew, and skills | Forward attacks |
| **Stern Firepower** | Stern cannons, cannon types, ammunition, crew, and skills | Rear attacks |
| **Total Firepower** | All four battery Firepower values | Summary of offensive capability |
| **Defense** | Hull Protection, Hull Points, equipment, and other modifiers | Damage resistance and survivability |
| **Seaworthiness** | Hull Points, Sail Condition, Load Ratio, and crew effectiveness | Storm and dangerous-voyage checks |
| **Free Cargo Space** | Cargo Capacity minus occupied space | Loading cargo and accepting freight |
| **Available Deadweight** | Deadweight Capacity minus Current Deadweight | Loading cargo, supplies, and equipment |

Current Deadweight includes:

- Cargo
- Provisions
- Ammunition
- Cannons
- Ship equipment
- Crew
- Passengers
- Treasure
- Other carried items

It excludes the empty ship's own structural weight.

Cannons affect Speed and Maneuverability through Current Deadweight. They should not receive an additional arbitrary movement penalty unless a future mechanic specifically requires one.

Weather modifies final ship performance but is not a ship stat.

An optional future calculated stat is **Draft**, representing how deeply the loaded ship sits in the water. It could affect shallow passages and access to small anchorages.

# Crew stats

The crew is represented as one collective pool. Individual crew members do not have separate records or player skills.

The collective crew has separate experience values for sailing, gunnery, and fighting.

## Current stats

| Crew stat | Meaning | Influences |
| --- | --- | --- |
| **Total Crew** | Everyone currently serving aboard | Deadweight, wages, provisions, and capacity |
| **Fit Crew** | Crew currently able to work | Sailing, gunnery, repairs, and boarding |
| **Injured Crew** | Living crew currently unable to work effectively | Doctoring and available manpower |
| **Morale** | Willingness and enthusiasm to continue serving | Performance, surrender, desertion, and mutiny |
| **Discipline** | Ability to follow orders under pressure | Reliability, panic, gunnery, and boarding |
| **Sailing Experience** | Collective experience operating ships | Speed, Maneuverability, and sailing actions |
| **Gunnery Experience** | Collective experience operating cannons | Accuracy, reload speed, and Firepower |
| **Fighting Experience** | Collective boarding and close-combat experience | Boarding strength and casualties |
| **Equipment Quality** | Overall quality of crew tools, clothing, armor, and weapons | Work, repairs, gunnery, boarding, and protection |
| **Silver Wage Rate** | Silver owed per crew member per day | Daily operating cost |
| **Provision Rate** | Provisions consumed per crew member per day | Daily supply consumption |
| **Wage Arrears** | Unpaid silver owed to the crew | Morale, discipline, desertion, and mutiny |

Crew Fatigue is not tracked.

Injured crew:

- Remain aboard
- Count toward Total Crew
- Add to Current Deadweight
- Continue consuming provisions
- Continue receiving wages
- Cannot contribute fully to ship operations
- Can recover through future healing mechanics

## Calculated crew stats

| Calculated stat | Main inputs | Influences |
| --- | --- | --- |
| **Crew Readiness** | Fit Crew, Morale, Discipline, Equipment Quality | General crew performance |
| **Sailing Efficiency** | Fit Crew, Sailing Experience, Readiness, and captain skills | Ship Speed and Maneuverability |
| **Gunnery Efficiency** | Fit Crew, Gunnery Experience, Readiness, and captain skills | Firepower, accuracy, and reload speed |
| **Boarding Strength** | Fit Crew, Fighting Experience, Morale, Equipment Quality, and captain skills | Boarding outcomes |
| **Daily Wage Cost** | Total Crew and Silver Wage Rate | Daily silver expense |
| **Daily Provision Need** | Total Crew and Provision Rate | Daily provision consumption |

A larger crew can improve performance but also increases Deadweight and operating costs.

The player's Training skill may improve crew experience. Leadership may affect Morale and Discipline. Doctoring may return Injured Crew to Fit Crew.

# Deferred decisions

The following details will be defined separately:

- Numerical ranges for Morale, Discipline, experience, and Equipment Quality
- Exact formulas for calculated stats
- Injury and fatigue penalties
- Healing and recovery
- Reputation thresholds and effects
- Faction-attitude ranks
- Equipment effects
- Cannon types, sizes, ammunition, and weight
- Whether batteries can contain mixed cannon types
- Crew experience progression
- Wage Arrears consequences
- Repair and cannon-replacement costs
- Overloading consequences
- Draft and shallow-water mechanics
