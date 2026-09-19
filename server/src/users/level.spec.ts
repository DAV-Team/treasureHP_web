import { describe, expect, it } from 'vitest';
import { calculateLevel } from './level.js';

describe('calculateLevel', () => {
  it.each([
    [0, 1],
    [99, 1],
    [100, 2],
    [250, 3],
    [-1, 1],
  ])('returns level %i for %i XP', (totalXp, expectedLevel) => {
    expect(calculateLevel(totalXp)).toBe(expectedLevel);
  });
});
