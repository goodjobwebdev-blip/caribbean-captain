# Player skill system

This document defines the planned skill system for the player character. It is based on [issue #1](https://github.com/goodjobwebdev-blip/caribbean-captain/issues/1).

The system has 24 skills covering sailing, naval combat, command, ship maintenance, social interaction, personal combat, and adventuring. These skills belong only to the player character; crew members use separate ship and crew systems.

## Skills

### Sailing and awareness

1. **Sailing & Navigation**
   - Ship handling and maneuvering
   - Sail, rope, and rigging work
   - Route planning
   - Weather judgment
   - Avoiding maritime hazards

2. **Lookout**
   - Spotting ships, reefs, land, threats, and opportunities
   - Noticing people, objects, and suspicious activity
   - Applies both aboard ship and on land

### Naval combat

3. **Cannon Aiming**
   - Cannon accuracy
   - Effective firing range

4. **Cannon Reloading**
   - Reload speed
   - Safe powder handling
   - Recovery from misfires

5. **Naval Tactics**
   - Combat positioning
   - Pursuit and escape
   - Broadside tactics
   - Using wind, terrain, and the environment

6. **Boarding**
   - Initiating boarding actions
   - Defending against boarding
   - Gaining an advantage during boarding

7. **Demolitions**
   - Explosives and gunpowder traps
   - Sabotage
   - Starting and controlling fires
   - Fire ships

### Command and crew

8. **Leadership**
   - Recruiting crew
   - Maintaining morale and loyalty
   - Managing discipline
   - Improving general crew effectiveness

9. **Training**
   - Training crew members
   - Improving crew capabilities
   - Reducing operational mistakes

### Ship maintenance and medicine

10. **Carpentry**
    - Repairing the hull and masts
    - Restoring structural damage

11. **Sailmaking**
    - Repairing sails, ropes, and rigging

12. **Doctoring**
    - Treating wounds and illness
    - Caring for injured crew members

13. **Logistics**
    - Managing food, supplies, and ammunition
    - Managing cargo capacity
    - Improving resource efficiency

### Social and economic

14. **Trade**
    - Negotiating prices
    - Evaluating goods
    - Identifying profitable deals

15. **Diplomacy**
    - Building relationships
    - Negotiating agreements
    - Requesting favors
    - Reaching peaceful resolutions

16. **Deception**
    - Lying and disguises
    - False flags and forgery
    - Misleading other characters

17. **Intimidation**
    - Threats and coercion
    - Interrogation
    - Forcing surrender

### Personal combat and movement

18. **Light Weapons**
    - Knives, rapiers, cutlasses, and other fast weapons

19. **Medium Weapons**
    - Sabres, axes, clubs, and other balanced weapons

20. **Heavy Weapons**
    - Two-handed blades, heavy axes, and crushing weapons

21. **Shooting**
    - Pistols, muskets, and other personal firearms

22. **Athletics**
    - Climbing, swimming, and jumping
    - Physical endurance
    - Resisting exhaustion

### Adventuring

23. **Stealth**
    - Sneaking and hiding
    - Pickpocketing and lockpicking
    - Bypassing security without being noticed

24. **Luck**
    - Fortunate outcomes
    - Rare events
    - Unexpected discoveries
    - Other chance-based effects

## Mastery tiers

Each skill has a mastery tier from **0 through 10**. Only the mastery tier affects gameplay.

Mastery tiers can:

- Modify success checks.
- Provide fixed bonuses such as accuracy, speed, efficiency, or damage.
- Unlock abilities, actions, or perks.
- Supply values used in gameplay formulas.

Raw skill points measure progress toward the next tier but do not directly modify game mechanics. Tier 10 represents legendary mastery and is intentionally rare.

## Skill-point progression

Each skill accumulates points toward its next mastery tier independently. When the requirement is met, the skill gains one mastery tier. Sailing subtracts that tier's requirement and carries excess points forward; overflow rules for other skills remain to be defined. The requirement doubles for every tier.

The point requirement is:

**points required = 10 × 2^(next mastery tier − 1)**

| Mastery tier gained | Points required | Total points earned |
| ---: | ---: | ---: |
| 1 | 10 | 10 |
| 2 | 20 | 30 |
| 3 | 40 | 70 |
| 4 | 80 | 150 |
| 5 | 160 | 310 |
| 6 | 320 | 630 |
| 7 | 640 | 1,270 |
| 8 | 1,280 | 2,550 |
| 9 | 2,560 | 5,110 |
| 10 | 5,120 | 10,230 |

## Sources of skill points

The system is intended to support several ways to earn skill points:

- Practicing or successfully using a skill.
- Allocating points when the player levels up.
- Learning from trainers.
- Learning from books or other items.
- Receiving special rewards.

The exact learning and reward rules remain to be designed.

## Design boundaries

- The system applies only to the player character.
- Crew members do not have these player skills.
- Crew discipline is a ship or crew metric, not a separate player skill.
- Recruitment is included in Leadership.
- General seamanship and weather knowledge are included in Sailing & Navigation.
- Thievery actions are included in Stealth.
- Trade and Diplomacy are separate skills.
- Boarding represents ship-to-ship assault expertise. Personal fighting uses the relevant weapon skill.

## Deferred decisions

The following details will be designed separately:

- Exact formulas for individual skills
- Skill checks and difficulty calculations
- Bonuses provided by each mastery tier
- Abilities and perks unlocked by mastery
- Detailed practice and learning rules
- Trainers, books, and special rewards
- Starting skill values
- Character creation and skill-point allocation
- Treatment of excess points for skills other than Sailing
- Crew attributes and progression
- Ship and crew metrics

## Implemented Sailing progression

See [Sailing & Navigation](sailing-skill.md) for the active speed and learning rules: +5% speed per mastery tier, and 1 point per 24 sailing hours on arrival with leftover hours and points carried forward. Quest bonuses and ship-tier training limits are planned but not active.
