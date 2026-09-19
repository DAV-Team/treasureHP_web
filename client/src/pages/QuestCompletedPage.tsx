import { ArrowRight, Compass, PartyPopper, ShieldCheck, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { categories, categoryOrder } from '../lib/categories';
import { getLocations } from '../services/locations';

const stars = [
  { left: '10%', top: '14%', size: 'size-6', delay: '0s' },
  { left: '84%', top: '20%', size: 'size-5', delay: '0.6s' },
  { left: '18%', top: '68%', size: 'size-4', delay: '1.1s' },
  { left: '90%', top: '62%', size: 'size-7', delay: '1.6s' },
  { left: '48%', top: '8%', size: 'size-4', delay: '0.3s' },
];

export function QuestCompletedPage() {
  const [params] = useSearchParams();
  const locationId = params.get('locationId');
  const [summary, setSummary] = useState({ xp: 50, completed: 1, total: 5 });

  useEffect(() => {
    getLocations()
      .then((locations) => {
        if (locations.length === 0) return;
        const earned = locations.find((location) => location._id === locationId);
        setSummary({
          xp: earned?.xpReward ?? 50,
          completed: locations.filter((location) => location.progress?.status === 'completed').length,
          total: locations.length,
        });
      })
      .catch(() => undefined);
  }, [locationId]);

  const slots = Array.from({ length: Math.min(summary.total, 6) }, (_, index) => index);
  const percentage = Math.round((summary.completed / summary.total) * 100);

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-gradient-to-b from-navy-deep via-navy to-[#173a6e] px-4 py-10 text-center text-white">
      {stars.map((star) => (
        <Sparkles key={star.left} aria-hidden className={`absolute animate-twinkle text-gold ${star.size}`} style={{ left: star.left, top: star.top, animationDelay: star.delay }} />
      ))}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-sky-900/40 to-transparent" />

      <section className="relative w-full max-w-md">
        <h1 className="flex items-center justify-center gap-2 font-brand text-3xl font-extrabold tracking-wide text-gold sm:text-4xl">
          <PartyPopper className="size-7 text-gold" aria-hidden />QUEST COMPLETED!
        </h1>

        <div className="mx-auto mt-8 grid size-32 place-items-center rounded-full bg-gradient-to-b from-amber-200 to-amber-500 shadow-[0_0_0_10px_rgba(245,185,66,0.18),0_0_60px_rgba(245,185,66,0.35)] animate-float">
          <span className="grid size-24 place-items-center rounded-full border-4 border-white/70 bg-navy text-gold"><ShieldCheck className="size-12" /></span>
        </div>
        <h2 className="mt-5 text-xl font-extrabold">History Hunter</h2>
        <p className="mt-1 text-2xl font-extrabold text-gold">+{summary.xp} XP</p>

        <div className="mt-8 rounded-2xl bg-white/10 p-5 text-left ring-1 ring-white/15 backdrop-blur">
          <div className="flex justify-between text-sm font-semibold">
            <span>Địa điểm đã khám phá</span>
            <span>{summary.completed}/{summary.total}</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15" role="progressbar" aria-label="Địa điểm đã khám phá" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
            <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-gold transition-all" style={{ width: `${percentage}%` }} />
          </div>
          <div className="mt-4 flex justify-between gap-2">
            {slots.map((index) => {
              const done = index < summary.completed;
              const category = categories[categoryOrder[index % categoryOrder.length]];
              return (
                <span key={index} className={`grid size-10 place-items-center rounded-full ring-2 ${done ? 'bg-white ring-white' : 'border-2 border-dashed border-white/30 ring-transparent'}`} style={done ? { color: category.color } : undefined}>
                  {done && <category.icon className="size-5" />}
                </span>
              );
            })}
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link to="/map" className="flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/40 bg-white/5 px-5 text-sm font-bold transition hover:bg-white/15">Khám phá tiếp <Compass className="size-4" /></Link>
          <Link to="/map" className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-navy transition hover:bg-slate-100">Xem bản đồ <ArrowRight className="size-4" /></Link>
        </div>
      </section>
    </main>
  );
}
