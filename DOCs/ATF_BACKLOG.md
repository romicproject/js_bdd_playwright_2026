# ATF Backlog (UI + API)

_Status legend: ✅ Done · ⏸️ Deferred · 📝 Open · 🚫 Dropped_

## Prioritate mare (impact direct pe stabilitate și încredere)

- ✅ **Uniformizare locatori UI pe accesibilitate-first**
  - Reducere CSS fragil unde a fost posibil în [src/fixtures/ui/pages/ProductsPage.js](../src/fixtures/ui/pages/ProductsPage.js).
  - Notă: fine-tuning suplimentar în [src/fixtures/ui/pages/RegisterPage.js](../src/fixtures/ui/pages/RegisterPage.js) rămâne opțional.

- ⏸️ **Politică clară pentru instabilități externe (ads/vignette/403)**
  - Standardizare tratament în [src/fixtures/ui/pages/BasePage.js](../src/fixtures/ui/pages/BasePage.js) și [src/fixtures/ui/pages/LoginPage.js](../src/fixtures/ui/pages/LoginPage.js) pentru separare clară flaky extern vs defect real.

- ✅ **Consistență execuție prin scripts**
  - Scripts și ghidare Windows/PowerShell aliniate în [package.json](../package.json) și [DOCs/README.md](README.md).

## Prioritate medie (mentenabilitate și scalare)

- 🚫 **Namespace clar pentru step text UI/API** (Not needed for now)
  - Decizie: tag-urile (`@ui`, `@api`) și formulările actuale de pași sunt suficiente.
  - Acțiune: păstrăm step text-urile curate; evităm doar punctual dublurile cu API.

- ✅ **Consolidare completă helperi UI reutilizabili**
  - Logică non-step extrasă în [src/support/ui/register.helpers.js](../src/support/ui/register.helpers.js).

- ✅ **Standardizare page-ready assertions**
  - Pattern `assertOn...Page()` consolidat în POM-urile UI din [src/fixtures/ui/pages](../src/fixtures/ui/pages).

## Prioritate mică (calitate operațională / fine tuning)

- ✅ **Aliniere report path (practică de rulare/documentare)**
  - Rulare și troubleshooting documentate în [DOCs/README.md](README.md).

- ✅ **Hardening pentru date de test**
  - Convenție metadata + structură explicită în [src/fixtures/ui/ui.fixtures.js](../src/fixtures/ui/ui.fixtures.js) și [src/support/ui/register.helpers.js](../src/support/ui/register.helpers.js).

- ✅ **Documentație scurtă de troubleshooting CI/local**
  - Secțiune dedicată Windows run tips + grep troubleshooting în [DOCs/README.md](README.md).

---

## Context de implementare recentă

- ✅ Separare clară config API vs UI în [playwright.config.js](../playwright.config.js).
- ✅ Stabilizare flow-uri UI register și signup-login (spec-uri UI verzi).
- ✅ Fără editare manuală în `.features-gen/**` (doar prin generare).
