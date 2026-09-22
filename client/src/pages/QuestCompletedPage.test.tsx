import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import * as locationsApi from '../services/locations';
import type { ApiLocation } from '../services/locations';
import * as questsApi from '../services/quests';
import { QuestCompletedPage } from './QuestCompletedPage';

describe('QuestCompletedPage', () => {
  it('shows the reward and map navigation actions', () => {
    render(<MemoryRouter><QuestCompletedPage /></MemoryRouter>);
    expect(screen.getByRole('heading', { name: 'QUEST COMPLETED!' })).toBeInTheDocument();
    expect(screen.getByText('+50 XP')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khám phá tiếp' })).toHaveAttribute('href', '/map');
  });
});

describe('QuestCompletedPage journey completion', () => {
  const location = (id: string, category: ApiLocation['category'], status: 'available' | 'completed') => (
    { _id: id, category, xpReward: 60, progress: { status, cultureStoryUnlocked: status === 'completed' } } as ApiLocation
  );

  // jsdom has no canvas; a null context makes Fireworks a no-op while its element still renders.
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
    vi.spyOn(questsApi, 'getCurrentJourney').mockResolvedValue(null);
  });
  afterEach(() => vi.restoreAllMocks());

  it('shows the fireworks and the finish action once every location is completed', async () => {
    vi.spyOn(locationsApi, 'getLocations').mockResolvedValue([location('a', 'history', 'completed'), location('b', 'cuisine', 'completed')]);
    render(<MemoryRouter><QuestCompletedPage /></MemoryRouter>);
    expect(await screen.findByRole('button', { name: /Kết thúc & bắt đầu hành trình mới/ })).toBeInTheDocument();
    expect(screen.getByTestId('fireworks')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Khám phá tiếp' })).not.toBeInTheDocument();
  });

  it('keeps exploring, without fireworks, while locations remain', async () => {
    vi.spyOn(locationsApi, 'getLocations').mockResolvedValue([location('a', 'history', 'completed'), location('b', 'cuisine', 'available')]);
    render(<MemoryRouter><QuestCompletedPage /></MemoryRouter>);
    expect(await screen.findByText('1/2')).toBeInTheDocument();
    expect(screen.queryByTestId('fireworks')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Khám phá tiếp' })).toBeInTheDocument();
  });

  it('finishes the journey after confirmation and opens quest selection', async () => {
    vi.spyOn(locationsApi, 'getLocations').mockResolvedValue([location('a', 'history', 'completed')]);
    const finish = vi.spyOn(questsApi, 'finishJourney').mockResolvedValue({ finished: true, type: 'full', locationsCompleted: 1 });
    render(
      <MemoryRouter initialEntries={['/quests/completed']}>
        <Routes>
          <Route path="/quests/completed" element={<QuestCompletedPage />} />
          <Route path="/quests/select" element={<p>Chọn cách khám phá</p>} />
        </Routes>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Kết thúc & bắt đầu hành trình mới/ }));
    expect(finish).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc hành trình' }));
    expect(await screen.findByText('Chọn cách khám phá')).toBeInTheDocument();
    expect(finish).toHaveBeenCalledOnce();
  });

  it('keeps the player on the page and shows an error when finishing fails', async () => {
    vi.spyOn(locationsApi, 'getLocations').mockResolvedValue([location('a', 'history', 'completed')]);
    vi.spyOn(questsApi, 'finishJourney').mockRejectedValue(new Error('offline'));
    render(<MemoryRouter><QuestCompletedPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: /Kết thúc & bắt đầu hành trình mới/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Kết thúc hành trình' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Không thể kết nối tới máy chủ');
  });

  it('counts only the journey locations and shows exactly that many badges', async () => {
    vi.spyOn(locationsApi, 'getLocations').mockResolvedValue([
      location('a', 'history', 'completed'), location('b', 'culture', 'completed'), location('c', 'cuisine', 'completed'),
      location('d', 'architecture', 'available'), location('e', 'art', 'available'),
    ]);
    vi.spyOn(questsApi, 'getCurrentJourney').mockResolvedValue({ id: 'j', type: 'mini', locationIds: ['a', 'b', 'c'], startedAt: '' });
    render(<MemoryRouter><QuestCompletedPage /></MemoryRouter>);
    expect(await screen.findByText('3/3')).toBeInTheDocument();
    expect(screen.getAllByTitle(/Lịch sử|Văn hóa|Ẩm thực|Kiến trúc|Nghệ thuật/)).toHaveLength(3);
    expect(document.querySelectorAll('section span.rounded-full.ring-2')).toHaveLength(3);
    expect(screen.getByTestId('fireworks')).toBeInTheDocument();
  });
});
