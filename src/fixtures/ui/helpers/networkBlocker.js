// src/fixtures/ui/helpers/networkBlocker.js
import { getEnv, parseBoolean } from "../../../framework/env.js";

function getDefaultAllowedHosts() {
  const baseUrl = getEnv("BASE_URL", "");

  try {
    return [new URL(baseUrl).hostname];
  } catch {
    return [];
  }
}

const DEFAULT_AD_HOST_PATTERNS = [
  /doubleclick\.net/i,
  /googlesyndication\.com/i,
  /googleadservices\.com/i,
  /googletagmanager\.com/i,
  /googletagservices\.com/i,
  /adservice\.google\./i,
  /adsystem\.com/i,
  /facebook\.net/i,
  /scorecardresearch\.com/i,
  /taboola\.com/i,
  /outbrain\.com/i,
  /criteo/i,
];

function shouldBlockByHost(urlStr, allowedHostsSet, patterns) {
  let url;
  try {
    url = new URL(urlStr);
  } catch {
    return false;
  }

  const host = url.hostname;

  if (allowedHostsSet.has(host)) return false;
  return patterns.some((re) => re.test(host));
}

/**
 * Attaches network blocking routes to a BrowserContext.
 * Keep this pure-ish: no testInfo, no logger dependencies.
 */
export async function applyNetworkBlocking(context, options = {}) {
  const enabled = options.enabled ?? parseBoolean(getEnv("UI_BLOCK_ADS", "true"));
  const blockResources =
    options.blockResources ?? parseBoolean(getEnv("UI_BLOCK_RESOURCES", "false"));

  if (!enabled && !blockResources)
    return { enabled: false, blockResources: false };

  const allowedHosts = new Set(
    options.allowedHosts ?? getDefaultAllowedHosts(),
  );
  const adHostPatterns = options.adHostPatterns ?? DEFAULT_AD_HOST_PATTERNS;

  await context.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();

    if (enabled && shouldBlockByHost(url, allowedHosts, adHostPatterns)) {
      await route.abort();
      return;
    }

    if (blockResources) {
      const rt = req.resourceType();
      if (rt === "font" || rt === "media") {
        await route.abort();
        return;
      }
      // optional (caution: may break UI):
      // if (rt === 'image' || rt === 'stylesheet') { await route.abort(); return; }
    }

    await route.continue();
  });

  return { enabled, blockResources };
}
