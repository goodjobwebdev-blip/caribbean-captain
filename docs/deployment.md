# GitHub Pages deployment

The current website is a standalone placeholder in `site/index.html`. It uses HTML and CSS without a build step or external assets. Gameplay is not implemented.

## One-time repository setup

In GitHub, open **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

Then open **Actions → Deploy GitHub Pages → Run workflow**, select `main`, and run it. If the initial push already deployed successfully, no manual run is necessary.

The successful deployment's `github-pages` environment displays the live site URL. Do not treat a committed workflow as proof of a successful deployment.

## Automatic deployments

Changes to `site/**` or `.github/workflows/deploy-pages.yml` on `main` trigger deployment. The workflow can also be run manually. Only the `site` directory is published, not the repository documentation.

The workflow uses GitHub's standard Pages actions and the built-in token with contents-read, pages-write, and OIDC permissions. No personal access token or NanoGPT key is required.

If Configure Pages reports that the Pages site cannot be found, enable the source setting above, then rerun the workflow. The repository connector does not expose Pages administration.

## Proposed game stack

This is a recommendation for discussion, not an implemented or approved framework decision:

- TypeScript for game state, rules, and content definitions.
- React for prose, action menus, inventory, contracts, and settings.
- Vite for local development and static production builds.
- Plain CSS for responsive styling.
- IndexedDB for local profiles and checkpoints, with versioned saves and eventual export/import.
- Vitest for economy, time, dice, and save-state tests; Playwright for a few complete player journeys.
- GitHub Actions and GitHub Pages for publishing.

Keep game rules independent of React and LLM calls. The LLM only produces optional dialogue prose. Browser access to NanoGPT must be verified before choosing direct requests versus a minimal proxy. GitHub Pages cannot itself run that proxy. API keys must never enter the repository, build output, or checkpoints.

When the actual app is introduced, set Vite's base path to `/caribbean-captain/`, add install/build steps, and upload `dist` instead of `site`.

Reference: [GitHub's custom Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
