import type { QuestSessionType } from './schemas/quest-session.schema.js';

/** Number of locations a player must pick to start each journey type (capped by how many locations exist). */
export const QUEST_SIZES = { full: 5, mini: 3 } as const satisfies Partial<Record<QuestSessionType, number>>;
export const JOURNEY_TYPES = Object.keys(QUEST_SIZES) as Array<keyof typeof QUEST_SIZES>;
export type JourneyType = keyof typeof QUEST_SIZES;
