import { expect, test } from './fixtures';

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
]) {
  test(`kết quả quest ${viewport.name} hiển thị đầy đủ`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/quests/completed?locationId=nha-hat-thanh-pho-hai-phong');
    await expect(page.getByRole('heading', { name: 'QUEST COMPLETED!' })).toBeVisible();
    await expect(page.getByText('History Hunter')).toBeVisible();
    expect(await page.evaluate(() => document.body.scrollWidth <= window.innerWidth)).toBe(true);
    expect(consoleErrors).toEqual([]);
    await page.screenshot({ path: `test-results/quest-completed-${viewport.width}.png`, fullPage: true });
  });
}
