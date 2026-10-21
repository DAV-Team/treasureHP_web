import { ImageUp } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { FormField } from '../../components/common/FormField';
import { describeApiError } from '../../lib/apiError';
import { getAppSettings, setLogoUrl } from '../../services/settings';

// Lets an admin replace the icon + wordmark the Navbar falls back to, by pointing it at a hosted image -
// the same "paste a link" pattern used for every other image in the app (avatars, location covers, ...).
export function LogoSettings() {
  const [logoUrl, setLogoUrlField] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getAppSettings().then((settings) => setLogoUrlField(settings.logoUrl ?? '')).catch(() => undefined);
  }, []);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setSaved(false);
    try {
      setLogoUrlField((await setLogoUrl(logoUrl.trim())).logoUrl ?? '');
      setSaved(true);
    } catch (caught) {
      setError(describeApiError(caught, 'Không thể lưu. Hãy kiểm tra đường dẫn (bắt đầu bằng http:// hoặc https://).'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-6 p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
          {logoUrl.trim() ? <img src={logoUrl.trim()} alt="Logo hiện tại" className="size-full object-contain" /> : <ImageUp className="size-6 text-slate-400" aria-hidden />}
        </span>
        <div>
          <h2 className="font-extrabold text-[#12294D]">Logo trang web</h2>
          <p className="text-sm text-slate-600">Hiển thị ở thanh điều hướng cho mọi người dùng. Để trống để dùng biểu tượng mặc định.</p>
        </div>
      </div>
      <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={save}>
        <FormField label="Đường dẫn logo" type="url" value={logoUrl} onChange={(event) => setLogoUrlField(event.target.value)} placeholder="https://..." className="flex-1" />
        <Button type="submit" disabled={busy} className="shrink-0">{busy ? 'Đang lưu...' : 'Lưu'}</Button>
      </form>
      {saved && !error && <p role="status" className="mt-2 text-sm font-semibold text-emerald-600">Đã lưu.</p>}
      {error && <p role="alert" className="mt-2 text-sm font-semibold text-rose-600">{error}</p>}
    </Card>
  );
}
