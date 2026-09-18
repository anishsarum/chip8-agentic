import { describe, expect, it } from 'vitest';

import {
  DISPLAY_HEIGHT,
  DISPLAY_WIDTH,
  consumeDisplayChange,
  createMachine,
  executeNextInstruction,
  loadRom,
} from '../src/index.js';

describe('CHIP-8 display opcodes', () => {
  it('initializes and clears the monochrome 64x32 framebuffer', () => {
    const machine = createMachine();
    expect(machine.display).toHaveLength(DISPLAY_WIDTH * DISPLAY_HEIGHT);
    expect(consumeDisplayChange(machine)).toBe(false);
    machine.display[0] = 1;
    loadRom(machine, Uint8Array.from([0x00, 0xe0]));

    executeNextInstruction(machine);

    expect(machine.display).toEqual(
      new Uint8Array(DISPLAY_WIDTH * DISPLAY_HEIGHT),
    );
    expect(consumeDisplayChange(machine)).toBe(true);
    expect(consumeDisplayChange(machine)).toBe(false);
  });

  it('XOR-draws sprites, wraps at the display edge, and reports collision in VF', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xd0, 0x11, 0xd0, 0x11]));
    machine.index = 0x300;
    machine.memory[0x300] = 0b1100_0000;
    machine.registers[0] = 63;
    machine.registers[1] = 31;

    executeNextInstruction(machine);
    expect(machine.display[31 * DISPLAY_WIDTH + 63]).toBe(1);
    expect(machine.display[31 * DISPLAY_WIDTH]).toBe(1);
    expect(machine.registers[0xf]).toBe(0);
    expect(consumeDisplayChange(machine)).toBe(true);

    executeNextInstruction(machine);
    expect(machine.display[31 * DISPLAY_WIDTH + 63]).toBe(0);
    expect(machine.display[31 * DISPLAY_WIDTH]).toBe(0);
    expect(machine.registers[0xf]).toBe(1);
  });

  it('XOR-draws each row of a multi-row sprite', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xd0, 0x12]));
    machine.index = 0x300;
    machine.memory.set([0b1000_0000, 0b0100_0000], machine.index);
    machine.registers[0] = 2;
    machine.registers[1] = 3;

    executeNextInstruction(machine);

    expect(machine.display[3 * DISPLAY_WIDTH + 2]).toBe(1);
    expect(machine.display[4 * DISPLAY_WIDTH + 3]).toBe(1);
    expect(machine.registers[0xf]).toBe(0);
  });
});
