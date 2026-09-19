import { api } from './api';

export type LocationCategory = 'history' | 'culture' | 'cuisine' | 'architecture' | 'art';
export interface ApiLocation {
  _id: string;
  name: string;
  slug: string;
  address: string;
  category: LocationCategory;
  coordinates: { lat: number; lng: number };
  coverImageUrl: string;
  shortDescription: string;
  xpReward: number;
  isSpecialQuest: boolean;
  cultureStory: { title: string; content?: string; imageUrl?: string; locked?: boolean };
  progress?: { status: 'available' | 'completed'; cultureStoryUnlocked: boolean };
}
export interface Challenge { id: string; levelName: string; xpReward: number; questions: ChallengeQuestion[]; }
export interface ChallengeQuestion { order: number; imageUrl: string; highlightBox: { x: number; y: number; width: number; height: number }; questionText: string; options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>; hintText: string; }

export async function getLocations(category?: LocationCategory) {
  return (await api.get<ApiLocation[]>('/locations', { params: category ? { category } : undefined })).data;
}
export async function getLocation(id: string) { return (await api.get<ApiLocation>(`/locations/${id}`)).data; }
export async function getChallenge(locationId: string) { return (await api.get<Challenge>(`/locations/${locationId}/challenge`)).data; }
export async function answerChallenge(locationId: string, questionOrder: number, selectedOption: 'A' | 'B' | 'C' | 'D') { return (await api.post(`/locations/${locationId}/challenge/answer`, { questionOrder, selectedOption })).data as { questionOrder: number; isCorrect: boolean; hintText?: string }; }
export async function completeLocation(locationId: string) { return (await api.post(`/locations/${locationId}/complete`)).data as { completed: boolean; xpEarned: number; totalXp: number; level: number }; }
