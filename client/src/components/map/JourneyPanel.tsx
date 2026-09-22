import { Check, Flag, Loader2 } from 'lucide-react';
import { categories } from '../../lib/categories';
import type { JourneyType } from '../../lib/journey';
import type { MapLocation } from '../../lib/mapLocations';
import { Button } from '../common/Button';

interface JourneyPanelProps {
  /** `picking` lets the player choose the journey's locations; `active` tracks a journey already started. */
  mode: 'picking' | 'active';
  type?: JourneyType;
  locations: MapLocation[];
  pickedIds: string[];
  required: number;
  selectedId: string | null;
  onToggle?: (id: string) => void;
  onFocus: (id: string) => void;
  onStart?: () => void;
  busy?: boolean;
  error?: string;
}

const typeNames: Record<JourneyType, string> = { full: 'Full Quest', mini: 'Mini Quest' };

// Lists the journey's locations: checkboxes while choosing (exactly `required`), progress ticks once started.
export function JourneyPanel({ mode, type, locations, pickedIds, required, selectedId, onToggle, onFocus, onStart, busy = false, error }: JourneyPanelProps) {
  const picking = mode === 'picking';
  const full = pickedIds.length >= required;
  const rows = picking ? locations : locations.filter((location) => pickedIds.includes(location.id));
  const doneCount = rows.filter((location) => location.status === 'completed').length;

  return (
    <section aria-label="Hành trình" className="mb-4 rounded-xl bg-sky-50 p-3 ring-1 ring-sky-100">
      <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-navy">
        <Flag className="size-4" aria-hidden />{picking && type ? `${typeNames[type]} - chọn ${required} địa điểm` : 'Hành trình của bạn'}
      </h2>
      <p role="status" className="mt-1 text-xs font-semibold text-slate-600">
        {picking ? `Đã chọn ${pickedIds.length}/${required}` : `Đã hoàn thành ${doneCount}/${rows.length}`}
      </p>
      <ul className="mt-2 space-y-1">
        {rows.map((location) => {
          const { icon: Icon, color, label } = categories[location.category];
          const picked = pickedIds.includes(location.id);
          const done = location.status === 'completed';
          return (
            <li key={location.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${location.id === selectedId ? 'bg-white shadow-sm' : ''}`}>
              {picking && (
                <input
                  type="checkbox"
                  aria-label={`Chọn ${location.name} cho hành trình`}
                  checked={picked}
                  disabled={!picked && full}
                  onChange={() => onToggle?.(location.id)}
                  className="size-4 shrink-0 cursor-pointer rounded accent-navy disabled:cursor-not-allowed"
                />
              )}
              <button type="button" onClick={() => onFocus(location.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left font-medium text-slate-700">
                <Icon className="size-3.5 shrink-0" style={{ color }} aria-label={label} />
                <span className="truncate">{location.name}</span>
              </button>
              {!picking && (done
                ? <Check className="size-4 shrink-0 text-emerald-600" aria-label="Đã hoàn thành" />
                : <span className="size-4 shrink-0 rounded-full border-2 border-dashed border-slate-300" aria-label="Chưa hoàn thành" />)}
            </li>
          );
        })}
      </ul>
      {picking && (
        <>
          <Button onClick={onStart} disabled={!full || busy} className="mt-3 w-full">
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}Bắt đầu hành trình
          </Button>
          {!full && <p className="mt-2 text-[11px] text-slate-500">Chọn đủ {required} địa điểm để bắt đầu.</p>}
          {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-500">{error}</p>}
        </>
      )}
    </section>
  );
}
