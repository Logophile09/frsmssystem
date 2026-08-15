import { supabase } from './supabase';
import { demoRequest } from './demoData';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:4000/api';

// If the real backend doesn't answer within this window (unreachable
// host, wrong VITE_API_URL, or a cold Render free-tier instance still
// waking up), we stop waiting and serve the offline demo dataset
// instead -- so the UI never sits blank.
const TIMEOUT_MS = 7000;

// Sticky flag: once we've detected the backend is unreachable, skip the
// timeout wait on subsequent calls this session and go straight to demo
// data (keeps navigation snappy instead of re-timing-out on every page).
let backendUnreachable = false;

async function authHeaders(): Promise<HeadersInit> {
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  } catch {
    // Supabase misconfigured/unreachable -- proceed without auth header,
    // the fetch below will fail too and trigger the demo fallback.
    return { 'Content-Type': 'application/json' };
  }
}

// Thrown when the backend was actually reached and answered, just with
// a non-2xx status (bad request, missing server-side config like
// ANTHROPIC_API_KEY, auth failure, etc). This is distinct from the
// backend being unreachable -- see withFallback below.
class HttpError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

async function handle(res: Response) {
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new HttpError(body.error ?? `Request failed (${res.status})`, res.status);
  return body;
}

async function realFetch(path: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headers = { ...(await authHeaders()), ...(init.headers ?? {}) };
    const res = await fetch(`${API_URL}${path}`, { ...init, headers, signal: controller.signal });
    // The backend answered at all (even with an error status), so it's
    // reachable -- clear the sticky flag before handle() potentially
    // throws on a non-2xx response.
    backendUnreachable = false;
    return await handle(res);
  } finally {
    clearTimeout(timer);
  }
}

async function withFallback(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, init: RequestInit, body?: unknown) {
  if (backendUnreachable) return demoRequest(method, path, body);
  try {
    return await realFetch(path, init);
  } catch (err) {
    if (err instanceof HttpError) {
      // Backend is reachable and responded -- this is a real application
      // error (e.g. ANTHROPIC_API_KEY not configured, bad input, expired
      // session), not a connectivity problem. Let it propagate so the
      // calling page can show the actual message instead of silently
      // masking it behind offline demo data.
      throw err;
    }
    // fetch() itself failed (network error, timeout/AbortError, CORS,
    // DNS, wrong VITE_API_URL, cold-starting host, etc) -- the backend
    // genuinely can't be reached, so fall back to the offline dataset.
    backendUnreachable = true;
    // eslint-disable-next-line no-console
    console.warn(`[FRSMS] Backend unreachable for ${method} ${path} -- showing offline demo data instead.`);
    return demoRequest(method, path, body);
  }
}

export const api = {
  get: (path: string) => withFallback('GET', path, { method: 'GET' }),
  post: (path: string, body: unknown) =>
    withFallback('POST', path, { method: 'POST', body: JSON.stringify(body) }, body),
  put: (path: string, body: unknown) =>
    withFallback('PUT', path, { method: 'PUT', body: JSON.stringify(body) }, body),
  del: (path: string) => withFallback('DELETE', path, { method: 'DELETE' }),
};

// Exposed so the UI (e.g. a "Demo Mode" badge) can tell whether it's
// currently showing live backend data or the offline fallback.
export function isBackendUnreachable() {
  return backendUnreachable;
}
