import * as allure from "allure-js-commons";
import { Severity } from "allure-js-commons";
import { createHash } from "node:crypto";
import { config } from "../framework/config/envConfig.js";

function normalizeTags(tags = []) {
  return [...new Set(tags.map((tag) => String(tag).replace(/^@/, "").trim()))];
}

function humanizeFeatureName(feature) {
  return String(feature || "")
    .replace(/\.feature$/i, "")
    .replace(/[-_]+/g, " ")
    .trim();
}

function resolveSeverity(tags) {
  if (tags.includes("critical")) {
    return Severity.CRITICAL;
  }

  if (tags.includes("smoke")) {
    return Severity.NORMAL;
  }

  if (tags.includes("regression")) {
    return Severity.MINOR;
  }

  return Severity.NORMAL;
}

function buildStableIdentity(testInfo, { kind, feature } = {}) {
  const titlePath = Array.isArray(testInfo?.titlePath)
    ? testInfo.titlePath.map((value) => String(value).trim()).filter(Boolean)
    : [];

  const parts = [
    String(kind || "unknown").trim(),
    String(testInfo?.project?.name || "unknown").trim(),
    String(feature || "unknown").trim(),
    ...titlePath,
  ].filter(Boolean);

  return parts.join(" :: ");
}

function buildStableAllureId(value) {
  return createHash("sha1").update(String(value)).digest("hex");
}

export async function applyAllureMetadata(
  testInfo,
  { kind, feature, apiMockEnabled, apiMockProfile } = {},
) {
  const tags = normalizeTags(testInfo?.tags);
  const stableIdentity = buildStableIdentity(testInfo, { kind, feature });
  const jobs = [
    allure.parameter("env", config.env, { excluded: true }),
    allure.parameter("lane", config.retry?.lane || "default", {
      excluded: true,
    }),
    allure.testCaseId(buildStableAllureId(`case::${stableIdentity}`)),
    allure.historyId(buildStableAllureId(`history::${stableIdentity}`)),
  ];

  if (process.env.LOG_RUN_ID) {
    jobs.push(
      allure.parameter("run_id", process.env.LOG_RUN_ID, { excluded: true }),
    );
  }

  if (kind) {
    jobs.push(allure.layer(String(kind).toLowerCase()));
  }

  const featureName = humanizeFeatureName(feature);
  if (featureName) {
    jobs.push(allure.feature(featureName));
  }

  const configuredOwner = String(process.env.ALLURE_OWNER || "").trim();
  if (configuredOwner) {
    jobs.push(allure.owner(configuredOwner));
  }

  jobs.push(allure.severity(resolveSeverity(tags)));

  if (kind === "API") {
    jobs.push(
      allure.parameter("api_mock_enabled", String(Boolean(apiMockEnabled)), {
        excluded: true,
      }),
    );

    if (apiMockProfile) {
      jobs.push(
        allure.parameter("api_mock_profile", String(apiMockProfile), {
          excluded: true,
        }),
      );
    }
  }

  await Promise.allSettled(jobs);
}
