---
description: "Instructions for Playwright + playwright-bdd tests (features/steps/fixtures)."
applyTo: "{tests/**/*.js,src/steps/**/*.js,src/fixtures/**/*.js,src/support/**/*.js,src/schemas/**/*.js,src/logging/**/*.js,src/reporters/**/*.js,.features-gen/**/*.js,playwright.config*.js}"
---

# Test-focused instructions (Playwright + playwright-bdd)

## Golden rules
- `.features-gen/**` is generated output. **Never edit it.**
  - Change feature sources in `tests/**/features/**`
  - Change step definitions in `src/steps/**`
  - Change shared code in `src/fixtures/**` and `src/support/**`
- No fixed sleeps:
  - Never add `page.waitForTimeout(...)`.
  - Prefer Playwright auto-wait + `expect(...)` assertions.
- Prefer stable locators:
  - Prefer `getByRole`, `getByLabel`, `getByPlaceholder`, `getByTestId`.
  - Avoid brittle CSS/XPath.
  - If multiple matches occur, require/assume `data-testid` and document it.

## UI testing specifics
- Use accessibility-first locators:
  - Buttons/links: `getByRole('button', { name: ... })`, `getByRole('link', { name: ... })`
  - Forms: `getByLabel(...)`, `getByPlaceholder(...)`
- Assertions must verify user-visible outcomes:
  - `toBeVisible`, `toHaveText`, `toHaveURL`, `toBeEnabled`, `toHaveCount`.
- Avoid `networkidle` unless explicitly required and justified.

## API testing specifics
- Use existing API context/client/helpers from `src/fixtures/api/**`.
- Validate responses with zod schemas in `src/schemas/**` when available.
- Do not log sensitive headers/tokens; mask secrets.

## BDD workflow
When adding tests:
1. Update/create feature spec under `tests/**/features/**`.
2. Implement/update steps under `src/steps/**`.
3. Reuse helpers/fixtures; avoid duplicated logic.
4. Run `npm run bdd:generate`.
5. Run the smallest relevant test command (e.g., `npm run test:dev --grep @tag` if appropriate).

## Debug & failures
- If a test fails:
  - fix selector/state/data issues first
  - do not “green” by deleting assertions
  - if it is an app bug, keep the test truthful and add an explicit note/marker in source steps/features (not generated output)