export function calculateLevel(totalXp: number): number {
  return Math.floor(Math.max(0, totalXp) / 100) + 1;
}
