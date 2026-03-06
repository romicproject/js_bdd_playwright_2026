import fs from 'node:fs';
import path from 'node:path';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

function toBool(v, fallback) {
  if (v == null) return fallback;
  return String(v).toLowerCase() === 'true';
}

function shouldColor() {
  const mode = String(env('LOG_COLOR', 'auto')).toLowerCase();
  if (mode === 'true') return true;
  if (mode === 'false') return false;
  const isCI = Boolean(process.env.CI);
  return Boolean(process.stdout.isTTY) && !isCI;
}

function colorize(level, s) {
  if (!shouldColor()) return s;

  const reset = '\x1b[0m';
  const bold = '\x1b[1m';

  const red = '\x1b[31m';
  const green = '\x1b[32m';
  const cyan = '\x1b[36m';

  if (level === 'error') return `${bold}${red}${s}${reset}`;
  if (level === 'warn') return `${red}${s}${reset}`;
  if (level === 'info') return `${green}${s}${reset}`;
  return `${cyan}${s}${reset}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function getAttachAllureEnabled() {
  return toBool(env('LOG_ATTACH_ALLURE', 'true'), true);
}

function shouldConsole() {
  return toBool(env('LOG_CONSOLE', 'true'), true);
}

function consoleMinLevel() {
  const levelName = String(env('LOG_CONSOLE_LEVEL', 'info')).toLowerCase();
  return LEVELS[levelName] ?? LEVELS.info;
}

export function createLogger({ filePath, testId }) {
  const levelName = String(env('LOG_LEVEL', 'info')).toLowerCase();
  const minLevel = LEVELS[levelName] ?? LEVELS.info;

  // Avoid confusion:
  // - LOG_LEVEL controls what gets recorded (file + eligible for console)
  // - LOG_CONSOLE_LEVEL controls what gets displayed
  // Display threshold can never be lower than record threshold.
  const consoleThreshold = Math.max(minLevel, consoleMinLevel());

  const fmt = String(env('LOG_FORMAT', 'pretty')).toLowerCase();
  const formatLine =
    fmt === 'jsonl'
      ? (rec) => JSON.stringify(rec)
      : (rec) =>
          `${rec.ts} [${rec.level.toUpperCase()}] ${rec.msg}${
            rec.meta ? ` ${safe(rec.meta)}` : ''
          }`;

  if (filePath) ensureDir(path.dirname(filePath));

  function write(line) {
    if (!filePath) return;
    fs.appendFileSync(filePath, `${line}\n`, 'utf8');
  }

  function log(level, msg, meta) {
    if ((LEVELS[level] ?? 999) < minLevel) return;

    const rec = {
      ts: nowLocal(),
      level,
      testId,
      msg,
      ...(meta ? { meta } : {})
    };

    if (shouldConsole() && (LEVELS[level] ?? 999) >= consoleThreshold) {
      const prefix = `[${rec.level.toUpperCase()}]`;
      const consoleLine = `${colorize(level, prefix)} ${msg}`;

      if (level === 'error') console.error(consoleLine);
      else if (level === 'warn') console.warn(consoleLine);
      else console.log(consoleLine);
    }

    write(formatLine(rec));
  }

  return {
    debug: (m, meta) => log('debug', m, meta),
    info: (m, meta) => log('info', m, meta),
    warn: (m, meta) => log('warn', m, meta),
    error: (m, meta) => log('error', m, meta)
  };
}

function safe(v) {
  try {
    return typeof v === 'string' ? v : JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function nowLocal(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `${y}-${m}-${day}T${hh}:${mm}:${ss}.${ms}`;
}