# Open decisions

These are intentionally unresolved. Do not silently turn suggestions into approved mechanics.

## World and starting values

- Historical year and tone; towns on Martinique and Curaçao.
- Starting calendar date, silver, provisions, crew count, and predefined ship statistics.
- Route durations in each direction; weather effects; whether seasons affect the first version.

## Economic balance

- Goods list, port prices, and whether prices vary over time.
- Hold units and how passenger capacity is represented.
- Provision consumption and wage rates, including how partial days and time in port are charged.
- Hiring, lodging, and repair prices and durations.
- Contract generation, rewards, completion procedure, deadlines, and failure rules.
- Behavior when provisions or silver run out, minimum crew is lost, or ship condition reaches zero.

## Encounters

- Outcomes for voyage totals 3–12; only total 2 = pirate attack is fixed.
- Confirm or revise the proposed 2–6 / 7–9 / 10–12 action outcome bands.
- Modifiers and separate consequences for flee, negotiate, and fight.
- How an encounter alters the remaining voyage and time costs.
- Whether restoring a checkpoint repeats or rerolls future random outcomes.

## Saves and interface

- Profile naming, checkpoint naming, selection, deletion, and session autosave behavior.
- Storage technology, export/import, and whether cross-device saves are needed later.
- Which status values appear persistently and how rolls and consequences are presented.

## LLM integration and engineering

- Verify NanoGPT's supported authentication, model discovery, request format, and browser restrictions before implementing it.
- Decide API-key handling, call timing, cancellation, response limits, and fallback behavior.
- Select framework, persistence architecture, hosting, and validation approach when implementation is authorized.

## Suggested next design step

Agree a small initial balance sheet and an encounter consequence table. They should make a complete loop possible: accept a task, buy provisions or cargo, sail, resolve any pirate encounter, arrive, earn silver, repair if necessary, and save at church.
