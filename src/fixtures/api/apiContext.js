// fixtures/api/apiContext.js
export function createApiContext(request, config) {
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

    // Stable timestamp per scenario (set once in api.fixtures.js)
    scenarioTimestamp: null,

    // Search context
    searchTerm: null,

    // Created entities (optional)
    createdUsers: [],
    createdProducts: [],

    // Test metadata
    startTime: null,
    scenarioName: null,

    resolveTemplate(value) {
      if (value === null || value === undefined) return value;

      if (typeof value !== 'string') return value;

      if (value.includes('{timestamp}')) {
        const ts = this.scenarioTimestamp ?? Date.now();
        return value.replaceAll('{timestamp}', String(ts));
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
      if (input && typeof input === 'object' && typeof input.rowsHash === 'function') {
        input = input.rowsHash();
      }

      const rowsHash = input || {};
      const out = {};

      for (const [key, rawVal] of Object.entries(rowsHash)) {
        out[key] = this.resolveTemplate(rawVal);
      }

      return out;
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

      // keep scenarioTimestamp stable for scenario; do not reset here
      this.searchTerm = null;

      this.createdUsers = [];
      this.createdProducts = [];
    },

    addCreatedUser(email, password) {
      this.createdUsers.push({ email, password });
    },

    getLastCreatedUser() {
      return this.createdUsers[this.createdUsers.length - 1];
    },

    markSavedUser(email, password) {
      this.savedUserEmail = email;
      this.savedUserPassword = password;
    },

    getSavedUser() {
      if (!this.savedUserEmail) return null;
      return { email: this.savedUserEmail, password: this.savedUserPassword };
    }
  };
}
