import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuestSelectPage } from './QuestSelectPage';

describe('QuestSelectPage', () => {
  it('renders quest options and filters', () => {
    render(<MemoryRouter><QuestSelectPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Chọn cách bạn muốn khám phá' })).toBeInTheDocument();
    expect(screen.getByText('Full Quest')).toBeInTheDocument();
    expect(screen.getByText('Mini Quest')).toBeInTheDocument();
    expect(screen.getByText('Explore Freely')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lịch sử' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '1 giờ' })).toHaveAttribute('aria-pressed', 'true');
  });
});
