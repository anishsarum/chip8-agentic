import { describe, expect, it } from 'vitest';

const loadConfig = async () => {
  try {
    return await import('../src/config.js');
  } catch {
    return undefined;
  }
};

describe('readServerConfig', () => {
  it('reads the API host and port from environment values', async () => {
    const config = await loadConfig();

    expect(
      config?.readServerConfig({ API_HOST: '127.0.0.1', API_PORT: '4010' }),
    ).toEqual({ host: '127.0.0.1', port: 4010 });
  });
});
