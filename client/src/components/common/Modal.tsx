import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Keep the title for assistive tech only, for dialogs that draw their own header. */
  hideTitle?: boolean;
  className?: string;
}

export function Modal({ children, isOpen, onClose, title, hideTitle = false, className = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const closeButton = (
    <button type="button" onClick={onClose} aria-label="Đóng" className="grid size-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100">
      <X className="size-5" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-deep/55 p-4 backdrop-blur-sm" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`relative max-h-[92vh] w-full overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6 ${className}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {hideTitle ? (
          <>
            <h2 id="modal-title" className="sr-only">{title}</h2>
            {children}
            <div className="absolute right-3 top-3">{closeButton}</div>
          </>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 id="modal-title" className="text-lg font-extrabold text-navy">{title}</h2>
              {closeButton}
            </div>
            {children}
          </>
        )}
      </section>
    </div>
  );
}
