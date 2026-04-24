import crypto from "node:crypto";

export const DEFAULT_USER_FIELDS = {
  name: "Test User",
  title: "Mr",
  birth_date: "1",
  birth_month: "1",
  birth_year: "1990",
  firstname: "Test",
  lastname: "User",
  company: "Test Company",
  address1: "123 Test St",
  country: "United States",
  zipcode: "12345",
  state: "Test State",
  city: "Test City",
};

function generateMobileNumber() {
  // 10 digits total, starting with "5" to stay in a clearly-fake range.
  const suffix = crypto.randomInt(100_000_000, 1_000_000_000);
  return `5${suffix}`;
}

function env(name, fallback) {
  return process.env[name] ?? fallback;
}

function sanitizeIdPart(value, fallback = "na") {
  const normalized = String(value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-_]+|[-_]+$/g, "")
    .slice(0, 24);

  return normalized || fallback;
}

function toIndex(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function randomIdPart(length = 8) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

export function buildScenarioUniqueId(identity = {}) {
  const timestamp = toIndex(identity.timestamp, Date.now());
  const runId = sanitizeIdPart(identity.runId ?? env("LOG_RUN_ID", "local"));
  const workerIndex = toIndex(identity.workerIndex, 0);
  const parallelIndex = toIndex(identity.parallelIndex, 0);
  const retry = toIndex(identity.retry, 0);
  const random = sanitizeIdPart(identity.random ?? randomIdPart(), "rand");

  return [
    runId,
    `w${workerIndex}`,
    `p${parallelIndex}`,
    `r${retry}`,
    String(timestamp),
    random,
  ].join("-");
}

export function buildTrackedUserRecord(user = {}) {
  return {
    email: String(user.email ?? "").trim(),
    password: String(user.password ?? ""),
  };
}

export function buildUserPayload(overrides = {}) {
  return {
    ...DEFAULT_USER_FIELDS,
    mobile_number: generateMobileNumber(),
    ...overrides,
  };
}
