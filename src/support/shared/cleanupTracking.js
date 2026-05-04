/**
 * Shared user cleanup tracking registry
 * Single source of truth for tracking users that need to be deleted across API and UI tests
 */
export class UserCleanupRegistry {
  constructor(logger = null) {
    this.logger = logger;
    this.users = [];
  }

  /**
   * Track a user for cleanup
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} source - Origin context (e.g., "api", "ui") for logging
   */
  track(email, password, source = "unknown") {
    if (!email || !password) {
      this.logger?.debug(
        "[UserCleanupRegistry] Skipping track: missing email or password",
        {
          email,
          source,
        },
      );
      return;
    }

    const alreadyTracked = this.users.some(
      (user) => user.email === email && user.password === password,
    );

    if (!alreadyTracked) {
      this.users.push({ email, password, source, trackedAt: new Date() });
      this.logger?.debug("[UserCleanupRegistry] User tracked", {
        email,
        source,
        totalTracked: this.users.length,
      });
    }
  }

  /**
   * Untrack a user by email
   * @param {string} email - User email
   * @param {string} source - Origin context (e.g., "api", "ui") for logging
   */
  untrack(email, source = "unknown") {
    if (!email) return;

    const before = this.users.length;
    this.users = this.users.filter((user) => user.email !== email);
    const after = this.users.length;

    if (before > after) {
      this.logger?.debug("[UserCleanupRegistry] User untracked", {
        email,
        source,
        remainingTracked: after,
      });
    }
  }

  /**
   * Get all tracked users (for cleanup operations)
   * @returns {Array} Array of tracked user objects
   */
  getAll() {
    return [...this.users];
  }

  /**
   * Clear all tracked users (reset state)
   */
  clear() {
    const count = this.users.length;
    this.users = [];
    if (count > 0) {
      this.logger?.debug("[UserCleanupRegistry] Registry cleared", {
        cleared: count,
      });
    }
  }

  /**
   * Get count of tracked users
   * @returns {number}
   */
  count() {
    return this.users.length;
  }

  /**
   * Check if user is tracked
   * @param {string} email
   * @returns {boolean}
   */
  isTracked(email) {
    return this.users.some((user) => user.email === email);
  }
}
