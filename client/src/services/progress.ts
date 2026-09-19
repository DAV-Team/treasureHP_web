import { api } from './api';

export interface UserProgress { locationId: string; status: 'available' | 'completed'; answeredQuestions: Array<{ questionOrder: number; selectedOption: string; isCorrect: boolean }>; cultureStoryUnlocked: boolean; xpEarned: number; }
export async function getUserProgress() { return (await api.get<UserProgress[]>('/users/me/progress')).data; }
