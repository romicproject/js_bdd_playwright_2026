# Performance mini-project (Artillery + Playwright)

This module adds mature load testing capabilities on top of the existing framework, without interfering with the Playwright-BDD functional suites.

## Objectives
- Realistic API load (browse/search/login verify)
- UI critical journey load (browser-level, controlled volume)
- SLO gates (`p95`, `p99`, success rate)
- Executive HTML reporting + raw JSON for trends
- Fast migration to another env/app through centralized variables and mappings

## Structure
- `perf/scenarios/api.smoke.yml` — fast daily performance check
- `perf/scenarios/api.load.yml` — primary load profile for release gating
- `perf/scenarios/ui.critical.yml` — critical UI journey under light load
- `perf/processors/common.processor.js` — runtime vars and body builders
- `perf/processors/ui.processor.js` — browser steps for the UI scenario
- `perf/config/targets.js` — environment and endpoint mapping
- `perf/data/*.csv` — payload data for varied input

## Run
- `npm run perf:smoke`
- `npm run perf:load`
- `npm run perf:ui`

## Reports
- `npm run perf:report:smoke`
- `npm run perf:report:load`
- `npm run perf:report:ui`

HTML reports are generated locally by `perf/reporters/generate-report.js` from Artillery JSON output files.

Output files:
- `out/perf/api-smoke.json`
- `out/perf/api-smoke.prev.json` (automatic trend baseline)
- `out/perf/api-load.json`
- `out/perf/api-load.prev.json` (automatic trend baseline)
- `out/perf/ui-critical.json`
- `out/perf/ui-critical.prev.json` (automatic trend baseline)
- `out/perf/*.html`

## Trend report (current vs previous)
- Each run automatically archives the previous result into `*.prev.json`.
- The HTML report includes a trend section with: `REGRESSION | STABLE | IMPROVEMENT` and deltas for `p95`, `p99`, and `success rate`.

## Included real-world scenarios
- API smoke: list products, search product, verify login
- API load: weighted mix of browse+search (60%) and login verification (40%), with warm-up/sustained/cool-down
- UI critical: home -> products -> search -> visible searched products

## Default SLO gates
- API smoke: `p95 <= 1000ms`, `p99 <= 2000ms`, success rate `>= 98%`
- API load: `p95 <= 900ms`, `p99 <= 1800ms`, minimum request rate, success rate `>= 99%`
- UI critical: p95 TTFB constraint and max 5% failed VUs

## Migration to another env/app
1. Set `BASE_URL`, `API_BASE_URL`, `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`.
2. Adjust endpoints in `perf/config/targets.js` if the API differs.
3. Update UI selectors in `perf/processors/ui.processor.js` for the new application.
4. Calibrate SLO thresholds in YAML files based on your app baseline.

## Maturity recommendations
- Run `perf:smoke` for every major PR (nightly if possible).
- Run `perf:load` before release.
- Version/store aggregated JSON output as pipeline artifacts for trend tracking.
- Do not use real sensitive data in `perf/data/*.csv`.
