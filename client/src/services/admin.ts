import { api } from './api';
import type { LocationCategory } from './locations';

export type OptionKey = 'A' | 'B' | 'C' | 'D';
export type UnlockConditionType = 'locationsInCategory' | 'totalLocations' | 'fullQuestCompleted';

export interface AdminDashboard { users: number; locations: number; challenges: number; badges: number; progress: number; completed: number; }
export interface AdminLocation {
  _id: string; name: string; slug: string; address: string; category: LocationCategory;
  coordinates: { lat: number; lng: number }; coverImageUrl: string; shortDescription: string;
  cultureStory: { title: string; content: string; imageUrl?: string }; xpReward: number; isSpecialQuest: boolean;
}
export interface AdminQuestion {
  order: number; imageUrl: string; highlightBox: { x: number; y: number; width: number; height: number };
  questionText: string; options: Array<{ key: OptionKey; text: string }>; correctOption: OptionKey; hintText: string;
}
export interface AdminChallenge { _id: string; levelName: string; xpReward: number; questions: AdminQuestion[]; locationId: { _id: string; name: string } | null; }
export interface AdminBadge {
  _id: string; code: string; name: string; description: string; icon: string; colorTheme: string;
  unlockCondition: { type: UnlockConditionType; value: number; category?: LocationCategory };
}
export interface AdminUser { _id: string; name: string; email: string; role: 'player' | 'admin'; level: number; totalXp: number; }
export interface AdminProgress { _id: string; status: string; xpEarned: number; cultureStoryUnlocked: boolean; userId: { name: string; email: string } | null; locationId: { name: string } | null; }
export type AdminContentType = 'locations' | 'challenges' | 'badges';

export async function getAdminDashboard() { return (await api.get<AdminDashboard>('/admin/dashboard')).data; }
export async function getAdminLocations() { return (await api.get<AdminLocation[]>('/admin/locations')).data; }
export async function getAdminChallenges() { return (await api.get<AdminChallenge[]>('/admin/challenges')).data; }
export async function getAdminBadges() { return (await api.get<AdminBadge[]>('/admin/badges')).data; }
export async function getAdminUsers() { return (await api.get<AdminUser[]>('/admin/users')).data; }
export async function getAdminProgress() { return (await api.get<AdminProgress[]>('/admin/progress')).data; }
export async function updateAdminUser(id: string, update: { name?: string; role?: 'player' | 'admin' }) { return (await api.patch<AdminUser>(`/admin/users/${id}`, update)).data; }
export async function deleteAdminUser(id: string) { return (await api.delete(`/admin/users/${id}`)).data; }
export async function createAdminContent(type: AdminContentType, payload: Record<string, unknown>) { return (await api.post(`/admin/${type}`, payload)).data; }
export async function updateAdminContent(type: AdminContentType, id: string, payload: Record<string, unknown>) { return (await api.patch(`/admin/${type}/${id}`, payload)).data; }
export async function deleteAdminContent(type: AdminContentType, id: string) { return (await api.delete(`/admin/${type}/${id}`)).data; }
