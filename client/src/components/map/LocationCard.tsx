import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categories } from '../../lib/categories';
import type { MapLocation } from '../../lib/mapLocations';
import { SafeImage } from '../common/SafeImage';

export function LocationCard({ location, className = '' }: { location: MapLocation; className?: string }) {
  const category = categories[location.category];
  return (
    <article className={`overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-100 ${className}`}>
      <SafeImage src={location.coverImageUrl} alt="" className="h-28 w-full object-cover sm:h-36" />
      <div className="p-4">
        <h2 className="text-base font-extrabold leading-snug text-navy">{location.name}</h2>
        <span className={`mt-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${category.tint}`}>
          <category.icon className="size-3" />{category.label}
        </span>
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-600">{location.description}</p>
        <p className="mt-3 flex items-center gap-1 text-sm font-bold text-navy">
          <Star className="size-4 fill-gold text-gold" />+{location.xp} XP
        </p>
        <Link to={`/locations/${location.id}`} className="mt-3 flex min-h-10 items-center justify-center gap-2 rounded-full bg-navy px-4 text-sm font-bold text-white transition hover:bg-navy-soft">
          Xem chi tiết <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
