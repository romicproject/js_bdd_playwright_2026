import { defineConfig } from "allure";
import { config as envConfig } from "./src/framework/config/envConfig.js";
import { buildAllureEnvironmentInfo } from "./src/reporters/allureConfig.js";

export default defineConfig({
  name: "BDD Playwright Allure Report",
  output: "./out/allure-report",
  historyPath: "./out/allure-history/history.jsonl",
  appendHistory: true,
  variables: buildAllureEnvironmentInfo(envConfig),
});
