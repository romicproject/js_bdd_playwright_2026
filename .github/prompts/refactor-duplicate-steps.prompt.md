---
description: "Detect and refactor duplicated step logic into helpers/fixtures."
---

You are refactoring a JS + Playwright + playwright-bdd repository.

Constraints:
- Do NOT edit `.features-gen/**`.
- Keep behavior identical.
- No new sleeps/timeouts.
- Prefer reusing existing utilities.

Task:
1) Identify duplicated logic across `src/steps/**` (API or UI).
2) Extract shared logic into:
   - `src/support/**` for generic helpers, or
   - `src/fixtures/api/helpers/**` for API-specific logic, or
   - `src/fixtures/ui/**` for UI-specific utilities.
3) Update steps to call the shared helper(s).
4) Ensure naming is consistent and intent-revealing.
5) Provide commands to validate:
   - `npm run bdd:generate`
   - `npm test` or the narrowest relevant `npm run test:*`.

Output:
- Summary of duplicates found
- Proposed helper API (function signatures)
- Patch/snippets
- Commands to run