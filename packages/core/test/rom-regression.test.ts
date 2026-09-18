import { describe, expect, it } from 'vitest';

import {
  CHIP8_COMPATIBILITY_PROFILE,
  QUARANTINED_ROM_FAMILIES,
  ROM_FIXTURES,
} from './support/rom-fixtures.js';
import { runBoundedRom } from './support/rom-runner.js';

describe('ROM regression', () => {
  it('executes a provenance-recorded ROM fixture with a bounded diagnostic runner', () => {
    const result = runBoundedRom(ROM_FIXTURES.singlePixel, { cycles: 4 });

    expect(result.machine.display[0]).toBe(1);
    expect(result.machine.registers[0xf]).toBe(0);
    expect(result.machine.programCounter).toBe(0x208);
    expect(result.litPixels).toBe(1);
  });

  it('identifies the fixture and cycle in a bounded-run failure', () => {
    expect(() =>
      runBoundedRom(
        { id: 'invalid-opcode', bytes: Uint8Array.from([0xff, 0xff]) },
        { cycles: 1 },
      ),
    ).toThrow('invalid-opcode failed at cycle 1');
  });

  it('records the selected baseline quirks and quarantined ROM families', () => {
    expect(CHIP8_COMPATIBILITY_PROFILE).toEqual({
      drawEdges: 'wrap',
      loadStoreIndex: 'unchanged',
      shiftSource: 'vx',
    });
    expect(QUARANTINED_ROM_FAMILIES[0]?.reason).toContain('extended opcodes');
  });
});
