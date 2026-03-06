---
description: "Triage Playwright failures using report/trace signals and propose fixes."
---

You are diagnosing failing Playwright tests in a JS + Playwright + playwright-bdd repo.

Constraints:
- Do NOT edit `.features-gen/**`.
- Do NOT “fix” by deleting assertions.
- No `waitForTimeout`.
- Prefer stable locators and deterministic assertions.
- If it’s an app bug, keep test truthful and add a clear note.

Task:
1) Ask me to paste:
   - failing test output OR report snippet (errors + stack)
   - the relevant feature scenario text
   - the related step file(s) content (if available)
2) Classify root cause:
   - locator ambiguity
   - missing deterministic expectation
   - state/data leak between tests
   - environment config issue (ENV=dev/staging/prod)
   - app bug
3) Propose minimal changes in source files (feature/steps/helpers).
4) Provide exact commands to validate and what to inspect in the report.

Output:
- Root cause classification
- Fix plan
- Patch/snippets
- Commands to run + what to verify