---
description: "UI-only instructions for future Playwright UI tests (playwright-bdd)."
applyTo: "{tests/ui/**/*.js,tests/ui/**/*.feature,src/steps/ui/**/*.js,src/fixtures/ui/**/*.js,src/support/ui/**/*.js}"
---

# UI Instructions (Playwright + playwright-bdd)

## Do not edit generated output
- `.features-gen/**` is generated. Never edit it.
- UI changes go into:
  - UI features: `tests/ui/features/**`
  - UI steps: `src/steps/ui/**`
  - UI fixtures/helpers: `src/fixtures/ui/**`
  - UI support utils: `src/support/ui/**`

## Locator policy (strict)
Preference order:
1) getByRole(role, { name })
2) getByLabel(label)
3) getByPlaceholder(placeholder)
4) getByTestId(testId)
5) stable CSS only if unavoidable

Rules:
- Never use XPath.
- Avoid getByText for primary actions unless stable and unique.
- Avoid nth() as workaround; if ambiguous, require/assume data-testid and document it.

## Waiting & flakiness
- No `page.waitForTimeout(...)`.
- Avoid `waitForLoadState('networkidle')` unless justified.
- Use assertions as waits:
  - expect(locator).toBeVisible / toBeEnabled / toHaveText
  - expect(page).toHaveURL

## Assertions (must-have)
Each UI scenario must assert a user-visible outcome:
- URL change, or
- toast/confirmation message, or
- visible state change, or
- data rendered.

## Auth & isolation
- Use storageState or auth fixtures; no repeated UI-login per scenario unless necessary.
- Tests must be parallel-safe.