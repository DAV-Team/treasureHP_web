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
});
