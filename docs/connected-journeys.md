# Connected harbour journeys

This release adds an authored journey that connects existing harbour choices to later meetings in other ports. The mechanical rules stay deterministic; optional dialogue models cannot invent rewards or actions.

## Player flow

Complete a local harbour story, then meet the returning contact. Accepting begins a short journey with a current destination and a clear route-review button. A later meeting offers a consequential choice, and the final port remembers both the original harbour choice and the later decision. Unreached chapters are hidden.

The current objective takes priority over generic exploration advice. Earlier scenes and choices remain available as a compact travel record. Quoted time, upkeep, contributions, fees and rewards are explicit before accepting an action; sailing itself continues to use the existing voyage system.

## Persistence and safety

Journey state is optional on older saves. Each action checks its canonical story, stage, port and expected state. Completed stages and final rewards cannot be replayed by double-clicking or refreshing. Church checkpoints retain their existing restore semantics.

## Verification

Run `npm test` and `npm run build`. Tests cover branching consequences, authoritative accounting, stale actions, duplicate rewards, old-save normalization, persistence, hidden future content, UI navigation and cancellation.

Responsive browser QA is reported using measured CSS viewport dimensions. Narrow desktop-browser testing must not be presented as physical phone or touch-device testing.
