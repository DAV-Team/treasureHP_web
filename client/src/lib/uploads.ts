// Turns a server-relative path (e.g. "/uploads/branding/x.png") into something an <img> can load.
// The API can live on its own origin (local dev) or behind the same origin under /api (production),
// exactly like services/api.ts's axios baseURL - so the same env var decides the prefix here too.
export function resolveUploadUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
  return `${apiBase}${path}`;
}
