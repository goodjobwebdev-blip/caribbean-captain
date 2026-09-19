# Sailing & Navigation: first display

Journal now includes a separate **Skills** tab. It displays the captain's Sailing & Navigation mastery tier (0–10), points toward the next tier, and a progress bar. This is a player skill, separate from crew statistics.

The display follows [skills.md](skills.md): the next tier requires `10 × 2^currentTier` points. Tier 10 has no next-tier requirement. No learning, excess-point rules, or gameplay modifiers are implemented yet.

Tier 0 and zero points are provisional starting values, not a final character-creation decision. New profiles store these values. Older profiles and checkpoints without skill data display the same defaults without losing other saved data. Skill data is part of the game state and therefore included in church checkpoints.

For discussion next: normal sailing speed, weather effects, learning opportunities, and whether escape checks belong primarily to Naval Tactics. No formula for these effects is approved by this UI addition.
