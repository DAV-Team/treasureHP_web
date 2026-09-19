import { useState, type ImgHTMLAttributes } from 'react';

interface SafeImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
}

// Content from the API can point at images that are not deployed yet; fall back instead of showing a broken icon.
export function SafeImage({ src, fallbackSrc = '/images/opera-cover.jpg', alt = '', ...props }: SafeImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return <img src={failedSrc === src ? fallbackSrc : src} alt={alt} onError={() => setFailedSrc(src)} {...props} />;
}
