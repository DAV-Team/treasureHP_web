import { TriangleAlert } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// A destructive action always goes through this instead of window.confirm, so it is styled and testable.
export function ConfirmDialog({ isOpen, title, message, confirmLabel = 'Xóa', busy = false, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} className="max-w-md">
      <div className="flex gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-rose-100 text-rose-600"><TriangleAlert className="size-5" /></span>
        <p className="pt-1 text-sm leading-6 text-slate-600">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel} disabled={busy}>Hủy</Button>
        <Button onClick={onConfirm} disabled={busy} className="bg-rose-600 hover:bg-rose-700">{busy ? 'Đang xóa...' : confirmLabel}</Button>
      </div>
    </Modal>
  );
}
