# Architecture Guidelines

## Purpose

This document defines a lightweight architecture for the Playwright + playwright-bdd framework in this repository.

The goal is to keep tests readable, reusable, and easy to evolve without mixing responsibilities across folders.

---

## Core rule

Keep each layer focused on a single responsibility:

- `tests/**/features/**` = business intent in Gherkin
- `src/steps/**` = thin step mapping from Gherkin to actions
- `src/fixtures/**` = dependency injection and test lifecycle
- `src/ui/pages/**` = Page Objects and UI interaction details
- `src/support/**` = reusable flows and helper logic
- `src/schemas/**` = validation contracts
- `src/framework/**` = shared infrastructure

---

## Folder responsibilities

| Area               | Responsibility                                        | May import                                                   | Should avoid                                          |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| `src/steps/**`     | Map Gherkin steps to actions                          | `fixtures`, `support`, lightweight assertions/utilities      | direct Page Object construction, large business logic |
| `src/fixtures/**`  | Create and inject dependencies                        | `framework`, `support`, `ui/pages`, API helper modules       | business workflows, duplicated validation logic       |
| `src/ui/pages/**`  | Encapsulate selectors, UI actions, page assertions    | Playwright APIs, `BasePage`                                  | step logic, scenario state, multi-page business flows |
| `src/support/**`   | Reusable flows, data builders, shared helper logic    | `ui/pages`, `framework`, `schemas`, fixture-provided objects | fixture lifecycle wiring, direct Gherkin coupling     |
| `src/schemas/**`   | Zod contracts and response/data validation            | schema libraries only                                        | dependencies on `steps`, `pages`, or fixtures         |
| `src/framework/**` | Shared infra: config, logging, HTTP utils, validation | low-level libraries                                          | feature-specific test logic                           |

---

## Recommended dependency direction

Use this dependency flow as the default:

- `steps` -> `fixtures` / `support`
- `fixtures` -> `framework` / `support` / `ui/pages` / API helpers
- `support` -> `ui/pages` / `framework` / `schemas`
- `ui/pages` -> Playwright + shared page base classes
- `schemas` -> schema libraries only
- `framework` -> independent shared infrastructure

If a dependency points upward in the stack, it is usually a signal that responsibilities are starting to blur.

---

## Framework-level patterns

### API Preflight Policy (shared module)

The `src/framework/http/preflightPolicy.js` module centralizes logic for determining whether API preflight is required or should be skipped based on lane and environment configuration.

**Why it exists:**
- Preflight logic was duplicated in both `globalSetup.js` and `apiAvailability` fixture
- Single source of truth reduces maintenance burden and prevents drift

**How it's used:**
- `globalSetup.js` calls `resolveConfigRequirements()` during worker startup
- `apiAvailability` fixture calls `shouldSkipApiPreflight()` to determine auto-enforcement
- Lane metadata (e.g., `TEST_LANE=api-mock`) is used to decide behavior

**Key function:**
```js
// Returns true if preflight should be skipped based on lane/env
shouldSkipApiPreflight() // checks TEST_LANE prefix, API_MOCK_ENABLED, API_SKIP_PREFLIGHT
```

### User Cleanup Registry (shared pattern)

The `src/support/shared/cleanupTracking.js` `UserCleanupRegistry` class provides a centralized tracker for users that need cleanup.

**Why it exists:**
- Previously, API and UI contexts maintained parallel cleanup tracking logic
- Single registry ensures consistency between API-initiated and UI-initiated test cleanup

**How it's used:**
- Both `apiContext` and `uiContext` fixtures inject a `UserCleanupRegistry` instance
- `trackCleanupUser(email, password, source)` registers a user for deletion
- `getAll()` returns tracked users for teardown phases
- Logging is automatically attached when registry is created with a logger

**Example:**
```js
// In apiContext
const cleanupRegistry = new UserCleanupRegistry(logger);
context.trackCleanupUser(email, password); // delegates to registry.track(email, password, "api")

// In uiContext
const cleanupRegistry = new UserCleanupRegistry(logger);
uiContext.trackCleanupUser(user); // delegates to registry.track(user.email, user.password, "ui")
```

### Lane Metadata Requirements

All lanes in `tools/run-lane.mjs` must specify metadata that controls test filtering and environment behavior:

- **Domain lanes** (`products`, `brands`, `users`, `workflow`): Must set `TEST_LANE=api-domain`
  - Ensures config validation knows to require API but not UI
- **Mock lanes** (e.g., `api-mock`): Must set `TEST_LANE=api-mock` + `API_MOCK_ENABLED=true`
  - Signals to preflight logic that mocks are enabled
- **Live lanes** (e.g., `api-live-smoke`): Must set `TEST_LANE=api-live-smoke`
  - Signals that live API is required; mocks should not be used
- **UI lanes**: Must set `TEST_LANE=ui-critical` or `ui-regression`
  - Signals that UI is primary; API config may not be present

### Error Message Standardization

Error messages across the framework should include a **prefix** indicating their source layer:

**Prefix convention:**
- `[API_FIXTURE]` — errors thrown from API fixtures
- `[UI_FIXTURE]` — errors thrown from UI fixtures
- `[API_CLEANUP]` — errors during API cleanup operations
- `[UI_CLEANUP]` — errors during UI cleanup operations
- `[PREFLIGHT]` — errors during API preflight initialization
- `[CONFIG]` — configuration validation errors
- `[VALIDATION]` — schema or data validation errors

**Example:**
```js
throw new Error(`[API_FIXTURE] TEST_USER_PASSWORD not configured`);
throw new Error(`[UI_CLEANUP] Delete returned non-success: effectiveStatus=${status}`);
throw new Error(`[PREFLIGHT] API health check failed: ${error.message}`);
```

**Benefit:** Makes debugging easier by immediately identifying which layer/phase an error originated from.

---

## Working rules

### 1. Keep steps thin

A step file should primarily express intent.

Good:

- receive injected fixtures
- call one helper or one page action
- assert the expected result

Avoid:

- long orchestration logic in the step file
- repeated request-building or UI flow code
- reusable API response/assertion helpers that are not Gherkin-specific

### 2. Do not import Page Object classes directly into steps

Prefer this pattern:

- fixtures create `homePage`, `loginPage`, `registerPage`, etc.
- steps consume those injected objects
- reusable multi-step flows live in `src/support/**`

Avoid this in `src/steps/**`:

```js
import { RegisterPage } from "../../ui/pages/RegisterPage.js";
```

Reason:

- keeps construction and lifecycle centralized
- reduces coupling
- makes refactors easier

### 3. Keep selectors inside Page Objects

Selectors and UI interaction details belong in `src/ui/pages/**`, not in steps.

### 4. Put multi-page workflows in `src/support/**`

If the logic spans multiple actions or multiple pages, it usually belongs in a helper/flow module.

Examples:

- open home page -> navigate to signup -> submit new user -> verify logged in
- prepare scenario data and enrich test context
- reusable API response/assertion helpers that are shared across step files

### 5. Keep fixtures focused on wiring

Fixtures should compose and expose dependencies, not become a second place for business logic.

### 6. Keep schemas and framework independent

`src/schemas/**` and `src/framework/**` should remain reusable and neutral.
They should not depend on steps or Page Objects.

---

## Practical examples for this repo

### Good pattern

- `src/steps/ui/register.steps.js` uses injected pages and support helpers
- `src/support/ui/register.helpers.js` owns reusable registration flow logic
- `src/ui/pages/*.js` own UI mechanics and page assertions

### Avoid over time

- putting UI flows directly in step files
- creating Page Objects inside step files
- mixing data builders, selectors, and assertions in the same layer

---

## Short version for team use

If in doubt, use this rule of thumb:

- **steps** say _what the scenario does_
- **fixtures** decide _what gets injected_
- **pages** know _how the UI is used_
- **support** contains _reusable flows and helpers_
- **schemas** define _what valid data looks like_
- **framework** provides _shared infrastructure_

---

## Decision guide

When adding new logic, ask:

1. Is it Gherkin-facing? -> `src/steps/**`
2. Is it dependency setup or lifecycle? -> `src/fixtures/**`
3. Is it selector/action/assertion for one page? -> `src/ui/pages/**`
4. Is it reusable flow or helper logic? -> `src/support/**`
5. Is it contract validation? -> `src/schemas/**`
6. Is it generic infra/config/logging/http utility? -> `src/framework/**`

If one file tries to answer several of the questions above, it probably needs to be split.

---

## Scaling model

When the suite grows toward hundreds or thousands of tests, architecture alone is not enough.
The repository should also preserve a stable operating model:

- `api-mock` lane for deterministic contract and regression coverage
- `api-live-smoke` lane for a thin set of live confidence checks
- `ui-critical` lane for the smallest business-critical UI journey set
- `ui-regression` lane for broader UI coverage that is allowed to run less often
- `perf-*` lanes for performance signals that stay operationally separate from functional gates

### Practical guidance

- Prefer adding new API regression coverage to mock or contract lanes first.
- Add live API scenarios only when the risk is specifically environment or integration dependent.
- Add UI end-to-end scenarios only for journeys that truly require browser validation.
- Treat slow tests, flaky tests, and cleanup-failure annotations as architecture feedback, not just execution noise.
- Keep step files thin even at scale; if one step starts carrying orchestration, move it to `src/support/**`.

### Observability expectations

- Functional runs should produce a machine-readable suite metrics artifact.
- Teams should regularly review:
  - slowest tests
  - flaky tests
  - cleanup-affected tests
  - lane duration trends

If those signals are ignored, the code structure may remain clean while the test platform itself becomes expensive to operate.
