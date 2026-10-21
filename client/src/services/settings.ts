import { api } from './api';

export interface AppSettings { logoUrl: string | null }

export async function getAppSettings() { return (await api.get<AppSettings>('/settings')).data; }

/** An empty string restores the default mark. */
export async function setLogoUrl(logoUrl: string) { return (await api.patch<AppSettings>('/admin/settings/logo', { logoUrl })).data; }
