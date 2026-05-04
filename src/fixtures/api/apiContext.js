// fixtures/api/apiContext.js
import { UserCleanupRegistry } from "../../support/shared/cleanupTracking.js";

export function createApiContext(request, config) {
  const defaultMockProfile = config?.apiMock?.profile || "";
  const USER_STATE_KEYS = ["created", "existing", "saved"];
  const cleanupRegistry = new UserCleanupRegistry();

  const context = {
    request,
    config,

    // Last "main" response (stored by apiClient unless storeResponse:false)
    response: null,

    state: {
      diagnostics: {
        lastRequest: null,
        lastError: null,
      },
      users: {
        created: {
          email: null,
          password: null,
        },
        existing: {
          email: null,
          password: null,
        },
        saved: {
          email: null,
          password: null,
        },
      },
      scenario: {
        timestamp: null,
        uniqueId: null,
        startTime: null,
      },
      logs: {
        logger: null,
        logFilePath: null,
      },
    },

    // API mock controls (per scenario)
    mock: {
      enabled: Boolean(config?.apiMock?.enabled),
      profile: defaultMockProfile,
    },

    resolveTemplate(value) {
      if (value === null || value === undefined) return value;

      if (typeof value !== "string") return value;

      if (value.includes("{unique}")) {
        const uniqueId = this.getScenarioUniqueId() ?? String(Date.now());
        return value.replaceAll("{unique}", uniqueId);
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

    getUser(key) {
      const user = this.state.users[key];
      if (!user || !USER_STATE_KEYS.includes(key)) {
        throw new Error(`[API_FIXTURE] Unknown user state key: ${key} (valid: ${USER_STATE_KEYS.join(", ")})`);
      }
      return user;
    },

    updateUser(key, updates = {}) {
      const user = this.getUser(key);

      if (Object.hasOwn(updates, "email")) {
        user.email = updates.email ?? null;
      }

      if (Object.hasOwn(updates, "password")) {
        user.password = updates.password ?? null;
      }

      return user;
    },

    clearUser(key) {
      return this.updateUser(key, {
        email: null,
        password: null,
      });
    },

    getCleanupUsers() {
      return this.state.users.cleanup;
    },

    getLastRequest() {
      return this.state.diagnostics.lastRequest;
    },

    setLastRequest(lastRequest) {
      this.state.diagnostics.lastRequest = lastRequest;
    },

    getLastError() {
      return this.state.diagnostics.lastError;
    },

    setLastError(lastError) {
      this.state.diagnostics.lastError = lastError;
    },

    clearLastError() {
      this.state.diagnostics.lastError = null;
    },

    getScenarioTimestamp() {
      return this.state.scenario.timestamp;
    },

    setScenarioTimestamp(timestamp) {
      this.state.scenario.timestamp = timestamp;
    },

    getScenarioUniqueId() {
      return this.state.scenario.uniqueId;
    },

    setScenarioUniqueId(uniqueId) {
      this.state.scenario.uniqueId = uniqueId;
    },

    getScenarioStartTime() {
      return this.state.scenario.startTime;
    },

    setScenarioStartTime(startTime) {
      this.state.scenario.startTime = startTime;
    },

    getLogger() {
      return this.state.logs.logger;
    },

    setLogger(logger) {
      this.state.logs.logger = logger;
    },

    getLogFilePath() {
      return this.state.logs.logFilePath;
    },

    setLogFilePath(logFilePath) {
      this.state.logs.logFilePath = logFilePath;
    },

    getCleanupUsers() {
      return cleanupRegistry.getAll();
    },

    trackCleanupUser(email, password) {
      cleanupRegistry.track(email, password, "api");
      this.getLogger()?.debug("[API] User cleanup tracked", { email });
    },

    untrackCleanupUser(email) {
      cleanupRegistry.untrack(email, "api");
      this.getLogger()?.debug("[API] User cleanup untracked", { email });
    },

    _getCleanupRegistry() {
      return cleanupRegistry;
    },

    // The context is created per test, so explicit reset/legacy alias support
    // is no longer needed as part of the public surface.
  };

  // Inject logger reference into registry after context creation
  context.setLogger = (logger) => {
    context.state.logs.logger = logger;
    cleanupRegistry.logger = logger;
  };

  return context;
}
