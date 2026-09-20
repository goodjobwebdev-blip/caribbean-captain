#!/usr/bin/env python3
"""Format the offline model's JSON output as a reviewable design report."""
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
r=json.loads((ROOT/'docs/trade-validation-data.json').read_text())
lines=['# Trade balance validation','',
'Status: offline design validation only. No playable game mechanics changed.',
'Inputs: [trade release draft](trade-release-draft.md). Numerical results are from',
'[the reproducible model](../scripts/trade_balance.py), with [raw results](trade-validation-data.json).','',
'## Conclusions','',
'1. Keep marginal stock-curve pricing and round complete line totals toward the merchant.',
'2. Add **Coffee as an Import in Bridgetown**. The initial specialization sketch left a poor short return route.',
'3. Reduce the initial **luxury stock profile from 10% to 2%** of ordinary goods as a first balancing adjustment.',
'4. Keep **100,000 provisions per port**, with finite stock and the proposed gradual recovery.',
'5. Attribute Trade learning to consistently matched profitable units rather than clipping each deal’s total profit at zero.',
'6. Keep the proposed reduced new-contract rates for the initial implementation; preserve accepted contract terms.',
'',
'These are recommended implementation settings, not a claim that all 45 goods and every future economy feature are fully balanced.',
'', '## Price and stock checks','',
f"The model passed **{r['invariant_checks']:,} assertions** across the 45 goods, three market roles, selected stock levels, three Trade mastery levels, and several transaction sizes.",
'',
'- Immediate buy → sell and sell → buy reversals never generated a gain at unchanged market conditions.',
'- Splitting buys did not lower cash costs; splitting sells did not increase cash receipts. These checks isolate identical stock paths with no intervening time.',
'- Empty stock and full storage refused additional transactions.',
'- Gradual recovery produced the same result for one elapsed interval and two consecutive intervals, within floating-point tolerance.',
'- Integrating the piecewise-linear scarcity curve avoids fixed-size batch-boundary pricing errors.',
'',
'These are mathematical model assertions, not browser tests or a test of the as-yet-unimplemented basket engine. Atomic settlement, stale quotes, save migration, and access restrictions still need implementation tests.',
'', '## Short-route income','',
'Assumptions: healthy Universal Sloop, ten crew, 120 provisions, novice Trade/Sailing, perfect market information, fresh market stocks, normal weather, and no pirate encounters. Cargo quantities are optimized for the named good under capital, hold, weight, stock, and provision-reserve limits. The model keeps at least 100 silver aside from the purchase and voyage wages.',
'',
'Net income subtracts buying costs, wages, and the replacement value of consumed provisions at approximately 1.15 silver each. It includes one purchase and one sale hour. Returns are per one-way voyage, not a round trip.',
'',
'| Starting cash | Cargo / route | Quantity | Buy | Sell | Net income | Hours including deals |',
'| ---: | --- | ---: | ---: | ---: | ---: | ---: |']
for idx in (0,2,3,5):
 x=r['scenarios'][idx]
 lines.append(f"| {x['capital']:,} | {x['good']}: {x['origin']} → {x['destination']} | {x['quantity']} | {x['buy']:,} | {x['sell']:,} | {x['net']:,.2f} | {x['hours']} |")
lines += ['',
'Coffee returns in this table use the recommended Bridgetown Import role.',
f"The proposed letter + 40-unit freight + three passengers pay {r['contract_only']['revenue']} silver in total, or approximately **{r['contract_only']['net']:.2f} net** after sailing and four port-action hours.",
f"At 800 starting silver, combining those contracts with 80 sugar yields approximately **{r['scenarios'][8]['net']:.2f} net** in {r['scenarios'][8]['hours']} hours. This uses six port-action hours; a future optimized basket flow could reduce some transaction overhead.",
'',
'Contracts are still useful when a captain lacks trading capital. At 3,000 silver, a well-planned coffee cargo earns substantially more than routine contracts. This matches the intended progression from reliable commissions to better-funded trading.',
'', '## Why change the coffee market?','',
f"With Bridgetown treated as Neutral for coffee, the 800-silver scenario loses **{abs(r['scenarios'][1]['net']):.2f} silver** on the return voyage. Treating it as Import changes the same scenario to **{r['scenarios'][2]['net']:.2f} net profit**.",
'',
'The regional sketch did not explicitly assign coffee to Bridgetown; Neutral was a conservative fallback for the original case. The Import recommendation creates a viable short return route without raising all prices or reducing travel expenses.',
'', '## Repeated trips and upgrade pace','',
'The following scenario alternates sugar outward and coffee back, with Bridgetown importing coffee. Markets recover using elapsed game hours, and every purchase/sale changes stock. Profits are reinvested. The captain keeps the sloop throughout; the model does not purchase the upgrade automatically.',
'',
'| Voyage leg | Treasury, skills progressing | Treasury, both skills held at tier 0 |',
'| ---: | ---: | ---: |']
for i in (1,3,5,7,9,11):
 a=r['round_trips_revised'][i];b=r['round_trips_revised_fixed_skills'][i]
 lines.append(f"| {i+1} | {a['treasury']:,.2f} | {b['treasury']:,.2f} |")
lines += ['',
'The 5,600-silver sloop-to-schooner exchange plus 1,000 cash reserve and 50 hiring cost becomes affordable by approximately **leg 10** in both modeled cases. Skills make a larger amount of trading capital available afterward. The sloop-to-schooner choice is optional; merchants can keep saving for cargo capacity.',
'',
'With progression enabled, this scenario reaches Trade tier 3 and Sailing tier 1 after 12 legs. Trade learning uses the per-unit attribution recommendation below; Sailing time is accumulated continuously in this analytical approximation. Exact whole-point progression and provision rounding belong to integration tests.',
'',
'The original Neutral coffee case ends at only '+f"{r['round_trips_original'][-1]['treasury']:,.2f}"+' silver after 12 legs. Regional demand is therefore more influential here than changing the ship prices.',
'', '## Weather and longer routes','',
f"Under headwinds, the fully loaded short sugar case earns approximately {r['scenarios'][6]['net']:.2f} silver over {r['scenarios'][6]['hours']} hours; the 125-coffee case earns {r['scenarios'][7]['net']:.2f} over {r['scenarios'][7]['hours']} hours. Both remain profitable, but earn less per game day.",
'',
'| Route / cargo | Ship | Trading cash | Net income | Hours | Net per game day |',
'| --- | --- | ---: | ---: | ---: | ---: |']
for idx in (9,10):
 x=r['scenarios'][idx]
 lines.append(f"| {x['origin']} → {x['destination']}: {x['good']} | {x['ship']} | {x['capital']:,} | {x['net']:,.2f} | {x['hours']} | {x['silver_per_day']:,.2f} |")
lines += ['',
'The Fluyt is assumed already owned; its purchase cost is not part of the trading-cash figure. Long routes carry 180 provisions in the sloop and 400 in the fluyt, reducing cargo space. Their estimates reserve enough for headwinds and an extra day.',
'',
'Long routes with the same Export/Import multipliers can earn less per day than short routes. The full market matrix should therefore give Willemstad distinctive exports and opportunities, rather than duplicate every profitable nearby route. These examples do not validate every ship/route combination or make long voyages universally preferable.',
'', '## Luxury-stock adjustment','',
'At 30,000 trading silver, a hypothetical short Export → Import jewelry route allows a sloop to earn much more than an ordinary cargo while occupying very little hold space. This is a density stress case, not a finalized jewelry route assignment.',
'',
'| Luxury stock fraction | Quantity optimized | Purchase cost | Net voyage income | Hold occupied by jewelry |',
'| ---: | ---: | ---: | ---: | ---: |']
for idx in (2,5):
 x=r['luxury'][idx]
 lines.append(f"| {x['luxury_stock_scale']:.0%} | {x['quantity']} | {x['buy']:,} | {x['net']:,.2f} | {x['quantity']*.1:.1f} |")
lines += ['',
'Use initial/target luxury stocks of **80 Export / 40 Neutral / 20 Import**, with maxima **160 / 80 / 40**. This keeps rare goods attractive without making one tiny luxury cargo eclipse ordinary trade so strongly. Multi-good luxury baskets can still be lucrative and require further balancing of the complete port inventories.',
'', '## Trade-learning split exploit','',
'The naive formula max(0, sale profit) / 100 applied once per deal is vulnerable:',
'',
f"- Acquire 100 units at 10 silver each: cost {r['xp_counterexample']['cost']}.",
f"- Sell all 100 in one deal: receive {r['xp_counterexample']['one_sale_receipt']}, lose 45, earn no points.",
f"- Sell 50 then 50 along the identical stock curve: receive {r['xp_counterexample']['split_sale_receipts'][0]} then {r['xp_counterexample']['split_sale_receipts'][1]}. The first sale looks profitable and grants **0.35 points**, despite the identical total loss.",
'',
'Recommendation: allocate cost and proceeds consistently to FIFO-matched units using their marginal prices; sum the positive eligible unit margins, independent of basket boundaries. Learning uses unrounded marginal values, while silver settlement rounds the completed line. Same-port sales, gifts, and legacy goods with unknown purchase cost grant no points.',
'',
'Under this interpretation the profitable early units earn learning even if later units in the same cargo lose money. The example grants approximately 0.3792 points whether sold in one deal or two. This is a clarification of what qualifies as a profitable trade unit; it should be documented in the skill description, not hidden in implementation.',
'', '## Provisions','',
'Neutral provisions start at 100,000 units in every port, with maximum storage 200,000 and a 20-day recovery time scale.',
'',
'| Quantity | Full buy quote | Average silver per unit | Stock remaining immediately afterward |',
'| ---: | ---: | ---: | ---: |']
for x in r['provisions']:
 lines.append(f"| {x['quantity']:,} | {x['total']:,} | {x['average']:.5f} | {x['stock_left']:,} |")
lines += ['',
'The 100,000-unit row is a pricing/stock stress test and exceeds current ship capacity; it is not an allowed player basket. A 3,500-unit purchase uses only 3.5% of starting supply. Stock is genuinely finite, but normal provisioning barely shifts the market.',
'', '## Scope and reproducibility','',
'Run from the repository root:',
'', '```sh',
'python scripts/trade_balance.py > docs/trade-validation-data.json',
'python scripts/write_trade_validation_report.py',
'```','',
'The model reads goods prices, space, and weight from the draft table. Pricing and stock constants in the script are explicit scenario parameters; both original and recommended luxury-stock settings are exercised. Ship parameters mirror the healthy sloop/fluyt reference cases, not all 28 configurations.',
'',
'Limitations: no browser playtest, no random encounters or repairs, no imperfect price knowledge, no illegal goods, no full 45-good role/access matrix, no whole-basket optimizer, and no customer competition. Market recovery uses continuous stock quantities. Provisions are expensed at an approximate replacement price, with a constant departure reserve; exact inventory top-up/rounding is not simulated. These estimates validate a starting direction and expose failure cases, not a finished campaign economy.',
'',
'Implementation should add tests for atomic mixed baskets, stale quotes, item provenance and learning, low-value rounding, access rules, stock caps, save/checkpoint restoration, and final load after buying and selling together. Battle remains outside this work.', '']
(ROOT/'docs/trade-validation.md').write_text('\n'.join(lines))
