import { test, expect, chromium } from '@playwright/test';
import path from 'path';

const extensionPath = path.resolve('.');

test.describe('MindfulCounter Extension', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
        '--disable-gpu',
      ],
    });

    let [background] = context.serviceWorkers();
    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }
    extensionId = background.url().split('/')[2];
  });

  test.afterAll(async () => {
    await context?.close();
  });

  test('extension should load without errors', async () => {
    expect(extensionId).toBeTruthy();
  });

  test('popup should display counters', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const heading = page.locator('h1');
    await expect(heading).toHaveText('MindfulCounter');

    await expect(page.locator('#counters-list .counter-row')).toHaveCount(6);

    await page.close();
  });

  test('popup should have correct dimensions', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    const body = page.locator('body');
    const width = await body.evaluate((el) => getComputedStyle(el).width);
    expect(parseInt(width)).toBe(320);

    await page.close();
  });

  test('options page should display correctly', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);

    const heading = page.locator('h1');
    await expect(heading).toHaveText('Options');

    const description = page.locator('p');
    await expect(description).toHaveText('Configure MindfulCounter settings here.');

    await page.close();
  });

  test('options page should have correct background color', async () => {
    const page = await context.newPage();
    await page.goto(`chrome-extension://${extensionId}/options/options.html`);

    const bgColor = await page.locator('body').evaluate(
      (el) => getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBe('rgb(245, 245, 245)');

    await page.close();
  });
});
