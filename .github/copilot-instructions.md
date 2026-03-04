# GitHub Copilot Instructions (Repo)

## Context
- Stack: JavaScript (ESM) + Playwright Test + playwright-bdd (NOT @cucumber/cucumber)
- Generated specs output: `.features-gen/**` (DO NOT EDIT)
- Feature specs (source): `tests/api/features/**` (and similar feature folders)
- Steps: `src/steps/**`
- Fixtures: `src/fixtures/**` (notably `src/fixtures/api/**`)
- Supporting modules: `src/support/**`, `src/logging/**`, `src/reporters/**`, `src/schemas/**`

---

## Commands (source of truth)
Use npm scripts only:

### Run tests
- All (default env): `npm test`
- Dev: `npm run test:dev`
- Staging: `npm run test:staging`
- Prod: `npm run test:prod`

### Tags / suites
- Smoke (dev): `npm run test:smoke`
- Smoke (staging): `npm run test:smoke:staging`
- Regression (staging): `npm run test:regression`
- Regression (prod): `npm run test:regression:prod`

### Domain tags
- Products: `npm run test:products`
- Users: `npm run test:users`
- Workflow: `npm run test:workflow`
- Positive: `npm run test:positive`
- Negative: `npm run test:negative`

### Local debug
- UI mode: `npm run test:ui`
- Debug mode: `npm run test:debug`
- Headed: `npm run test:headed`

### Reports
- Report (default): `npm run report`
- Open report folder: `npm run report:open`

### BDD generation
- Generate from features to `.features-gen/`: `npm run bdd:generate`

### Cleanup
- Clean results + report + .playwright: `npm run clean`
- Light clean (attachments/report data): `npm run clean:light`
- Full clean (incl. node_modules): `npm run clean:all`

---

## Non-negotiables (quality + stability)
1. **No fixed delays**
   - Never introduce `page.waitForTimeout(...)` or arbitrary sleeps.
   - Use Playwright auto-waits + web-first assertions.

2. **Do not edit generated output**
   - Treat `.features-gen/**` as generated. Never modify it manually.
   - Make changes in sources instead:
     - feature specs: `tests/**/features/**`
     - steps: `src/steps/**`
     - fixtures/helpers: `src/fixtures/**`, `src/support/**`

3. **Stable selectors**
   - Prefer `getByRole`, `getByLabel`, `getByPlaceholder`, `getByTestId`.
   - Avoid brittle CSS/XPath and unstable text selectors.
   - If multiple matches exist, request/assume `data-testid` and document the need.

4. **Security**
   - Never hardcode tokens/passwords.
   - Never log secrets.
   - Use `ENV`-based configuration only (`ENV=dev|staging|prod` via scripts) and `.env` via dotenv.

---

## playwright-bdd workflow rules
### Adding or updating tests
When asked to “add a test”, follow this sequence:
1. Update or create a feature spec under `tests/**/features/**`.
2. Implement or update steps under `src/steps/**`.
3. Reuse existing fixtures/helpers under `src/fixtures/**` and `src/support/**`.
4. Run generation: `npm run bdd:generate`.
5. Run relevant suite (dev/staging/prod or tag-based scripts).

### Step definition rules
- Steps must be deterministic and parallel-safe.
- Prefer small steps that delegate logic to shared helpers.
- Avoid duplicating API calls/validation logic across steps — put it in:
  - `src/fixtures/api/helpers/**` or `src/support/**`

---

## API testing conventions (based on repo structure)
- Use existing API context/client under `src/fixtures/api/**` (e.g., `apiContext`, `client`, `helpers`).
- Validation:
  - Use schemas from `src/schemas/**` when possible (zod).
  - Prefer structured assertions and clear error messages.
- Logging:
  - Use existing logging utilities under `src/logging/**`.
  - Mask tokens/PII; do not dump full payloads when they can include secrets.

---

## Playwright Test conventions (general)
- Prefer explicit, web-first assertions:
  - `expect(locator).toBeVisible()`, `toHaveText`, `toHaveURL`, `toBeEnabled`, etc.
- Do not introduce custom per-step timeouts unless strictly justified and documented.
- If a test is flaky:
  - Fix locator strategy or state handling first.
  - Do not “green” by removing assertions.

---

## Environment handling
- Tests must be runnable with:
  - `npm run test:dev` / `npm run test:staging` / `npm run test:prod`
- Any environment-specific logic must branch on `process.env.ENV`.
- Do not introduce hardcoded base URLs; use config/env system already present in the repo.

---

## Debugging & fixing failures
When a test fails, do:
1. Identify category:
   - locator ambiguity
   - missing deterministic wait/assertion
   - test data/environment issue
   - product bug
2. Fix root cause:
   - For product bugs, keep test truthful; add a clear comment / mark appropriately (avoid deleting asserts).
   - Never patch `.features-gen/**`; patch the feature/steps/helpers.

---

## Output format requirements (for Copilot Chat)
When responding, always provide:
1. Plan (bullets)
2. Files to change (with paths)
3. Patches/snippets
4. Commands to run (`npm run ...`)
5. Risks/notes (stability/security)