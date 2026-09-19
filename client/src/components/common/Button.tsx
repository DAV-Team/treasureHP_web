import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'outline' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-[#12294D] text-white shadow-sm hover:bg-[#1B3A6B] disabled:bg-slate-300',
  outline: 'border border-[#12294D] bg-white text-[#12294D] hover:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400',
  ghost: 'text-[#12294D] hover:bg-slate-100 disabled:text-slate-400',
};

export function Button({ children, className = '', variant = 'primary', type = 'button', ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
