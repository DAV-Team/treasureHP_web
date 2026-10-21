import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import * as settingsApi from '../../services/settings';
import { adminUser, makeAuthContext, playerUser } from '../../test/authContext';
import { Navbar } from './Navbar';

function renderNavbar(context = makeAuthContext()) {
  render(<AuthContext value={context}><MemoryRouter><Navbar /></MemoryRouter></AuthContext>);
  return context;
}

describe('Navbar', () => {
  it('offers a login link to signed-out visitors', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: 'Đăng nhập' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: /Mai Phương Anh/ })).not.toBeInTheDocument();
  });

  it('opens the user menu, closes it with Escape and logs out', () => {
    const context = renderNavbar(makeAuthContext({ user: playerUser }));
    const trigger = screen.getByRole('button', { name: /Mai Phương Anh/ });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: 'Cài đặt tài khoản' })).toHaveAttribute('href', '/account');
    expect(screen.queryByRole('menuitem', { name: 'Quản trị' })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitem', { name: 'Đăng xuất' }));
    expect(context.logout).toHaveBeenCalled();
  });

  it('shows the admin entry only to admins', () => {
    renderNavbar(makeAuthContext({ user: adminUser }));
    fireEvent.click(screen.getByRole('button', { name: /Quản trị viên/ }));
    expect(screen.getByRole('menuitem', { name: 'Quản trị' })).toHaveAttribute('href', '/admin');
  });

  it('shows the default mark until a custom logo loads, then swaps to it', async () => {
    vi.spyOn(settingsApi, 'getAppSettings').mockResolvedValue({ logoUrl: 'https://cdn.example.com/logo.png' });
    renderNavbar();
    const image = await screen.findByRole('img', { name: 'Culture Quest' });
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/logo.png');
    vi.restoreAllMocks();
  });

  it('falls back to the default mark without a custom logo', async () => {
    vi.spyOn(settingsApi, 'getAppSettings').mockResolvedValue({ logoUrl: null });
    renderNavbar();
    await screen.findByRole('link', { name: 'Đăng nhập' });
    expect(screen.queryByRole('img', { name: 'Culture Quest' })).not.toBeInTheDocument();
    vi.restoreAllMocks();
  });
});
