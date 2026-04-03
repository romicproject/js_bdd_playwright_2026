import * as allure from "allure-js-commons";
import { Severity } from "allure-js-commons";
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

export async function applyAllureMetadata(
  testInfo,
  { kind, feature, apiMockEnabled, apiMockProfile } = {},
) {
  const tags = normalizeTags(testInfo?.tags);
  const jobs = [
    allure.parameter("env", config.env),
    allure.parameter("lane", config.retry?.lane || "default"),
    allure.parameter("project", testInfo?.project?.name || "unknown"),
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
      allure.parameter("api_mock_enabled", String(Boolean(apiMockEnabled))),
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
