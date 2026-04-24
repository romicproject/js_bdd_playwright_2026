import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const action = process.argv[2];
const profileName = process.argv[3];

const profiles = {
  smoke: {
    scenario: "perf/scenarios/api.smoke.yml",
    json: "out/perf/api-smoke.json",
    html: "out/perf/api-smoke.html",
    title: "API Smoke Performance Report",
  },
  load: {
    scenario: "perf/scenarios/api.load.yml",
    json: "out/perf/api-load.json",
    html: "out/perf/api-load.html",
    title: "API Load Performance Report",
  },
  ui: {
    scenario: "perf/scenarios/ui.critical.yml",
    json: "out/perf/ui-critical.json",
    html: "out/perf/ui-critical.html",
    title: "UI Critical Performance Report",
  },
};

function ensureOutDir() {
  fs.mkdirSync("out/perf", { recursive: true });
}

function archivePreviousResult(resultPath) {
  if (!fs.existsSync(resultPath)) return;
  fs.copyFileSync(resultPath, resultPath.replace(/\.json$/, ".prev.json"));
}

function artilleryCli() {
  return path.resolve(process.cwd(), "node_modules", "artillery", "bin", "run");
}

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    env,
    shell: false,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

function usageAndExit() {
  console.error("Usage: node tools/run-perf.mjs <run|report> <smoke|load|ui>");
  process.exit(2);
}

if (!action || !profileName) {
  usageAndExit();
}

const profile = profiles[profileName];
if (!profile) {
  console.error(`Unknown perf profile: ${profileName}`);
  usageAndExit();
}

ensureOutDir();

if (action === "run") {
  archivePreviousResult(profile.json);
  run(
    process.execPath,
    [artilleryCli(), "run", profile.scenario, "-o", profile.json],
    {
      ...process.env,
      ENV: process.env.ENV || "dev",
    },
  );
}

if (action === "report") {
  run(process.execPath, [
    "perf/reporters/generate-report.js",
    "--input",
    profile.json,
    "--output",
    profile.html,
    "--title",
    profile.title,
  ]);
}

usageAndExit();
