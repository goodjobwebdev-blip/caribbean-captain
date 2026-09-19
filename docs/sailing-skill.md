# Sailing & Navigation: first display

Journal now includes a separate **Skills** tab. It displays the captain's Sailing & Navigation mastery tier (0–10), points toward the next tier, and a progress bar. This is a player skill, separate from crew statistics.

The display follows [skills.md](skills.md): the next tier requires `10 × 2^currentTier` points. Tier 10 has no next-tier requirement. Speed and learning rules are defined below.

Tier 0 and zero points are provisional starting values, not a final character-creation decision. New profiles store these values. Older profiles and checkpoints without skill data display the same defaults without losing other saved data. Skill data is part of the game state and therefore included in church checkpoints.

For discussion next: quest rewards and future ship-tier training limits. Weather-specific skill bonuses are deferred.

## Active speed effect

Sailing mastery now grants **+5% ship speed per tier**, additively: `effective speed = base ship speed × (1 + tier × 0.05)`. The bonus is +50% at tier 10. Raw progress points have no mechanical effect.

Normal hours are `ceil(distance / effective speed)`. The existing weather multiplier is applied afterward and rounded up again. Weather chances and multipliers are unchanged. Time savings naturally reduce wages and food consumption. Encounter delays remain fixed additions.

Harbour estimates, contract travel estimates, food/wage forecasts, the ship sidebar, and Journal use effective speed. Contract rewards still use baseline travel time, so becoming skilled does not reduce payment. Already-started voyages retain their saved duration.

Point awards now follow the active learning rule below.

## Active learning rule

Successful arrival grants one Sailing point per 24 actual weather-adjusted sailing hours. Unused hours carry across voyages, and excess points carry across mastery tiers. An award can cross multiple tiers. Mastery caps at tier 10; further practice is not banked beyond maximum mastery.

Only the original voyage duration counts: port time and extra encounter delays are excluded. Failed voyages grant no practice credit. Tier gains affect the next voyage, not the duration already sailed. The captain's log reports point awards and promotions. Journal displays both tier progress and hours toward the next point. Practice hours are saved in the profile and church checkpoints; older saves default to zero uncredited hours.

## Letter rewards and future ship limits

Letter quests grant `ceil(straight-line route distance / 100)` Sailing points alongside silver when delivered at the destination Harbour Master. The whole-point reward is stored in the offer and accepted contract, independent of weather and captain speed. Bridgetown–Saint-Pierre grants 1 point; Bridgetown–Willemstad grants 3. Freight and passenger tasks grant no bonus. Awards share Sailing mastery thresholds and the tier-10 cap, preserving carried practice hours. Journal, quest offers, active tasks, and completion logs display the skill reward.

Older active letters without a stored skill reward use the same route-distance formula on delivery. Historical archived quests without that field show zero and are not retroactively rewarded.

A future ship-tier system should limit how far a captain can train Sailing aboard a small/basic ship. The maximum mastery trainable on each ship tier, whether quest bonuses share the cap, and treatment of blocked progress are undecided. Do not apply a ship-based training cap to the current single-ship prototype. This would be a limit on gaining points, not a loss of mastery already earned.
