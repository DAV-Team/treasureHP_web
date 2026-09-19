import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <article className={`overflow-hidden rounded-lg border border-slate-100 bg-white shadow-sm ${className}`} {...props}>
      {children}
    </article>
  );
}
