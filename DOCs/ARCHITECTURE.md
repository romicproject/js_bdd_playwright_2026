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

- `steps` → `fixtures` / `support`
- `fixtures` → `framework` / `support` / `ui/pages` / API helpers
- `support` → `ui/pages` / `framework` / `schemas`
- `ui/pages` → Playwright + shared page base classes
- `schemas` → schema libraries only
- `framework` → independent shared infrastructure

If a dependency points upward in the stack, it is usually a signal that responsibilities are starting to blur.

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

- open home page → navigate to signup → submit new user → verify logged in
- prepare scenario data and enrich test context

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

1. Is it Gherkin-facing? → `src/steps/**`
2. Is it dependency setup or lifecycle? → `src/fixtures/**`
3. Is it selector/action/assertion for one page? → `src/ui/pages/**`
4. Is it reusable flow or helper logic? → `src/support/**`
5. Is it contract validation? → `src/schemas/**`
6. Is it generic infra/config/logging/http utility? → `src/framework/**`

If one file tries to answer several of the questions above, it probably needs to be split.
