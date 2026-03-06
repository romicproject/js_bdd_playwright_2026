// fixtures/api/apiClient.js
import { expect } from '@playwright/test';
import {
  redactUrl,
  redactHeaders,
  redactBodyForLogs,
  limitBody
} from '../../framework/http/redact.js';
import { shouldLog, attachJson, getLogger } from './client/reporter.js';
import { joinUrl } from '../../framework/http/url.js';
import { hasHeader, isFormLike } from '../../framework/http/headers.js';

function envNum(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) ? n : fallback;
}

function safeJson(v) {
  try {
    return typeof v === 'string' ? v : JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

export function createApiClient(apiContext, testInfo) {
  const { request, config } = apiContext;
  const log = getLogger(apiContext);

  const MAX_BODY = envNum('LOG_API_MAX_BODY', 50_000);

  async function _makeRequest(method, url, options = {}) {
    const start = Date.now();
    const fullUrl = joinUrl(config.apiBaseUrl, url);
    const safeUrl = redactUrl(fullUrl);

    const {
      storeResponse = true,
      timeout = config.timeout?.request,
      ...requestOptions
    } = options;

    // normalize body -> data (Playwright uses `data`)
    if (method === 'GET') {
      delete requestOptions.data;
      delete requestOptions.body;
    } else if (requestOptions.body !== undefined && requestOptions.data === undefined) {
      requestOptions.data = requestOptions.body;
      delete requestOptions.body;
    }

    // headers: don't force JSON if caller set Content-Type or data is form-like
    const providedHeaders = requestOptions.headers || {};
    const callerHasContentType = hasHeader(providedHeaders, 'Content-Type');

    const shouldSetJsonContentType =
      method !== 'GET' && !callerHasContentType && !isFormLike(requestOptions.data);

    requestOptions.headers = {
      Accept: 'application/json',
      ...(shouldSetJsonContentType ? { 'Content-Type': 'application/json' } : {}),
      ...providedHeaders
    };

    requestOptions.timeout = timeout;

    apiContext.lastRequest = { method, url: fullUrl };
    apiContext.lastError = null;

    // snapshots (safe)
    const reqHeadersSnapshot = redactHeaders(requestOptions.headers);
    const reqBodySnapshot =
      requestOptions.data !== undefined && requestOptions.data !== null
        ? redactBodyForLogs(requestOptions.data, requestOptions.headers)
        : undefined;

    if (shouldLog()) {
      log.info(`→ ${method} ${safeUrl}`);
      if (reqBodySnapshot !== undefined) log.debug(`  Body: ${safeJson(reqBodySnapshot)}`);
    }

    let response;
    try {
      switch (method) {
        case 'GET':
          response = await request.get(fullUrl, requestOptions);
          break;
        case 'POST':
          response = await request.post(fullUrl, requestOptions);
          break;
        case 'PUT':
          response = await request.put(fullUrl, requestOptions);
          break;
        case 'DELETE':
          response = await request.delete(fullUrl, requestOptions);
          break;
        case 'PATCH':
          response = await request.patch(fullUrl, requestOptions);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    } catch (e) {
      apiContext.lastError = e;
      const duration = Date.now() - start;

      log.error(
        `✗✗✗ ${method} ${safeUrl} failed after ${duration}ms: ${String(e?.message || e)}`
      );

      await attachJson(testInfo, `api-exception-${method}.json`, {
        kind: 'exception',
        method,
        url: safeUrl,
        duration,
        request: { headers: reqHeadersSnapshot, body: reqBodySnapshot },
        error: String(e?.message || e)
      });

      throw new Error(`API request failed: ${method} ${safeUrl}`, { cause: e });
    }

    const httpStatus = response.status();
    const resHeaders = response.headers();

    let body;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    // accept numeric OR numeric-string
    const rawRc = body && typeof body === 'object' ? body.responseCode : undefined;
    const bodyResponseCode = Number.isFinite(Number(rawRc)) ? Number(rawRc) : undefined;

    const hasBodyCode = typeof bodyResponseCode === 'number';
    const effectiveStatus = hasBodyCode ? bodyResponseCode : httpStatus;

    const duration = Date.now() - start;

    const statusLog = hasBodyCode ? `${httpStatus} (body:${bodyResponseCode})` : `${httpStatus}`;

    // classify "HTTP ok but business code fail" as WARN (mixed fail)
    const isHttpOk = httpStatus >= 200 && httpStatus < 300;
    const isBodyOk = !hasBodyCode || (bodyResponseCode >= 200 && bodyResponseCode < 300);
    const isMixedFail = isHttpOk && hasBodyCode && !isBodyOk;

    if (shouldLog()) log.info(`← ${statusLog} (${duration}ms)`);

    const result = {
      status: httpStatus,
      bodyResponseCode,
      body,
      headers: resHeaders,
      ok: effectiveStatus >= 200 && effectiveStatus < 300,
      duration
    };

    if (!result.ok) {
      const failLog = isMixedFail ? log.warn : log.error;

      failLog(`API FAIL ${method} ${safeUrl} -> ${statusLog} (${duration}ms)`);

      await attachJson(testInfo, `api-fail-${method}-${httpStatus}.json`, {
        kind: isMixedFail ? 'business-fail' : 'http-fail',
        method,
        url: safeUrl,
        duration,
        httpStatus,
        bodyResponseCode,
        request: { headers: reqHeadersSnapshot, body: reqBodySnapshot },
        response: {
          headers: redactHeaders(resHeaders),
          body: limitBody(body, MAX_BODY, safeJson)
        }
      });
    }

    if (storeResponse) apiContext.response = result;
    return result;
  }

  async function healthCheck({ path = '/productsList' } = {}) {
    const res = await _makeRequest('GET', path, { storeResponse: true });
    expect(res.ok, `Health check failed for ${path}. Status: ${res.status}`).toBeTruthy();
    return res;
  }

  return {
    get: (url, options = {}) => _makeRequest('GET', url, options),
    post: (url, body = {}, options = {}) => _makeRequest('POST', url, { ...options, data: body }),
    put: (url, body = {}, options = {}) => _makeRequest('PUT', url, { ...options, data: body }),
    delete: (url, body = {}, options = {}) => _makeRequest('DELETE', url, { ...options, data: body }),
    patch: (url, body = {}, options = {}) => _makeRequest('PATCH', url, { ...options, data: body }),
    healthCheck
  };
}