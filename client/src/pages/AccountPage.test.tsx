import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { changePassword } from '../services/auth';
import { makeAuthContext, playerUser } from '../test/authContext';
import { AccountPage } from './AccountPage';

vi.mock('../services/auth', () => ({ changePassword: vi.fn().mockResolvedValue(undefined) }));

function renderPage() {
  const context = makeAuthContext({ user: playerUser });
  render(
    <AuthContext value={context}>
      <MemoryRouter initialEntries={['/account']}>
        <Routes>
          <Route path="/account" element={<AccountPage />} />
          <Route path="/" element={<p>Trang chủ</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext>,
  );
  return context;
}

const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe('AccountPage', () => {
  it('saves the display name and avatar', async () => {
    const context = renderPage();
    expect(screen.getByLabelText('Tên hiển thị')).toHaveValue('Mai Phương Anh');
    fill('Tên hiển thị', '  Mai Anh ');
    fill('Ảnh đại diện (đường dẫn)', 'https://cdn.example.com/a.png');
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    await waitFor(() => expect(context.updateProfile).toHaveBeenCalledWith({ name: 'Mai Anh', avatarUrl: 'https://cdn.example.com/a.png' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã lưu');
  });

  it('shows an error when saving fails', async () => {
    const context = renderPage();
    vi.mocked(context.updateProfile).mockRejectedValueOnce(new Error('boom'));
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('changes the password when the confirmation matches', async () => {
    renderPage();
    fill('Mật khẩu hiện tại', 'OldSecret123');
    fill('Mật khẩu mới', 'BrandNewSecret456');
    fill('Xác nhận mật khẩu mới', 'BrandNewSecret456');
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    await waitFor(() => expect(changePassword).toHaveBeenCalledWith({ currentPassword: 'OldSecret123', newPassword: 'BrandNewSecret456' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Đã đổi mật khẩu');
  });

  it('refuses a mismatching confirmation without calling the API', () => {
    vi.mocked(changePassword).mockClear();
    renderPage();
    fill('Mật khẩu hiện tại', 'OldSecret123');
    fill('Mật khẩu mới', 'BrandNewSecret456');
    fill('Xác nhận mật khẩu mới', 'Different789');
    fireEvent.click(screen.getByRole('button', { name: 'Đổi mật khẩu' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Mật khẩu xác nhận chưa khớp.');
    expect(changePassword).not.toHaveBeenCalled();
  });

  it('logs out and returns to the home page', () => {
    const context = renderPage();
    fireEvent.click(screen.getAllByRole('button', { name: 'Đăng xuất' })[0]);
    expect(context.logout).toHaveBeenCalled();
    expect(screen.getByText('Trang chủ')).toBeInTheDocument();
  });
});
