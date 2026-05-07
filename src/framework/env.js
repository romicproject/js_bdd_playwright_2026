/**
 * Centralized environment variable helpers.
 * Single source of truth for reading env vars across the framework.
 */

/**
 * Get string environment variable with fallback.
 * @param {string} name - Environment variable name
 * @param {string} fallback - Default value if not set
 * @returns {string}
 */
export function getEnv(name, fallback = "") {
  return process.env[name] ?? fallback;
}

/**
 * Get numeric environment variable with fallback.
 * Returns fallback if value is not a finite number.
 * @param {string} name - Environment variable name
 * @param {number} fallback - Default value if not set or invalid
 * @returns {number}
 */
export function getEnvNumber(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Parse environment variable as boolean.
 * Returns true for: "true", "1"
 * Returns false for everything else.
 * @param {string|number} value - Value to parse
 * @returns {boolean}
 */
export function parseBoolean(value) {
  return value === "true" || value === "1";
}
