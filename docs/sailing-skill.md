# Sailing & Navigation: first display

Journal now includes a separate **Skills** tab. It displays the captain's Sailing & Navigation mastery tier (0–10), points toward the next tier, and a progress bar. This is a player skill, separate from crew statistics.

The display follows [skills.md](skills.md): the next tier requires `10 × 2^currentTier` points. Tier 10 has no next-tier requirement. Learning and excess-point rules are not implemented yet. The speed effect is defined below.

Tier 0 and zero points are provisional starting values, not a final character-creation decision. New profiles store these values. Older profiles and checkpoints without skill data display the same defaults without losing other saved data. Skill data is part of the game state and therefore included in church checkpoints.

For discussion next: learning opportunities and whether escape checks belong primarily to Naval Tactics. Weather-specific skill bonuses are deferred.

## Active speed effect

Sailing mastery now grants **+5% ship speed per tier**, additively: `effective speed = base ship speed × (1 + tier × 0.05)`. The bonus is +50% at tier 10. Raw progress points have no mechanical effect.

Normal hours are `ceil(distance / effective speed)`. The existing weather multiplier is applied afterward and rounded up again. Weather chances and multipliers are unchanged. Time savings naturally reduce wages and food consumption. Encounter delays remain fixed additions.

Harbour estimates, contract travel estimates, food/wage forecasts, the ship sidebar, and Journal use effective speed. Contract rewards still use baseline travel time, so becoming skilled does not reduce payment. Already-started voyages retain their saved duration.

Point awards are not implemented. The next design discussion is how time spent sailing should earn points, including rate, fractional progress, delays, and when points are awarded.
