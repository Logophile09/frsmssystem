import { supabase } from './supabase';

const API_URL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:4000/api';

async function authHeaders(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handle(res: Response) {
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body;
}

export const api = {
  get: async (path: string) => handle(await fetch(`${API_URL}${path}`, { headers: await authHeaders() })),
  post: async (path: string, body: unknown) =>
    handle(await fetch(`${API_URL}${path}`, { method: 'POST', headers: await authHeaders(), body: JSON.stringify(body) })),
  put: async (path: string, body: unknown) =>
    handle(await fetch(`${API_URL}${path}`, { method: 'PUT', headers: await authHeaders(), body: JSON.stringify(body) })),
  del: async (path: string) => handle(await fetch(`${API_URL}${path}`, { method: 'DELETE', headers: await authHeaders() })),
};
