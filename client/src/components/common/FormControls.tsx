import { useId, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { inputClass } from './FormField';

interface FieldMeta {
  label: string;
  hint?: string;
  className?: string;
}

export function TextAreaField({ label, hint, className = '', rows = 3, ...props }: FieldMeta & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700">{label}</label>
      <textarea id={id} rows={rows} aria-describedby={hint ? `${id}-hint` : undefined} className={`${inputClass} mt-1.5 resize-y`} {...props} />
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function SelectField({ label, hint, className = '', options, ...props }: FieldMeta & { options: SelectOption[] } & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'className'>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-bold text-slate-700">{label}</label>
      <select id={id} aria-describedby={hint ? `${id}-hint` : undefined} className={`${inputClass} mt-1.5`} {...props}>
        {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
      </select>
      {hint && <p id={`${id}-hint`} className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function CheckboxField({ label, hint, className = '', ...props }: FieldMeta & Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'className' | 'type'>) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="flex cursor-pointer items-center gap-2.5 text-sm font-bold text-slate-700">
        <input id={id} type="checkbox" className="size-4 cursor-pointer rounded accent-navy" {...props} />
        {label}
      </label>
      {hint && <p className="ml-6.5 mt-1 text-xs font-normal text-slate-500">{hint}</p>}
    </div>
  );
}
