import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  selected?: boolean;
}

export function Chip({ children, className = '', selected = false, type = 'button', ...props }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`inline-flex min-h-8 items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        selected
          ? 'border-[#12294D] bg-[#12294D] text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-[#1B3A6B]'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
