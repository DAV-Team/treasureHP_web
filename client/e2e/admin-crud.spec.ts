import { expect, test, type Page } from './fixtures';

const API = 'http://localhost:3000';
const admin = { id: 'a1', email: 'admin@example.com', name: 'Quản trị viên', level: 1, totalXp: 0, role: 'admin' };

// A tiny in-memory backend so the whole create / edit / delete flow runs without a database.
async function mockAdminApi(page: Page) {
  let nextId = 10;
  const locations: Array<Record<string, unknown>> = [{
    _id: 'l1', name: 'Nhà hát thành phố', slug: 'nha-hat', address: 'Hồng Bàng', category: 'architecture', coordinates: { lat: 20.85, lng: 106.68 },
    coverImageUrl: '/images/opera-cover.jpg', shortDescription: 'Mô tả', cultureStory: { title: 'Nhà hát', content: 'Nội dung' }, xpReward: 50, isSpecialQuest: false,
  }];
  const badges: Array<Record<string, unknown>> = [];
  await page.addInitScript(() => localStorage.setItem('culture-quest-token', 'test-token'));
  await page.route(`${API}/users/me`, (route) => route.fulfill({ json: admin }));
  await page.route(`${API}/admin/dashboard`, (route) => route.fulfill({ json: { users: 1, locations: locations.length, challenges: 0, badges: badges.length, progress: 0, completed: 0 } }));
  await page.route(`${API}/admin/challenges`, (route) => route.fulfill({ json: [] }));
  await page.route(`${API}/admin/locations`, async (route) => {
    if (route.request().method() === 'POST') {
      const created = { _id: `l${nextId++}`, ...route.request().postDataJSON() };
      locations.push(created);
      return route.fulfill({ status: 201, json: created });
    }
    return route.fulfill({ json: locations });
  });
  await page.route(`${API}/admin/locations/*`, async (route) => {
    const id = route.request().url().split('/').pop();
    const index = locations.findIndex((item) => item._id === id);
    if (route.request().method() === 'DELETE') locations.splice(index, 1);
    else Object.assign(locations[index], route.request().postDataJSON());
    return route.fulfill({ json: route.request().method() === 'DELETE' ? { deleted: true } : locations[index] });
  });
  await page.route(`${API}/admin/badges`, (route) => route.fulfill({ json: badges }));
}

test('quản trị viên tạo, sửa và xóa địa điểm', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await mockAdminApi(page);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/admin');
  await expect(page.getByText('Nhà hát thành phố')).toBeVisible();

  await page.getByRole('button', { name: 'Thêm địa điểm' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Tên địa điểm').fill('Chợ Sắt');
  await expect(dialog.getByLabel('Slug')).toHaveValue('cho-sat');
  await dialog.getByLabel('Địa chỉ').fill('Cát Dài, Lê Chân');
  await dialog.getByLabel('Ảnh bìa (đường dẫn)').fill('/images/card-full-quest.jpg');
  await dialog.getByLabel('Mô tả ngắn').fill('Khu chợ lâu đời.');
  await dialog.getByLabel('Tiêu đề câu chuyện').fill('Chợ Sắt');
  await dialog.getByLabel('Nội dung', { exact: true }).fill('Câu chuyện chợ.');
  await page.screenshot({ path: 'test-results/admin-location-form-1280.png' });
  await dialog.getByRole('button', { name: 'Tạo địa điểm' }).click();
  await expect(page.getByRole('status')).toContainText('Đã tạo địa điểm mới.');
  await expect(page.getByText('Chợ Sắt', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Sửa Chợ Sắt' }).click();
  await page.getByRole('dialog').getByLabel('XP thưởng').fill('70');
  await page.getByRole('dialog').getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('status')).toContainText('Đã lưu địa điểm.');

  await page.getByRole('button', { name: 'Xóa Chợ Sắt' }).click();
  await page.getByRole('dialog', { name: 'Xác nhận xóa' }).getByRole('button', { name: 'Xóa' }).click();
  await expect(page.getByRole('status')).toContainText('Đã xóa "Chợ Sắt".');
  await expect(page.getByText('Chợ Sắt', { exact: true })).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

for (const viewport of [{ name: 'mobile', width: 375, height: 812 }, { name: 'desktop', width: 1280, height: 900 }]) {
  test(`form thử thách ${viewport.name} không tràn ngang`, async ({ page }) => {
    await mockAdminApi(page);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/admin');
    await page.getByRole('tab', { name: 'Thử thách' }).click();
    await page.getByRole('button', { name: 'Thêm thử thách' }).click();
    await expect(page.getByRole('dialog').getByLabel('Tên level')).toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    const dialogBox = await page.getByRole('dialog').boundingBox();
    expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(viewport.width);
    await page.screenshot({ path: `test-results/admin-challenge-form-${viewport.width}.png` });
  });
}
