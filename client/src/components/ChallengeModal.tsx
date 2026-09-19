import { ArrowRight, Check, Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './common/Button';
import { Modal } from './common/Modal';
import { SafeImage } from './common/SafeImage';
import { answerChallenge, completeLocation, getChallenge, type ChallengeQuestion } from '../services/locations';

type OptionKey = 'A' | 'B' | 'C' | 'D';

const fallbackQuestions: ChallengeQuestion[] = [
  { order: 1, imageUrl: '/images/opera-house.jpg', highlightBox: { x: 36, y: 12, width: 28, height: 30 }, questionText: 'Nhà hát thành phố mang đậm phong cách kiến trúc nào?', options: [{ key: 'A', text: 'Gothic' }, { key: 'B', text: 'Tân cổ điển Pháp' }, { key: 'C', text: 'Hiện đại' }, { key: 'D', text: 'Á Đông' }], hintText: 'Công trình được xây dựng trong thời Pháp thuộc.' },
  { order: 2, imageUrl: '/images/opera-house.jpg', highlightBox: { x: 36, y: 12, width: 28, height: 30 }, questionText: 'Nhà hát nằm bên không gian công cộng nào của thành phố?', options: [{ key: 'A', text: 'Hồ Tam Bạc' }, { key: 'B', text: 'Quảng trường Nhà hát' }, { key: 'C', text: 'Cầu Bính' }, { key: 'D', text: 'Bến Bính' }], hintText: 'Tên không gian này trùng với tên công trình.' },
  { order: 3, imageUrl: '/images/opera-house.jpg', highlightBox: { x: 36, y: 12, width: 28, height: 30 }, questionText: 'Chi tiết nào tạo nên vẻ trang trọng của mặt tiền?', options: [{ key: 'A', text: 'Mái kính' }, { key: 'B', text: 'Cột lớn và phù điêu' }, { key: 'C', text: 'Tường gạch trần' }, { key: 'D', text: 'Cổng đá' }], hintText: 'Hãy quan sát phần chính diện.' },
];

export function ChallengeModal({ isOpen, onClose, locationId }: { isOpen: boolean; onClose: () => void; locationId?: string }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answer, setAnswer] = useState<OptionKey | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !locationId) return;
    getChallenge(locationId).then((challenge) => { setQuestions(challenge.questions); setStep(0); }).catch(() => undefined);
  }, [isOpen, locationId]);

  const current = questions[step];
  const isLast = step === questions.length - 1;

  const advance = async () => {
    if (!answer) return;
    setSubmitting(true);
    setFeedback('');
    try {
      if (locationId) {
        const result = await answerChallenge(locationId, current.order, answer);
        if (!result.isCorrect) { setFeedback(result.hintText ?? current.hintText); return; }
      }
      if (isLast) {
        if (locationId) await completeLocation(locationId);
        navigate(`/quests/completed?locationId=${locationId ?? ''}`);
      } else {
        setStep(step + 1);
        setAnswer(null);
        setShowHint(false);
      }
    } catch {
      setFeedback('Không thể gửi đáp án. Hãy thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Thử thách ${step + 1}/${questions.length}`} hideTitle className="max-w-2xl">
      <div className="flex items-center gap-3 pr-12" aria-hidden>
        <ol className="flex flex-1 items-center">
          {questions.map((question, index) => (
            <li key={question.order} className="flex flex-1 items-center last:flex-none">
              <span className={`grid size-5 place-items-center rounded-full border-2 ${index <= step ? 'border-navy bg-navy text-white' : 'border-slate-300 bg-white'}`}>
                {index < step && <Check className="size-3" strokeWidth={3} />}
              </span>
              {index < questions.length - 1 && <span className={`mx-1 h-0.5 flex-1 rounded-full ${index < step ? 'bg-navy' : 'bg-slate-200'}`} />}
            </li>
          ))}
        </ol>
        <span className="text-sm font-bold text-slate-500">{step + 1}/{questions.length}</span>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[minmax(0,13rem)_1fr]">
        <div className="relative mx-auto h-48 w-full max-w-64 overflow-hidden rounded-xl bg-slate-100 sm:h-auto sm:min-h-64 sm:max-w-none">
          <SafeImage src={current.imageUrl} fallbackSrc="/images/opera-house.jpg" alt="Chi tiết cần quan sát" className="absolute inset-0 size-full object-cover" />
          <div
            data-testid="highlight-box"
            className="absolute rounded-sm border-[3px] border-red-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.18)]"
            style={{ left: `${current.highlightBox.x}%`, top: `${current.highlightBox.y}%`, width: `${current.highlightBox.width}%`, height: `${current.highlightBox.height}%` }}
          />
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-500">Câu hỏi {step + 1}/{questions.length}</p>
          <p className="mt-1 font-extrabold leading-6 text-navy">{current.questionText}</p>
          <fieldset className="mt-4 space-y-2">
            <legend className="sr-only">Chọn đáp án</legend>
            {current.options.map((option) => {
              const selected = answer === option.key;
              return (
                <label key={option.key} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm font-medium transition focus-within:ring-2 focus-within:ring-navy/30 ${selected ? 'border-sky-500 bg-sky-50 text-navy' : 'border-slate-200 text-slate-700 hover:border-slate-300'}`}>
                  <input aria-label={option.text} className="sr-only" type="radio" name={`question-${step}`} checked={selected} onChange={() => setAnswer(option.key)} />
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border text-xs font-bold ${selected ? 'border-navy bg-navy text-white' : 'border-slate-300 text-slate-500'}`} aria-hidden>
                    {selected ? <Check className="size-3.5" strokeWidth={3} /> : option.key}
                  </span>
                  {option.text}
                </label>
              );
            })}
          </fieldset>
        </div>
      </div>

      {showHint && <p role="status" className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{current.hintText}</p>}
      {feedback && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{feedback}</p>}

      <div className="mt-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setShowHint(!showHint)} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-bold text-navy transition hover:bg-slate-50">
          <Lightbulb className="size-4 text-amber-500" />Gợi ý
        </button>
        <Button disabled={!answer || isSubmitting} onClick={advance} className="min-w-36">
          {isSubmitting ? 'Đang kiểm tra...' : isLast ? 'Hoàn thành' : 'Tiếp theo'}
          {!isSubmitting && <ArrowRight className="size-4" />}
        </Button>
      </div>
    </Modal>
  );
}
