import { getEffectiveStatus, getResponseMessage } from "./apiResponse.js";
import { joinUrl } from "./url.js";

export async function runApiPreflight({
  requestFactory,
  apiBaseUrl,
  endpoint = "/productsList",
  apiKey,
  timeout,
  ignoreHTTPSErrors = true,
}) {
  if (!requestFactory?.newContext) {
    throw new Error(
      "A Playwright request factory is required for API preflight",
    );
  }

  const fullUrl = joinUrl(apiBaseUrl, endpoint);
  const requestContext = await requestFactory.newContext({
    extraHTTPHeaders: {
      Accept: "application/json",
      ...(apiKey && { "X-API-Key": apiKey }),
    },
    ignoreHTTPSErrors,
  });

  try {
    const response = await requestContext.get(fullUrl, { timeout });

    let body;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    const preflightResult = {
      status: response.status(),
      body,
    };
    const effectiveStatus = getEffectiveStatus(preflightResult);

    if (effectiveStatus >= 200 && effectiveStatus < 300) {
      return {
        ok: true,
        checkedUrl: fullUrl,
        effectiveStatus,
      };
    }

    throw new Error(
      `API preflight failed for ${fullUrl}. http=${response.status()} effective=${effectiveStatus} message="${getResponseMessage(preflightResult)}"`,
    );
  } finally {
    await requestContext.dispose();
  }
}
