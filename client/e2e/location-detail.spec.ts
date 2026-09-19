import { expect, test } from './fixtures';

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`chi tiết địa điểm và thử thách ${viewport.name}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error' && !message.text().includes('ERR_CONNECTION_REFUSED')) consoleErrors.push(message.text()); });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/locations/nha-hat-thanh-pho-hai-phong');
    await expect(page.getByRole('heading', { name: 'Nhà hát thành phố Hải Phòng' })).toBeVisible();
    await page.getByRole('button', { name: 'Bắt đầu thử thách' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tiếp theo' })).toBeDisabled();
    await page.locator('label', { hasText: 'Tân cổ điển Pháp' }).click();
    await expect(page.getByRole('button', { name: 'Tiếp theo' })).toBeEnabled();
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    expect(consoleErrors).toEqual([]);
    await page.screenshot({ path: `test-results/location-detail-${viewport.width}.png`, fullPage: true });
  });
}
