import { test, expect } from './fixtures';

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`trang chủ ${viewport.name} tải đúng bố cục`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Khám phá Hải Phòng theo cách của bạn' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Bắt đầu Quest/ })).toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    expect(consoleErrors).toEqual([]);
    await page.screenshot({ path: `test-results/home-${viewport.width}.png`, fullPage: true });
  });
}
