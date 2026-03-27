import {
  createLogger,
  getAttachAllureEnabled,
} from "../../framework/logging/logger.js";
import {
  buildTestLogPath,
  inferFeatureFromTestInfo,
} from "../../logging/paths.js";

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

export function startTestLogging(testInfo, { kind }) {
  const feature = inferFeatureFromTestInfo(testInfo);
  const projectName = testInfo.project?.name || "";
  const baseDir = String(env("LOG_DIR", "logs"));

  const logFilePath = buildTestLogPath({
    baseDir,
    kind,
    feature,
    testTitle: testInfo.title,
  });

  const logger = createLogger({
    filePath: logFilePath,
    testId: testInfo.testId,
  });

  testInfo.annotations.push({
    type: "feature",
    description: feature,
  });
  testInfo.annotations.push({
    type: "log-file",
    description: logFilePath,
  });
  testInfo.annotations.push({
    type: "project",
    description: projectName || "unknown",
  });

  return {
    feature,
    logFilePath,
    logger,
    async attachExecutionLog() {
      if (getAttachAllureEnabled()) {
        await testInfo.attach("execution.log", {
          path: logFilePath,
          contentType: "text/plain",
        });
      }
    },
  };
}
