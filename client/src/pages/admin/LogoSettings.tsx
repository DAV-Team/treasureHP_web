import { ImageUp, Loader2, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { describeApiError } from '../../lib/apiError';
import { resolveUploadUrl } from '../../lib/uploads';
import { getAppSettings, resetLogo, uploadLogo } from '../../services/settings';

const maxBytes = 2 * 1024 * 1024;
const acceptedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

// Lets an admin replace the icon + wordmark the Navbar falls back to with an uploaded image.
export function LogoSettings() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getAppSettings().then((settings) => setLogoUrl(settings.logoUrl)).catch(() => undefined);
  }, []);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    event.target.value = '';
    if (!file) return;
    setError('');
    if (!acceptedTypes.includes(file.type)) { setError('Chỉ chấp nhận ảnh PNG, JPG, WEBP hoặc SVG.'); return; }
    if (file.size > maxBytes) { setError('Ảnh phải nhỏ hơn 2MB.'); return; }
    setBusy(true);
    try {
      setLogoUrl((await uploadLogo(file)).logoUrl);
    } catch (caught) {
      setError(describeApiError(caught, 'Không thể tải logo lên. Hãy thử lại.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError('');
    try {
      setLogoUrl((await resetLogo()).logoUrl);
    } catch (caught) {
      setError(describeApiError(caught, 'Không thể khôi phục logo mặc định. Hãy thử lại.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-200">
          {logoUrl ? <img src={resolveUploadUrl(logoUrl)} alt="Logo hiện tại" className="size-full object-contain" /> : <ImageUp className="size-6 text-slate-400" aria-hidden />}
        </span>
        <div>
          <h2 className="font-extrabold text-[#12294D]">Logo trang web</h2>
          <p className="text-sm text-slate-600">PNG, JPG, WEBP hoặc SVG, tối đa 2MB. Hiển thị ở thanh điều hướng cho mọi người dùng.</p>
          {error && <p role="alert" className="mt-1 text-sm font-semibold text-rose-600">{error}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <input ref={inputRef} type="file" accept={acceptedTypes.join(',')} onChange={(event) => void handleFile(event)} className="hidden" aria-label="Tải logo lên" />
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImageUp className="size-4" aria-hidden />}
          {logoUrl ? 'Đổi logo' : 'Tải logo lên'}
        </Button>
        {logoUrl && (
          <Button variant="ghost" onClick={() => void remove()} disabled={busy}>
            <RotateCcw className="size-4" aria-hidden />Khôi phục mặc định
          </Button>
        )}
      </div>
    </Card>
  );
}
