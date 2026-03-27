// fixtures/api/apiContext.js
export function createApiContext(request, config) {
  const defaultMockProfile = config?.apiMock?.profile || "";

  return {
    request,
    config,

    // Last "main" response (stored by apiClient unless storeResponse:false)
    response: null,

    // Diagnostics
    lastRequest: null,
    lastError: null,

    // User management
    createdUserEmail: null,
    createdUserPassword: null,
    existingUserEmail: null,
    existingUserPassword: null,
    savedUserEmail: null,
    savedUserPassword: null,
    cleanupUsers: [],

    // Stable timestamp per scenario (set once in api.fixtures.js)
    scenarioTimestamp: null,

    // Test metadata
    startTime: null,
    scenarioName: null,

    // API mock controls (per scenario)
    mock: {
      enabled: Boolean(config?.apiMock?.enabled),
      profile: defaultMockProfile,
    },

    resolveTemplate(value) {
      if (value === null || value === undefined) return value;

      if (typeof value !== "string") return value;

      if (value.includes("{timestamp}")) {
        const ts = this.scenarioTimestamp ?? Date.now();
        return value.replaceAll("{timestamp}", String(ts));
      }

      return value;
    },

    /**
     * Resolve a DataTable OR a plain object (rowsHash).
     *
     * Accepts:
     *  - playwright-bdd DataTable: resolveDataTable(dataTable)
     *  - already-extracted object: resolveDataTable(dataTable.rowsHash())
     */
    resolveDataTable(dataTableOrRowsHash) {
      let input = dataTableOrRowsHash;

      // If it's a playwright-bdd DataTable, it typically has rowsHash()
      if (
        input &&
        typeof input === "object" &&
        typeof input.rowsHash === "function"
      ) {
        input = input.rowsHash();
      }

      const rowsHash = input || {};
      const out = {};

      for (const [key, rawVal] of Object.entries(rowsHash)) {
        out[key] = this.resolveTemplate(rawVal);
      }

      return out;
    },

    trackCleanupUser(email, password) {
      if (!email || !password) return;

      const alreadyTracked = this.cleanupUsers.some(
        (user) => user.email === email && user.password === password,
      );

      if (!alreadyTracked) {
        this.cleanupUsers.push({ email, password });
      }
    },

    untrackCleanupUser(email) {
      if (!email) return;
      this.cleanupUsers = this.cleanupUsers.filter(
        (user) => user.email !== email,
      );
    },

    reset() {
      this.response = null;
      this.lastRequest = null;
      this.lastError = null;

      this.createdUserEmail = null;
      this.createdUserPassword = null;
      this.existingUserEmail = null;
      this.existingUserPassword = null;
      this.savedUserEmail = null;
      this.savedUserPassword = null;
      this.cleanupUsers = [];

      this.mock.enabled = Boolean(this.config?.apiMock?.enabled);
      this.mock.profile = this.config?.apiMock?.profile || "";

      // keep scenarioTimestamp stable for scenario; do not reset here
    },
  };
}
