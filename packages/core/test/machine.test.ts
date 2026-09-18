import { describe, expect, it } from 'vitest';

import {
  CHIP8_FONT,
  FONT_START_ADDRESS,
  MEMORY_SIZE,
  PROGRAM_START_ADDRESS,
  createMachine,
  loadRom,
  resetMachine,
} from '../src/index.js';

describe('CHIP-8 machine state', () => {
  it('initializes the conventional machine layout', () => {
    const machine = createMachine();

    expect(machine.memory).toHaveLength(MEMORY_SIZE);
    expect(machine.registers).toHaveLength(16);
    expect(machine.stack).toHaveLength(16);
    expect(machine.programCounter).toBe(PROGRAM_START_ADDRESS);
    expect(machine.index).toBe(0);
    expect(machine.stackPointer).toBe(0);
    expect(machine.delayTimer).toBe(0);
    expect(machine.soundTimer).toBe(0);
    expect(
      machine.memory.slice(
        FONT_START_ADDRESS,
        FONT_START_ADDRESS + CHIP8_FONT.length,
      ),
    ).toEqual(CHIP8_FONT);
  });

  it('resets mutable state and restores the font data', () => {
    const machine = createMachine();
    machine.memory[0] = 0;
    machine.registers[4] = 0xff;
    machine.index = 0xabc;
    machine.programCounter = 0x456;
    machine.stack[0] = 0x234;
    machine.stackPointer = 1;
    machine.delayTimer = 3;
    machine.soundTimer = 4;

    resetMachine(machine);

    expect(machine.registers).toEqual(new Uint8Array(16));
    expect(machine.index).toBe(0);
    expect(machine.programCounter).toBe(PROGRAM_START_ADDRESS);
    expect(machine.stack).toEqual(new Uint16Array(16));
    expect(machine.stackPointer).toBe(0);
    expect(machine.delayTimer).toBe(0);
    expect(machine.soundTimer).toBe(0);
    expect(machine.memory.slice(0, CHIP8_FONT.length)).toEqual(CHIP8_FONT);
  });

  it('loads a ROM at 0x200 after resetting the machine', () => {
    const machine = createMachine();
    machine.registers[0] = 1;

    loadRom(machine, Uint8Array.from([0x60, 0x0a, 0x61, 0x0b]));

    expect(machine.registers[0]).toBe(0);
    expect(
      machine.memory.slice(PROGRAM_START_ADDRESS, PROGRAM_START_ADDRESS + 4),
    ).toEqual(Uint8Array.from([0x60, 0x0a, 0x61, 0x0b]));
    expect(
      machine.memory.slice(
        FONT_START_ADDRESS,
        FONT_START_ADDRESS + CHIP8_FONT.length,
      ),
    ).toEqual(CHIP8_FONT);
  });

  it('rejects a ROM that cannot fit in program memory', () => {
    const machine = createMachine();
    const oversizedRom = new Uint8Array(
      MEMORY_SIZE - PROGRAM_START_ADDRESS + 1,
    );

    expect(() => loadRom(machine, oversizedRom)).toThrow(RangeError);
  });
});
