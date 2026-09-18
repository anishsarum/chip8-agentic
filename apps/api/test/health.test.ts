import { describe, expect, it } from 'vitest';

const loadApi = async () => {
  try {
    return await import('../src/app.js');
  } catch {
    return undefined;
  }
};

describe('health endpoint', () => {
  it('reports that the API is ready', async () => {
    const api = await loadApi();
    const app = api?.createApp();

    const response = await app?.inject({ method: 'GET', url: '/health' });

    expect(response?.statusCode).toBe(200);
    expect(response?.json()).toEqual({ status: 'ready' });

    await app?.close();
  });
});
