export function resolvePerfConfig() {
  const env = process.env.ENV || 'dev';

  const knownTargets = {
    dev: {
      name: 'dev',
      apiBaseUrl: process.env.API_BASE_URL || 'https://automationexercise.com/api',
      uiBaseUrl: process.env.BASE_URL || 'https://automationexercise.com'
    },
    staging: {
      name: 'staging',
      apiBaseUrl: process.env.API_BASE_URL || 'https://automationexercise.com/api',
      uiBaseUrl: process.env.BASE_URL || 'https://automationexercise.com'
    },
    prod: {
      name: 'prod',
      apiBaseUrl: process.env.API_BASE_URL || 'https://automationexercise.com/api',
      uiBaseUrl: process.env.BASE_URL || 'https://automationexercise.com'
    }
  };

  const selected = knownTargets[env] || knownTargets.dev;

  return {
    env: selected.name,
    targetApi: selected.apiBaseUrl,
    targetUi: selected.uiBaseUrl,
    endpoints: {
      productsList: '/productsList',
      searchProduct: '/searchProduct',
      verifyLogin: '/verifyLogin'
    },
    slo: {
      p95Ms: Number(process.env.PERF_P95_MS || 900),
      p99Ms: Number(process.env.PERF_P99_MS || 1800),
      minSuccessRate: Number(process.env.PERF_MIN_SUCCESS_RATE || 0.99)
    }
  };
}
