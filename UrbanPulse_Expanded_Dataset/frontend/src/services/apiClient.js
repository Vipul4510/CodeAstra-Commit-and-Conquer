const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(method, path, body = null, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal: controller.signal,
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const res = await fetch(`${BASE}${path}`, opts);
    clearTimeout(timer);
    const data = await res.json();
    if (!res.ok) return { ok: false, status: res.status, error: data.detail || res.statusText, data };
    return { ok: true, status: res.status, data };
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') return { ok: false, status: 0, error: 'Request timed out' };
    return { ok: false, status: 0, error: err.message || 'Network error' };
  }
}

export const api = {
  get: (path, timeout) => request('GET', path, null, timeout),
  post: (path, body, timeout) => request('POST', path, body, timeout),
};

export function healthCheck() {
  return api.get('/');
}

export default api;
