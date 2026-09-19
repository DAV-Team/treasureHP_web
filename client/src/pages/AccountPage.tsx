import { KeyRound, LogOut, UserRound } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/common/Button';
import { FormField } from '../components/common/FormField';
import { Navbar } from '../components/common/Navbar';
import { useAuth } from '../hooks/useAuth';
import { apiErrorMessage, apiErrorStatus, describeApiError } from '../lib/apiError';
import { changePassword } from '../services/auth';

type Notice = { tone: 'success' | 'error'; text: string } | null;

function NoticeText({ notice }: { notice: Notice }) {
  if (!notice) return null;
  const tone = notice.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700';
  return <p role={notice.tone === 'success' ? 'status' : 'alert'} className={`rounded-xl p-3 text-sm ${tone}`}>{notice.text}</p>;
}

export function AccountPage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [profileNotice, setProfileNotice] = useState<Notice>(null);
  const [passwordNotice, setPasswordNotice] = useState<Notice>(null);
  const [isSaving, setSaving] = useState(false);

  if (!user) return null;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setProfileNotice(null);
    try {
      await updateProfile({ name: name.trim(), avatarUrl: avatarUrl.trim() });
      setProfileNotice({ tone: 'success', text: 'Đã lưu thông tin tài khoản.' });
    } catch (caught) {
      setProfileNotice({ tone: 'error', text: describeApiError(caught, 'Không thể lưu. Hãy kiểm tra tên và đường dẫn ảnh (bắt đầu bằng http:// hoặc https://).') });
    } finally {
      setSaving(false);
    }
  }

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get('currentPassword'));
    const newPassword = String(data.get('newPassword'));
    if (newPassword !== String(data.get('confirmPassword'))) {
      setPasswordNotice({ tone: 'error', text: 'Mật khẩu xác nhận chưa khớp.' });
      return;
    }
    setPasswordNotice(null);
    try {
      await changePassword({ currentPassword, newPassword });
      form.reset();
      setPasswordNotice({ tone: 'success', text: 'Đã đổi mật khẩu. Lần đăng nhập sau hãy dùng mật khẩu mới.' });
    } catch (caught) {
      const message = apiErrorMessage(caught);
      let text = describeApiError(caught, 'Không thể đổi mật khẩu. Hãy thử lại.');
      if (apiErrorStatus(caught) === 400 && message.includes('Current password')) text = 'Mật khẩu hiện tại chưa đúng.';
      else if (apiErrorStatus(caught) === 400 && message.includes('differ')) text = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
      setPasswordNotice({ tone: 'error', text });
    }
  }

  const handleLogout = () => {
    // Leave the page before dropping the session, otherwise RequireAuth redirects to /login first.
    navigate('/', { replace: true });
    logout();
  };

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-extrabold text-navy sm:text-3xl">Cài đặt tài khoản</h1>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6" aria-labelledby="profile-heading">
          <h2 id="profile-heading" className="flex items-center gap-2 text-lg font-extrabold text-navy"><UserRound className="size-5" />Thông tin cá nhân</h2>
          <form className="mt-5 space-y-4" onSubmit={saveProfile}>
            <div className="flex items-center gap-4">
              <Avatar name={name || user.name} src={avatarUrl.trim() || undefined} className="size-16 text-lg" />
              <div className="min-w-0">
                <p className="truncate font-bold text-navy">{user.email}</p>
                <p className="text-xs text-slate-500">{user.role === 'admin' ? 'Quản trị viên' : 'Người chơi'} - Level {user.level} - {user.totalXp} XP</p>
              </div>
            </div>
            <FormField label="Tên hiển thị" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={60} autoComplete="name" />
            <FormField label="Ảnh đại diện (đường dẫn)" type="url" value={avatarUrl} onChange={(event) => setAvatarUrl(event.target.value)} placeholder="https://..." hint="Để trống để dùng chữ cái đầu của tên." />
            <NoticeText notice={profileNotice} />
            <Button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}</Button>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6" aria-labelledby="password-heading">
          <h2 id="password-heading" className="flex items-center gap-2 text-lg font-extrabold text-navy"><KeyRound className="size-5" />Đổi mật khẩu</h2>
          <form className="mt-5 space-y-4" onSubmit={submitPassword}>
            <FormField label="Mật khẩu hiện tại" name="currentPassword" type="password" required autoComplete="current-password" />
            <FormField label="Mật khẩu mới" name="newPassword" type="password" required minLength={8} autoComplete="new-password" hint="Tối thiểu 8 ký tự." />
            <FormField label="Xác nhận mật khẩu mới" name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
            <NoticeText notice={passwordNotice} />
            <Button type="submit">Đổi mật khẩu</Button>
          </form>
        </section>

        <section className="flex items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 sm:p-6">
          <div>
            <h2 className="font-extrabold text-navy">Đăng xuất</h2>
            <p className="mt-0.5 text-sm text-slate-600">Kết thúc phiên trên thiết bị này.</p>
          </div>
          <Button variant="outline" onClick={handleLogout}><LogOut className="size-4" />Đăng xuất</Button>
        </section>
      </main>
    </div>
  );
}
