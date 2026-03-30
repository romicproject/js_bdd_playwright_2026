# Playwright API BDD helpers overview

## Repository positioning

- This repository serves two purposes at the same time:
  - a learning/playground space for Playwright + BDD + performance experimentation
  - a reusable framework starter with patterns mature enough for team adoption
- Treat `tests/**`, `perf/**`, and some docs/backlog items as the learning and experimentation surface.
- Treat `src/framework/**`, `src/fixtures/**`, `src/ui/pages/**`, `src/support/**`, CI setup, and environment conventions as the reusable framework core.
- When adding new material, be explicit about which category it belongs to so the repo does not drift into a mixed, hard-to-maintain state.

## Recommended use

- Safe to reuse as framework baseline:
  - fixture wiring
  - API client/logging/redaction
  - page object structure
  - schema validation patterns
  - Docker/Jenkins/GitHub CI scaffolding
- Keep clearly marked as examples or learning assets:
  - demo scenarios tied to third-party public apps
  - exploratory perf scenarios
  - one-off experiments or temporary feature drafts

## Architecture

- For folder responsibilities and dependency boundaries, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Helper architecture

- `fixtures/api/api.fixtures.js` injects `apiHelpers` into steps via Playwright fixtures.
- `fixtures/api/helpers/index.js` aggregates product, brand, and user helper groups and currently exposes a flat helper surface (`apiHelpers.createUser`, `apiHelpers.searchProduct`, etc.).
- Each helper wraps `apiClient` to handle POST/DELETE/PUT payloads, form encoding, and responseCode fallback.

## How to use in tests

```js
import { test } from "../fixtures/api/api.fixtures.js";

test("rewind response", async ({ apiHelpers, apiContext }) => {
  const response = await apiHelpers.searchProduct("jeans");
  expect(response.body.products).toBeDefined();
});
```

- Use the top-level methods for common operations (`apiHelpers.createUser`, `apiHelpers.getAllBrands`, etc.).
- If namespaced helper groups are added later, document them here before relying on them in steps or examples.

## Helper utils

- `fixtures/api/helpers/utils.js` provides `buildForm`, `formBody`, `FORM_HEADERS`, and `buildSearchParams` so helpers reuse consistent form encoding and headers.
- When you add new helpers, reuse these utilities to keep payload formatting uniform and avoid duplication.

## Extending helpers

Add new methods at `createProductsHelpers`, `createUsersHelpers`, or `createBrandsHelpers` and expose them through `createApiHelpers`. Existing steps already consume flat `apiHelpers.*` methods, so keep that surface stable unless you intentionally introduce and document namespaces.

## API mock mode (example)

- API mocks are opt-in and scenario-safe.
- Use tag `@mock` and step `Given API mock profile "products-happy" is enabled` in API features.
- Run only mock scenarios:
  - `npm run test:dev -- --project="API Tests - Chromium" --grep=@mock`

- Optional ENV fallback:
  - `API_MOCK_ENABLED=true`
  - `API_MOCK_PROFILE=products-happy`

## Tagging and naming conventions

- Use one layer tag on every scenario:
  - `@api` for API scenarios
  - `@ui` for UI scenarios
- Use one intent tag when relevant:
  - `@smoke` for fast confidence checks
  - `@regression` for broader functional coverage
  - `@workflow` for cross-step or end-to-end flows
  - `@mock` for scenario-safe API mock runs
- Use one outcome tag when relevant:
  - `@positive` for success paths
  - `@negative` for validation/error paths
- Prefer feature names that describe business capability, not endpoint names alone.
- Prefer scenario names in the form `Action + expected outcome`.
- Reuse existing tags before inventing new ones. If a new tag is needed, document it here first.

## Windows run tips (PowerShell/CMD)

- Prefer `--grep=@tag` instead of `--grep @tag` to avoid argument parsing issues in PowerShell.
- For register UI flow, use the dedicated scripts:
  - `npm run test:ui:register`
  - `npm run test:ui:register:headed`
- Generic examples:
  - `npm run test:dev -- --grep=@ui`
  - `npm run test:dev -- --grep=@register --headed`

### Common issues

- `option '-g, --grep <grep>' argument missing`
  - Cause: shell split removed the grep value.
  - Fix: use `--grep=@tag` format..

- Command works in CMD but fails in PowerShell
  - Use the same syntax with equals (`--grep=@tag`) and avoid extra quotes unless needed.

- `npm` blocked by execution policy in PowerShell
  - Run `npm.cmd ...` instead of `npm ...` for local terminal sessions.

## Secret handling policy

- Do not commit real credentials or API keys in tracked `.env` files.
- Local runtime files such as `env/dev.env`, `env/staging.env`, and `env/prod.env` are git-ignored and should stay local only.
- Provide real sensitive values via local environment variables, Docker/Jenkins env injection, or CI secret stores.
- Use [env/dev.env.example](../env/dev.env.example), [env/staging.env.example](../env/staging.env.example), and [env/prod.env.example](../env/prod.env.example) as templates for required keys.
- The framework can now start even if `env/<ENV>.env` is missing, as long as the required variables are already present in `process.env`.
- Recommended CI secrets: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`, `API_KEY`, `BASE_URL`, `API_BASE_URL`.

## Performance load testing

- Performance mini-project is available in [perf/README.md](../perf/README.md).
- Quick commands:
  - `npm run perf:smoke`
  - `npm run perf:load`
  - `npm run perf:ui`
  - `npm run perf:report:smoke`
  - `npm run perf:report:load`
  - `npm run perf:report:ui`
- Reports are generated locally from Artillery JSON via `perf/reporters/generate-report.js`.
- Trend mode compares the current run against `*.prev.json` baseline files.
