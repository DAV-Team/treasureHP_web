import { expect, test } from './fixtures';

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`bản đồ ${viewport.name} hiển thị và lọc địa điểm`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('ERR_CONNECTION_REFUSED')) consoleErrors.push(message.text()); });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/map');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: 'Khám phá Hải Phòng' })).toBeVisible();
    // Pins of nearby places can overlap on a real map, so dispatch the click instead of aiming at the pin's centre.
    await page.getByRole('button', { name: 'Chọn Đền Nghè' }).dispatchEvent('click');
    await expect(page.getByRole('heading', { name: 'Đền Nghè' })).toBeVisible();
    await page.getByRole('checkbox', { name: 'Lịch sử' }).check();
    await expect(page.getByRole('button', { name: 'Chọn Chùa Dư Hàng' })).not.toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    expect(consoleErrors).toEqual([]);
    await page.screenshot({ path: `test-results/map-${viewport.width}.png`, fullPage: true });
  });
}
