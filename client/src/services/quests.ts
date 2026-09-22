import { api } from './api';
import type { JourneyType } from '../lib/journey';

export interface Journey { id: string; type: JourneyType; locationIds: string[]; startedAt: string }

export async function getCurrentJourney() { return (await api.get<{ journey: Journey | null }>('/quests/current')).data.journey; }
export async function startJourney(type: JourneyType, locationIds: string[]) { return (await api.post<{ journey: Journey }>('/quests/start', { type, locationIds })).data.journey; }
export async function finishJourney() { return (await api.post('/quests/finish')).data as { finished: boolean; type: string; locationsCompleted: number }; }
