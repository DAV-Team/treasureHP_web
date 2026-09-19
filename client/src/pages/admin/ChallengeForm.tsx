import { Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button } from '../../components/common/Button';
import { SelectField, TextAreaField } from '../../components/common/FormControls';
import { FormField } from '../../components/common/FormField';
import { SafeImage } from '../../components/common/SafeImage';
import type { AdminChallenge, AdminLocation, AdminQuestion, OptionKey } from '../../services/admin';
import { FormFooter } from './FormFooter';
import { useFormSubmit } from './useFormSubmit';

interface ChallengeFormProps {
  record: AdminChallenge | null;
  locations: AdminLocation[];
  /** Locations that already own a challenge, which cannot be picked again. */
  takenLocationIds: string[];
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

const optionKeys: OptionKey[] = ['A', 'B', 'C', 'D'];

interface QuestionDraft {
  imageUrl: string;
  box: { x: string; y: string; width: string; height: string };
  questionText: string;
  options: Record<OptionKey, string>;
  correctOption: OptionKey;
  hintText: string;
}

const blankQuestion = (): QuestionDraft => ({
  imageUrl: '', box: { x: '30', y: '20', width: '30', height: '30' }, questionText: '',
  options: { A: '', B: '', C: '', D: '' }, correctOption: 'A', hintText: '',
});

const toDraft = (question: AdminQuestion): QuestionDraft => ({
  imageUrl: question.imageUrl,
  box: { x: String(question.highlightBox.x), y: String(question.highlightBox.y), width: String(question.highlightBox.width), height: String(question.highlightBox.height) },
  questionText: question.questionText,
  options: Object.fromEntries(optionKeys.map((key) => [key, question.options.find((option) => option.key === key)?.text ?? ''])) as Record<OptionKey, string>,
  correctOption: question.correctOption,
  hintText: question.hintText,
});

export function ChallengeForm({ record, locations, takenLocationIds, onSubmit, onCancel }: ChallengeFormProps) {
  const [locationId, setLocationId] = useState(record?.locationId?._id ?? '');
  const [levelName, setLevelName] = useState(record?.levelName ?? '');
  const [xpReward, setXpReward] = useState(String(record?.xpReward ?? 50));
  const [questions, setQuestions] = useState<QuestionDraft[]>(record ? record.questions.map(toDraft) : [blankQuestion()]);
  const { isSaving, error, setError, submit } = useFormSubmit(onSubmit);

  const updateQuestion = (index: number, change: Partial<QuestionDraft>) => setQuestions((current) => current.map((question, position) => (position === index ? { ...question, ...change } : question)));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!locationId) { setError('Hãy chọn địa điểm cho thử thách.'); return; }
    void submit({
      locationId,
      levelName: levelName.trim(),
      xpReward: Number(xpReward),
      // Orders follow the list position so reordering or deleting never leaves gaps or duplicates.
      questions: questions.map((question, index) => ({
        order: index + 1,
        imageUrl: question.imageUrl.trim(),
        highlightBox: { x: Number(question.box.x), y: Number(question.box.y), width: Number(question.box.width), height: Number(question.box.height) },
        questionText: question.questionText.trim(),
        options: optionKeys.map((key) => ({ key, text: question.options[key].trim() })),
        correctOption: question.correctOption,
        hintText: question.hintText.trim(),
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          className="sm:col-span-2"
          label="Địa điểm"
          value={locationId}
          required
          hint={locations.length === 0 ? 'Chưa có địa điểm nào. Hãy tạo địa điểm trước.' : 'Mỗi địa điểm chỉ có một thử thách.'}
          options={[{ value: '', label: 'Chọn địa điểm...', disabled: true }, ...locations.map((location) => ({ value: location._id, label: takenLocationIds.includes(location._id) && location._id !== record?.locationId?._id ? `${location.name} (đã có thử thách)` : location.name, disabled: takenLocationIds.includes(location._id) && location._id !== record?.locationId?._id }))]}
          onChange={(event) => setLocationId(event.target.value)}
        />
        <FormField label="Tên level" value={levelName} required placeholder="The Hidden Detail" onChange={(event) => setLevelName(event.target.value)} />
        <FormField label="XP thưởng" type="number" min={0} step={1} value={xpReward} required onChange={(event) => setXpReward(event.target.value)} />
      </div>

      <h3 className="mt-6 text-sm font-extrabold text-navy">Câu hỏi ({questions.length})</h3>
      <div className="mt-3 space-y-4">
        {questions.map((question, index) => (
          <fieldset key={index} className="rounded-2xl border border-slate-200 p-4">
            <legend className="px-2 text-sm font-extrabold text-navy">Câu {index + 1}</legend>
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div>
                <div className="relative h-36 overflow-hidden rounded-xl bg-slate-100" aria-hidden>
                  {question.imageUrl && <SafeImage src={question.imageUrl} fallbackSrc="/images/opera-house.jpg" className="absolute inset-0 size-full object-cover" />}
                  <div className="absolute border-2 border-red-500" style={{ left: `${Number(question.box.x) || 0}%`, top: `${Number(question.box.y) || 0}%`, width: `${Number(question.box.width) || 0}%`, height: `${Number(question.box.height) || 0}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Xem trước vùng khoanh đỏ.</p>
              </div>
              <div className="grid gap-4">
                <FormField label={`Ảnh câu ${index + 1} (đường dẫn)`} value={question.imageUrl} required onChange={(event) => updateQuestion(index, { imageUrl: event.target.value })} />
                <div className="grid grid-cols-4 gap-2">
                  {(['x', 'y', 'width', 'height'] as const).map((key) => (
                    <FormField key={key} label={`${{ x: 'X', y: 'Y', width: 'Rộng', height: 'Cao' }[key]} (%)`} type="number" min={0} max={100} step="any" value={question.box[key]} required onChange={(event) => updateQuestion(index, { box: { ...question.box, [key]: event.target.value } })} />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              <TextAreaField label={`Câu hỏi ${index + 1}`} rows={2} value={question.questionText} required onChange={(event) => updateQuestion(index, { questionText: event.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                {optionKeys.map((key) => (
                  <div key={key} className="flex items-end gap-2">
                    <FormField className="flex-1" label={`Đáp án ${key} (câu ${index + 1})`} value={question.options[key]} required onChange={(event) => updateQuestion(index, { options: { ...question.options, [key]: event.target.value } })} />
                    <label className="mb-2.5 flex shrink-0 cursor-pointer items-center gap-1.5 text-xs font-bold text-emerald-700">
                      <input type="radio" name={`correct-${index}`} checked={question.correctOption === key} onChange={() => updateQuestion(index, { correctOption: key })} className="size-4 accent-emerald-600" aria-label={`Đáp án đúng của câu ${index + 1} là ${key}`} />Đúng
                    </label>
                  </div>
                ))}
              </div>
              <FormField label={`Gợi ý câu ${index + 1}`} value={question.hintText} required onChange={(event) => updateQuestion(index, { hintText: event.target.value })} />
            </div>
            {questions.length > 1 && (
              <div className="mt-3 flex justify-end">
                <button type="button" onClick={() => setQuestions((current) => current.filter((_, position) => position !== index))} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"><Trash2 className="size-3.5" />Xóa câu {index + 1}</button>
              </div>
            )}
          </fieldset>
        ))}
      </div>
      <Button variant="outline" className="mt-4" onClick={() => setQuestions((current) => [...current, blankQuestion()])}><Plus className="size-4" />Thêm câu hỏi</Button>

      <FormFooter error={error} isSaving={isSaving} onCancel={onCancel} submitLabel={record ? 'Lưu thay đổi' : 'Tạo thử thách'} />
    </form>
  );
}
