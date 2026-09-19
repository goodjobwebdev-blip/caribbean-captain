# Deployment

GitHub Pages publishes the production Vite build at `/caribbean-captain/`. The repository's Pages source must be **GitHub Actions**.

`.github/workflows/deploy-pages.yml` runs on pushes to `main` and manual dispatch. It installs locked dependencies, runs tests, builds the app, uploads only `dist/`, and deploys through the `github-pages` environment. A failed test or build prevents deployment. Existing documentation is not included in the published bundle.

No personal token or NanoGPT secret is needed in Actions. The built-in token has contents-read permission; only the deploy job has pages-write and OIDC permissions. NanoGPT keys are entered by players at runtime, never included in the build.

Framework: React + TypeScript + Vite. CSS handles the responsive layout. IndexedDB provides local profiles and church checkpoints. There is no server or cloud save service.

NanoGPT uses the documented [model list](https://docs.nano-gpt.com/api-reference/endpoint/models) and [chat completion](https://docs.nano-gpt.com/api-reference/endpoint/chat-completion) endpoints. Requests are optional, time-limited, and fall back to predefined prose. Keys remain in memory for the current tab. Authenticated generation has not been validated with a real user key.

See [GitHub's Pages workflow documentation](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
