import React, { useState } from 'react';
import axios from 'axios';
import { Send, Loader2, CheckCircle, XCircle, Code } from 'lucide-react';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api';

const PRESET_ENDPOINTS = [
  { method: 'GET', path: '/health', label: 'Health Check', auth: false },
  { method: 'POST', path: '/auth/login', label: 'Login', auth: false },
  { method: 'GET', path: '/employees/me', label: 'My Profile', auth: true },
  { method: 'GET', path: '/employees', label: 'List Employees', auth: true },
  { method: 'GET', path: '/departments', label: 'List Departments', auth: true },
  { method: 'GET', path: '/positions', label: 'List Positions', auth: true },
  { method: 'GET', path: '/attendance', label: 'List Attendance', auth: true },
  { method: 'GET', path: '/leaves/types', label: 'Leave Types', auth: true },
  { method: 'GET', path: '/leaves', label: 'List Leave Requests', auth: true },
  { method: 'GET', path: '/payroll', label: 'List Payslips', auth: true },
  { method: 'GET', path: '/performance', label: 'List Performance', auth: true },
  { method: 'GET', path: '/recruitment/jobs', label: 'List Jobs', auth: true },
  { method: 'GET', path: '/recruitment/applications', label: 'List Applications', auth: true },
  { method: 'GET', path: '/dashboard/stats', label: 'Dashboard Stats', auth: true },
  { method: 'GET', path: '/announcements', label: 'List Announcements', auth: true },
];

const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as const;

const DEFAULT_BODIES: Record<string, string> = {
  '/auth/login': JSON.stringify({ email: 'hr@zephrons.com', password: 'CB230025@vb' }, null, 2),
};

export const ApiTest: React.FC = () => {
  const [method, setMethod] = useState<string>('GET');
  const [path, setPath] = useState('/positions');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: unknown;
    time: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useAuth, setUseAuth] = useState(true);

  // Health is at /health, not /api/health
  const base = path === '/health' ? '' : apiBaseUrl;
  const fullUrl = `${base}${path.startsWith('/') ? path : '/' + path}`;

  const handlePresetSelect = (preset: (typeof PRESET_ENDPOINTS)[0]) => {
    setMethod(preset.method);
    setPath(preset.path);
    setBody(DEFAULT_BODIES[preset.path] ?? '');
    setUseAuth(preset.auth);
    setResponse(null);
    setError(null);
  };

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);
    const start = Date.now();

    try {
      const token = localStorage.getItem('hrm_token');
      const config: Record<string, unknown> = {
        method,
        url: fullUrl,
        headers: {
          'Content-Type': 'application/json',
          ...(useAuth && token ? { Authorization: `Bearer ${token}` } : {}),
        },
        validateStatus: () => true,
      };
      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        try {
          config.data = JSON.parse(body);
        } catch {
          setError('Invalid JSON in request body');
          setLoading(false);
          return;
        }
      }

      const res = await axios(config);
      const headers: Record<string, string> = {};
      Object.entries(res.headers).forEach(([k, v]) => {
        if (typeof v === 'string') headers[k] = v;
      });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers,
        data: res.data,
        time: Date.now() - start,
      });
    } catch (e: unknown) {
      const err = e as { message?: string; response?: { status?: number; data?: unknown } };
      setError(err.message || 'Request failed');
      if (err.response) {
        setResponse({
          status: err.response.status,
          statusText: 'Error',
          headers: {},
          data: err.response.data,
          time: Date.now() - start,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">API Test</h1>
        <p className="text-slate-500 text-sm mt-0.5">Test HRM API endpoints from the browser</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Request */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="px-5 py-4 flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-white outline-none"
                style={{ border: '1.5px solid #e2e8f0', minWidth: 100 }}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/api/endpoint"
                className="flex-1 min-w-48 px-4 py-2 rounded-xl text-sm outline-none"
                style={{ border: '1.5px solid #e2e8f0' }}
              />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={useAuth} onChange={(e) => setUseAuth(e.target.checked)} className="rounded" />
                Use token
              </label>
              <button
                onClick={handleSend}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                Send
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Request URL</p>
              <p className="text-sm font-mono text-slate-700 break-all">{fullUrl}</p>
            </div>
            {['POST', 'PUT', 'PATCH'].includes(method) && (
              <div className="p-4" style={{ borderTop: '1px solid #f1f5f9' }}>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Request Body (JSON)</p>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="{}"
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl text-sm font-mono outline-none resize-none"
                  style={{ border: '1.5px solid #e2e8f0', background: '#fafafa' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right: Presets */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
              <Code size={16} className="text-indigo-500" />
              <p className="text-sm font-semibold text-slate-700">Preset Endpoints</p>
            </div>
            <div className="p-3 max-h-64 overflow-y-auto space-y-1">
              {PRESET_ENDPOINTS.map((preset) => (
                <button
                  key={preset.path + preset.method}
                  onClick={() => handlePresetSelect(preset)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm hover:bg-slate-50 transition-colors"
                >
                  <span className={`font-mono font-semibold ${preset.method === 'GET' ? 'text-emerald-600' : preset.method === 'POST' ? 'text-blue-600' : 'text-amber-600'}`}>
                    {preset.method}
                  </span>
                  <span className="text-slate-600 ml-2">{preset.path}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 text-red-700 text-sm">
          <XCircle size={18} />
          {error}
        </div>
      )}

      {/* Response */}
      {response && (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold ${
                response.status >= 200 && response.status < 300
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-red-50 text-red-700'
              }`}>
                {response.status >= 200 && response.status < 300 ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {response.status} {response.statusText}
              </span>
              <span className="text-sm text-slate-500">{response.time} ms</span>
            </div>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Response Body</p>
            <pre className="p-4 rounded-xl text-sm font-mono overflow-x-auto max-h-80 overflow-y-auto" style={{ background: '#0f172a', color: '#e2e8f0' }}>
              {typeof response.data === 'object'
                ? JSON.stringify(response.data, null, 2)
                : String(response.data)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
