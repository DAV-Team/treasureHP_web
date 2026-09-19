import { MapPin } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { useAuth } from '../hooks/useAuth';
import { apiErrorStatus, describeApiError } from '../lib/apiError';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination: string = location.state?.from?.pathname ?? '/map';
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  // Someone who is already signed in has no reason to see this page.
  if (user) return <Navigate to={destination} replace />;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email')).trim();
    const password = String(data.get('password'));
    if (isRegister && password !== String(data.get('confirmPassword'))) {
      setError('Mật khẩu xác nhận chưa khớp.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) await register(String(data.get('name')).trim(), email, password);
      else await login(email, password);
      navigate(destination, { replace: true });
    } catch (caught) {
      const status = apiErrorStatus(caught);
      if (isRegister) setError(status === 409 ? 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.' : describeApiError(caught, 'Không thể tạo tài khoản. Hãy kiểm tra lại thông tin.'));
      else setError(describeApiError(caught, 'Email hoặc mật khẩu chưa đúng.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-paper lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy-deep lg:block">
        <img src="/images/opera-house.jpg" alt="" className="absolute inset-0 size-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-navy-deep/40 to-transparent" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <p className="font-script text-4xl leading-snug">Khám phá Hải Phòng theo cách của bạn</p>
          <p className="mt-3 max-w-sm text-sm text-white/80">Đăng nhập để lưu tiến độ, XP và huy hiệu trên mọi thiết bị.</p>
        </div>
      </aside>
      <div className="grid place-items-center px-4 py-10">
        <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-100 sm:p-8">
          <Link to="/" className="inline-flex items-center gap-1.5 font-brand text-xl font-extrabold text-navy"><MapPin className="size-6 fill-gold" />Culture Quest</Link>
          <h1 className="mt-6 text-2xl font-extrabold text-navy">{isRegister ? 'Tạo tài khoản' : 'Chào mừng trở lại'}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{isRegister ? 'Bắt đầu hành trình khám phá Hải Phòng.' : 'Tiếp tục hành trình khám phá của bạn.'}</p>
          <form className="mt-6 space-y-4" onSubmit={submit}>
            {isRegister && <FormField label="Tên hiển thị" name="name" required minLength={2} maxLength={60} autoComplete="name" />}
            <FormField label="Email" name="email" type="email" required autoComplete="email" />
            <FormField label="Mật khẩu" name="password" type="password" required minLength={8} autoComplete={isRegister ? 'new-password' : 'current-password'} hint={isRegister ? 'Tối thiểu 8 ký tự.' : undefined} />
            {isRegister && <FormField label="Xác nhận mật khẩu" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />}
            {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
            <Button className="w-full" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang xử lý...' : isRegister ? 'Tạo tài khoản' : 'Đăng nhập'}</Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-600">
            {isRegister ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}{' '}
            <Link className="font-bold text-navy hover:underline" to={isRegister ? '/login' : '/register'} state={location.state}>{isRegister ? 'Đăng nhập' : 'Tạo tài khoản'}</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
