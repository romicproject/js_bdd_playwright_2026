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
  mobile_number: "1234567890",
};

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

export function buildScenarioEmail(
  prefix = "api.user",
  identity = {},
  domain = "test.com",
) {
  const safePrefix = sanitizeIdPart(prefix, "user");
  const safeDomain = String(domain || "test.com")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();

  return `${safePrefix}.${buildScenarioUniqueId(identity)}@${safeDomain}`;
}

export function buildScenarioPhoneNumber(identity = {}) {
  const uniqueId = buildScenarioUniqueId(identity).replace(/[^0-9]/g, "");
  const digits = `${uniqueId}1234567`.slice(0, 7);
  return `555${digits}`;
}

export function buildUserCredentials(email, password) {
  return {
    email: String(email ?? "").trim(),
    password: String(password ?? ""),
  };
}

export function buildTrackedUserRecord(user = {}) {
  return {
    email: String(user.email ?? "").trim(),
    password: String(user.password ?? ""),
  };
}

export function buildScenarioUser(options = {}) {
  const {
    identity = {},
    emailPrefix = "api.user",
    emailDomain = "test.com",
    password = "Test123!",
    overrides = {},
  } = options;

  const email =
    overrides.email ?? buildScenarioEmail(emailPrefix, identity, emailDomain);

  return buildUserPayload({
    ...buildUserCredentials(email, password),
    ...overrides,
  });
}

export function buildUserPayload(overrides = {}) {
  return {
    ...DEFAULT_USER_FIELDS,
    ...overrides,
  };
}
