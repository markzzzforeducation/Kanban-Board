const API_BASE = import.meta.env.VITE_API_BASE || '';

function getAuthToken(): string | null {
  return localStorage.getItem('kb-token');
}

function authHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) return res.json();
  let message = 'Request failed';
  try {
    const data = await res.json();
    message = (data && (data.error || data.message)) || message;
  } catch {
    try { message = await res.text(); } catch { /* ignore */ }
  }
  throw new Error(message);
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
  try { console.debug('[API][GET]', url, res.status); } catch { }
  return handle<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body ?? {}) });
  try { console.debug('[API][POST]', url, res.status, body); } catch { }
  return handle<T>(res);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(body ?? {}) });
  try { console.debug('[API][PUT]', url, res.status, body); } catch { }
  return handle<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...authHeaders() } });
  try { console.debug('[API][DELETE]', url, res.status); } catch { }
  return handle<T>(res);
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('kb-token', token);
  else localStorage.removeItem('kb-token');
}


