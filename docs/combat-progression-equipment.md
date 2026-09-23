# Combat progression and captain equipment

Implemented in three phases on top of Capture Resolution. Prices and practice rates are provisional balance choices for the current single-ship game.

## Phase 1: Practice

The 17 active encounter/combat skills now earn fractional points. The existing mastery thresholds remain 10, 20, 40, … points per tier, capped at tier 10. Only mastery changes mechanics. Sailing and Trade keep their existing reward rules.

| Action | Skill | Practice |
| --- | --- | ---: |
| Investigate an early sighting | Lookout | 0.5 |
| Resolve negotiation, deception or intimidation | Corresponding social skill | 0.25 setback; 0.5 otherwise |
| Flee using a powder charge | Demolitions | 0.5 |
| Fire a valid cannon volley | Aiming | 0.25 setback; 0.5 otherwise |
| Complete a timed reload | Reloading | 0.5 |
| Deploy a powder charge | Demolitions | 0.5 |
| Roll for grappling or fight a deck round | Boarding | 0.25 setback; 0.5 otherwise |
| Complete combat deception | Deception | 0.25 setback; 0.5 otherwise |
| Restore hull or reduce flooding | Carpentry | 0.5 |
| Restore sails / treat injured crew / reduce shock or fire | Sailmaking / Doctoring / Leadership | 0.5 |
| Roll a duel attack or defense | Weapon class, Shooting for pistol, Athletics for dodge | 0.25 setback; 0.5 otherwise |
| Roll a surrender demand | Intimidation | 0.25 setback; 0.5 otherwise |

Encounter practice is capped at 1 point per skill per contact. Battle practice is capped at 3 per skill and 10 total per battle. Completed actions count even in a surviving defeat. Free preloads, planning, failed legality/bearing checks, no-op healing/repairs, NPC actions and surrender alone earn nothing. Repeat reloads cannot exceed the cap. A dead captain receives no battle award.

Battle practice is collected during playback and credited once at capture/escape resolution, before settlement. Active combatant mastery stays at its initial snapshot, preventing mid-battle changes to scheduled costs. The award flag and pending practice persist across refresh, checkpoint restoration and phase changes. Older battles receive no reconstructed practice.

## Phase 2: Purchases and preparation

Visit the **Blacksmith** to buy weapons, pistol supplies, and armour; the **Harbour Master** now sells the spyglass. The **Weaver** sells clothing. See [shops and equipment](shops-and-equipment.md) for the expanded catalogue and appearance index. Purchases cost silver, enter the Finance ledger as equipment expenses and take no game time. Prices do not fluctuate with commodity markets or Trade mastery; these are personal retail items, not resale cargo.

| Item | Price in silver | Effect |
| --- | ---: | --- |
| Dagger / Cutlass / Boarding axe | 60 / 90 / 120 | Standard light / medium / heavy melee weapon |
| Fine dagger / Fine cutlass / Fine boarding axe | 300 / 400 / 450 | Same class, superior quality +1 |
| Pistol | 200 | One loaded shot, using Shooting mastery |
| Spyglass | 150 | Early sighting at contacts |
| Five pistol cartridges | 25 | Five pistol balls with powder |

A new captain already owns a standard cutlass. Purchases do not automatically equip weapons or load pistols. Choose an owned melee weapon and load/unload the pistol at the Harbour preparation panel; melee equipment can also be selected at the Blacksmith. Melee quality affects attacks and weapon defenses; it does not improve pistol shots or dodges. Pistol quality is standard. A shot, including a misfire, consumes the loaded cartridge. Reloading is port-only; an unfired cartridge can be unloaded and returned to your supply.

Personal inventory permits one of each catalogue weapon, one pistol, one spyglass and at most 20 cartridges including the loaded shot. Equipment remains inside the captain's existing one-unit person/baggage allowance: no extra hold or deadweight is added. This is an explicit abstraction, not a new commodity conversion. Cargo weapons and cannon shot cannot be converted into personal weapons/cartridges. Eligible unworn clothing, armour and weapons can be resold at their respective shops under the rules in the shops document. Equipment theft and multiple pistols are not implemented.

The Harbour preparation panel also saves ammunition choices per battery and shows required ammunition/powder against stores aboard. Each gun requires one ammunition unit and one gunpowder unit. Purchase cannon supplies through the existing market and its access rules.

At the first naval planning window, select **Apply prepared loadout**. The reducer validates the entire remaining preset before consuming any resources; a shortage consumes nothing. Batteries already preloaded are skipped and cannot consume twice. Manual individual preloads remain available. Presets follow the current operational cannon counts, including after ship purchases/capture exchanges. They are preferences, not reserved supplies: check them again before each departure. Unused surviving loads are returned by existing battle settlement/escape rules; expended or destroyed loads are lost.

## Phase 3: Journal and compatibility

**Journal → Skills** shows mastery and fractional progress for all active combat skills alongside Sailing and Trade. **Equipment** shows owned/equipped weapons, pistol load and cartridges, spyglass, captain injury/fatigue and crew conditions. Crew statistics show fit/injured/dead and quality values. Actions remain in Gamespace.

Existing version-1/2 saves remain compatible. An old captain's weapon class/quality, loaded pistol, spyglass and injuries are retained; a non-catalogue weapon becomes an owned legacy weapon. Owning a pistol survives firing its last loaded shot. New fields are optional and persist in the existing profile/checkpoint system. No mastery, money, spare cartridges or historical practice are retroactively granted.

Captain Training and crew specialties are now covered by [crew development](crew-development.md). Officers, Naval Tactics, Logistics, Stealth, Luck and other mechanics without current action hooks remain future work; this update does not fabricate passive rewards for them.

## Validation

Automated coverage includes progression thresholds/caps, simultaneous event merging, one-time terminal rewards, dead captains, old saves, completed actions versus invalid actions, purchases and finance, ammunition limits, pistol consumption, atomic presets, save/checkpoint persistence and server-rendered equipment/Journal views. TypeScript and the production bundle are checked. Interactive browser QA and live Battle-model playtesting remain outstanding; no installed browser was available in the implementation environment.
