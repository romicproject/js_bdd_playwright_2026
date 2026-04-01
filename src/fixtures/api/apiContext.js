// fixtures/api/apiContext.js
export function createApiContext(request, config) {
  const defaultMockProfile = config?.apiMock?.profile || "";
  const USER_STATE_KEYS = ["created", "existing", "saved"];

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
        cleanup: [],
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

      if (value.includes("{timestamp}")) {
        const uniqueId = this.getScenarioUniqueId() ?? String(Date.now());
        return value.replaceAll("{timestamp}", uniqueId);
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
        throw new Error(`Unknown apiContext user state: ${key}`);
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

    trackCleanupUser(email, password) {
      if (!email || !password) return;

      const alreadyTracked = this.getCleanupUsers().some(
        (user) => user.email === email && user.password === password,
      );

      if (!alreadyTracked) {
        this.getCleanupUsers().push({ email, password });
      }
    },

    untrackCleanupUser(email) {
      if (!email) return;
      this.state.users.cleanup = this.state.users.cleanup.filter(
        (user) => user.email !== email,
      );
    },

    reset() {
      this.response = null;
      this.setLastRequest(null);
      this.clearLastError();

      this.clearUser("created");
      this.clearUser("existing");
      this.clearUser("saved");
      this.state.users.cleanup = [];

      this.mock.enabled = Boolean(this.config?.apiMock?.enabled);
      this.mock.profile = this.config?.apiMock?.profile || "";

      // keep scenario timestamp stable for scenario; do not reset here
    },
  };

  const aliases = {
    lastRequest: {
      get: () => context.state.diagnostics.lastRequest,
      set: (value) => {
        context.state.diagnostics.lastRequest = value;
      },
    },
    lastError: {
      get: () => context.state.diagnostics.lastError,
      set: (value) => {
        context.state.diagnostics.lastError = value;
      },
    },
    createdUserEmail: {
      get: () => context.state.users.created.email,
      set: (value) => {
        context.state.users.created.email = value;
      },
    },
    createdUserPassword: {
      get: () => context.state.users.created.password,
      set: (value) => {
        context.state.users.created.password = value;
      },
    },
    existingUserEmail: {
      get: () => context.state.users.existing.email,
      set: (value) => {
        context.state.users.existing.email = value;
      },
    },
    existingUserPassword: {
      get: () => context.state.users.existing.password,
      set: (value) => {
        context.state.users.existing.password = value;
      },
    },
    savedUserEmail: {
      get: () => context.state.users.saved.email,
      set: (value) => {
        context.state.users.saved.email = value;
      },
    },
    savedUserPassword: {
      get: () => context.state.users.saved.password,
      set: (value) => {
        context.state.users.saved.password = value;
      },
    },
    cleanupUsers: {
      get: () => context.state.users.cleanup,
      set: (value) => {
        context.state.users.cleanup = Array.isArray(value) ? value : [];
      },
    },
    scenarioTimestamp: {
      get: () => context.state.scenario.timestamp,
      set: (value) => {
        context.state.scenario.timestamp = value;
      },
    },
    scenarioUniqueId: {
      get: () => context.state.scenario.uniqueId,
      set: (value) => {
        context.state.scenario.uniqueId = value;
      },
    },
    startTime: {
      get: () => context.state.scenario.startTime,
      set: (value) => {
        context.state.scenario.startTime = value;
      },
    },
    logger: {
      get: () => context.state.logs.logger,
      set: (value) => {
        context.state.logs.logger = value;
      },
    },
    logFilePath: {
      get: () => context.state.logs.logFilePath,
      set: (value) => {
        context.state.logs.logFilePath = value;
      },
    },
  };

  Object.defineProperties(
    context,
    Object.fromEntries(
      Object.entries(aliases).map(([key, accessors]) => [
        key,
        {
          enumerable: true,
          configurable: true,
          get: accessors.get,
          set: accessors.set,
        },
      ]),
    ),
  );

  return context;
}
