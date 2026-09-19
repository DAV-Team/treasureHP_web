import { api } from './api';

export interface ApiBadge { _id: string; name: string; description: string; unlocked: boolean; unlockedAt?: string; }
export async function getMyBadges() { return (await api.get<ApiBadge[]>('/users/me/badges')).data; }
