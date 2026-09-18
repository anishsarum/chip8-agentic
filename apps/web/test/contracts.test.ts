import { describe, expect, it } from 'vitest';

const loadContracts = async () => {
  try {
    return await import('@chip8/contracts');
  } catch {
    return undefined;
  }
};

describe('web contract dependency', () => {
  it('consumes the shared key-message parser through the workspace package', async () => {
    const contracts = await loadContracts();

    expect(
      contracts?.parseClientMessage({ type: 'key', key: 0xa, pressed: true }),
    ).toEqual({ type: 'key', key: 0xa, pressed: true });
  });
});
