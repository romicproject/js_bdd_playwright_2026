// reporters/configReporter.js
import { config } from "../framework/config/envConfig.js";

function buildConfigSummary() {
  return (
    `\n[Config] Configuration Loaded:\n` +
    `   Environment: ${config.env}\n` +
    `   Test Lane: ${config.retry?.lane || "default"}\n` +
    `   API Base URL: ${config.apiBaseUrl}\n` +
    `   Request Timeout: ${config.timeout.request}ms\n` +
    `   Retries: ${config.retry?.retries}\n` +
    `   Debug Mode: ${config.debug.enabled}\n`
  );
}

export default class ConfigReporter {
  onBegin() {
    if (!config.debug.enabled) return;
    console.log(buildConfigSummary());
  }
}
