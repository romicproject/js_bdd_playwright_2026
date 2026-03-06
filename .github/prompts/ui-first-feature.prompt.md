---
description: "Create first UI feature + steps (playwright-bdd), minimal & stable."
---

Create the first UI BDD test for this repo.

Constraints:
- Do NOT edit `.features-gen/**`.
- Add UI feature in `tests/ui/features/`.
- Add UI steps in `src/steps/ui/`.
- Never use `page.waitForTimeout`.
- Prefer `getByRole/getByLabel/getByTestId`.

Task:
1) Ask me for the target URL and flow (e.g., login, navigation, CRUD).
2) Create one feature file with 1–2 scenarios and appropriate tags (e.g., @smoke @ui).
3) Create step definitions, keeping steps small and readable.
4) Provide commands to run:
   - `npm run bdd:generate`
   - `npm run test:dev` (or the narrowest `--grep` suggestion)

Output:
- Plan
- Files + snippets
- Commands
- Notes/risks