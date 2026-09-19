import { expect, test } from './fixtures';

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`hồ sơ ${viewport.name} hiển thị huy hiệu và lịch sử`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/profile');
    await expect(page.getByRole('heading', { name: 'Mai Phương Anh' })).toBeVisible();
    await expect(page.getByText('History Hunter')).toBeVisible();
    await page.getByRole('tab', { name: 'Lịch sử' }).click();
    await expect(page.getByRole('heading', { name: 'Hành trình gần đây' })).toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    expect(consoleErrors).toEqual([]);
    await page.screenshot({ path: `test-results/profile-${viewport.width}.png`, fullPage: true });
  });
}
