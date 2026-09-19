import { vi } from 'vitest';
import type { ComponentProps } from 'react';
import type { AuthContext } from '../contexts/AuthContext';

type AuthValue = ComponentProps<typeof AuthContext>['value'];

/** A signed-out auth context whose actions are spies; override any part per test. */
export function makeAuthContext(overrides: Partial<AuthValue> = {}): NonNullable<AuthValue> {
  return {
    user: null,
    isLoading: false,
    login: vi.fn().mockResolvedValue(undefined),
    register: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    ...overrides,
  };
}

export const playerUser = { id: 'u1', email: 'mai@example.com', name: 'Mai Phương Anh', level: 2, totalXp: 150, role: 'player' as const };
export const adminUser = { ...playerUser, id: 'a1', email: 'admin@example.com', name: 'Quản trị viên', role: 'admin' as const };
