import { describe, expect, it } from 'vitest';

import {
  createMachine,
  executeNextInstruction,
  loadRom,
  setKeyState,
} from '../src/index.js';

describe('CHIP-8 keypad opcodes', () => {
  it('skips based on pressed and unpressed keypad state', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xe1, 0x9e, 0xe1, 0xa1]));
    machine.registers[1] = 0x0a;
    setKeyState(machine, 0x0a, true);

    executeNextInstruction(machine);
    expect(machine.programCounter).toBe(0x204);

    setKeyState(machine, 0x0a, false);
    machine.programCounter = 0x202;
    executeNextInstruction(machine);
    expect(machine.programCounter).toBe(0x206);
  });

  it('keeps the program counter on FX0A until a key is pressed', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xf2, 0x0a]));

    executeNextInstruction(machine);
    expect(machine.programCounter).toBe(0x200);

    setKeyState(machine, 0x07, true);
    executeNextInstruction(machine);
    expect(machine.registers[2]).toBe(0x07);
    expect(machine.programCounter).toBe(0x202);
  });

  it('accepts an already-held key for FX0A', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xf2, 0x0a]));
    setKeyState(machine, 0x0b, true);

    executeNextInstruction(machine);

    expect(machine.registers[2]).toBe(0x0b);
    expect(machine.programCounter).toBe(0x202);
  });

  it('rejects a keypad index outside 0 through F', () => {
    const machine = createMachine();
    expect(() => setKeyState(machine, -1, true)).toThrow(RangeError);
    expect(() => setKeyState(machine, 1.5, true)).toThrow(RangeError);
    expect(() => setKeyState(machine, 0x10, true)).toThrow(RangeError);
  });

  it.each([
    [0xe1, 0x9e, false, false],
    [0xe1, 0xa1, true, false],
  ])(
    'does not skip for 0x%i when its key predicate is false',
    (highByte, lowByte, pressed) => {
      const machine = createMachine();
      loadRom(machine, Uint8Array.from([highByte, lowByte]));
      machine.registers[1] = 0x0a;
      setKeyState(machine, 0x0a, pressed);

      executeNextInstruction(machine);

      expect(machine.programCounter).toBe(0x202);
    },
  );
});
