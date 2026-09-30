# Tactical captains and harbour stories

A first gameplay-focused release: keep the existing sailing, trade, combat and save rules, while giving captains more immediate choices and removing the combat network dependency.

## Tactical combat

- Built-in opponents make deterministic, engine-validated decisions from an explicit observation allowlist. They cannot inspect secret schedules, cargo, mastery or battery loads belonging to the player. Declared duel attacks are public.
- Roles, temperament, damage, supplies and visible geometry influence behavior. Local planning is scheduled after render while the player thinks. Its observation key allows reuse after commitment, with cancellation and stale-key rejection when observations change.
- The optional Battle model remains available per decision. Its request may be suspended and replaced with the local captain without discarding the player's committed orders. No automatic paid request is made.
- Editable maneuver cards expose practical ways to use existing movement, ammunition and support mechanics. Selecting a card does not commit it; replacing existing orders needs explicit confirmation.
- A blocked replacement may abandon its remaining schedule and hold course. This prevents exhausted-resource dependency chains from trapping the player or an opponent.

## Harbour stories

Each of the fifteen towns has a one-time authored incident with two approaches. Exact time, silver, provisions and other consequences are shown before choosing. Normal wages and food consumption still apply. Completed choices are saved per port and survive reloads; checkpoint restoration keeps its existing meaning.

The captain's compass surfaces the current opportunity, useful existing services and exploration progress. Rules and rewards are authored; prose models do not invent mechanical outcomes.

## Compatibility and verification

Existing saves need no reset. New optional story memory defaults to absent; accepted battle decisions and the existing authoritative reducer remain unchanged.

Run `npm test` and `npm run build`. PRs now run these checks before merge, while the existing main-branch workflow tests, builds and deploys GitHub Pages.

The cloud browser cannot reach the local development server (`ERR_BLOCKED_BY_CLIENT`), so local UI coverage uses React interaction tests. Public deployment must be checked separately; a passing build is not visual browser verification.
