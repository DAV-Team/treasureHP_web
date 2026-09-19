import { Building2, Landmark, Palette, Soup, Theater, type LucideIcon } from 'lucide-react';

export type Category = 'history' | 'culture' | 'cuisine' | 'architecture' | 'art';

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  /** Solid colour used by map markers. */
  color: string;
  /** Tailwind classes for the soft icon circle used in lists and chips. */
  tint: string;
}

// One fixed colour per category, reused by the home row, filters, map markers and cards.
export const categories: Record<Category, CategoryMeta> = {
  history: { label: 'Lịch sử', icon: Landmark, color: '#E8792B', tint: 'bg-orange-100 text-orange-600' },
  culture: { label: 'Văn hóa', icon: Theater, color: '#7C5CD6', tint: 'bg-violet-100 text-violet-600' },
  cuisine: { label: 'Ẩm thực', icon: Soup, color: '#E5484D', tint: 'bg-red-100 text-red-500' },
  architecture: { label: 'Kiến trúc', icon: Building2, color: '#1E9E6A', tint: 'bg-emerald-100 text-emerald-600' },
  art: { label: 'Nghệ thuật', icon: Palette, color: '#DB4F9C', tint: 'bg-pink-100 text-pink-600' },
};

export const categoryOrder: Category[] = ['history', 'culture', 'cuisine', 'architecture', 'art'];

export function isCategory(value: string | null): value is Category {
  return value !== null && value in categories;
}
