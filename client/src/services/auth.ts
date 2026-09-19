import { api } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  level: number;
  totalXp: number;
  role: 'player' | 'admin';
}

interface AuthResult { accessToken: string; user: User; }
interface Credentials { email: string; password: string; }
export interface ProfileUpdate { name?: string; /** An empty string removes the avatar. */ avatarUrl?: string; }
export interface PasswordChange { currentPassword: string; newPassword: string; }

export async function login(credentials: Credentials) {
  return (await api.post<AuthResult>('/auth/login', credentials)).data;
}

export async function register(details: Credentials & { name: string }) {
  return (await api.post<AuthResult>('/auth/register', details)).data;
}

export async function getCurrentUser() {
  return (await api.get<User>('/users/me')).data;
}

export async function updateProfile(update: ProfileUpdate) {
  return (await api.patch<User>('/users/me', update)).data;
}

export async function changePassword(change: PasswordChange) {
  await api.post('/users/me/password', change);
}
