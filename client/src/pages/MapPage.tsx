import { Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { LocationCard } from '../components/map/LocationCard';
import { MapView } from '../components/map/MapView';
import { Navbar } from '../components/common/Navbar';
import { categories, categoryOrder, isCategory, type Category } from '../lib/categories';
import { statusMeta, statusOrder } from '../lib/locationStatus';
import { fallbackLocations, normalizeText, toMapLocation, type MapLocation } from '../lib/mapLocations';
import { getLocations } from '../services/locations';

export function MapPage() {
  const [params] = useSearchParams();
  const initialCategory = params.get('category');
  const [allLocations, setAllLocations] = useState<MapLocation[]>(fallbackLocations);
  // An empty selection means "Tất cả".
  const [selectedCategories, setSelectedCategories] = useState<Category[]>(isCategory(initialCategory) ? [initialCategory] : []);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(fallbackLocations[0].id);

  useEffect(() => {
    getLocations()
      .then((data) => {
        if (data.length === 0) return;
        const next = data.map(toMapLocation);
        setAllLocations(next);
        setSelectedId((current) => (next.some((location) => location.id === current) ? current : next[0].id));
      })
      .catch(() => undefined);
  }, []);

  const visible = useMemo(() => {
    const needle = normalizeText(query.trim());
    return allLocations.filter((location) => (
      (selectedCategories.length === 0 || selectedCategories.includes(location.category))
      && (needle === '' || normalizeText(location.name).includes(needle))
    ));
  }, [allLocations, selectedCategories, query]);

  const selected = visible.find((location) => location.id === selectedId) ?? null;
  const toggleCategory = (category: Category) => setSelectedCategories((current) => (
    current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
  ));

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="relative lg:h-[calc(100vh-4rem)]">
        <h1 className="sr-only">Khám phá Hải Phòng</h1>

        <aside className="z-10 m-3 rounded-2xl bg-white p-4 shadow-lg ring-1 ring-slate-100 lg:absolute lg:left-4 lg:top-4 lg:m-0 lg:w-64">
          <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 focus-within:border-navy">
            <Search className="size-4 shrink-0" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-slate-800 outline-none placeholder:text-slate-400" placeholder="Tìm địa điểm..." aria-label="Tìm địa điểm" />
          </label>

          <h2 className="mt-4 text-sm font-extrabold text-navy">Danh mục</h2>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 lg:flex-col lg:gap-y-2.5">
            <CategoryCheckbox label="Tất cả" checked={selectedCategories.length === 0} onChange={() => setSelectedCategories([])} />
            {categoryOrder.map((category) => (
              <CategoryCheckbox key={category} label={categories[category].label} checked={selectedCategories.includes(category)} onChange={() => toggleCategory(category)} color={categories[category].color} />
            ))}
          </div>

          <h2 className="mt-4 text-sm font-extrabold text-navy">Trạng thái</h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-600 lg:flex-col lg:gap-y-2.5">
            {statusOrder.map((status) => {
              const { label, color, icon: Icon } = statusMeta[status];
              return (
                <li key={status} className="flex items-center gap-2">
                  <span className="grid size-5 place-items-center rounded-full text-white" style={{ backgroundColor: color }}><Icon className="size-3" strokeWidth={3} /></span>
                  {label}
                </li>
              );
            })}
          </ul>
        </aside>

        <section className="relative lg:absolute lg:inset-0" aria-label="Bản đồ Hải Phòng">
          {/* isolate: Leaflet panes use z-indexes up to 1000, which must not climb over the filter panel and location card. */}
          <div className="relative isolate h-[55vh] min-h-80 lg:h-full">
            <MapView locations={visible} selectedId={selectedId} onSelect={setSelectedId} />
            {visible.length === 0 && (
              <p role="status" className="absolute left-1/2 top-6 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-lg">Không có địa điểm nào khớp bộ lọc.</p>
            )}
          </div>
          {selected && <LocationCard location={selected} className="z-10 mx-3 mb-4 sm:absolute sm:inset-x-auto sm:bottom-6 sm:right-4 sm:mx-0 sm:mb-0 sm:w-80" />}
        </section>
      </main>
    </div>
  );
}

function CategoryCheckbox({ label, checked, onChange, color }: { label: string; checked: boolean; onChange: () => void; color?: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-700">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 cursor-pointer rounded accent-navy" />
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />}
      {label}
    </label>
  );
}
