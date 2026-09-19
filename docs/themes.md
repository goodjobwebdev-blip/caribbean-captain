# Appearance themes

Settings → Appearance provides three light and three dark themes:

| Light | Dark |
| --- | --- |
| Parchment (default) | Midnight Sea |
| Sea Glass | Mangrove |
| Coral Sand | Captain’s Cabin |

`src/themes.css` defines semantic CSS custom properties for backgrounds, surfaces, text, buttons, borders, focus indicators, alerts, and header colors. `src/style.css` consumes those variables without hard-coded colors. Native form controls follow each theme's `color-scheme`. Preview cards use exactly the same palette variables as the application.

`src/themes.ts` contains theme metadata and applies `data-theme` on the document root. Selection is stored separately from captain saves under `caribbean-captain.theme` in localStorage. It applies to all profiles and is not changed by restoring checkpoints. Unknown stored IDs fall back to Parchment. If storage is blocked, selection still works for the current visit and Settings explains that it could not be saved.

The selected theme is applied before React mounts. Theme changes update the browser theme-color metadata too. Native radio controls provide keyboard navigation and a visible selection/focus indicator.

Build verification passed. Main text, secondary text, headings, button labels, warnings, error text, and header secondary text were checked against their corresponding surfaces for at least 4.5:1 contrast in all six palettes.
