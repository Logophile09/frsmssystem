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

// While backendUnreachable is true, quietly poll the lightweight /health
// route in the background so the app can recover on its own -- e.g. a
// Render free-tier instance that was asleep on the first request usually
// finishes waking up within 30-60s. Without this, the app would stay on
// demo data for the rest of the browser tab's life even after the real
// backend comes back, since normal requests skip straight past it once
// the sticky flag is set (see withFallback below).
const RECOVERY_POLL_MS = 8000;
const RECOVERY_TIMEOUT_MS = 12000;
const RECOVERY_MAX_ATTEMPTS = 60; // ~8 minutes, then give up until the next real request fails again
let recoveryTimer: ReturnType<typeof setInterval> | null = null;
let recoveryAttempts = 0;

function stopRecoveryWatcher() {
  if (recoveryTimer) {
    clearInterval(recoveryTimer);
    recoveryTimer = null;
  }
  recoveryAttempts = 0;
}

function startRecoveryWatcher() {
  if (recoveryTimer) return; // already watching
  recoveryTimer = setInterval(async () => {
    recoveryAttempts += 1;
    if (recoveryAttempts > RECOVERY_MAX_ATTEMPTS) {
      // Stop trying for now -- a future failed request will call
      // startRecoveryWatcher() again and give it another window.
      stopRecoveryWatcher();
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), RECOVERY_TIMEOUT_MS);
    try {
      const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
      if (res.ok) {
        backendUnreachable = false;
        stopRecoveryWatcher();
        // eslint-disable-next-line no-console
        console.info('[FRSMS] Backend reachable again -- switching back to live data.');
      }
    } catch {
      // Still down -- keep watching.
    } finally {
      clearTimeout(timer);
    }
  }, RECOVERY_POLL_MS);
}

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
// GROQ_API_KEY, auth failure, etc). This is distinct from the
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
    stopRecoveryWatcher();
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
      // error (e.g. GROQ_API_KEY not configured, bad input, expired
      // session), not a connectivity problem. Let it propagate so the
      // calling page can show the actual message instead of silently
      // masking it behind offline demo data.
      throw err;
    }
    // fetch() itself failed (network error, timeout/AbortError, CORS,
    // DNS, wrong VITE_API_URL, cold-starting host, etc) -- the backend
    // genuinely can't be reached, so fall back to the offline dataset
    // and start quietly watching for it to come back.
    backendUnreachable = true;
    startRecoveryWatcher();
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

// Self-registration always talks to the real backend -- creating an
// account isn't something the offline demo dataset can meaningfully
// fake, so this deliberately skips withFallback()/demoRequest().
export async function registerAccount(payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  position: string;
  station: string;
  notes?: string;
}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return await handle(res);
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new Error('Could not reach the registration server. Please try again in a moment.');
  } finally {
    clearTimeout(timer);
  }
}