/**
 * Framework-level utility functions
 */
import fs from "node:fs";

/**
 * Ensure a directory exists (creates recursively if needed)
 * @param {string} dir - Directory path to ensure
 */
export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
