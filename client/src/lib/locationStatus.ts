import { Check, Lock, MapPin, Star, type LucideIcon } from 'lucide-react';

export type LocationStatus = 'completed' | 'available' | 'locked' | 'special';

interface StatusMeta {
  label: string;
  color: string;
  icon: LucideIcon;
}

export const statusMeta: Record<LocationStatus, StatusMeta> = {
  completed: { label: 'Đã hoàn thành', color: '#22A06B', icon: Check },
  available: { label: 'Có thể chơi', color: '#2563EB', icon: MapPin },
  locked: { label: 'Chưa mở khóa', color: '#94A3B8', icon: Lock },
  special: { label: 'Quest đặc biệt', color: '#F5A524', icon: Star },
};

export const statusOrder: LocationStatus[] = ['completed', 'available', 'locked', 'special'];
