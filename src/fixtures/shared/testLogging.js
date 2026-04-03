import fs from "node:fs/promises";
import path from "node:path";
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

function didTestNeedDiagnostics(testInfo) {
  const expectedStatus = testInfo.expectedStatus || "passed";
  const actualStatus = testInfo.status || expectedStatus;

  if ((testInfo.errors?.length ?? 0) > 0) {
    return true;
  }

  return actualStatus !== expectedStatus;
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

  return didTestNeedDiagnostics(testInfo);
}

function shouldKeepExecutionLog(testInfo) {
  if (isDebugLoggingEnabled()) {
    return true;
  }

  const keepMode = String(env("LOG_KEEP_MODE", "fail")).toLowerCase();
  if (keepMode === "always") {
    return true;
  }

  if (keepMode === "never") {
    return false;
  }

  if ((testInfo.retry ?? 0) > 0) {
    return true;
  }

  return didTestNeedDiagnostics(testInfo);
}

async function removeFileAndEmptyParents(filePath, rootDir) {
  try {
    await fs.rm(filePath, { force: true });
  } catch {}

  const resolvedRoot = path.resolve(rootDir);
  let currentDir = path.resolve(path.dirname(filePath));

  while (
    currentDir.startsWith(resolvedRoot) &&
    currentDir !== resolvedRoot &&
    currentDir !== path.dirname(currentDir)
  ) {
    try {
      await fs.rmdir(currentDir);
    } catch {
      break;
    }

    currentDir = path.dirname(currentDir);
  }
}

export function startTestLogging(testInfo, { kind }) {
  const feature = inferFeatureFromTestInfo(testInfo);
  const projectName = testInfo.project?.name || "";
  const baseDir = String(env("LOG_DIR", "out/logs"));

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

      if (!shouldKeepExecutionLog(testInfo)) {
        await removeFileAndEmptyParents(logFilePath, baseDir);
      }
    },
  };
}
