# Easy repeatable commissions

Roadmap item 5, 24 September 2026. The player requested implementation of the entire easy pool from [quest roadmap](quest-roadmap.md). The numbers below are provisional implementation defaults.

## Work and balance

| Work | Accept and deliver at | Load | Payment / availability |
| --- | --- | --- | --- |
| Monk passage | Church | 2 passenger berths; 2 provisions/day; normal person weight | round(30 + distance × 2 × 0.69); each other town daily |
| Medical supplies | Pharmacy | 20 hold and weight units | round(20 + distance × 20 × 0.0432); each other town daily |
| Garrison supplies | Fort & Garrison | 40 hold and weight units | round(20 + distance × 40 × 0.0432); other towns of the same nation daily |
| Official dispatch | Governor | No hold space or weight | round(round(20 + distance × 1.04) × 1.25); one rotating same-nation destination daily |
| Parish donation | Local Church | None | Costs 100 silver plus one hour of upkeep; once per town per game day |

Official dispatches grant the ordinary letter Sailing reward, ceil(distance / 100). Other new jobs grant no Sailing points. All five completions grant +2 attitude with the receiving/local nation and +1 global reputation, subject to existing caps. Donations grant no cash reward.

Transport jobs use the existing global three-active-contract limit, one-hour acceptance, and one-hour delivery per building (including multiple jobs). There are no deadlines. Arrival does not pay: deliver at the named destination building. Accepted terms remain fixed when offers refresh.

Donations complete immediately in one hour, bypass active task slots, and appear in the completed Journal archive. The offer explicitly states the cost and reward. Insufficient silver for donation plus wages, or insufficient provisions for the hour, blocks the action. Donations have their own finance expense category. The daily restriction uses accepted offer IDs and survives reloads; checkpoint restore restores the old state as usual.

## Cargo and encounters

Medical and military freight is provided as sealed contract cargo. It cannot be traded, opened, consumed as medicine, or loaded into cannons. It is not market inventory and needs no trading permit. Existing hold, deadweight, speed, and ship-exchange restrictions apply.

Monks use the existing passenger system: provisions, weight, berths, encounter passenger demands, and capture/defeat rules apply. These are not escort quests. Existing defeat behavior fails active work.

## Dialogue and UI

Church, Pharmacy, Fort & Garrison, and Governor offer spoken commission choices through their fixed named hosts. Church checkpoint services remain available. The other services in the three formerly inactive buildings remain planned. Service panels stay open after accepting, delivering, or donating. Hosts remember successful deliveries and donations.

Offer cards, active commissions, logs, and Journal entries show job-specific names and delivery buildings. The Wiki describes the new work. Authored dialogue works without an AI model; optional prose uses the existing canonical service context.

## Compatibility and validation

New transport jobs retain the underlying Freight, Passengers, and Letter types with an optional assignment name. Donation is an immediately archived type. Existing offer IDs and legacy contracts are unchanged; a missing building still means Harbour Master. Old checkpoints require no rewrite.

Automated coverage checks daily offers, fixed terms, wrong-building rejection, duplicate completion prevention, load/berth/provision rules, real voyages and delivery, donations and affordability, finance accounting, named-host memory, Journal and building service access, and checkpoint restoration. Full test/build results are recorded in the delivery PR.
