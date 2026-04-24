# Docker workflow for tests

The project now ships with a Docker runner that mirrors `npm run test:lane -- <lane>`.

1. Build the image (first run only):
   ```sh
   docker compose --profile dev build
   ```
2. Execute a suite and keep reports:
   ```sh
   docker compose --profile dev up --abort-on-container-exit --exit-code-from tests-dev --remove-orphans
   ```
   Reports land in `out/playwright-report`/`out/test-results` on the host thanks to the mounted volumes.
3. Switch environments by selecting the matching profile + env file:
   - `--profile staging` + `env/staging.env` -> runs `npm run test:lane -- all-staging`
   - `--profile prod` + `env/prod.env` -> runs `npm run test:lane -- all-prod`
4. Tear down:
   ```sh
   docker compose down --remove-orphans
   ```

The accompanying `Dockerfile` is based on `mcr.microsoft.com/playwright:v1.58.2-jammy`, copies the sources, installs dependencies, generates `.features-gen`, and finally dispatches `npm run test:lane -- all-${ENV:-dev}` (overridable via the Compose service).

Use the `env/*.env` files to set `ENV` and other secrets (`--env-file` on compose). In CI, publish `playwright-report` and `test-results` as artifacts after the compose service finishes.

## Report output locations

The compose services mount two folders from the repo root into the container:

- `./out/playwright-report` -> `/app/out/playwright-report`
- `./out/test-results` -> `/app/out/test-results`

Anything the Playwright run writes in those directories (reports, attachments, traces) appears immediately on the host so you can inspect the report via `npm run report` or publish the folders as artifacts.

## Jenkins CI usage

The project includes a top-level `Jenkinsfile` that runs tests **directly inside the Playwright Docker image** (no Docker Compose on the agent).

Pipeline flow:

1. Checkout repository
2. Install dependencies with `npm ci`
3. Quality gate: `npm run check:quality` (bddgen + lint + format check)
4. Restore Allure history from the last successful build (via `copyArtifacts`)
5. Run three lanes **in parallel**:
   - `api-mock` -> `npm run test:lane -- api-mock-ci`
   - `api-live-smoke` -> `npm run test:lane -- api-live-smoke-ci`
   - `ui-critical` -> `npm run test:lane -- ui-critical-ci` (skippable via `SKIP_UI` parameter)
6. Generate Allure report: `npm run report:allure:generate:lanes`
7. Publish artifacts: `playwright-report`, `test-results`, `allure-results`, `allure-report`, `allure-history`, `logs`, per-lane snapshots under `out/lanes/`

Parameters:

- `TEST_ENV` - `dev` / `staging` / `prod`
- `SKIP_UI` - boolean, skips the `ui-critical` lane when the UI site is unstable

The Jenkins agent requires access to the Playwright Docker image (`mcr.microsoft.com/playwright:v1.58.2-jammy`). The `copyArtifacts` step requires the **Copy Artifact** plugin; the `publishHTML` step requires the **HTML Publisher** plugin. Both are optional - the pipeline degrades gracefully if they are absent.
