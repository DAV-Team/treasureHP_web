import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QuestCompletedPage } from './QuestCompletedPage';

describe('QuestCompletedPage', () => {
  it('shows the reward and map navigation actions', () => {
    render(<MemoryRouter><QuestCompletedPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'QUEST COMPLETED!' })).toBeInTheDocument();
    expect(screen.getByText('+50 XP')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khám phá tiếp' })).toHaveAttribute('href', '/map');
  });
});
