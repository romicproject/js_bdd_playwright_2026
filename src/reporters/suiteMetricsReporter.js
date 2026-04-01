import fs from "node:fs";
import path from "node:path";
import { config } from "../framework/config/envConfig.js";

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function resolveProjectName(test, result) {
  return result?.projectName || test.titlePath?.()[1] || "unknown";
}

function buildTestKey(test, projectName) {
  return [
    projectName || "unknown",
    test.location?.file || "unknown",
    ...test.titlePath().slice(1),
  ].join(" :: ");
}

function summarizeAnnotations(annotations = []) {
  return annotations.map((annotation) => ({
    type: annotation.type,
    description: annotation.description || "",
  }));
}

function mergeAnnotations(...annotationSets) {
  const merged = [];
  const seen = new Set();

  for (const annotation of annotationSets.flat()) {
    const normalized = {
      type: annotation?.type || "unknown",
      description: annotation?.description || "",
    };
    const key = `${normalized.type}::${normalized.description}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(normalized);
  }

  return merged;
}

function formatTopRecords(records, limit = 10) {
  return records.slice(0, limit).map((record) => ({
    project: record.project,
    title: record.title,
    file: record.file,
    totalDurationMs: record.totalDurationMs,
    attempts: record.attempts.length,
    retries: record.retries,
    finalStatus: record.finalStatus,
    cleanup: record.cleanup,
  }));
}

export default class SuiteMetricsReporter {
  constructor() {
    this.records = new Map();
    this.runStartedAt = Date.now();
  }

  onBegin(configObj) {
    this.runStartedAt = Date.now();
    this.runMetadata = {
      env: config.env,
      lane: config.retry?.lane || process.env.TEST_LANE || "default",
      workers: configObj.workers,
      projects: (configObj.projects || []).map((project) => project.name),
    };
  }

  onTestEnd(test, result) {
    const projectName = resolveProjectName(test, result);
    const key = buildTestKey(test, projectName);
    const existing = this.records.get(key) || {
      key,
      project: projectName,
      title: test.title,
      titlePath: test.titlePath(),
      file: test.location?.file || "unknown",
      tags: test.tags || [],
      annotations: [],
      attempts: [],
    };

    existing.project = projectName;
    existing.annotations = mergeAnnotations(
      existing.annotations,
      summarizeAnnotations(test.annotations),
      summarizeAnnotations(result.annotations),
    );

    existing.attempts.push({
      retry: result.retry,
      status: result.status,
      durationMs: result.duration,
      errors: (result.errors || []).map(
        (error) => error.message || String(error),
      ),
    });

    this.records.set(key, existing);
  }

  async onEnd(fullResult) {
    const aggregated = [...this.records.values()].map((record) => {
      const attempts = [...record.attempts].sort((a, b) => a.retry - b.retry);
      const finalAttempt = attempts[attempts.length - 1];
      const retries = Math.max(
        0,
        ...attempts.map((attempt) => Number(attempt.retry) || 0),
      );
      const totalDurationMs = attempts.reduce(
        (sum, attempt) => sum + (attempt.durationMs || 0),
        0,
      );
      const cleanup = record.annotations.filter(
        (annotation) => annotation.type === "cleanup",
      );

      return {
        ...record,
        attempts,
        retries,
        totalDurationMs,
        finalStatus: finalAttempt?.status || "unknown",
        flaky:
          (finalAttempt?.status === "passed" ||
            finalAttempt?.status === "expected") &&
          attempts.some((attempt) => attempt.status !== finalAttempt?.status),
        cleanup,
      };
    });

    const totals = aggregated.reduce(
      (summary, record) => {
        summary.total += 1;
        summary[record.finalStatus] = (summary[record.finalStatus] || 0) + 1;
        if (record.flaky) summary.flaky += 1;
        if (record.retries > 0) summary.retried += 1;
        if (record.cleanup.length > 0) summary.cleanupAffected += 1;
        return summary;
      },
      {
        total: 0,
        passed: 0,
        failed: 0,
        timedOut: 0,
        skipped: 0,
        interrupted: 0,
        flaky: 0,
        retried: 0,
        cleanupAffected: 0,
      },
    );

    const topSlowTests = formatTopRecords(
      [...aggregated].sort((a, b) => b.totalDurationMs - a.totalDurationMs),
      10,
    );
    const flakyTests = formatTopRecords(
      aggregated.filter((record) => record.flaky),
      10,
    );
    const cleanupFailures = aggregated
      .filter((record) => record.cleanup.length > 0)
      .map((record) => ({
        project: record.project,
        title: record.title,
        cleanup: record.cleanup,
      }));

    const metrics = {
      generatedAt: new Date().toISOString(),
      runDurationMs: Date.now() - this.runStartedAt,
      status: fullResult.status,
      metadata: this.runMetadata,
      summary: totals,
      topSlowTests,
      flakyTests,
      cleanupFailures,
    };

    const outputFile = String(
      env("SUITE_METRICS_FILE", "out/test-results/suite-metrics.json"),
    );
    ensureDir(path.dirname(outputFile));
    fs.writeFileSync(outputFile, JSON.stringify(metrics, null, 2), "utf8");

    const summaryLine = [
      `[Metrics] lane=${metrics.metadata?.lane || "default"}`,
      `total=${metrics.summary.total}`,
      `passed=${metrics.summary.passed}`,
      `failed=${metrics.summary.failed}`,
      `flaky=${metrics.summary.flaky}`,
      `retried=${metrics.summary.retried}`,
      `cleanup=${metrics.summary.cleanupAffected}`,
    ].join(" ");

    console.log(summaryLine);

    if (topSlowTests.length > 0) {
      console.log("[Metrics] slowest tests:");
      topSlowTests.slice(0, 5).forEach((testRecord, index) => {
        console.log(
          `  ${index + 1}. ${testRecord.totalDurationMs}ms | ${testRecord.project} | ${testRecord.title}`,
        );
      });
    }
  }
}
