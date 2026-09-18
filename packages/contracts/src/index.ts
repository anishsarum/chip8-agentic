export type KeyMessage = {
  type: 'key';
  key: number;
  pressed: boolean;
};

export type ClientMessage = KeyMessage;

export type RomLoadRequest = {
  rom: number[];
};

export type FrameRequest = {
  cycles: number;
};

export type EmulatorSnapshot = {
  display: number[];
  displayChanged: boolean;
  programCounter: number;
  registers: number[];
  running: boolean;
  soundActive: boolean;
};

export function parseClientMessage(value: unknown): ClientMessage | undefined {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('type' in value) ||
    !('key' in value) ||
    !('pressed' in value) ||
    value.type !== 'key' ||
    typeof value.key !== 'number' ||
    !Number.isInteger(value.key) ||
    value.key < 0 ||
    value.key > 0xf ||
    typeof value.pressed !== 'boolean'
  ) {
    return undefined;
  }

  return { type: 'key', key: value.key, pressed: value.pressed };
}

export function parseRomLoadRequest(
  value: unknown,
): RomLoadRequest | undefined {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('rom' in value) ||
    !Array.isArray(value.rom) ||
    value.rom.some(
      (byte) =>
        typeof byte !== 'number' ||
        !Number.isInteger(byte) ||
        byte < 0 ||
        byte > 0xff,
    )
  ) {
    return undefined;
  }

  return { rom: value.rom };
}

export function parseFrameRequest(value: unknown): FrameRequest | undefined {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('cycles' in value) ||
    typeof value.cycles !== 'number' ||
    !Number.isInteger(value.cycles) ||
    value.cycles < 0
  ) {
    return undefined;
  }

  return { cycles: value.cycles };
}
