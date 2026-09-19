import { Button } from '../../components/common/Button';

interface FormFooterProps {
  error: string;
  isSaving: boolean;
  onCancel: () => void;
  submitLabel?: string;
}

// The footer sticks one modal-padding below the visible edge, so content scrolling underneath never shows in the padding.
export function FormFooter({ error, isSaving, onCancel, submitLabel = 'Lưu' }: FormFooterProps) {
  return (
    <div className="sticky -bottom-5 -mx-5 mt-6 border-t border-slate-100 bg-white px-5 pb-5 pt-4 sm:-bottom-6 sm:-mx-6 sm:px-6 sm:pb-6">
      {error && <p role="alert" className="mb-3 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>Hủy</Button>
        <Button type="submit" disabled={isSaving}>{isSaving ? 'Đang lưu...' : submitLabel}</Button>
      </div>
    </div>
  );
}
