const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'pwd',
  'token',
  'api_key',
  'apikey',
  'authorization',
  'email'
]);

const REDACT_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key'
]);

export function getHeaderValue(headers, headerName) {
  for (const [k, v] of Object.entries(headers || {})) {
    if (String(k).toLowerCase() === String(headerName).toLowerCase()) return String(v);
  }
  return '';
}

export function redactUrl(fullUrl) {
  try {
    const u = new URL(fullUrl);
    for (const key of u.searchParams.keys()) {
      if (SENSITIVE_KEYS.has(String(key).toLowerCase())) {
        u.searchParams.set(key, '***');
      }
    }
    return u.toString();
  } catch (e) {
    return fullUrl;
  }
}

export function redactHeaders(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers || {})) {
    out[k] = REDACT_HEADERS.has(String(k).toLowerCase()) ? '***' : v;
  }
  return out;
}

// minimal: only shallow object redaction
export function redactBodyShallow(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return data;
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = SENSITIVE_KEYS.has(String(k).toLowerCase()) ? '***' : v;
  }
  return out;
}

function redactFormEncodedString(s) {
  try {
    const params = new URLSearchParams(String(s));
    for (const key of params.keys()) {
      if (SENSITIVE_KEYS.has(String(key).toLowerCase())) params.set(key, '***');
    }
    return params.toString();
  } catch (e) {
    return String(s);
  }
}

function redactFormParams(params) {
  const out = new URLSearchParams(params);
  for (const key of out.keys()) {
    if (SENSITIVE_KEYS.has(String(key).toLowerCase())) out.set(key, '***');
  }
  return out;
}

export function redactBodyForLogs(data, headers) {
  if (data instanceof URLSearchParams) return redactFormParams(data).toString();

  if (typeof data === 'string') {
    const ct = getHeaderValue(headers, 'Content-Type');
    if (/application\/x-www-form-urlencoded/i.test(ct)) {
      return redactFormEncodedString(data);
    }
    return data;
  }

  return redactBodyShallow(data);
}

export function limitBody(body, maxLen, safeJson) {
  const s = typeof body === 'string' ? body : safeJson(body);
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}\n… [TRUNCATED ${s.length - maxLen} chars]`;
}