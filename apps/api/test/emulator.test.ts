import { describe, expect, it } from 'vitest';

const loadApi = async () => {
  try {
    return await import('../src/app.js');
  } catch {
    return undefined;
  }
};

describe('emulator API', () => {
  it('loads ROM bytes, runs a frame, and returns emulator state', async () => {
    const api = await loadApi();
    const app = api?.createApp();

    const loadResponse = await app?.inject({
      method: 'POST',
      url: '/rom',
      payload: { rom: [0x60, 0x01, 0x70, 0x02] },
    });
    expect(loadResponse?.statusCode).toBe(204);

    const keyResponse = await app?.inject({
      method: 'POST',
      url: '/key',
      payload: { type: 'key', key: 2, pressed: true },
    });
    expect(keyResponse?.statusCode).toBe(204);

    const frameResponse = await app?.inject({
      method: 'POST',
      url: '/frame',
      payload: { cycles: 2 },
    });
    expect(frameResponse?.statusCode).toBe(200);
    const state = frameResponse?.json();
    expect(state?.programCounter).toBe(0x204);
    expect(state?.registers[0]).toBe(3);
    expect(state?.display).toEqual(Array(64 * 32).fill(0));
    expect(state?.displayChanged).toBe(false);

    await app?.close();
  });

  it('reports a framebuffer change once when a sprite is drawn', async () => {
    const api = await loadApi();
    const app = api?.createApp();

    await app?.inject({
      method: 'POST',
      url: '/rom',
      payload: {
        rom: [0x60, 0x00, 0x61, 0x00, 0xa2, 0x0a, 0xd0, 0x11, 0x12, 0x08, 0x80],
      },
    });

    const changed = await app?.inject({
      method: 'POST',
      url: '/frame',
      payload: { cycles: 4 },
    });
    expect(changed?.json().displayChanged).toBe(true);

    const unchanged = await app?.inject({
      method: 'POST',
      url: '/frame',
      payload: { cycles: 0 },
    });
    expect(unchanged?.json().displayChanged).toBe(false);

    await app?.close();
  });

  it('owns session start, stop, and reset state server-side', async () => {
    const api = await loadApi();
    const app = api?.createApp();

    expect(
      (await app?.inject({ method: 'POST', url: '/session/start' }))
        ?.statusCode,
    ).toBe(204);
    expect(
      (await app?.inject({ method: 'POST', url: '/session/stop' }))?.statusCode,
    ).toBe(204);
    const reset = await app?.inject({ method: 'POST', url: '/session/reset' });

    expect(reset?.statusCode).toBe(200);
    expect(reset?.json()).toMatchObject({
      programCounter: 0x200,
      running: false,
    });

    await app?.close();
  });
});
