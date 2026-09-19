import { AxiosError, type AxiosResponse } from 'axios';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { makeAuthContext, playerUser } from '../test/authContext';
import { AuthPage } from './AuthPage';

function renderPage(mode: 'login' | 'register', context = makeAuthContext()) {
  render(
    <AuthContext value={context}>
      <MemoryRouter initialEntries={[`/${mode}`]}>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/map" element={<p>Trang bản đồ</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  );
  return context;
}

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
const submit = (name: string) => fireEvent.submit(screen.getByRole('button', { name }).closest('form')!);
const httpError = (status: number) => new AxiosError('failed', String(status), undefined, undefined, { status, data: {} } as AxiosResponse);

describe('AuthPage', () => {
  it('submits login credentials and moves on to the map', async () => {
    const context = renderPage('login');
    fill('Email', 'guest@example.com');
    fill('Mật khẩu', 'password123');
    submit('Đăng nhập');
    expect(context.login).toHaveBeenCalledWith('guest@example.com', 'password123');
    expect(await screen.findByText('Trang bản đồ')).toBeInTheDocument();
  });

  it('shows a friendly error for wrong credentials and stays on the page', async () => {
    renderPage('login', makeAuthContext({ login: vi.fn().mockRejectedValue(httpError(401)) }));
    fill('Email', 'guest@example.com');
    fill('Mật khẩu', 'wrong-password');
    submit('Đăng nhập');
    expect(await screen.findByRole('alert')).toHaveTextContent('Email hoặc mật khẩu chưa đúng.');
  });

  it('registers a new account with a trimmed name', async () => {
    const context = renderPage('register');
    fill('Tên hiển thị', '  Mai Anh ');
    fill('Email', 'mai@example.com');
    fill('Mật khẩu', 'password123');
    fill('Xác nhận mật khẩu', 'password123');
    submit('Tạo tài khoản');
    expect(context.register).toHaveBeenCalledWith('Mai Anh', 'mai@example.com', 'password123');
    expect(await screen.findByText('Trang bản đồ')).toBeInTheDocument();
  });

  it('does not call the API when the password confirmation does not match', () => {
    const context = renderPage('register');
    fill('Tên hiển thị', 'Mai Anh');
    fill('Email', 'mai@example.com');
    fill('Mật khẩu', 'password123');
    fill('Xác nhận mật khẩu', 'different123');
    submit('Tạo tài khoản');
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu xác nhận chưa khớp.');
    expect(context.register).not.toHaveBeenCalled();
  });

  it('explains that the email is already registered', async () => {
    renderPage('register', makeAuthContext({ register: vi.fn().mockRejectedValue(httpError(409)) }));
    fill('Tên hiển thị', 'Mai Anh');
    fill('Email', 'mai@example.com');
    fill('Mật khẩu', 'password123');
    fill('Xác nhận mật khẩu', 'password123');
    submit('Tạo tài khoản');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email này đã được đăng ký'));
  });

  it('toggles password visibility', () => {
    renderPage('login');
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('type', 'password');
    fireEvent.click(screen.getByRole('button', { name: 'Hiện mật khẩu' }));
    expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('type', 'text');
  });

  it('redirects an already signed-in user away from the login page', () => {
    renderPage('login', makeAuthContext({ user: playerUser }));
    expect(screen.getByText('Trang bản đồ')).toBeInTheDocument();
  });
});
