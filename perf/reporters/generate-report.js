import fs from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i += 1;
    }
  }
  return args;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function number(val, fallback = 0) {
  return Number.isFinite(Number(val)) ? Number(val) : fallback;
}

function pct(num) {
  return `${(num * 100).toFixed(2)}%`;
}

function ms(val) {
  return `${number(val).toFixed(1)} ms`;
}

function signedMsDelta(curr, prev) {
  const delta = number(curr) - number(prev);
  const sign = delta > 0 ? '+' : '';
  return `${sign}${delta.toFixed(1)} ms`;
}

function signedPctPointDelta(currRatio, prevRatio) {
  const deltaPp = (number(currRatio) - number(prevRatio)) * 100;
  const sign = deltaPp > 0 ? '+' : '';
  return `${sign}${deltaPp.toFixed(2)} pp`;
}

function levelClass(value, warnAt, failAt, lowerIsBetter = true) {
  const num = number(value);
  if (lowerIsBetter) {
    if (num > failAt) return 'bad';
    if (num > warnAt) return 'warn';
    return 'good';
  }

  if (num < failAt) return 'bad';
  if (num < warnAt) return 'warn';
  return 'good';
}

function safeName(metricName) {
  return metricName
    .replace(/^perf\.endpoint\.latency_ms\./, '')
    .replace(/^https?:\/\//, '')
    .replace(/\?.*$/, '')
    .replace(/\/$/, '');
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildEndpointRows(histograms) {
  return Object.entries(histograms)
    .filter(([name]) => name.startsWith('perf.endpoint.latency_ms.'))
    .map(([name, summary]) => ({
      endpoint: safeName(name),
      count: number(summary?.count),
      mean: number(summary?.mean),
      p95: number(summary?.p95),
      p99: number(summary?.p99),
      max: number(summary?.max)
    }))
    .sort((a, b) => b.count - a.count);
}

function getTrendSignal(current, previous) {
  if (!previous) {
    return { status: 'NO_BASELINE', className: 'warn' };
  }

  const p95Delta = number(current?.p95) - number(previous?.p95);
  const p99Delta = number(current?.p99) - number(previous?.p99);
  const successDelta = number(current?.successRate) - number(previous?.successRate);

  const hasRegression = p95Delta > 25 || p99Delta > 40 || successDelta < -0.002;
  const hasImprovement = p95Delta < -25 || p99Delta < -40 || successDelta > 0.002;

  if (hasRegression) return { status: 'REGRESSION', className: 'bad' };
  if (hasImprovement) return { status: 'IMPROVEMENT', className: 'good' };
  return { status: 'STABLE', className: 'warn' };
}

function readPreviousAggregate(inputPath) {
  const prevPath = inputPath.replace(/\.json$/i, '.prev.json');
  if (!fs.existsSync(prevPath)) {
    return null;
  }

  try {
    const prevReport = readJson(prevPath);
    return {
      path: prevPath,
      aggregate: prevReport?.aggregate || {}
    };
  } catch {
    return null;
  }
}

function inferGateDefaultsFromInput(inputPath) {
  const file = String(inputPath || '').toLowerCase();

  if (file.endsWith('api-smoke.json')) {
    return {
      profile: 'api-smoke',
      p95MaxMs: 1000,
      p99MaxMs: 2000,
      minSuccessRate: 0.98
    };
  }

  if (file.endsWith('api-load.json')) {
    return {
      profile: 'api-load',
      p95MaxMs: 900,
      p99MaxMs: 1800,
      minSuccessRate: 0.99
    };
  }

  return {
    profile: 'default',
    p95MaxMs: 900,
    p99MaxMs: 1800,
    minSuccessRate: 0.99
  };
}

function resolveGates(args, inferredGates) {
  const hasCli = args.p95 != null || args.p99 != null || args.minSuccessRate != null || args['min-success-rate'] != null;
  const hasEnv = process.env.PERF_P95_MS != null || process.env.PERF_P99_MS != null || process.env.PERF_MIN_SUCCESS_RATE != null;

  const source = hasCli ? 'cli' : hasEnv ? 'env' : 'inferred';

  return {
    p95MaxMs: number(args.p95 ?? process.env.PERF_P95_MS, inferredGates.p95MaxMs),
    p99MaxMs: number(args.p99 ?? process.env.PERF_P99_MS, inferredGates.p99MaxMs),
    minSuccessRate: number(
      args.minSuccessRate ?? args['min-success-rate'] ?? process.env.PERF_MIN_SUCCESS_RATE,
      inferredGates.minSuccessRate
    ),
    profile: inferredGates.profile,
    source
  };
}

function buildHtml({ title, inputPath, aggregate, previous, generatedAt, gates }) {
  const counters = aggregate?.counters || {};
  const rates = aggregate?.rates || {};
  const summaries = aggregate?.summaries || aggregate?.histograms || {};

  const totalRequests = number(counters['http.requests']);
  const totalResponses = number(counters['http.responses']);
  const ok200 = number(counters['http.codes.200']);
  const vuCreated = number(counters['vusers.created']);
  const vuFailed = number(counters['vusers.failed']);
  const successRate = totalRequests > 0 ? ok200 / totalRequests : 0;

  const httpRt = summaries['http.response_time'] || {};
  const endpointRows = buildEndpointRows(summaries);

  const previousSummaries = previous?.aggregate?.summaries || previous?.aggregate?.histograms || {};
  const previousCounters = previous?.aggregate?.counters || {};
  const previousRequests = number(previousCounters['http.requests']);
  const previousOk200 = number(previousCounters['http.codes.200']);
  const previousSuccessRate = previousRequests > 0 ? previousOk200 / previousRequests : 0;
  const previousHttpRt = previousSummaries['http.response_time'] || null;

  const gateChecks = {
    p95: number(httpRt.p95) <= gates.p95MaxMs,
    p99: number(httpRt.p99) <= gates.p99MaxMs,
    successRate: successRate >= gates.minSuccessRate
  };

  const overallPass = gateChecks.p95 && gateChecks.p99 && gateChecks.successRate;
  const gateBadgeClass = overallPass ? 'badge pass' : 'badge fail';
  const gateBadgeText = overallPass ? 'PASS' : 'FAIL';

  const trendSignal = getTrendSignal(
    { p95: httpRt.p95, p99: httpRt.p99, successRate },
    previousHttpRt
      ? { p95: previousHttpRt.p95, p99: previousHttpRt.p99, successRate: previousSuccessRate }
      : null
  );

  const endpointTable = endpointRows.length
    ? endpointRows
        .map(
          (row) => `<tr>
<td>${escapeHtml(row.endpoint)}</td>
<td>${row.count}</td>
<td>${ms(row.mean)}</td>
<td>${ms(row.p95)}</td>
<td>${ms(row.p99)}</td>
<td>${ms(row.max)}</td>
</tr>`
        )
        .join('\n')
    : '<tr><td colspan="6">No endpoint-level latency metrics found.</td></tr>';

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      color-scheme: light dark;
      --ok: #166534;
      --ok-bg: #dcfce7;
      --warn: #92400e;
      --warn-bg: #fef3c7;
      --bad: #991b1b;
      --bad-bg: #fee2e2;
      --muted: #6b7280;
      --border: #d1d5db;
    }
    body { font-family: Segoe UI, Arial, sans-serif; margin: 24px; line-height: 1.45; }
    h1, h2 { margin: 0 0 12px 0; }
    .meta { color: var(--muted); margin: 0; }
    .meta-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
    .header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .badge { padding: 8px 14px; border-radius: 999px; font-weight: 700; font-size: 13px; border: 1px solid transparent; }
    .badge.pass { background: var(--ok-bg); color: var(--ok); border-color: #86efac; }
    .badge.fail { background: var(--bad-bg); color: var(--bad); border-color: #fca5a5; }
    .badge.neutral { background: var(--warn-bg); color: var(--warn); border-color: #fcd34d; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(200px, 1fr)); gap: 12px; margin-bottom: 20px; }
    .card { border: 1px solid var(--border); border-radius: 10px; padding: 12px; }
    .k { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
    .v { font-size: 22px; font-weight: 700; margin-top: 6px; }
    .good { background: var(--ok-bg); color: var(--ok); }
    .warn { background: var(--warn-bg); color: var(--warn); }
    .bad { background: var(--bad-bg); color: var(--bad); }
    .section { margin-top: 14px; margin-bottom: 18px; }
    .section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .section-head h2 { margin: 0; }
    .trend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .trend-card { border: 1px solid var(--border); border-radius: 10px; padding: 10px; }
    .trend-label { font-size: 12px; color: var(--muted); text-transform: uppercase; }
    .trend-value { font-size: 18px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid var(--border); padding: 8px; text-align: left; font-size: 13px; }
    th { background: #f3f4f6; color: #111827; }
    .gate-table td:nth-child(2), .gate-table td:nth-child(3) { font-weight: 600; }
  </style>
</head>
<body>
  <div class="header-row">
    <h1>${escapeHtml(title)}</h1>
    <div class="${gateBadgeClass}">Quality Gate: ${gateBadgeText}</div>
  </div>
  <div class="meta-row">
    <div class="meta">Generated at ${escapeHtml(generatedAt)} from ${escapeHtml(inputPath)}</div>
    <div class="meta">Gate profile: ${escapeHtml(gates.profile)} | source: ${escapeHtml(gates.source)}</div>
  </div>

  <div class="section">
    <div class="section-head">
      <h2>Trend vs previous run</h2>
      <div class="meta">Baseline: ${escapeHtml(previous?.path || 'not available yet')}</div>
    </div>
    <div class="trend-grid">
      <div class="trend-card">
        <div class="trend-label">Trend Status</div>
        <div class="trend-value ${trendSignal.className}">${trendSignal.status}</div>
      </div>
      <div class="trend-card">
        <div class="trend-label">Quality Gate</div>
        <div class="trend-value ${overallPass ? 'good' : 'bad'}">${overallPass ? 'PASS' : 'FAIL'}</div>
      </div>
      <div class="trend-card">
        <div class="trend-label">P95 delta</div>
        <div class="trend-value ${previousHttpRt ? levelClass(number(httpRt.p95) - number(previousHttpRt.p95), 10, 25) : 'warn'}">${previousHttpRt ? signedMsDelta(httpRt.p95, previousHttpRt.p95) : 'N/A'}</div>
      </div>
      <div class="trend-card">
        <div class="trend-label">P99 delta</div>
        <div class="trend-value ${previousHttpRt ? levelClass(number(httpRt.p99) - number(previousHttpRt.p99), 20, 40) : 'warn'}">${previousHttpRt ? signedMsDelta(httpRt.p99, previousHttpRt.p99) : 'N/A'}</div>
      </div>
      <div class="trend-card">
        <div class="trend-label">Success rate delta</div>
        <div class="trend-value ${previousHttpRt ? levelClass(number(successRate) - number(previousSuccessRate), -0.001, -0.002, false) : 'warn'}">${previousHttpRt ? signedPctPointDelta(successRate, previousSuccessRate) : 'N/A'}</div>
      </div>
      <div class="trend-card">
        <div class="trend-label">Request rate</div>
        <div class="trend-value">${number(rates['http.request_rate']).toFixed(2)} / sec</div>
      </div>
    </div>
  </div>

  <div class="grid">
    <div class="card"><div class="k">Total Requests</div><div class="v">${totalRequests}</div></div>
    <div class="card ${levelClass(successRate, gates.minSuccessRate + 0.005, gates.minSuccessRate, false)}"><div class="k">Success Rate</div><div class="v">${pct(successRate)}</div></div>
    <div class="card"><div class="k">Request Rate</div><div class="v">${number(rates['http.request_rate']).toFixed(2)} / sec</div></div>
    <div class="card"><div class="k">VUsers Created</div><div class="v">${vuCreated}</div></div>
    <div class="card ${vuFailed > 0 ? 'bad' : 'good'}"><div class="k">VUsers Failed</div><div class="v">${vuFailed}</div></div>
    <div class="card"><div class="k">Responses</div><div class="v">${totalResponses}</div></div>
  </div>

  <div class="section">
    <h2>Quality gate checks</h2>
    <table class="gate-table">
      <thead><tr><th>Check</th><th>Actual</th><th>Target</th><th>Status</th></tr></thead>
      <tbody>
        <tr>
          <td>HTTP p95</td>
          <td>${ms(httpRt.p95)}</td>
          <td>&le; ${ms(gates.p95MaxMs)}</td>
          <td class="${gateChecks.p95 ? 'good' : 'bad'}">${gateChecks.p95 ? 'PASS' : 'FAIL'}</td>
        </tr>
        <tr>
          <td>HTTP p99</td>
          <td>${ms(httpRt.p99)}</td>
          <td>&le; ${ms(gates.p99MaxMs)}</td>
          <td class="${gateChecks.p99 ? 'good' : 'bad'}">${gateChecks.p99 ? 'PASS' : 'FAIL'}</td>
        </tr>
        <tr>
          <td>Success rate</td>
          <td>${pct(successRate)}</td>
          <td>&ge; ${pct(gates.minSuccessRate)}</td>
          <td class="${gateChecks.successRate ? 'good' : 'bad'}">${gateChecks.successRate ? 'PASS' : 'FAIL'}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h2>HTTP latency summary</h2>
  <table>
    <thead><tr><th>Metric</th><th>Value</th></tr></thead>
    <tbody>
      <tr><td>mean</td><td>${ms(httpRt.mean)}</td></tr>
      <tr><td>p95</td><td class="${levelClass(httpRt.p95, gates.p95MaxMs * 0.9, gates.p95MaxMs)}">${ms(httpRt.p95)}</td></tr>
      <tr><td>p99</td><td class="${levelClass(httpRt.p99, gates.p99MaxMs * 0.9, gates.p99MaxMs)}">${ms(httpRt.p99)}</td></tr>
      <tr><td>max</td><td>${ms(httpRt.max)}</td></tr>
    </tbody>
  </table>

  <h2>Endpoint latency breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Endpoint</th>
        <th>Count</th>
        <th>Mean</th>
        <th>P95</th>
        <th>P99</th>
        <th>Max</th>
      </tr>
    </thead>
    <tbody>
      ${endpointTable}
    </tbody>
  </table>
</body>
</html>`;
}

function main() {
  const args = parseArgs(process.argv);
  const inputPath = args.input || args.in;
  const outputPath = args.output || args.out;
  const title = String(args.title || 'Performance Report');

  if (!inputPath || !outputPath) {
    throw new Error('Usage: node perf/reporters/generate-report.js --input <json> --output <html> [--title <name>]');
  }

  const absoluteInput = path.resolve(inputPath);
  const absoluteOutput = path.resolve(outputPath);

  if (!fs.existsSync(absoluteInput)) {
    throw new Error(`Input file not found: ${absoluteInput}`);
  }

  const report = readJson(absoluteInput);
  const aggregate = report?.aggregate || {};
  const previous = readPreviousAggregate(absoluteInput);
  const inferredGates = inferGateDefaultsFromInput(absoluteInput);
  const gates = resolveGates(args, inferredGates);

  fs.mkdirSync(path.dirname(absoluteOutput), { recursive: true });
  const html = buildHtml({
    title,
    inputPath,
    aggregate,
    previous,
    gates,
    generatedAt: new Date().toISOString()
  });
  fs.writeFileSync(absoluteOutput, html, 'utf8');

  console.log(`Report generated: ${absoluteOutput}`);
}

main();
