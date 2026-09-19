interface ProgressBarProps {
  value: number;
  label: string;
  /** Use "dark" on navy backgrounds so the track and fill stay visible. */
  tone?: 'light' | 'dark';
}

export function ProgressBar({ value, label, tone = 'light' }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={percentage}>
      <div className={`h-2 overflow-hidden rounded-full ${tone === 'dark' ? 'bg-white/20' : 'bg-slate-200'}`}>
        <div className={`h-full rounded-full transition-all ${tone === 'dark' ? 'bg-gold' : 'bg-[#12294D]'}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
