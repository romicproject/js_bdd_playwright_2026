import { resolvePerfConfig } from '../config/targets.js';

function toFormBody(fields) {
  return new URLSearchParams(fields).toString();
}

export function setRunContext(userContext, events, done) {
  const cfg = resolvePerfConfig();

  userContext.vars.env = cfg.env;
  userContext.vars.targetApi = cfg.targetApi;
  userContext.vars.targetUi = cfg.targetUi;
  userContext.vars.endpointProductsList = cfg.endpoints.productsList;
  userContext.vars.endpointSearchProduct = cfg.endpoints.searchProduct;
  userContext.vars.endpointVerifyLogin = cfg.endpoints.verifyLogin;

  events.emit('counter', 'perf.context.ready', 1);
  done();
}

export function buildSearchBody(userContext, events, done) {
  const searchTerm = userContext.vars.search_term || 'top';
  userContext.vars.searchBody = toFormBody({ search_product: searchTerm });
  done();
}

export function buildLoginBody(userContext, events, done) {
  const email = userContext.vars.email || process.env.TEST_USER_EMAIL || 'change_me_local@example.com';
  const password = userContext.vars.password || process.env.TEST_USER_PASSWORD || 'CHANGE_ME_LOCAL';

  userContext.vars.loginBody = toFormBody({ email, password });
  done();
}

export function metricsByEndpoint_beforeRequest(requestParams, userContext, events, done) {
  userContext.vars.__perfStartTs = Date.now();
  done();
}

export function metricsByEndpoint_afterResponse(requestParams, response, userContext, events, done) {
  const requestUrl =
    requestParams?.url ||
    requestParams?.uri ||
    response?.request?.path ||
    'unknown';

  const durationMs = userContext.vars.__perfStartTs
    ? Date.now() - userContext.vars.__perfStartTs
    : undefined;

  events.emit('counter', `perf.endpoint.hit.${requestUrl}`, 1);

  if (typeof durationMs === 'number') {
    events.emit('histogram', `perf.endpoint.latency_ms.${requestUrl}`, durationMs);
  }

  done();
}
