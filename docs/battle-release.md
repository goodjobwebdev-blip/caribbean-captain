# Battle implementation

Implements the Encounter → Naval Engagement → Deck Battle → Captain Duel flow from the three battle specifications. Numerical choices remain provisional.

## Playing

New voyages use a seeded contact schedule. Contact roles and opening postures produce contextual responses; not every contact becomes combat. Lookout and a spyglass can unlock early sightings. Peaceful hail stores the NPC origin market's dated departure snapshot.

In Settings, load NanoGPT models and choose a **Battle model**. The Prose model and dialogue toggle are independent. Easy / Normal / Hard change NPC planning information, not combat stats. No model or API failure suspends the battle. Retry or Change Model resumes it. The implementation never supplies a deterministic NPC combat fallback.

Naval planning supports free initial battery preloads, timed orders, ammunition/powder reservations, turns, sails, volleys, explosives, grappling, repairs, morale support, doctoring and deception. The course preview assumes the opponent maintains its visible course. Both accepted plans are saved before reveal. Playback supports Pause, Normal, Fast, Next Event and Resolve Instantly, with mandatory stops at invalid starts and phase changes.

Boarding replaces the timeline with secret crew orders, casualties, Boarding Control and captain exchanges. The UI shows initiative, conditions, equipment, rolls and public tactical intent. Enemy exact captain levels and raw mastery are not displayed.

## Explicit boundary

The specifications defer **Capture Resolution**. Surrender, sinking, incapacitation, collapse and death retain the complete combatant state and outcome. The voyage pauses at this boundary rather than inventing rewards, prize crews, imprisonment or transfer rules. Escape can resume the voyage. Church checkpoints remain the recovery mechanism.

Fleets, selectable boarding parties, cut grapples, ramming, detailed equipment catalogs, new skill training/reward systems, witnesses and delayed reporting remain deferred. Existing saves without combat skills use mastery zero; existing crew without quality data use normalized quality 50. The default captain has a standard medium melee weapon and no loaded pistol. Loaded-pistol and alternative melee equipment state are supported, but this release does not create a new equipment shop.

Provisional implementation choices:

- Regional danger defaults to 1. NPC quality is derived from level; ship preference weights taper by tier distance.
- Prepared encounter gunpowder distraction consumes one powder unit.
- Full Deception reduces demands by half; partial reduces them by one quarter.
- Inspection fines use 50 silver per discovered offense; multiple contraband goods can be confiscated.
- NPC partial duel defenses mirror the player's defense-specific mitigation; natural 12 bypasses that mitigation.
- Combat units do not advance voyage hours. The original departure-duration snapshot remains intact.

## Persistence and authority

`Game` stores pending contacts, active encounter, battle seed state, accepted model decisions, schedules, timeline position, resources, crew, captain conditions, and phase transitions. Existing version-1/2 saves remain readable. Only old saves already in a prototype pirate encounter use the legacy one-roll handler.

The model receives an explicit allowlisted observation payload, never the Game object or secret player schedule. The engine validates structured responses, action IDs, ownership, costs, resources, loading sequences and surrender eligibility. Up to ten invalid responses receive exact correction errors; exhaustion or transport failure leaves the original state suspended. Accepted decisions cannot be overwritten or accepted against a different decision key.

## Validation

- `npm test`: 144 passing tests, including the existing economy/storage suite.
- `npm run build`: TypeScript and Vite production build pass.
- Seeded 5,000-voyage check verifies the approximately 20% two-day contact baseline.
- Combat tests cover reservations, failed volleys, bearing boundaries, simultaneous effects, grappling cancellation, replacements, save replay, casualties, natural rolls, duel fatigue and the public-reducer flow through all phases.
- Mocked API tests cover schema correction, missing model, ten-attempt suspension and hidden-information isolation. No paid live NanoGPT request was made.
- Server-rendered UI checks cover encounters, naval combat, deck fighting, duels and the resolution boundary.
- Interactive browser QA was attempted but blocked: no browser executable was installed, and the browser download timed out. Visual layout and live-provider behavior still need playtesting before release.
