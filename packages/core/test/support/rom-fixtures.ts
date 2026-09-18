export type RomFixture = {
  bytes: Uint8Array;
  id: string;
  provenance: string;
};

export const CHIP8_COMPATIBILITY_PROFILE = {
  drawEdges: 'wrap',
  loadStoreIndex: 'unchanged',
  shiftSource: 'vx',
} as const;

export const QUARANTINED_ROM_FAMILIES = [
  {
    reason:
      'Requires Super-CHIP or XO-CHIP extended opcodes outside the selected baseline CHIP-8 profile.',
    name: 'Super-CHIP and XO-CHIP programs',
  },
] as const;

export const ROM_FIXTURES = {
  singlePixel: {
    id: 'chip8-agentic-single-pixel',
    provenance:
      'Authored for this repository and dedicated to CC0-1.0; a redistributable CHIP-8 diagnostic fixture.',
    bytes: Uint8Array.from([
      0x60,
      0x00, // V0 = 0
      0x61,
      0x00, // V1 = 0
      0xa2,
      0x0a, // I = sprite below
      0xd0,
      0x11, // draw one sprite row at V0,V1
      0x12,
      0x08, // loop after drawing
      0x80, // sprite: one lit pixel
    ]),
  },
} satisfies Record<string, RomFixture>;
