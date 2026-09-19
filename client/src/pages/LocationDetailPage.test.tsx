import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocationDetailPage } from './LocationDetailPage';

describe('LocationDetailPage', () => {
  it('reveals its hint and starts the mission', () => {
    render(<MemoryRouter initialEntries={['/locations/nha-hat-thanh-pho-hai-phong']}><Routes><Route path="/locations/:id" element={<LocationDetailPage />} /></Routes></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'Nhà hát thành phố Hải Phòng' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Xem gợi ý' }));
    expect(screen.getByRole('status')).toHaveTextContent('Hãy nhìn về các chi tiết');
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu thử thách' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Thử thách 1/3');
  });
});
