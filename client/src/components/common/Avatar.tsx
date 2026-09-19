import { useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  className?: string;
}

// Falls back to initials when there is no picture or the URL fails to load.
export function Avatar({ name, src, className = 'size-8 text-[11px]' }: AvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const base = `shrink-0 rounded-full ${className}`;
  if (src && failedSrc !== src) {
    return <img src={src} alt="" className={`${base} object-cover`} onError={() => setFailedSrc(src)} />;
  }
  return <span aria-hidden className={`${base} grid place-items-center bg-gold/30 font-extrabold uppercase text-navy`}>{name.trim().slice(0, 2)}</span>;
}
