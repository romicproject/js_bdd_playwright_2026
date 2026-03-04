# Docker workflow for tests

The project now ships with a Docker runner that mirrors `npm run test:*`.

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
   * `--profile staging` + `config/env/staging.env` → runs `npm run test:staging`
   * `--profile prod` + `config/env/prod.env` → runs `npm run test:prod`
4. Tear down:
   ```sh
   docker compose down --remove-orphans
   ```

The accompanying `Dockerfile` is based on `mcr.microsoft.com/playwright:v1.58.2-jammy`, copies the sources, installs dependencies, generates `.features-gen`, and finally dispatches `npm run test:dev` (overridable via the Compose service).

Use the `config/env/*.env` files to set `ENV` and other secrets (`--env-file` on compose). In CI, publish `playwright-report` and `test-results` as artifacts after the compose service finishes.

## Report output locations

The compose services mount two folders from the repo root into the container:
 - `./out/playwright-report` → `/app/out/playwright-report`
 - `./out/test-results` → `/app/out/test-results`

Anything the Playwright run writes in those directories (reports, attachments, traces) appears immediately on the host so you can inspect the report via `npm run report` or publish the folders as artifacts.

## Jenkins CI usage

The project includes a top-level `Jenkinsfile` that runs Docker Compose tests with a parameterized environment:
 - `TEST_ENV=dev` uses `tests-dev`
 - `TEST_ENV=staging` uses `tests-staging`
 - `TEST_ENV=prod` uses `tests-prod`

Pipeline flow:
1. Checkout repository
2. Verify Docker / Compose availability on agent
3. Build image with `docker compose --profile <env> build`
4. Run tests with `docker compose --profile <env> up --build --abort-on-container-exit --exit-code-from tests-<env> --remove-orphans`
5. Publish `out/test-results/junit.xml` and archive `out/playwright-report/**` + `out/test-results/**`

The Jenkins agent must have Docker access and permissions to execute `docker compose`.
