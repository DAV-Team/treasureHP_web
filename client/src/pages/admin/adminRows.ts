import type { AdminBadge, AdminChallenge, AdminLocation, AdminProgress, AdminUser } from '../../services/admin';

export type AdminTab = 'locations' | 'challenges' | 'badges' | 'users' | 'progress';
export type AdminRow = AdminLocation | AdminChallenge | AdminBadge | AdminUser | AdminProgress;

/** The words a search box matches against for one row. */
export function searchableText(row: AdminRow) {
  const record = row as unknown as Record<string, unknown>;
  const nested = (value: unknown) => (value && typeof value === 'object' ? String((value as { name?: string }).name ?? '') : '');
  return [record.name, record.levelName, record.slug, record.code, record.email, nested(record.locationId), nested(record.userId)].filter(Boolean).join(' ');
}

export const rowLabel = (row: AdminRow) => {
  const record = row as unknown as { name?: string; levelName?: string };
  return record.name ?? record.levelName ?? '';
};

