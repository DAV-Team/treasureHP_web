import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { makeAuthContext } from '../test/authContext';
import { ProfilePage } from './ProfilePage';

describe('ProfilePage', () => {
  it('shows badge collection and switches to history', () => {
    render(<AuthContext value={makeAuthContext()}><MemoryRouter><ProfilePage /></MemoryRouter></AuthContext>);
    expect(screen.getByRole('heading', { name: 'Bộ sưu tập huy hiệu' })).toBeInTheDocument();
    expect(screen.getByText('History Hunter')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'Lịch sử' }));
    expect(screen.getByRole('heading', { name: 'Hành trình gần đây' })).toBeInTheDocument();
  });
});
