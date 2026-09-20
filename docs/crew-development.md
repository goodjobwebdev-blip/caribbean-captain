# Crew development

This release implements the next three crew phases from the collective crew design in [stats.md](stats.md). Numerical rates are provisional. Officers, individual sailors, desertion and mutiny remain outside this release.

## 1. Separate crew experience

Crew sailing, gunnery and fighting experience each range from 0 to 100. Existing saves inherit each missing specialty from their previous collective experience; a crew without quality data starts at 50. Existing specialties, casualties, injuries, morale and discipline are retained.

- Sailing multiplies speed and maneuverability by `1 + (experience − 50) / 500`: 0.90–1.10. Successful arrivals earn `min(3, voyage hours / 48)` experience; port time, encounter delays and aborted return voyages earn none. The current voyage keeps its departure duration.
- Gunnery replaces generic experience in cannon accuracy and reload/order costs. Valid volleys and completed timed reloads earn 0.25 on a rolled setback and 0.5 otherwise, capped at 2 per battle.
- Fighting replaces generic experience in boarding strength. Grapple rolls and deck rounds earn 0.25 on setback and 0.5 otherwise, capped at 2 per battle. Captain duel actions do not train the crew.

Battle gains are independent of the captain's practice cap. NPC work, planning, free preloads and invalid actions earn none. Simultaneous completion events merge practice once. Crew experience is applied once at resolution, never during an active schedule. Already resolved legacy battles receive no retroactive reward or morale change. Historical outcomes remain snapshots of the fight before post-battle growth.

New recruits arrive at 50 in each specialty, morale and discipline. Those values are averaged across living sailors, excluding historical dead crew. Dismissal does not restore the previous average. Injured crew retain experience, wages, provisions and weight; naval movement now includes their weight while only fit sailors contribute manpower.

## 2. Tavern services

Every service shows its fee, time, wages, provisions and exact expected result. The reducer recomputes the quote before purchase. It rejects unavailable services or insufficient funds/food without consuming anything. Services are port-only and their fees appear in Finance.

| Service | Time | Fee | Result |
| --- | ---: | ---: | --- |
| Train sailing, gunnery or fighting | 8 hours | max(20, 2 × living crew) silver | `(2 + 0.2 × captain Training tier) × fit / living crew` specialty gain, capped at 75; +1 discipline; +0.5 captain Training point |
| Medical care | 4 hours | 10 per healed sailor + 50 per captain Injury step | Heal up to `ceil(living crew × 0.25 × (1 + 0.05 × Doctoring tier))` injured sailors and one captain Injury step |
| Shore leave | 8 hours | max(10, 5 × living crew) silver | Up to +10 morale, stopping at 80 |

Wages and food are additional to those fees. Training requires fit sailors and a captain who is neither incapacitated nor collapsed. Only service experience can advance specialties beyond 75. A medical visit treats only living wounded people; it never revives dead crew or captains. Professional medical care does not grant captain Doctoring practice or clear fatigue. Tavern sleep retains its existing eight-hour rest and slower healing rules. Shore leave provides a paid path to recover morale; it cannot be funded by new debt.

## 3. Morale and discipline

Both remain on a 0–100 scale. They already affect boarding strength and morale checks. Together they now multiply sailing speed and maneuverability by `1 + (morale + discipline − 100) / 1000`, ranging from 0.90–1.10. Starting values of 50 preserve the starting ship's pace. Journal performance shows this factor separately from crew headcount and sailing experience.

Once per battle, victory adds 4 morale and 1 discipline; defeat removes 6 morale and 2 discipline. Escape without a winner has no victory/defeat bonus. Net loss of fit sailors adds a morale penalty of `10 × max(0, starting fit − surviving fit) / max(1, starting fit)`. Casualties are not applied repeatedly on settlement, return or refresh.

After wages are charged, unpaid wages are `min(wages charged, max(0, −treasury))`. Their share of that interval removes 4 morale and 2 discipline per equivalent unpaid day. Fractional consequences apply immediately and consistently whether time advances in one large step or multiple smaller steps. Zero-time actions do not cause penalties. The rule includes voyage time, port activities, starvation's elapsed time and rescue passage.

The current game has one treasury debt balance, not separate creditor accounts. Incoming silver automatically offsets it; this stops future unpaid-wage penalties once wages can be funded. It does not restore lost morale or erase cumulative unpaid-wage exposure. The Journal labels that exposure as equivalent hours, not an additional bill. No debt interest, desertion or mutiny is added.

## Interface, saves and validation

Tavern services, Journal crew statistics, sailing performance, departure debt warnings and the in-game Wiki describe these rules. Specialties, Training mastery, morale, injuries and wage exposure use the existing profile/checkpoint system. Old version-1/2 saves remain readable. No historical wage exposure is reconstructed.

Validation: 188 automated tests pass, including 16 new crew/service/checkpoint checks. TypeScript and Vite production build pass. Coverage includes specialty effects, neutral baseline, arrival gains, bounded independent battle rewards, simultaneous merging, one-time outcomes, recruit dilution, service costs and rejections, medical limits, unpaid-wage time splitting, shore leave and persistence. Interactive browser and live Battle-model playtesting remain outstanding.
