import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return <main className="grid min-h-full place-items-center bg-slate-50 p-6 text-center"><div><h1 className="text-2xl font-bold text-[#12294D]">Trang đang được mở khóa</h1><Link className="mt-4 inline-block text-sm font-semibold text-[#12294D] underline" to="/">Về trang chủ</Link></div></main>;
}
