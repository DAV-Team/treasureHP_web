import { ArrowLeft, ArrowRight, Clock3, LayoutGrid, MousePointerClick, Tag } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Chip } from '../components/common/Chip';
import { Navbar } from '../components/common/Navbar';
import { categories, categoryOrder, isCategory } from '../lib/categories';

const durations = ['30 phút', '1 giờ', '2+ giờ'];
const choices = [
  { type: 'full', name: 'Full Quest', description: 'Khám phá toàn bộ những địa điểm nổi bật của Hải Phòng theo một hành trình hoàn chỉnh.', action: 'Bắt đầu', image: '/images/card-full-quest.jpg', variant: 'primary', recommended: true },
  { type: 'mini', name: 'Mini Quest', description: 'Chọn 1-3 địa điểm bạn yêu thích và tạo hành trình riêng.', action: 'Tùy chọn', image: '/images/card-mini-quest.jpg', variant: 'outline', recommended: false },
  { type: 'explore', name: 'Explore Freely', description: 'Tự do khám phá bất kỳ địa điểm nào trên bản đồ.', action: 'Khám phá', image: '/images/card-explore.jpg', variant: 'outline', recommended: false },
] as const;

export function QuestSelectPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const categoryParam = params.get('category');
  const category = isCategory(categoryParam) ? categoryParam : 'all';
  const duration = params.get('duration') ?? '1 giờ';

  const setFilter = (name: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(name, value);
    setParams(next, { replace: true });
  };
  const openMap = (type: string) => {
    const search = new URLSearchParams({ type, duration });
    if (category !== 'all') search.set('category', category);
    navigate(`/map?${search.toString()}`);
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-navy"><ArrowLeft className="size-4" /> Quay lại</Link>
        <h1 className="mt-4 text-2xl font-extrabold text-navy sm:text-3xl">Chọn cách bạn muốn khám phá</h1>
        <p className="mt-1.5 text-sm text-slate-600">Tùy chỉnh hành trình của bạn và bắt đầu ngay!</p>

        <section className="mt-6 grid gap-4 md:grid-cols-3 md:gap-5">
          {choices.map((choice) => (
            <article key={choice.type} className={`relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${choice.recommended ? 'ring-2 ring-sky-500' : 'ring-1 ring-slate-100'}`}>
              {choice.recommended && <span className="absolute right-3 top-3 z-10 rounded-full bg-navy/90 px-3 py-1 text-[11px] font-bold text-white">Được đề xuất</span>}
              <img src={choice.image} alt="" className="h-36 w-full object-cover" />
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-extrabold text-navy">{choice.name}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{choice.description}</p>
                <Button variant={choice.variant} onClick={() => openMap(choice.type)} className="mt-5 w-full">
                  {choice.action} {choice.variant === 'primary' ? <ArrowRight className="size-4" /> : <MousePointerClick className="size-4" />}
                </Button>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-6 grid gap-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-navy"><Tag className="size-4" /> Lọc theo chủ đề</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Chip selected={category === 'all'} onClick={() => setFilter('category', 'all')}><LayoutGrid className="size-3.5" />Tất cả</Chip>
              {categoryOrder.map((key) => {
                const { label, icon: Icon, color } = categories[key];
                return <Chip key={key} selected={category === key} onClick={() => setFilter('category', key)}><Icon className="size-3.5" style={category === key ? undefined : { color }} />{label}</Chip>;
              })}
            </div>
          </div>
          <div>
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-navy"><Clock3 className="size-4" /> Thời gian</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {durations.map((item) => <Chip key={item} selected={duration === item} onClick={() => setFilter('duration', item)}>{item}</Chip>)}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
