import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Trophy } from 'lucide-react';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import { Chip } from './Chip';
import { Modal } from './Modal';
import { ProgressBar } from './ProgressBar';

describe('common components', () => {
  it('renders primary and outline buttons with accessible names', () => {
    render(<><Button>Bắt đầu Quest</Button><Button variant="outline">Xem bản đồ</Button></>);
    expect(screen.getByRole('button', { name: 'Bắt đầu Quest' })).toHaveClass('bg-[#12294D]');
    expect(screen.getByRole('button', { name: 'Xem bản đồ' })).toHaveClass('border');
  });

  it('renders a card', () => {
    render(<Card aria-label="Thẻ quest">Nội dung</Card>);
    expect(screen.getByLabelText('Thẻ quest')).toHaveTextContent('Nội dung');
  });

  it('renders selected and unselected chips', () => {
    render(<><Chip selected>Lịch sử</Chip><Chip>Văn hóa</Chip></>);
    expect(screen.getByRole('button', { name: 'Lịch sử' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Văn hóa' })).toHaveAttribute('aria-pressed', 'false');
  });

  it.each([[0], [50], [100]])('renders progress at %i%%', (value) => {
    render(<ProgressBar value={value} label="Tiến độ quest" />);
    expect(screen.getByRole('progressbar', { name: 'Tiến độ quest' })).toHaveAttribute('aria-valuenow', String(value));
  });

  it('shows locked and unlocked badge states', () => {
    render(<><Badge icon={<Trophy />} name="History Hunter" description="Mở khóa" /><Badge locked icon={<Trophy />} name="Culture Keeper" description="Bị khóa" /></>);
    expect(screen.queryByLabelText('Huy hiệu chưa mở khóa')).toBeInTheDocument();
    expect(screen.getByText('History Hunter')).toBeInTheDocument();
  });

  it('renders a dialog and closes it with Escape', () => {
    const onClose = vi.fn();
    render(<Modal isOpen onClose={onClose} title="Thử thách">Câu hỏi</Modal>);
    expect(screen.getByRole('dialog', { name: 'Thử thách' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not render a closed dialog', () => {
    function Example() {
      const [isOpen] = useState(false);
      return <Modal isOpen={isOpen} onClose={() => undefined} title="Thử thách">Câu hỏi</Modal>;
    }
    render(<Example />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
