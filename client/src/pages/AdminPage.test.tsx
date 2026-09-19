import { AxiosError, type AxiosResponse } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { createAdminContent, deleteAdminContent, deleteAdminUser, updateAdminContent, updateAdminUser } from '../services/admin';
import { adminUser, makeAuthContext } from '../test/authContext';
import { AdminPage } from './AdminPage';

const users = [
  { _id: 'a1', name: 'Quản trị viên', email: 'admin@example.com', role: 'admin', level: 1, totalXp: 0 },
  { _id: 'u2', name: 'Lê Chân', email: 'chan@example.com', role: 'player', level: 2, totalXp: 120 },
];
const location = {
  _id: 'l1', name: 'Nhà hát', slug: 'nha-hat', address: 'Hồng Bàng', category: 'architecture', coordinates: { lat: 20.85, lng: 106.68 }, coverImageUrl: '/a.jpg',
  shortDescription: 'Mô tả', cultureStory: { title: 'Tiêu đề', content: 'Nội dung' }, xpReward: 50, isSpecialQuest: false,
};
const locations = [location, { ...location, _id: 'l2', name: 'Đền Nghè', slug: 'den-nghe' }];
const challenge = { _id: 'c1', levelName: 'Cấp 1', xpReward: 50, locationId: { _id: 'l1', name: 'Nhà hát' }, questions: [] };

vi.mock('../services/admin', () => ({
  getAdminDashboard: vi.fn().mockResolvedValue({ users: 2, locations: 5, challenges: 5, badges: 4, progress: 1, completed: 1 }),
  getAdminLocations: vi.fn().mockImplementation(async () => locations),
  getAdminChallenges: vi.fn().mockImplementation(async () => [challenge]),
  getAdminBadges: vi.fn().mockResolvedValue([]),
  getAdminUsers: vi.fn().mockImplementation(async () => users),
  getAdminProgress: vi.fn().mockResolvedValue([]),
  createAdminContent: vi.fn().mockResolvedValue({}),
  updateAdminContent: vi.fn().mockResolvedValue({}),
  deleteAdminContent: vi.fn().mockResolvedValue({ deleted: true }),
  updateAdminUser: vi.fn().mockResolvedValue({}),
  deleteAdminUser: vi.fn().mockResolvedValue({ deleted: true }),
}));

function renderAdmin() {
  render(<AuthContext value={makeAuthContext({ user: adminUser })}><MemoryRouter><AdminPage /></MemoryRouter></AuthContext>);
}
const openTab = async (name: string) => fireEvent.click(await screen.findByRole('tab', { name }));
const httpError = (status: number, message: string) => new AxiosError('failed', String(status), undefined, undefined, { status, data: { message } } as AxiosResponse);

beforeEach(() => { vi.clearAllMocks(); });

describe('AdminPage', () => {
  it('renders protected operational metrics for an admin', async () => {
    renderAdmin();
    expect(await screen.findByRole('heading', { name: 'Bảng điều hành' })).toBeInTheDocument();
    expect(await screen.findByText('Nhà hát')).toBeInTheDocument();
  });

  it('blocks non-admins', () => {
    render(<AuthContext value={makeAuthContext()}><MemoryRouter><AdminPage /></MemoryRouter></AuthContext>);
    expect(screen.getByRole('heading', { name: 'Khu vực quản trị' })).toBeInTheDocument();
  });

  it('filters the table with the search box', async () => {
    renderAdmin();
    expect(await screen.findByText('Nhà hát')).toBeInTheDocument();
    expect(screen.getByText('2/2 mục')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tìm trong danh sách'), { target: { value: 'den-nghe' } });
    expect(screen.queryByText('Nhà hát')).not.toBeInTheDocument();
    expect(screen.getByText('Đền Nghè')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tìm trong danh sách'), { target: { value: 'không có' } });
    expect(screen.getByText('Không có mục nào khớp tìm kiếm.')).toBeInTheDocument();
  });

  describe('locations', () => {
    it('creates a location through the form and confirms it', async () => {
      renderAdmin();
      fireEvent.click(await screen.findByRole('button', { name: 'Thêm địa điểm' }));
      const dialog = await screen.findByRole('dialog');
      fireEvent.change(within(dialog).getByLabelText('Tên địa điểm'), { target: { value: 'Chợ Sắt' } });
      expect(within(dialog).getByLabelText('Slug')).toHaveValue('cho-sat');
      fireEvent.change(within(dialog).getByLabelText('Địa chỉ'), { target: { value: 'Lê Chân' } });
      fireEvent.change(within(dialog).getByLabelText('Ảnh bìa (đường dẫn)'), { target: { value: '/cover.jpg' } });
      fireEvent.change(within(dialog).getByLabelText('Mô tả ngắn'), { target: { value: 'Khu chợ' } });
      fireEvent.change(within(dialog).getByLabelText('Tiêu đề câu chuyện'), { target: { value: 'Chợ Sắt' } });
      fireEvent.change(within(dialog).getByLabelText('Nội dung'), { target: { value: 'Câu chuyện' } });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo địa điểm' }));
      await waitFor(() => expect(createAdminContent).toHaveBeenCalledWith('locations', expect.objectContaining({
        name: 'Chợ Sắt', slug: 'cho-sat', category: 'history', coordinates: { lat: 20.8449, lng: 106.6881 }, xpReward: 50, isSpecialQuest: false,
        cultureStory: { title: 'Chợ Sắt', content: 'Câu chuyện' },
      })));
      expect(await screen.findByRole('status')).toHaveTextContent('Đã tạo địa điểm mới.');
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('edits a location and keeps its slug', async () => {
      renderAdmin();
      fireEvent.click(await screen.findByRole('button', { name: 'Sửa Nhà hát' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByLabelText('Slug')).toHaveValue('nha-hat');
      fireEvent.change(within(dialog).getByLabelText('Tên địa điểm'), { target: { value: 'Nhà hát lớn' } });
      expect(within(dialog).getByLabelText('Slug')).toHaveValue('nha-hat');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Lưu thay đổi' }));
      await waitFor(() => expect(updateAdminContent).toHaveBeenCalledWith('locations', 'l1', expect.objectContaining({ name: 'Nhà hát lớn', slug: 'nha-hat' })));
    });

    it('keeps the form open and explains a duplicate slug', async () => {
      vi.mocked(updateAdminContent).mockRejectedValueOnce(httpError(409, 'A record with the same slug or code already exists'));
      renderAdmin();
      fireEvent.click(await screen.findByRole('button', { name: 'Sửa Nhà hát' }));
      fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Lưu thay đổi' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Slug hoặc mã này đã tồn tại');
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('deletes only after the confirmation dialog is accepted', async () => {
      renderAdmin();
      fireEvent.click(await screen.findByRole('button', { name: 'Xóa Nhà hát' }));
      const dialog = await screen.findByRole('dialog', { name: 'Xác nhận xóa' });
      expect(dialog).toHaveTextContent('Thử thách và tiến độ của người chơi');
      fireEvent.click(within(dialog).getByRole('button', { name: 'Hủy' }));
      expect(deleteAdminContent).not.toHaveBeenCalled();
      fireEvent.click(await screen.findByRole('button', { name: 'Xóa Nhà hát' }));
      fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Xóa' }));
      await waitFor(() => expect(deleteAdminContent).toHaveBeenCalledWith('locations', 'l1'));
      expect(await screen.findByRole('status')).toHaveTextContent('Đã xóa "Nhà hát".');
    });
  });

  describe('challenges', () => {
    it('offers only locations without a challenge and creates one with numbered questions', async () => {
      renderAdmin();
      await openTab('Thử thách');
      fireEvent.click(await screen.findByRole('button', { name: 'Thêm thử thách' }));
      const dialog = await screen.findByRole('dialog');
      const select = within(dialog).getByLabelText('Địa điểm');
      expect(within(select).getByRole('option', { name: 'Nhà hát (đã có thử thách)' })).toBeDisabled();
      fireEvent.change(select, { target: { value: 'l2' } });
      fireEvent.change(within(dialog).getByLabelText('Tên level'), { target: { value: 'Chi tiết ẩn' } });
      fireEvent.change(within(dialog).getByLabelText('Ảnh câu 1 (đường dẫn)'), { target: { value: '/q1.jpg' } });
      fireEvent.change(within(dialog).getByLabelText('Câu hỏi 1'), { target: { value: 'Đây là gì?' } });
      for (const key of ['A', 'B', 'C', 'D']) fireEvent.change(within(dialog).getByLabelText(`Đáp án ${key} (câu 1)`), { target: { value: `Đáp án ${key}` } });
      fireEvent.click(within(dialog).getByLabelText('Đáp án đúng của câu 1 là C'));
      fireEvent.change(within(dialog).getByLabelText('Gợi ý câu 1'), { target: { value: 'Nhìn lên mái' } });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo thử thách' }));
      await waitFor(() => expect(createAdminContent).toHaveBeenCalledWith('challenges', {
        locationId: 'l2', levelName: 'Chi tiết ẩn', xpReward: 50,
        questions: [{
          order: 1, imageUrl: '/q1.jpg', highlightBox: { x: 30, y: 20, width: 30, height: 30 }, questionText: 'Đây là gì?',
          options: [{ key: 'A', text: 'Đáp án A' }, { key: 'B', text: 'Đáp án B' }, { key: 'C', text: 'Đáp án C' }, { key: 'D', text: 'Đáp án D' }], correctOption: 'C', hintText: 'Nhìn lên mái',
        }],
      }));
    });

    it('requires a location, and adds or removes questions', async () => {
      renderAdmin();
      await openTab('Thử thách');
      fireEvent.click(await screen.findByRole('button', { name: 'Thêm thử thách' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).queryByRole('button', { name: 'Xóa câu 1' })).not.toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Thêm câu hỏi' }));
      expect(within(dialog).getByText('Câu hỏi (2)')).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole('button', { name: 'Xóa câu 2' }));
      expect(within(dialog).getByText('Câu hỏi (1)')).toBeInTheDocument();
      fireEvent.submit(within(dialog).getByRole('button', { name: 'Tạo thử thách' }).closest('form')!);
      expect(await within(dialog).findByRole('alert')).toHaveTextContent('Hãy chọn địa điểm');
      expect(createAdminContent).not.toHaveBeenCalled();
    });
  });

  describe('badges', () => {
    it('shows the category picker only for category-based conditions', async () => {
      renderAdmin();
      await openTab('Huy hiệu');
      fireEvent.click(await screen.findByRole('button', { name: 'Thêm huy hiệu' }));
      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).queryByLabelText('Danh mục')).not.toBeInTheDocument();
      fireEvent.change(within(dialog).getByLabelText('Loại điều kiện'), { target: { value: 'locationsInCategory' } });
      fireEvent.change(within(dialog).getByLabelText('Danh mục'), { target: { value: 'cuisine' } });
      fireEvent.change(within(dialog).getByLabelText('Tên huy hiệu'), { target: { value: 'Food Fan' } });
      fireEvent.change(within(dialog).getByLabelText('Mã huy hiệu'), { target: { value: 'food_fan' } });
      fireEvent.change(within(dialog).getByLabelText('Mô tả điều kiện'), { target: { value: 'Thử 3 món' } });
      fireEvent.change(within(dialog).getByLabelText('Giá trị'), { target: { value: '3' } });
      fireEvent.click(within(dialog).getByRole('button', { name: 'Tạo huy hiệu' }));
      await waitFor(() => expect(createAdminContent).toHaveBeenCalledWith('badges', {
        code: 'food_fan', name: 'Food Fan', description: 'Thử 3 món', icon: 'award', colorTheme: 'gold',
        unlockCondition: { type: 'locationsInCategory', value: 3, category: 'cuisine' },
      }));
    });
  });

  describe('users', () => {
    it('edits a user from the users tab', async () => {
      renderAdmin();
      await openTab('Người dùng');
      fireEvent.click(await screen.findByRole('button', { name: 'Sửa Lê Chân' }));
      fireEvent.change(screen.getByLabelText('Tên hiển thị'), { target: { value: 'Lê Chân Mới' } });
      fireEvent.change(screen.getByLabelText('Vai trò'), { target: { value: 'admin' } });
      fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
      await waitFor(() => expect(updateAdminUser).toHaveBeenCalledWith('u2', { name: 'Lê Chân Mới', role: 'admin' }));
    });

    it("locks the admin's own role and cannot delete their own row", async () => {
      renderAdmin();
      await openTab('Người dùng');
      expect(await screen.findByRole('button', { name: 'Xóa Quản trị viên' })).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Sửa Quản trị viên' }));
      expect(screen.getByLabelText('Vai trò')).toBeDisabled();
      fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }));
      await waitFor(() => expect(updateAdminUser).toHaveBeenLastCalledWith('a1', { name: 'Quản trị viên' }));
    });

    it('deletes another user only after confirmation', async () => {
      renderAdmin();
      await openTab('Người dùng');
      fireEvent.click(await screen.findByRole('button', { name: 'Xóa Lê Chân' }));
      fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Hủy' }));
      expect(deleteAdminUser).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole('button', { name: 'Xóa Lê Chân' }));
      fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Xóa' }));
      await waitFor(() => expect(deleteAdminUser).toHaveBeenCalledWith('u2'));
    });
  });
});
