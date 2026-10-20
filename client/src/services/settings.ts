import { api } from './api';

export interface AppSettings { logoUrl: string | null }

export async function getAppSettings() { return (await api.get<AppSettings>('/settings')).data; }

export async function uploadLogo(file: File) {
  const form = new FormData();
  form.append('logo', file);
  // Drop the instance's default 'application/json' header so axios/the browser can set the multipart boundary.
  return (await api.post<AppSettings>('/admin/settings/logo', form, { headers: { 'Content-Type': undefined } })).data;
}

export async function resetLogo() { return (await api.delete<AppSettings>('/admin/settings/logo')).data; }
