import { useState, type FormEvent } from 'react';
import { CheckboxField, SelectField, TextAreaField } from '../../components/common/FormControls';
import { FormField } from '../../components/common/FormField';
import { categories, categoryOrder } from '../../lib/categories';
import { slugify } from '../../lib/slug';
import type { AdminLocation } from '../../services/admin';
import { FormFooter } from './FormFooter';
import { useFormSubmit } from './useFormSubmit';

interface LocationFormProps {
  record: AdminLocation | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

const categoryOptions = categoryOrder.map((key) => ({ value: key, label: categories[key].label }));

export function LocationForm({ record, onSubmit, onCancel }: LocationFormProps) {
  const [draft, setDraft] = useState({
    name: record?.name ?? '',
    slug: record?.slug ?? '',
    address: record?.address ?? '',
    category: record?.category ?? 'history',
    lat: String(record?.coordinates.lat ?? 20.8449),
    lng: String(record?.coordinates.lng ?? 106.6881),
    coverImageUrl: record?.coverImageUrl ?? '',
    shortDescription: record?.shortDescription ?? '',
    storyTitle: record?.cultureStory.title ?? '',
    storyContent: record?.cultureStory.content ?? '',
    storyImageUrl: record?.cultureStory.imageUrl ?? '',
    xpReward: String(record?.xpReward ?? 50),
    isSpecialQuest: record?.isSpecialQuest ?? false,
  });
  // The slug follows the name until someone edits it by hand (or when editing an existing place).
  const [slugEdited, setSlugEdited] = useState(record !== null);
  const { isSaving, error, submit } = useFormSubmit(onSubmit);
  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit({
      name: draft.name.trim(),
      slug: draft.slug.trim(),
      address: draft.address.trim(),
      category: draft.category,
      coordinates: { lat: Number(draft.lat), lng: Number(draft.lng) },
      coverImageUrl: draft.coverImageUrl.trim(),
      shortDescription: draft.shortDescription.trim(),
      cultureStory: { title: draft.storyTitle.trim(), content: draft.storyContent.trim(), ...(draft.storyImageUrl.trim() ? { imageUrl: draft.storyImageUrl.trim() } : {}) },
      xpReward: Number(draft.xpReward),
      isSpecialQuest: draft.isSpecialQuest,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Tên địa điểm" value={draft.name} required onChange={(event) => { set('name', event.target.value); if (!slugEdited) set('slug', slugify(event.target.value)); }} />
        <FormField label="Slug" value={draft.slug} required pattern="[a-z0-9]+(-[a-z0-9]+)*" title="Chữ thường, số và dấu gạch ngang" hint="Định danh duy nhất trong đường dẫn." onChange={(event) => { setSlugEdited(true); set('slug', event.target.value); }} />
        <FormField className="sm:col-span-2" label="Địa chỉ" value={draft.address} required onChange={(event) => set('address', event.target.value)} />
        <SelectField label="Danh mục" value={draft.category} options={categoryOptions} onChange={(event) => set('category', event.target.value as AdminLocation['category'])} />
        <FormField label="XP thưởng" type="number" min={0} step={1} value={draft.xpReward} required onChange={(event) => set('xpReward', event.target.value)} />
        <FormField label="Vĩ độ (lat)" type="number" min={-90} max={90} step="any" value={draft.lat} required onChange={(event) => set('lat', event.target.value)} />
        <FormField label="Kinh độ (lng)" type="number" min={-180} max={180} step="any" value={draft.lng} required onChange={(event) => set('lng', event.target.value)} />
        <FormField className="sm:col-span-2" label="Ảnh bìa (đường dẫn)" value={draft.coverImageUrl} required placeholder="/images/... hoặc https://..." onChange={(event) => set('coverImageUrl', event.target.value)} />
        <TextAreaField className="sm:col-span-2" label="Mô tả ngắn" value={draft.shortDescription} required onChange={(event) => set('shortDescription', event.target.value)} />
        <CheckboxField className="sm:col-span-2" label="Quest đặc biệt" hint="Hiện với biểu tượng ngôi sao trên bản đồ." checked={draft.isSpecialQuest} onChange={(event) => set('isSpecialQuest', event.target.checked)} />
      </div>

      <fieldset className="mt-6 rounded-2xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-extrabold text-navy">Culture Story</legend>
        <p className="mb-3 text-xs text-slate-500">Chỉ hiện với người chơi sau khi họ hoàn thành thử thách.</p>
        <div className="grid gap-4">
          <FormField label="Tiêu đề câu chuyện" value={draft.storyTitle} required onChange={(event) => set('storyTitle', event.target.value)} />
          <TextAreaField label="Nội dung" rows={5} value={draft.storyContent} required onChange={(event) => set('storyContent', event.target.value)} />
          <FormField label="Ảnh minh họa (không bắt buộc)" value={draft.storyImageUrl} onChange={(event) => set('storyImageUrl', event.target.value)} />
        </div>
      </fieldset>

      <FormFooter error={error} isSaving={isSaving} onCancel={onCancel} submitLabel={record ? 'Lưu thay đổi' : 'Tạo địa điểm'} />
    </form>
  );
}
