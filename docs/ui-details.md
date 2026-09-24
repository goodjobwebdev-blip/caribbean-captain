# Game UI details

Agreed 24 September 2026, roadmap item 7. Keep the existing themes and game rules. Improve small feedback and readability details; no redesign or new illustrations.

- Crew sailing, gunnery and fighting experience bars with numeric values; separate morale and discipline gauges with text labels.
- Captain skill bars retain exact points and next-tier targets, including a full maximum-mastery state. Successful actions explicitly announce tier increases.
- Hull/sail condition bars and cargo/deadweight meters show exact values, remaining capacity, and text warnings. Over-capacity values remain visible rather than being hidden by a full bar.
- Brief action results are calculated from successfully saved before/after game state: net silver (including upkeep), provisions, crew experience, captain practice/tier changes, repairs and completed commissions. No rewards are inferred from clicks, failed saves, loading profiles, or checkpoint restoration. The latest result remains until the next action/navigation and can be dismissed.
- Quest state badges distinguish active, ready and completed work. Town buildings show counts of commissions deliverable at the current port/building, including legacy Harbour Master work. No ready badges at sea or after failure.
- Selected navigation/tab controls get clear theme-based outlines and accessible state. Common unavailable actions show visible reasons; existing quote errors remain visible.
- Bars and result highlights animate briefly. Reduced-motion preferences disable these animations. Meaning is conveyed by labels and numbers, never color alone. Feedback is announced politely without moving focus.

Thresholds are presentation only: condition below 30% is critical, below 70% damaged; crew morale/discipline below 20 critical, below 40 low, below 70 steady, otherwise high. Capacity at 90% warns and over 100% reports overload. No gameplay thresholds, rewards, prices, save schema, or theme choices change.

## Validation

243 automated tests across 28 files pass, including six new tests for accessible overflow values, crew/mastery states, condition warnings, local/legacy delivery routing, real net rewards and tier rollover, and successful-save versus failed-save/checkpoint feedback. TypeScript and the production build pass. The existing Vite bundle-size advisory remains.

Browser visual verification was attempted but the workspace has no installed Chromium executable. Desktop/mobile layout and the reduced-motion media query are implemented but still need a visual playtest. No new theme or game-state fields are introduced.
