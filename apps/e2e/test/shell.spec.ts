import { expect, test } from '@playwright/test';

test('shows the emulator service shell', async ({ page }) => {
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'CHIP-8 Emulator' }),
  ).toBeVisible();
  await expect(page.getByText('Service shell ready')).toBeVisible();
});

test('loads a ROM and renders its framebuffer through the API', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByLabel('ROM file').setInputFiles({
    name: 'pixel.ch8',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from([
      0x60, 0x00, 0x61, 0x00, 0xa2, 0x0a, 0xd0, 0x11, 0x12, 0x08, 0x80,
    ]),
  });

  await page.getByRole('button', { name: 'Step' }).click();
  await page.getByRole('button', { name: 'Step' }).click();
  await page.getByRole('button', { name: 'Step' }).click();
  await page.getByRole('button', { name: 'Step' }).click();

  await expect(page.getByLabel('CHIP-8 display')).toHaveAttribute(
    'data-lit-pixels',
    '1',
  );

  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Run' })).toBeVisible();

  const keyRequest = page.waitForRequest(
    (request) =>
      request.url().endsWith('/api/key') &&
      (request.postData()?.includes('"pressed":true') ?? false),
  );
  await page.keyboard.press('x');
  await expect((await keyRequest).postDataJSON()).toEqual({
    key: 0,
    pressed: true,
    type: 'key',
  });
});
