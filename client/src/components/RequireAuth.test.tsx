import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { makeAuthContext, playerUser } from '../test/authContext';
import { RequireAuth } from './RequireAuth';

function tree(context: ReturnType<typeof makeAuthContext>): ReactElement {
  return (
    <AuthContext value={context}>
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<RequireAuth><p>Nội dung riêng tư</p></RequireAuth>} />
          <Route path="/login" element={<p>Trang đăng nhập</p>} />
          <Route path="/" element={<p>Trang chủ</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext>
  );
}

function renderGuarded(context: ReturnType<typeof makeAuthContext>) {
  return render(tree(context));
}

describe('RequireAuth', () => {
  it('redirects signed-out visitors to the login page', () => {
    renderGuarded(makeAuthContext());
    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
  });

  it('renders the page for a signed-in user', () => {
    renderGuarded(makeAuthContext({ user: playerUser }));
    expect(screen.getByText('Nội dung riêng tư')).toBeInTheDocument();
  });

  it('waits while the session is being restored instead of redirecting', () => {
    renderGuarded(makeAuthContext({ isLoading: true }));
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải');
    expect(screen.queryByText('Trang đăng nhập')).not.toBeInTheDocument();
  });

  it('sends a user who logs out on the page to the home page rather than the login page', () => {
    const { rerender } = renderGuarded(makeAuthContext({ user: playerUser }));
    expect(screen.getByText('Nội dung riêng tư')).toBeInTheDocument();
    rerender(tree(makeAuthContext()));
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
  });
});
