---
description: "Harden UI locators for stability (roles/labels/testids), remove flake patterns."
---

Harden UI tests for stability.

Constraints:
- No XPath.
- No `waitForTimeout`.
- Prefer `getByRole/getByLabel/getByTestId`.
- If ambiguous, require/assume `data-testid` and document.

Task:
1) Identify flaky/weak locators in UI steps/pages.
2) Replace with accessibility-first locators or testids.
3) Add minimal assertions to serve as deterministic waits.

Output:
- Issues found
- Proposed locator improvements
- Patch/snippets
- Commands to validate