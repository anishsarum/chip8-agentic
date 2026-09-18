import { describe, expect, it } from 'vitest';

const loadServer = async () => {
  try {
    return await import('../src/server.js');
  } catch {
    return undefined;
  }
};

describe('startServer', () => {
  it('starts the API on an injected host and port', async () => {
    const server = await loadServer();
    const app = await server?.startServer({ host: '127.0.0.1', port: 0 });

    expect(app?.server.listening).toBe(true);

    await app?.close();
  });

  it('starts the API from environment configuration', async () => {
    const server = await loadServer();
    const app = await server?.startConfiguredServer({
      API_HOST: '127.0.0.1',
      API_PORT: '0',
    });

    expect(app?.server.listening).toBe(true);

    await app?.close();
  });
});
