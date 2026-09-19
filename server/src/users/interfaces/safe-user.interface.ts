import type { UserRole } from '../schemas/user.schema.js';

export interface SafeUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  level: number;
  totalXp: number;
  role: UserRole;
}
