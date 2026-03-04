// logging/paths.js
import path from 'node:path';

function sanitize(s) {
  return String(s)
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 140);
}

function yyyymmdd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getRunId() {
  return process.env.LOG_RUN_ID || 'no-run-id';
}

export function buildTestLogPath({ baseDir, kind, feature, testTitle }) {
  const date = yyyymmdd();
  const runId = getRunId();

  return path.join(
    baseDir,
    date,
    runId,                // NEW: time folder per execution
    sanitize(kind),
    sanitize(feature),
    `${sanitize(testTitle)}.log`
  );
}

export function inferFeatureFromTestInfo(testInfo) {
  const file = testInfo.file || testInfo.location?.file || 'unknown.spec.js';
  return path.basename(file, path.extname(file));
}
