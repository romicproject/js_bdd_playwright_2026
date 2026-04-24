import { spawnSync } from "node:child_process";
import path from "node:path";

const laneName = process.argv[2];
const passthroughArgs = process.argv.slice(3);

const projects = {
  api: "API Tests - Chromium",
  ui: "UI Tests - Chromium",
};

const lanes = {
  "all-dev": { env: { ENV: "dev" } },
  "all-staging": { env: { ENV: "staging" } },
  "all-prod": { env: { ENV: "prod" } },
  smoke: {
    env: { ENV: "dev" },
    grep: "@smoke",
    grepInvert: "@regression",
  },
  "smoke-staging": {
    env: { ENV: "staging" },
    grep: "@smoke",
    grepInvert: "@regression",
  },
  regression: {
    env: { ENV: "staging" },
    grep: "@regression",
  },
  "regression-prod": {
    env: { ENV: "prod" },
    grep: "@regression",
  },
  products: { env: { ENV: "dev" }, grep: "@products" },
  brands: { env: { ENV: "dev" }, grep: "@brands" },
  users: { env: { ENV: "dev" }, grep: "@users" },
  workflow: { env: { ENV: "dev" }, grep: "@workflow" },
  positive: { env: { ENV: "dev" }, grep: "@positive" },
  negative: { env: { ENV: "dev" }, grep: "@negative" },
  "api-live-smoke": {
    env: { ENV: "dev", TEST_LANE: "api-live-smoke", RETRY_API_LIVE: "0" },
    project: projects.api,
    grep: "(?=.*@api)(?=.*@smoke)",
    grepInvert: "@mock",
  },
  "api-live-smoke-ci": {
    extends: "api-live-smoke",
    workers: "3",
  },
  "api-live-regression": {
    env: {
      ENV: "dev",
      TEST_LANE: "api-live-regression",
      RETRY_API_LIVE: "0",
    },
    project: projects.api,
    grep: "(?=.*@api)(?=.*@regression)",
    grepInvert: "@mock",
  },
  "api-mock": {
    env: {
      ENV: "dev",
      TEST_LANE: "api-mock",
      API_MOCK_ENABLED: "true",
      API_MOCK_PROFILE: "contract-default",
      RETRY_API_MOCK: "0",
    },
    project: projects.api,
    grep: "(?=.*@api)(?=.*@mock)",
  },
  "api-mock-ci": {
    extends: "api-mock",
    workers: "2",
  },
  "ui-smoke": {
    env: { ENV: "dev", TEST_LANE: "ui-critical", RETRY_UI_CRITICAL: "1" },
    project: projects.ui,
    grep: "(?=.*@ui)(?=.*@smoke)",
    grepInvert: "@regression",
  },
  "ui-smoke-fast": {
    extends: "ui-smoke",
    workers: "75%",
  },
  "ui-smoke-ci": {
    extends: "ui-smoke",
    workers: "3",
  },
  "ui-critical": {
    env: { ENV: "dev", TEST_LANE: "ui-critical", RETRY_UI_CRITICAL: "1" },
    project: projects.ui,
    grep: "(?=.*@ui)(?=.*@critical)",
  },
  "ui-critical-ci": {
    extends: "ui-critical",
    workers: "2",
  },
  "ui-regression": {
    env: { ENV: "dev", TEST_LANE: "ui-regression", RETRY_UI_REGRESSION: "1" },
    project: projects.ui,
    grep: "(?=.*@ui)(?=.*@regression)",
  },
  "ui-register": {
    env: { ENV: "dev" },
    grep: "@register",
  },
  "ui-register-headed": {
    extends: "ui-register",
    headed: true,
  },
  "ui-register-fast": {
    env: { ENV: "dev" },
    project: projects.ui,
    grep: "@register",
    workers: "75%",
  },
  "ui-fast": {
    env: { ENV: "dev" },
    project: projects.ui,
    grep: "@ui",
    workers: "75%",
  },
};

function resolveLane(name, seen = new Set()) {
  const lane = lanes[name];
  if (!lane) return undefined;

  if (!lane.extends) {
    return { ...lane, env: { ...(lane.env || {}) } };
  }

  if (seen.has(name)) {
    throw new Error(`Circular lane inheritance detected for "${name}"`);
  }

  seen.add(name);
  const parent = resolveLane(lane.extends, seen);

  return {
    ...parent,
    ...lane,
    env: {
      ...(parent?.env || {}),
      ...(lane.env || {}),
    },
    extends: undefined,
  };
}

function buildPlaywrightArgs(lane) {
  const args = ["test"];

  if (lane.project) args.push("--project", lane.project);
  if (lane.grep) args.push("--grep", lane.grep);
  if (lane.grepInvert) args.push("--grep-invert", lane.grepInvert);
  if (lane.workers) args.push(`--workers=${lane.workers}`);
  if (lane.headed) args.push("--headed");

  return args;
}

function playwrightCli() {
  return path.resolve(process.cwd(), "node_modules", "playwright", "cli.js");
}

if (!laneName) {
  console.error("Usage: node tools/run-lane.mjs <lane> [playwright args...]");
  console.error(`Available lanes: ${Object.keys(lanes).sort().join(", ")}`);
  process.exit(2);
}

const lane = resolveLane(laneName);
if (!lane) {
  console.error(`Unknown test lane: ${laneName}`);
  console.error(`Available lanes: ${Object.keys(lanes).sort().join(", ")}`);
  process.exit(2);
}

const result = spawnSync(
  process.execPath,
  [playwrightCli(), ...buildPlaywrightArgs(lane), ...passthroughArgs],
  {
    env: {
      ...process.env,
      ...(lane.env || {}),
    },
    shell: false,
    stdio: "inherit",
  },
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
