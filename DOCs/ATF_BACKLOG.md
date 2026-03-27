# ATF Backlog (UI + API)

_Status legend: ✅ Done · ⏸️ Deferred · 📝 Open · 🚫 Dropped_

## High priority (direct impact on stability and confidence)

- ✅ **UI locator standardization with accessibility-first approach**
  - Reduced fragile CSS usage where possible in [src/ui/pages/ProductsPage.js](../src/ui/pages/ProductsPage.js).
  - Note: additional fine-tuning in [src/ui/pages/RegisterPage.js](../src/ui/pages/RegisterPage.js) remains optional.

- ⏸️ **Clear policy for external instability (ads/vignette/403)**
  - Standardized handling in [src/ui/pages/BasePage.js](../src/ui/pages/BasePage.js) and [src/ui/pages/LoginPage.js](../src/ui/pages/LoginPage.js) to clearly separate external flakiness from real defects.

- ✅ **Execution consistency through scripts**
  - Scripts and Windows/PowerShell guidance aligned in [package.json](../package.json) and [DOCs/README.md](README.md).

## Medium priority (maintainability and scaling)

- 🚫 **Clear namespace for UI/API step text** (Not needed for now)
  - Decision: current tags (`@ui`, `@api`) and step wording are sufficient.
  - Action: keep step text clean and only avoid API duplicates when they appear.

- ✅ **Complete consolidation of reusable UI helpers**
  - Non-step logic extracted to [src/support/ui/register.helpers.js](../src/support/ui/register.helpers.js).

- ✅ **Standardized page-ready assertions**
  - `assertOn...Page()` pattern consolidated in UI POMs under [src/ui/pages](../src/ui/pages).

## Low priority (operational quality / fine tuning)

- ✅ **Report path alignment (execution/documentation practice)**
  - Execution and troubleshooting documented in [DOCs/README.md](README.md).

- ✅ **Test data hardening**
  - Metadata convention and explicit structure in [src/fixtures/ui/ui.fixtures.js](../src/fixtures/ui/ui.fixtures.js) and [src/support/ui/register.helpers.js](../src/support/ui/register.helpers.js).

- ✅ **Short CI/local troubleshooting documentation**
  - Dedicated Windows run tips + grep troubleshooting section in [DOCs/README.md](README.md).

---

## Recent implementation context

- ✅ Clear API vs UI config separation in [playwright.config.js](../playwright.config.js).
- ✅ Stabilized UI register and signup-login flows (UI specs green).
- ✅ No manual edits in `.features-gen/**` (generation only).
