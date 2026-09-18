import { describe, expect, it } from 'vitest';

const loadDistribution = async () => {
  try {
    return await import('../dist/index.js');
  } catch {
    return undefined;
  }
};

describe('contracts distribution', () => {
  it('exports the browser-to-API contract from the built package', async () => {
    const contracts = await loadDistribution();

    expect(
      contracts?.parseClientMessage({ type: 'key', key: 7, pressed: true }),
    ).toEqual({ type: 'key', key: 7, pressed: true });
  });
});
