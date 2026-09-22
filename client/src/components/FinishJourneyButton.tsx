import { Flag } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { describeApiError } from '../lib/apiError';
import { finishJourney } from '../services/quests';
import { ConfirmDialog } from './common/ConfirmDialog';

interface FinishJourneyButtonProps {
  className?: string;
  children?: ReactNode;
}

// Ends the current journey after confirmation, then sends the player to pick a new one.
export function FinishJourneyButton({ className = '', children = 'Kết thúc & bắt đầu hành trình mới' }: FinishJourneyButtonProps) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      await finishJourney();
      navigate('/quests/select');
    } catch (caught) {
      setError(describeApiError(caught, 'Không thể kết thúc hành trình. Vui lòng thử lại.'));
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setConfirming(true)} className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-sm font-bold transition ${className}`}>
        <Flag className="size-4" aria-hidden />{children}
      </button>
      {error && <p role="alert" className="text-center text-sm font-semibold text-rose-400 sm:col-span-2">{error}</p>}
      <ConfirmDialog
        isOpen={confirming}
        title="Kết thúc hành trình?"
        message="Hành trình này sẽ được lưu vào lịch sử và tiến độ các địa điểm được đặt lại để bạn bắt đầu hành trình mới. XP và huy hiệu đã nhận vẫn được giữ nguyên."
        confirmLabel="Kết thúc hành trình"
        busyLabel="Đang kết thúc..."
        busy={busy}
        onConfirm={confirm}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
