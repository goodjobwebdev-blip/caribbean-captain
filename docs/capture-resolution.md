# Capture Resolution — single-ship release

This implements the next phase after Encounter, Naval Engagement, Deck Battle and Captain Duel. The following numbers are provisional implementation choices, not historical claims.

## Victory

The player reviews and confirms one settlement:

- Keep the current ship, or exchange it for the defeated ship. There is never a second owned ship. The exchange transfers the player's surviving crew, captain, passengers, commissions, stores and selected loot; it preserves the captured ship's actual hull, sails and installed cannons. Enemy crew are released rather than recruited. No ship-sale payment is generated.
- Release the enemy captain, or demand ransom from that ship's recorded purse. Ransom is available only for a living captain on an intact ship and is forbidden when conditional surrender terms have been accepted. It transfers the available purse once, with no invented future ransom payment. Dead captains cannot be ransomed; surviving crew are still released.
- Select whole units of surviving enemy cargo. Unselected goods stay behind. Surviving battery loads count as ammunition and powder, not duplicate cargo. Sunk ships provide neither cargo nor silver.
- Continue the voyage, or arrange a return to the departure port.

Hold capacity, deadweight, maximum crew and passenger berths are checked before accepting the settlement. Continuing additionally requires an operational ship and able captain. An undermanned or disabled prize can be taken under tow if its accommodation and load limits permit it.

Returned player battery loads retain unknown purchase provenance when the older combat ledger has already consumed their lots; they are not assigned a fabricated zero cost. Newly captured loot has a zero purchase cost in the cargo ledger and grants no Trade experience until an ordinary eligible sale. Ransom is encounter income. Releasing a living captain grants +2 reputation and +2 attitude with the captain's faction; taking the ship costs 10 faction attitude. Accepted personal-safety terms are always honored. Execution and prisoner imprisonment are not offered.

New contacts receive a small seeded purse of `50 + 25 × floor(random × (level + 3))` silver. Older saved NPCs without a purse have zero available silver; loading a save never regenerates wealth.

## Defeat

If the captain is alive and the player's ship is still afloat:

- Pirates and privateers take exposed positive silver after passive Deception concealment, and trade goods. Provisions, ammunition and supply materials are excluded from trade-goods seizure.
- Other captors charge 25% of positive silver and confiscate controlled cargo.
- All active commissions fail. Passengers are repatriated; existing accepted contract IDs stay recorded to prevent collecting the same commission again.
- The player retains the damaged ship and surviving crew and returns to the departure port after confirming the terms.

These are deterministic, visible release terms for the current version. There is no prison location, jail simulation, execution choice or fleet transfer.

## Return and recovery

Return service costs 100 silver per current ship tier, plus 12 hours of living-crew wages, and takes 12 hours. It includes a tow, food during the return passage and captain stabilization. Unpaid charges become debt. Existing provisions are preserved; fruit still spoils for the elapsed time. The captain's fatigue clears and incapacitation is stabilized to Critically Injured. Hull, sail damage, dead crew and crew injuries remain.

The return aborts the original voyage without awarding Sailing practice or commission rewards. The voyage account records the actual return destination and retains its original planned destination. Escaped ships can also choose the same return service.

Tavern rest retains its existing 8-silver / 8-hour cost and consumption. It now clears captain fatigue, heals one captain Injury step, and restores up to `ceil(living crew × 10%)` injured sailors to Fit Crew. Dead crew are never restored. An incapacitated or collapsed captain cannot depart until treated or rested.

A dead captain or lost player ship is a terminal loss requiring a church checkpoint, consistent with the existing game. Rescue does not conjure a replacement ship or resurrect anyone.

## Persistence and validation

Settlement is atomic and allowed only once in Capture Resolution. The original terminal battle snapshot is preserved separately from the settlement. The record includes disposition, selected loot, silver, ship, terms and route. Save/restore cannot repeat payouts, transfer the same cargo twice or repay a returned voyage.

The completed battle is archived when the voyage resumes or the ship returns to port. Existing saves paused at Capture Resolution can settle without migration or model requests. Capture Resolution does not depend on an LLM; combat planning still uses the configured Battle model.

## Deferred

Fleet ownership, prize crews, persistent prisoners, holding cells, prisoner upkeep, delayed ransom collection, recruitment of captured crew, additional rescue destinations, and elaborate faction-specific court proceedings remain outside this version.

## Verification

All 156 automated tests and the production build pass, including settlement conservation, cargo/crew/berth limits, conditional surrender, permanent loss, defeat recovery, rest, finance reconciliation, save replay and rendered settlement controls. Interactive browser and live-provider playtesting remain outstanding from the combat release; settlement itself makes no model requests.
