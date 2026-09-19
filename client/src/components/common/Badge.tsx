import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';

interface BadgeProps {
  icon: ReactNode;
  name: string;
  description: string;
  locked?: boolean;
  /** Tailwind gradient stops for the unlocked medallion, e.g. "from-amber-300 to-orange-500". */
  gradient?: string;
  className?: string;
}

export function Badge({ icon, name, description, locked = false, gradient = 'from-amber-300 to-orange-500', className = '' }: BadgeProps) {
  return (
    <article className={`flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100 ${locked ? 'text-slate-400' : 'text-navy'} ${className}`}>
      <div className={`relative grid size-16 place-items-center rounded-full text-white shadow-md ${locked ? 'bg-slate-300 grayscale' : `bg-gradient-to-b ${gradient}`}`}>
        {icon}
        {locked && (
          <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-slate-600 text-white ring-2 ring-white">
            <Lock className="size-3" aria-label="Huy hiệu chưa mở khóa" />
          </span>
        )}
      </div>
      <h3 className="text-sm font-extrabold">{name}</h3>
      <p className="text-xs leading-5 text-slate-500">{description}</p>
    </article>
  );
}
