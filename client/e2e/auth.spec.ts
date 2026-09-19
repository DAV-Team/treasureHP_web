import { expect, test, type Page } from './fixtures';

const user = { id: 'u1', email: 'mai@example.com', name: 'Mai Anh', level: 1, totalXp: 0, role: 'player' };

// The API is mocked so the flow does not depend on a running backend or database.
async function mockAuthApi(page: Page) {
  let current = { ...user };
  await page.route('**/auth/register', (route) => route.fulfill({ status: 201, json: { accessToken: 'test-token', user: current } }));
  await page.route('**/users/me', async (route) => {
    const request = route.request();
    if (request.method() === 'PATCH') current = { ...current, ...request.postDataJSON() };
    await route.fulfill({ status: 200, json: current });
  });
  await page.route('**/locations', (route) => route.fulfill({ status: 200, json: [] }));
}

test('đăng ký, đổi tên rồi đăng xuất', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await mockAuthApi(page);
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto('/register');
  await page.getByLabel('Tên hiển thị').fill('Mai Anh');
  await page.getByLabel('Email').fill('mai@example.com');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('password123');
  await page.getByLabel('Xác nhận mật khẩu', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Tạo tài khoản' }).click();

  await expect(page).toHaveURL(/\/map/);
  await page.getByRole('button', { name: /Mai Anh/ }).click();
  await page.getByRole('menuitem', { name: 'Cài đặt tài khoản' }).click();
  await expect(page).toHaveURL(/\/account/);

  await page.getByLabel('Tên hiển thị').fill('Mai Phương Anh');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.getByRole('status')).toContainText('Đã lưu');
  await expect(page.getByRole('button', { name: /Mai Phương Anh/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/account-1280.png', fullPage: true });

  await page.getByRole('button', { name: /Mai Phương Anh/ }).click();
  await page.getByRole('menuitem', { name: 'Đăng xuất' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('link', { name: 'Đăng nhập' })).toBeVisible();
  expect(consoleErrors).toEqual([]);
});

test('trang tài khoản yêu cầu đăng nhập', async ({ page }) => {
  await page.goto('/account');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('heading', { name: 'Chào mừng trở lại' })).toBeVisible();
});

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  for (const path of ['/login', '/register']) {
    test(`${path} ${viewport.name} không tràn ngang`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(path);
      await expect(page.getByRole('button', { name: /Đăng nhập|Tạo tài khoản/ }).first()).toBeVisible();
      expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/${path.slice(1)}-${viewport.width}.png`, fullPage: true });
    });
  }
}
