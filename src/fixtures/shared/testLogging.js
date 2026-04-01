import {
  createLogger,
  getAttachAllureEnabled,
  isDebugLoggingEnabled,
} from "../../framework/logging/logger.js";
import {
  buildTestLogPath,
  inferFeatureFromTestInfo,
} from "../../logging/paths.js";

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

function shouldAttachExecutionLog(testInfo) {
  if (!getAttachAllureEnabled()) {
    return false;
  }

  if (isDebugLoggingEnabled()) {
    return true;
  }

  const attachMode = String(env("LOG_ATTACH_MODE", "fail")).toLowerCase();
  if (attachMode === "always") {
    return true;
  }

  if (attachMode === "never") {
    return false;
  }

  if ((testInfo.retry ?? 0) > 0) {
    return true;
  }

  return testInfo.status !== testInfo.expectedStatus;
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
      await logger.close?.();

      if (shouldAttachExecutionLog(testInfo)) {
        await testInfo.attach("execution.log", {
          path: logFilePath,
          contentType: "text/plain",
        });
      }
    },
  };
}
