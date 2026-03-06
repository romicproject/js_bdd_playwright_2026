---
description: "Create a new BDD feature + step skeleton (playwright-bdd) and generate specs."
---

You are working in a JS + Playwright + playwright-bdd repository.

Goal: add a new test scenario using the repo’s BDD approach.

Constraints:
- Do NOT edit `.features-gen/**`.
- Add/modify feature specs under `tests/**/features/**`.
- Add/modify step definitions under `src/steps/**`.
- Reuse helpers/fixtures under `src/fixtures/**` and `src/support/**`.
- Never add `page.waitForTimeout`.
- Prefer getByRole/getByLabel/getByTestId for UI.

Task:
1) Ask me for the feature name, tags (@smoke/@regression/@users/@products/@workflow/@positive/@negative), and target flow (UI/API).
2) Create the feature file in the correct folder with:
   - Background (only if needed)
   - 1–3 scenarios max, each with clear Given/When/Then
3) Create/extend step definitions in `src/steps/**`:
   - Keep steps small; delegate logic to helpers
4) If new shared logic is required, create it under `src/support/**` or `src/fixtures/**`.
5) Provide exact commands to run:
   - `npm run bdd:generate`
   - then the smallest appropriate test command (dev/staging/prod or tag grep).

Output format:
- Plan
- Files to change with patches/snippets
- Commands to run
- Notes/risks