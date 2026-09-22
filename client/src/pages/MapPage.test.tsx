import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MapPage } from './MapPage';

function renderMap(entry = '/map') {
  return render(<MemoryRouter initialEntries={[entry]}><MapPage /></MemoryRouter>);
}

describe('MapPage', () => {
  it('renders filters and updates location card when a marker is selected', () => {
    renderMap();
    expect(screen.getByRole('heading', { name: 'Khám phá Hải Phòng' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Chọn Đền Nghè' }));
    expect(screen.getByRole('heading', { name: 'Đền Nghè' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Lịch sử' }));
    expect(screen.queryByRole('button', { name: 'Chọn Chùa Dư Hàng' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Tất cả' })).not.toBeChecked();
  });

  it('applies the category from the URL and can reset it with "Tất cả"', () => {
    renderMap('/map?category=architecture');
    expect(screen.getByRole('checkbox', { name: 'Kiến trúc' })).toBeChecked();
    expect(screen.queryByRole('button', { name: 'Chọn Đền Nghè' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tất cả' }));
    expect(screen.getByRole('button', { name: 'Chọn Đền Nghè' })).toBeInTheDocument();
  });

  it('searches locations regardless of Vietnamese diacritics and shows an empty state', () => {
    renderMap();
    fireEvent.change(screen.getByLabelText('Tìm địa điểm'), { target: { value: 'den nghe' } });
    expect(screen.getByRole('button', { name: 'Chọn Đền Nghè' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Chọn Chùa Dư Hàng' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Tìm địa điểm'), { target: { value: 'không có gì' } });
    expect(screen.getByRole('status')).toHaveTextContent('Không có địa điểm nào khớp');
  });

  it('lets a Mini Quest pick exactly 3 locations before starting', () => {
    renderMap('/map?type=mini');
    const start = screen.getByRole('button', { name: 'Bắt đầu hành trình' });
    expect(screen.getByText('Đã chọn 0/3')).toBeInTheDocument();
    expect(start).toBeDisabled();

    for (const name of ['Nhà hát thành phố Hải Phòng', 'Đền Nghè', 'Chùa Dư Hàng']) {
      fireEvent.click(screen.getByRole('checkbox', { name: `Chọn ${name} cho hành trình` }));
    }
    expect(screen.getByText('Đã chọn 3/3')).toBeInTheDocument();
    expect(start).toBeEnabled();
    // Once 3 are picked nothing else can be added, but a pick can still be removed.
    expect(screen.getByRole('checkbox', { name: 'Chọn Bảo tàng Hải Phòng cho hành trình' })).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Chọn Đền Nghè cho hành trình' }));
    expect(screen.getByText('Đã chọn 2/3')).toBeInTheDocument();
    expect(start).toBeDisabled();
  });

  it('starts a Full Quest with every location already picked', () => {
    renderMap('/map?type=full');
    expect(screen.getByText('Đã chọn 5/5')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bắt đầu hành trình' })).toBeEnabled();
  });

  it('shows no journey panel when just exploring', () => {
    renderMap('/map?type=explore');
    expect(screen.queryByRole('region', { name: 'Hành trình' })).not.toBeInTheDocument();
  });
});
