import { useState, type FormEvent } from 'react';
import { SelectField, TextAreaField } from '../../components/common/FormControls';
import { FormField } from '../../components/common/FormField';
import { categories, categoryOrder } from '../../lib/categories';
import type { AdminBadge, UnlockConditionType } from '../../services/admin';
import { FormFooter } from './FormFooter';
import { useFormSubmit } from './useFormSubmit';

interface BadgeFormProps {
  record: AdminBadge | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

const conditionOptions: Array<{ value: UnlockConditionType; label: string; hint: string }> = [
  { value: 'totalLocations', label: 'Số địa điểm đã hoàn thành', hint: 'Cần hoàn thành ít nhất bấy nhiêu địa điểm bất kỳ.' },
  { value: 'locationsInCategory', label: 'Số địa điểm theo danh mục', hint: 'Cần hoàn thành ít nhất bấy nhiêu địa điểm thuộc danh mục đã chọn.' },
  { value: 'fullQuestCompleted', label: 'Hoàn thành Full Quest', hint: 'Mở khóa khi người chơi hoàn thành toàn bộ địa điểm.' },
];
const iconSuggestions = ['award', 'trophy', 'book-open', 'utensils', 'shield-check', 'map-pin', 'star'];
const colorSuggestions = ['gold', 'orange', 'red', 'purple', 'green', 'blue'];

export function BadgeForm({ record, onSubmit, onCancel }: BadgeFormProps) {
  const [draft, setDraft] = useState({
    code: record?.code ?? '',
    name: record?.name ?? '',
    description: record?.description ?? '',
    icon: record?.icon ?? 'award',
    colorTheme: record?.colorTheme ?? 'gold',
    type: record?.unlockCondition.type ?? 'totalLocations',
    value: String(record?.unlockCondition.value ?? 1),
    category: record?.unlockCondition.category ?? 'history',
  });
  const { isSaving, error, submit } = useFormSubmit(onSubmit);
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((current) => ({ ...current, [key]: value }));
  const condition = conditionOptions.find((option) => option.value === draft.type);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit({
      code: draft.code.trim(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      icon: draft.icon.trim(),
      colorTheme: draft.colorTheme.trim(),
      unlockCondition: { type: draft.type, value: Number(draft.value), ...(draft.type === 'locationsInCategory' ? { category: draft.category } : {}) },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tên huy hiệu" value={draft.name} required onChange={(event) => set('name', event.target.value)} />
        <FormField label="Mã huy hiệu" value={draft.code} required pattern="[a-z0-9_]+" title="Chữ thường, số và dấu gạch dưới" hint="Duy nhất, ví dụ history_hunter." onChange={(event) => set('code', event.target.value)} />
        <TextAreaField className="sm:col-span-2" label="Mô tả điều kiện" value={draft.description} required onChange={(event) => set('description', event.target.value)} />
        <FormField label="Biểu tượng" list="badge-icons" value={draft.icon} required onChange={(event) => set('icon', event.target.value)} />
        <FormField label="Màu chủ đề" list="badge-colors" value={draft.colorTheme} required onChange={(event) => set('colorTheme', event.target.value)} />
        <datalist id="badge-icons">{iconSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
        <datalist id="badge-colors">{colorSuggestions.map((item) => <option key={item} value={item} />)}</datalist>
      </div>

      <fieldset className="mt-6 rounded-2xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-extrabold text-navy">Điều kiện mở khóa</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField className="sm:col-span-2" label="Loại điều kiện" value={draft.type} hint={condition?.hint} options={conditionOptions} onChange={(event) => set('type', event.target.value as UnlockConditionType)} />
          <FormField label="Giá trị" type="number" min={0} step={1} value={draft.value} required onChange={(event) => set('value', event.target.value)} />
          {draft.type === 'locationsInCategory' && (
            <SelectField label="Danh mục" value={draft.category} options={categoryOrder.map((key) => ({ value: key, label: categories[key].label }))} onChange={(event) => set('category', event.target.value as typeof draft.category)} />
          )}
        </div>
      </fieldset>

      <FormFooter error={error} isSaving={isSaving} onCancel={onCancel} submitLabel={record ? 'Lưu thay đổi' : 'Tạo huy hiệu'} />
    </form>
  );
}
