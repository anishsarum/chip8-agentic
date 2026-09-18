import {
  createMachine,
  executeNextInstruction,
  loadRom,
  type Chip8Machine,
} from '../../src/index.js';
import type { RomFixture } from './rom-fixtures.js';

export function runBoundedRom(
  fixture: Pick<RomFixture, 'bytes' | 'id'>,
  options: { cycles: number },
): { litPixels: number; machine: Chip8Machine } {
  if (!Number.isInteger(options.cycles) || options.cycles < 0) {
    throw new RangeError('ROM cycle limit must be a non-negative integer');
  }

  const machine = createMachine();
  loadRom(machine, fixture.bytes);

  for (let cycle = 1; cycle <= options.cycles; cycle += 1) {
    try {
      executeNextInstruction(machine);
    } catch (error) {
      throw new Error(
        `${fixture.id} failed at cycle ${cycle} (PC 0x${machine.programCounter.toString(16)}): ${String(error)}`,
      );
    }
  }

  return {
    machine,
    litPixels: machine.display.reduce((total, pixel) => total + pixel, 0),
  };
}
