import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HomePage } from './HomePage';

describe('HomePage', () => {
  it('renders the quest heading, CTA, and all category navigation links', () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Khám phá Hải Phòng theo cách của bạn' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Bắt đầu Quest/ })).toHaveAttribute('href', '/quests/select');
    expect(screen.getByRole('link', { name: 'Lịch sử' })).toHaveAttribute('href', '/map?category=history');
    expect(screen.getByRole('link', { name: 'Nghệ thuật' })).toHaveAttribute('href', '/map?category=art');
  });
});
