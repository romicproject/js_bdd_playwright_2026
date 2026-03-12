# Playwright API BDD helpers overview

## Helper architecture
- `fixtures/api/api.fixtures.js` injects `apiHelpers` into steps via Playwright fixtures.
- `fixtures/api/helpers/index.js` aggregates product, brand, and user helper groups + exposes flat methods plus namespaced objects for convenience.
- Each helper wraps `apiClient` to handle POST/DELETE/PUT payloads, form encoding, and responseCode fallback.

## How to use in tests
```js
import { test } from '../fixtures/api/api.fixtures.js';

test('rewind response', async ({ apiHelpers, apiContext }) => {
  const response = await apiHelpers.searchProduct('jeans');
  expect(response.body.products).toBeDefined();
});
```
- Use the top-level methods for common operations (`apiHelpers.createUser`, `apiHelpers.getAllBrands`, etc.).
- To access helper-specific APIs or extensions, use the namespaces (`apiHelpers.products`, `apiHelpers.brands`, `apiHelpers.users`). This keeps helper code organized as the suite grows.

## Helper utils
- `fixtures/api/helpers/utils.js` provides `buildForm`, `formBody`, `FORM_HEADERS`, and `buildSearchParams` so helpers reuse consistent form encoding and headers.
- When you add new helpers, reuse these utilities to keep payload formatting uniform and avoid duplication.

## Extending helpers
Add new methods at `createProductsHelpers`, `createUsersHelpers`, or `createBrandsHelpers` and expose them either directly in the returned object or via the namespaced property. Existing steps already consume `apiHelpers.*`, so keep the flat exports stable.

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
- Keep [env/dev.env](../env/dev.env) with local placeholders only.
- Keep [env/staging.env](../env/staging.env) and [env/prod.env](../env/prod.env) placeholder-only in git.
- Provide real sensitive values via local environment variables or CI secret stores.
- Use [env/dev.env.example](../env/dev.env.example) as the template for required keys.
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
