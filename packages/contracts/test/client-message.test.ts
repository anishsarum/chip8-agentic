import { describe, expect, it } from 'vitest';

const loadContracts = async () => {
  try {
    return await import('../src/index.js');
  } catch {
    return undefined;
  }
};

describe('parseClientMessage', () => {
  it('accepts a valid CHIP-8 key press from a browser client', async () => {
    const contracts = await loadContracts();

    expect(
      contracts?.parseClientMessage({ type: 'key', key: 0xf, pressed: true }),
    ).toEqual({ type: 'key', key: 0xf, pressed: true });
  });

  it('rejects a key outside the CHIP-8 keypad range', async () => {
    const contracts = await loadContracts();

    expect(
      contracts?.parseClientMessage({ type: 'key', key: 0x10, pressed: true }),
    ).toBeUndefined();
  });
});

describe('emulator HTTP contracts', () => {
  it('parses ROM bytes and a non-negative frame cycle count', async () => {
    const contracts = await loadContracts();

    expect(contracts?.parseRomLoadRequest({ rom: [0, 0xff] })).toEqual({
      rom: [0, 0xff],
    });
    expect(contracts?.parseRomLoadRequest({ rom: [256] })).toBeUndefined();
    expect(contracts?.parseFrameRequest({ cycles: 10 })).toEqual({
      cycles: 10,
    });
    expect(contracts?.parseFrameRequest({ cycles: -1 })).toBeUndefined();
  });
});
