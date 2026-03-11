import { Router, Request, Response } from 'express';
import http from 'http';

const router = Router();

const API_ENDPOINTS = [
  { method: 'GET', path: '/health', auth: false, label: 'Health Check' },
  { method: 'POST', path: '/api/auth/login', auth: false, label: 'Login' },
  { method: 'GET', path: '/api/employees/me', auth: true, label: 'My Profile' },
  { method: 'GET', path: '/api/employees', auth: true, label: 'List Employees' },
  { method: 'GET', path: '/api/departments', auth: true, label: 'List Departments' },
  { method: 'GET', path: '/api/positions', auth: true, label: 'List Positions' },
  { method: 'GET', path: '/api/attendance', auth: true, label: 'List Attendance' },
  { method: 'GET', path: '/api/leaves/types', auth: true, label: 'Leave Types' },
  { method: 'GET', path: '/api/leaves', auth: true, label: 'List Leaves' },
  { method: 'GET', path: '/api/payroll', auth: true, label: 'List Payroll' },
  { method: 'GET', path: '/api/performance', auth: true, label: 'List Performance' },
  { method: 'GET', path: '/api/recruitment/jobs', auth: true, label: 'List Jobs' },
  { method: 'GET', path: '/api/recruitment/applications', auth: true, label: 'List Applications' },
  { method: 'GET', path: '/api/dashboard/stats', auth: true, label: 'Dashboard Stats' },
  { method: 'GET', path: '/api/announcements', auth: true, label: 'List Announcements' },
];

const TEST_EMAIL = process.env.API_TEST_EMAIL || 'hr@zephrons.com';
const TEST_PASSWORD = process.env.API_TEST_PASSWORD || 'CB230025@vb';

function httpRequest(
  url: string,
  method: string,
  body?: string,
  auth?: string
): Promise<{ status: number; data: string }> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts: http.RequestOptions = {
      hostname: u.hostname,
      port: u.port || 80,
      path: u.pathname + u.search,
      method,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };
    if (auth) (opts.headers as Record<string, string>)['Authorization'] = `Bearer ${auth}`;
    if (body) (opts.headers as Record<string, string>)['Content-Length'] = String(Buffer.byteLength(body));

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', (ch) => (data += ch));
      res.on('end', () => resolve({ status: res.statusCode || 0, data }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

async function getAuthToken(baseUrl: string): Promise<string | null> {
  try {
    const body = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
    const res = await httpRequest(`${baseUrl}/api/auth/login`, 'POST', body);
    const json = JSON.parse(res.data || '{}');
    return (json && json.token) || null;
  } catch {
    return null;
  }
}

async function checkEndpoint(
  baseUrl: string,
  endpoint: (typeof API_ENDPOINTS)[0],
  token: string | null
): Promise<{ healthy: boolean; status?: number; error?: string; time?: number }> {
  const start = Date.now();
  try {
    let body: string | undefined;
    if (endpoint.method === 'POST' && endpoint.path.includes('login')) {
      body = JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD });
    }
    const res = await httpRequest(
      `${baseUrl}${endpoint.path}`,
      endpoint.method,
      body,
      endpoint.auth && token ? token : undefined
    );
    const time = Date.now() - start;
    const healthy = res.status >= 200 && res.status < 400;
    return { healthy, status: res.status, time };
  } catch (e: any) {
    return { healthy: false, error: e.message || 'Request failed', time: Date.now() - start };
  }
}

// JSON response
router.get('/', async (req: Request, res: Response) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const token = await getAuthToken(baseUrl);

  const results = await Promise.all(
    API_ENDPOINTS.map(async (ep) => {
      const result = await checkEndpoint(baseUrl, ep, token);
      return { ...ep, ...result };
    })
  );

  const healthy = results.filter((r) => r.healthy);
  const unhealthy = results.filter((r) => !r.healthy);

  res.json({
    timestamp: new Date().toISOString(),
    healthy,
    unhealthy,
    summary: { total: results.length, healthy: healthy.length, unhealthy: unhealthy.length },
  });
});

// HTML page - also export for direct mount (Express 5 router /page matching)
async function statusPageHandler(req: Request, res: Response) {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const token = await getAuthToken(baseUrl);

  const results = await Promise.all(
    API_ENDPOINTS.map(async (ep) => {
      const result = await checkEndpoint(baseUrl, ep, token);
      return { ...ep, ...result };
    })
  );

  const healthy = results.filter((r) => r.healthy);
  const unhealthy = results.filter((r) => !r.healthy);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HRM API Status</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 24px; background: #0f172a; color: #e2e8f0; }
    h1 { font-size: 1.5rem; margin-bottom: 8px; }
    .meta { color: #94a3b8; font-size: 0.875rem; margin-bottom: 24px; }
    .summary { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .badge { padding: 8px 16px; border-radius: 12px; font-weight: 600; font-size: 0.875rem; }
    .badge-ok { background: rgba(34,197,94,0.2); color: #22c55e; }
    .badge-err { background: rgba(239,68,68,0.2); color: #ef4444; }
    .section { margin-bottom: 24px; }
    .section h2 { font-size: 1rem; margin-bottom: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border-radius: 12px; overflow: hidden; }
    th, td { padding: 12px 16px; text-align: left; }
    th { background: #334155; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; }
    tr:not(:last-child) td { border-bottom: 1px solid #334155; }
    .method { font-weight: 600; font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; }
    .method-GET { background: #22c55e33; color: #22c55e; }
    .method-POST { background: #3b82f633; color: #3b82f6; }
    .status { font-mono; font-size: 0.875rem; }
    .status-ok { color: #22c55e; }
    .status-err { color: #ef4444; }
    .time { color: #94a3b8; font-size: 0.8rem; }
    a { color: #818cf8; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>HRM API Status</h1>
  <p class="meta">Checked at ${new Date().toISOString()} · Base: ${baseUrl}</p>
  <div class="summary">
    <span class="badge badge-ok">Healthy: ${healthy.length}</span>
    <span class="badge badge-err">Unhealthy: ${unhealthy.length}</span>
    <span class="badge" style="background:#334155;color:#94a3b8">Total: ${results.length}</span>
  </div>
  <div class="section">
    <h2>Healthy APIs (${healthy.length})</h2>
    <table>
      <thead><tr><th>Method</th><th>Endpoint</th><th>Label</th><th>Status</th><th>Time</th></tr></thead>
      <tbody>
        ${healthy.map((r) => `
        <tr>
          <td><span class="method method-${r.method}">${r.method}</span></td>
          <td><code>${r.path}</code></td>
          <td>${r.label}</td>
          <td class="status status-ok">${r.status ?? '-'}</td>
          <td class="time">${r.time ?? '-'} ms</td>
        </tr>`).join('')}
        ${healthy.length === 0 ? '<tr><td colspan="5">No healthy APIs</td></tr>' : ''}
      </tbody>
    </table>
  </div>
  <div class="section">
    <h2>Unhealthy APIs (${unhealthy.length})</h2>
    <table>
      <thead><tr><th>Method</th><th>Endpoint</th><th>Label</th><th>Status / Error</th><th>Time</th></tr></thead>
      <tbody>
        ${unhealthy.map((r) => `
        <tr>
          <td><span class="method method-${r.method}">${r.method}</span></td>
          <td><code>${r.path}</code></td>
          <td>${r.label}</td>
          <td class="status status-err">${r.status ?? r.error ?? 'Failed'}</td>
          <td class="time">${r.time ?? '-'} ms</td>
        </tr>`).join('')}
        ${unhealthy.length === 0 ? '<tr><td colspan="5">All APIs healthy</td></tr>' : ''}
      </tbody>
    </table>
  </div>
  <p class="meta"><a href="/api/status">View JSON</a> · <a href="/api/status/page">Refresh</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}

router.get('/page', statusPageHandler);

export default router;
export { statusPageHandler };
