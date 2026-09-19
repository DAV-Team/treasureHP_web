import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ChallengeModal } from './ChallengeModal';

describe('ChallengeModal', () => {
  it('requires an answer before advancing and shows a hint', () => {
    render(<MemoryRouter><ChallengeModal isOpen onClose={() => undefined} /></MemoryRouter>);
    expect(screen.getByRole('dialog')).toHaveTextContent('Thử thách 1/3');
    expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý' }));
    expect(screen.getByRole('status')).toHaveTextContent('Pháp thuộc');
    fireEvent.click(screen.getByLabelText('Tân cổ điển Pháp'));
    expect(screen.getByRole('button', { name: 'Tiếp theo' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp theo' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Thử thách 2/3');
  });
});
