export function getEffectiveStatus(res) {
  const body = res?.body || {};
  const hasBodyCode =
    body && typeof body === "object" && typeof body.responseCode === "number";

  return hasBodyCode ? body.responseCode : res?.status;
}

export function getResponseMessage(res) {
  const body = res?.body || {};
  const msg = body?.message ?? body?.responseMessage ?? body?.response_message;
  return String(msg ?? "");
}