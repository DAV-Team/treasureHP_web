import { categories } from '../../lib/categories';
import { statusMeta } from '../../lib/locationStatus';
import type { MapLocation } from '../../lib/mapLocations';

interface LocationMarkerProps {
  location: MapLocation;
  selected: boolean;
  onSelect: (id: string) => void;
}

// Round pin coloured by progress state. The glyph is the category icon while a quest is playable.
export function LocationMarker({ location, selected, onSelect }: LocationMarkerProps) {
  const status = statusMeta[location.status];
  const Icon = location.status === 'available' ? categories[location.category].icon : status.icon;
  return (
    <button
      type="button"
      aria-label={`Chọn ${location.name}`}
      aria-pressed={selected}
      onClick={() => onSelect(location.id)}
      className={`relative grid size-10 place-items-center rounded-full border-[3px] border-white text-white shadow-lg transition-transform ${selected ? 'scale-125 ring-4 ring-navy/25' : 'hover:scale-110'}`}
      style={{ backgroundColor: status.color }}
    >
      <Icon className="size-[18px]" strokeWidth={2.5} />
      <span className="pointer-events-none absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 rounded-[2px]" style={{ backgroundColor: status.color }} aria-hidden />
    </button>
  );
}
