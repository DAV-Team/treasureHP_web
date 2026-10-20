import { ChevronDown, LayoutDashboard, LogOut, MapPin, Menu, Search, Settings, Trophy, X } from 'lucide-react';
import { useContext, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { resolveUploadUrl } from '../../lib/uploads';
import { getAppSettings } from '../../services/settings';
import { Avatar } from './Avatar';

const navItems = [
  { to: '/', label: 'Trang chủ' },
  { to: '/map', label: 'Bản đồ' },
  { to: '/quests/select', label: 'Quest của tôi' },
  { to: '/profile', label: 'Huy hiệu' },
];

const linkClass = ({ isActive }: { isActive: boolean }) => (
  `relative py-1 text-xs font-semibold transition-colors ${isActive ? 'text-navy after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-navy' : 'text-slate-500 hover:text-navy'}`
);
const menuItemClass = 'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100';

export function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isUserMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  // Pages render without an AuthProvider in isolation (tests), so read the context leniently.
  const auth = useContext(AuthContext);
  const user = auth?.user ?? null;
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    getAppSettings().then((settings) => setLogoUrl(settings.logoUrl)).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!isUserMenuOpen) return undefined;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) { if (event.key === 'Escape') setUserMenuOpen(false); return; }
      if (!userMenuRef.current?.contains(event.target as Node)) setUserMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', close); };
  }, [isUserMenuOpen]);

  const logout = () => {
    setUserMenuOpen(false);
    setMenuOpen(false);
    // Leave the page before dropping the session, otherwise a guarded page redirects to /login first.
    navigate('/');
    auth?.logout();
  };

  return (
    <header className="relative z-30 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6" aria-label="Điều hướng chính">
        <Link to="/" className="flex shrink-0 items-center gap-1 whitespace-nowrap font-brand text-lg font-extrabold text-navy sm:gap-1.5 sm:text-xl">
          {logoUrl && !logoFailed
            ? <img src={resolveUploadUrl(logoUrl)} alt="Culture Quest" className="size-8 rounded-lg object-contain" onError={() => setLogoFailed(true)} />
            : <MapPin className="size-6 fill-gold text-navy" aria-hidden />}
          <span>Culture Quest</span>
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.to === '/'} className={linkClass}>{item.label}</NavLink>)}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link to="/map" aria-label="Tìm kiếm" className="grid size-9 place-items-center rounded-full text-navy transition hover:bg-slate-100"><Search className="size-[18px]" /></Link>
          {user ? (
            <div ref={userMenuRef} className="relative hidden sm:block">
              <button type="button" aria-haspopup="menu" aria-expanded={isUserMenuOpen} onClick={() => setUserMenuOpen(!isUserMenuOpen)} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 text-xs font-bold text-navy transition hover:bg-slate-100">
                <Avatar name={user.name} src={user.avatarUrl} />
                <span className="max-w-32 truncate">{user.name}</span>
                <ChevronDown className="size-3.5" />
              </button>
              {isUserMenuOpen && (
                <div role="menu" className="absolute right-0 top-full mt-2 w-60 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-slate-100">
                  <p className="truncate px-3 pb-2 pt-1 text-xs text-slate-500">{user.email}</p>
                  <Link role="menuitem" to="/profile" onClick={() => setUserMenuOpen(false)} className={menuItemClass}><Trophy className="size-4" />Hồ sơ & huy hiệu</Link>
                  <Link role="menuitem" to="/account" onClick={() => setUserMenuOpen(false)} className={menuItemClass}><Settings className="size-4" />Cài đặt tài khoản</Link>
                  {user.role === 'admin' && <Link role="menuitem" to="/admin" onClick={() => setUserMenuOpen(false)} className={menuItemClass}><LayoutDashboard className="size-4" />Quản trị</Link>}
                  <button type="button" role="menuitem" onClick={logout} className={`${menuItemClass} text-rose-600`}><LogOut className="size-4" />Đăng xuất</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="whitespace-nowrap rounded-full bg-navy px-3 py-2 text-xs font-bold text-white transition hover:bg-navy-soft sm:px-4">Đăng nhập</Link>
          )}
          <button type="button" aria-label={isMenuOpen ? 'Đóng menu' : 'Mở menu'} aria-expanded={isMenuOpen} onClick={() => setMenuOpen(!isMenuOpen)} className="grid size-9 place-items-center rounded-full text-navy hover:bg-slate-100 md:hidden">
            {isMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>
      {isMenuOpen && (
        <div className="absolute inset-x-0 top-16 border-t border-slate-100 bg-white px-4 py-3 shadow-lg md:hidden">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMenuOpen(false)} className={({ isActive }) => `rounded-lg px-3 py-2.5 text-sm font-semibold ${isActive ? 'bg-slate-100 text-navy' : 'text-slate-600'}`}>{item.label}</NavLink>
            ))}
            {user && (
              <>
                <hr className="my-1 border-slate-100" />
                <Link to="/account" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600">Cài đặt tài khoản</Link>
                {user.role === 'admin' && <Link to="/admin" onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600">Quản trị</Link>}
                <button type="button" onClick={logout} className="rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-600">Đăng xuất</button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
