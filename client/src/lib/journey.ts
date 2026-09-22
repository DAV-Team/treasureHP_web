export type JourneyType = 'full' | 'mini';

// Mirrors QUEST_SIZES on the server: how many locations a player picks for each journey.
export const journeySizes: Record<JourneyType, number> = { full: 5, mini: 3 };

export function isJourneyType(value: string | null): value is JourneyType {
  return value === 'full' || value === 'mini';
}

/** Locations to pick for a journey; never more than exist. */
export function requiredLocations(type: JourneyType, totalLocations: number) {
  return Math.min(journeySizes[type], totalLocations);
}
