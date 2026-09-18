import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

const loadApp = async () => {
  try {
    return await import('../src/App.js');
  } catch {
    return undefined;
  }
};

describe('web shell', () => {
  it('shows that the CHIP-8 service is ready', async () => {
    const app = await loadApp();
    const page = app ? renderToStaticMarkup(createElement(app.App)) : undefined;

    expect(page).toContain('CHIP-8 Emulator');
    expect(page).toContain('Service shell ready');
  });
});
