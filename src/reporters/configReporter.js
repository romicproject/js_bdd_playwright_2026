// reporters/configReporter.js
import { config } from "../framework/config/envConfig.js";

function buildConfigSummary() {
  const lines = [
    "",
    "[Config] Configuration Loaded:",
    `   Environment: ${config.env}`,
    `   Test Lane: ${config.retry?.lane || "default"}`,
    `   API Base URL: ${config.apiBaseUrl || "n/a"}`,
    `   Base URL: ${config.baseUrl || "n/a"}`,
    `   Request Timeout: ${config.timeout.request}ms`,
    `   Retries: ${config.retry?.retries}`,
    `   Workers: ${process.env.PLAYWRIGHT_WORKERS || "auto"}`,
    `   Debug Mode: ${config.debug.enabled}`,
  ];

  return lines.join("\n");
}

export default class ConfigReporter {
  onBegin() {
    if (!config.debug.enabled) return;
    console.log(buildConfigSummary());
  }
}
