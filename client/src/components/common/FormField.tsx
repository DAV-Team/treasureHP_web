import { Eye, EyeOff } from 'lucide-react';
import { useId, useState, type InputHTMLAttributes } from 'react';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  hint?: string;
}

export const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-navy focus:ring-2 focus:ring-navy/15 disabled:bg-slate-50 disabled:text-slate-500';

export function FormField({ label, hint, type = 'text', className = '', ...props }: FormFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700">{label}</label>
      <div className="relative mt-1.5">
        <input id={id} type={isPassword && visible ? 'text' : type} aria-describedby={hint ? `${id}-hint` : undefined} className={`${inputClass} ${isPassword ? 'pr-11' : ''}`} {...props} />
        {isPassword && (
          <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? `Ẩn ${label.toLowerCase()}` : `Hiện ${label.toLowerCase()}`} className="absolute inset-y-0 right-1 grid w-10 place-items-center rounded-full text-slate-400 transition hover:text-navy">
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
