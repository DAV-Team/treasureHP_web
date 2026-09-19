import { ArrowRight, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/common/Navbar';
import { categories, categoryOrder } from '../lib/categories';

export function HomePage() {
  return (
    <div className="min-h-screen bg-paper text-slate-800">
      <Navbar />
      <main>
        <section className="relative isolate overflow-hidden bg-[#2b7fb0]">
          <img src="/images/opera-house.jpg" alt="Nhà hát thành phố Hải Phòng" className="absolute inset-y-0 right-0 -z-20 h-full w-full object-cover object-[70%_30%] [mask-image:linear-gradient(to_right,transparent_5%,black_55%)] sm:w-4/5 lg:w-3/4" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1e6f9f]/80 via-[#1e6f9f]/35 to-transparent" />
          <div className="mx-auto flex min-h-[460px] max-w-7xl items-center px-6 pb-28 pt-12 sm:min-h-[520px] sm:px-10">
            <div className="max-w-md text-white">
              <div className="relative">
                <h1 className="font-script text-4xl leading-[1.25] drop-shadow-md sm:text-5xl">Khám phá Hải Phòng theo cách của bạn</h1>
                <Send className="absolute -right-2 -top-7 hidden size-9 -rotate-12 text-white/80 animate-float sm:block" aria-hidden />
              </div>
              <p className="mt-5 text-sm font-medium leading-7 text-white/95">Đến - Khám phá - Giải đố - Hiểu văn hóa - Nhận thưởng</p>
              <Link to="/quests/select" className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-navy px-6 text-sm font-bold text-white shadow-xl shadow-navy/30 transition hover:scale-[1.03] hover:bg-navy-deep">
                Bắt đầu Quest <span className="grid size-6 place-items-center rounded-full bg-sky-400/90"><ArrowRight className="size-3.5" /></span>
              </Link>
            </div>
          </div>
          <svg className="absolute inset-x-0 bottom-0 -z-0 h-16 w-full text-paper sm:h-24" viewBox="0 0 1440 120" preserveAspectRatio="none" aria-hidden>
            <path fill="currentColor" d="M0 70c120-40 240-50 380-30s260 60 420 50 300-60 440-60 140 20 200 30v40H0z" />
          </svg>
        </section>

        <section className="relative z-10 mx-auto -mt-10 max-w-4xl px-4 pb-16 sm:-mt-14">
          <ul className="grid grid-cols-5 gap-2 sm:gap-6">
            {categoryOrder.map((key) => {
              const { label, icon: Icon, tint } = categories[key];
              return (
                <li key={key}>
                  <Link to={`/map?category=${key}`} className="group flex flex-col items-center gap-2 text-center">
                    <span className={`grid size-14 place-items-center rounded-full shadow-md ring-4 ring-white transition group-hover:-translate-y-1 group-hover:shadow-lg sm:size-[72px] ${tint}`}><Icon className="size-6 sm:size-8" /></span>
                    <span className="text-[11px] font-bold text-navy sm:text-sm">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
