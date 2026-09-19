import { Award, BookOpen, Compass, Flag, MapPin, Trophy, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Avatar } from '../components/common/Avatar';
import { Badge } from '../components/common/Badge';
import { Navbar } from '../components/common/Navbar';
import { ProgressBar } from '../components/common/ProgressBar';
import { SafeImage } from '../components/common/SafeImage';
import { useAuth } from '../hooks/useAuth';
import { getMyBadges } from '../services/badges';
import { getLocations } from '../services/locations';
import { getUserProgress, type UserProgress } from '../services/progress';

interface BadgeView { key: string; name: string; description: string; locked: boolean }

const badgeStyles: Array<{ icon: LucideIcon; gradient: string }> = [
  { icon: Trophy, gradient: 'from-amber-300 to-orange-500' },
  { icon: UtensilsCrossed, gradient: 'from-red-400 to-orange-500' },
  { icon: BookOpen, gradient: 'from-yellow-300 to-amber-500' },
  { icon: Award, gradient: 'from-violet-400 to-purple-600' },
];

// Shown to guests and while the API is unreachable.
const demoBadges: BadgeView[] = [
  { key: 'history', name: 'History Hunter', description: 'Khám phá 3 địa điểm lịch sử', locked: false },
  { key: 'food', name: 'Food Explorer', description: 'Thử 3 món ăn địa phương', locked: false },
  { key: 'keeper', name: 'Culture Keeper', description: 'Tìm hiểu 5 câu chuyện văn hóa', locked: true },
  { key: 'master', name: 'City Master', description: 'Hoàn thành Full Quest Hải Phòng', locked: true },
];

export function ProfilePage() {
  const [tab, setTab] = useState<'badges' | 'history'>('badges');
  const { user } = useAuth();
  const [badges, setBadges] = useState<BadgeView[]>(demoBadges);
  const [progress, setProgress] = useState<UserProgress[] | null>(null);
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    getMyBadges()
      .then((data) => { if (data.length) setBadges(data.map((badge) => ({ key: badge._id, name: badge.name, description: badge.description, locked: !badge.unlocked }))); })
      .catch(() => undefined);
    getUserProgress().then(setProgress).catch(() => undefined);
    getLocations()
      .then((data) => setLocationNames(Object.fromEntries(data.map((location) => [location._id, location.name]))))
      .catch(() => undefined);
  }, [user]);

  const name = user?.name ?? 'Mai Phương Anh';
  const level = user?.level ?? 2;
  const xp = user?.totalXp ?? 150;
  const xpPerLevel = 100;
  const completed = progress?.filter((item) => item.status === 'completed') ?? [];
  const stats = progress
    ? [
      { icon: MapPin, color: 'text-rose-500', value: completed.length, label: 'Địa điểm đã khám phá' },
      { icon: Award, color: 'text-amber-500', value: badges.filter((badge) => !badge.locked).length, label: 'Huy hiệu đã nhận' },
      { icon: Compass, color: 'text-sky-500', value: progress.filter((item) => item.status !== 'completed' && item.answeredQuestions.length > 0).length, label: 'Quest đang chơi' },
    ]
    : [
      { icon: MapPin, color: 'text-rose-500', value: 5, label: 'Địa điểm đã khám phá' },
      { icon: Award, color: 'text-amber-500', value: 3, label: 'Huy hiệu đã nhận' },
      { icon: Compass, color: 'text-sky-500', value: 2, label: 'Quest đang chơi' },
    ];

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto grid max-w-6xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <section className="rounded-2xl bg-gradient-to-br from-navy-deep to-navy p-5 text-white shadow-md">
            <div className="flex items-center gap-4">
              <Avatar name={name} src={user?.avatarUrl} className="size-16 text-lg ring-4 ring-white/20" />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-extrabold">{name}</h1>
                <p className="mt-0.5 text-xs font-medium text-sky-200">Level {level} - Culture Seeker</p>
              </div>
            </div>
            <div className="mt-5">
              <div className="mb-2 flex justify-between text-xs font-semibold text-sky-100">
                <span>{xp % xpPerLevel} / {xpPerLevel} XP</span>
                <span>Level {level + 1}</span>
              </div>
              <ProgressBar label="Tiến độ cấp độ" value={xp % xpPerLevel} tone="dark" />
            </div>
          </section>

          <ul className="grid grid-cols-3 gap-3 lg:grid-cols-1">
            {stats.map(({ icon: Icon, color, value, label }) => (
              <li key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100 lg:flex-row lg:gap-4 lg:text-left">
                <Icon className={`size-5 ${color}`} aria-hidden />
                <strong className="text-2xl font-extrabold text-navy lg:w-10">{value}</strong>
                <span className="text-[11px] leading-4 text-slate-600 sm:text-xs">{label}</span>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div role="tablist" className="flex border-b border-slate-200">
            {([['badges', 'Huy hiệu'], ['history', 'Lịch sử']] as const).map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`-mb-px px-5 py-3 text-sm font-bold transition ${tab === id ? 'border-b-2 border-navy text-navy' : 'text-slate-400 hover:text-slate-600'}`}>{label}</button>
            ))}
          </div>

          {tab === 'badges' ? (
            <div className="mt-6">
              <h2 className="text-lg font-extrabold text-navy">Bộ sưu tập huy hiệu</h2>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {badges.map((badge, index) => {
                  const style = badgeStyles[index % badgeStyles.length];
                  return <Badge key={badge.key} locked={badge.locked} name={badge.name} description={badge.description} gradient={style.gradient} icon={<style.icon className="size-8" />} className="bg-paper" />;
                })}
              </div>
            </div>
          ) : (
            <div className="mt-6">
              <h2 className="text-lg font-extrabold text-navy">Hành trình gần đây</h2>
              <ul className="mt-4 space-y-3">
                {(progress ? completed : [{ locationId: 'demo', xpEarned: 50 }]).map((item) => (
                  <li key={item.locationId} className="flex items-center gap-4 rounded-xl bg-paper p-4">
                    <span className="grid size-10 place-items-center rounded-full bg-emerald-100 text-emerald-700"><Flag className="size-5" /></span>
                    <div>
                      <h3 className="font-bold text-navy">{locationNames[item.locationId] ?? 'Nhà hát thành phố Hải Phòng'}</h3>
                      <p className="text-sm text-slate-600">Hoàn thành thử thách, nhận {item.xpEarned} XP</p>
                    </div>
                  </li>
                ))}
              </ul>
              {progress && completed.length === 0 && <p className="text-sm text-slate-500">Bạn chưa hoàn thành địa điểm nào. Hãy bắt đầu một Quest!</p>}
            </div>
          )}

          <figure className="mt-8 flex items-center gap-4 overflow-hidden rounded-2xl bg-sky-50 p-4">
            <blockquote className="flex-1 text-sm italic leading-6 text-navy">“Mỗi địa điểm là một câu chuyện, mỗi câu chuyện là một hành trình khám phá.”</blockquote>
            <SafeImage src="/images/lighthouse.jpg" alt="" className="h-20 w-28 shrink-0 rounded-xl object-cover" />
          </figure>
        </section>
      </main>
    </div>
  );
}
