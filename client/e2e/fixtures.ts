import { test as base, expect } from '@playwright/test';

// A 1x1 pale-green PNG standing in for every map tile.
const BLANK_TILE = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN48+EJAAWMAsE4xMGYAAAAAElFTkSuQmCC', 'base64');

// Google Fonts and map tiles are external network dependencies: when they are slow the page `load` event
// stalls and tests time out. Stubbing them keeps the suite hermetic; pages fall back to system fonts and blank tiles.
export const test = base.extend<{ stubExternalNetwork: void }>({
  stubExternalNetwork: [async ({ page }, use) => {
    await page.route(/fonts\.(googleapis|gstatic)\.com/, (route) => route.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    // The navbar loads the site logo on every page; tests that care about it override this route.
    await page.route('http://localhost:3000/settings', (route) => route.fulfill({ json: { logoUrl: null } }));
    await page.route(/tile\.openstreetmap\.(org|fr)|basemaps\.cartocdn\.com/, (route) => route.fulfill({ status: 200, contentType: 'image/png', body: BLANK_TILE }));
    await use();
  }, { auto: true }],
});

export { expect };
export type { Page } from '@playwright/test';
