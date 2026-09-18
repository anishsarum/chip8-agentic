import { describe, expect, it } from 'vitest';

import {
  createMachine,
  executeNextInstruction,
  loadRom,
} from '../src/index.js';

describe('CHIP-8 address, random, and memory opcodes', () => {
  it('loads I and jumps using V0', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xa3, 0x21, 0xb2, 0x00]));
    machine.registers[0] = 4;

    executeNextInstruction(machine);
    expect(machine.index).toBe(0x321);
    executeNextInstruction(machine);
    expect(machine.programCounter).toBe(0x204);
  });

  it('masks an injected random byte for CXNN', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xc1, 0x0f]));

    executeNextInstruction(machine, () => 0xab);

    expect(machine.registers[1]).toBe(0x0b);
  });

  it('adds VX to I and locates the five-byte font sprite for VX', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xf1, 0x1e, 0xf1, 0x29]));
    machine.index = 0x200;
    machine.registers[1] = 0x0a;

    executeNextInstruction(machine);
    expect(machine.index).toBe(0x20a);
    executeNextInstruction(machine);
    expect(machine.index).toBe(50);
  });

  it('stores decimal digits and transfers V0 through VX to and from memory', () => {
    const bcdMachine = createMachine();
    loadRom(bcdMachine, Uint8Array.from([0xf1, 0x33]));
    bcdMachine.index = 0x350;
    bcdMachine.registers[1] = 231;

    executeNextInstruction(bcdMachine);
    expect(bcdMachine.memory.slice(0x350, 0x353)).toEqual(
      Uint8Array.from([2, 3, 1]),
    );

    const transferMachine = createMachine();
    loadRom(transferMachine, Uint8Array.from([0xf2, 0x55, 0xf2, 0x65]));
    transferMachine.index = 0x360;
    transferMachine.registers.set([4, 5, 6]);

    executeNextInstruction(transferMachine);
    expect(transferMachine.memory.slice(0x360, 0x363)).toEqual(
      Uint8Array.from([4, 5, 6]),
    );
    transferMachine.registers.fill(0);
    executeNextInstruction(transferMachine);
    expect(transferMachine.registers.slice(0, 3)).toEqual(
      Uint8Array.from([4, 5, 6]),
    );
  });

  it('reads and writes the delay and sound timer registers', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xf1, 0x15, 0xf1, 0x18, 0xf2, 0x07]));
    machine.registers[1] = 9;

    executeNextInstruction(machine);
    executeNextInstruction(machine);
    executeNextInstruction(machine);

    expect(machine.delayTimer).toBe(9);
    expect(machine.soundTimer).toBe(9);
    expect(machine.registers[2]).toBe(9);
  });

  it.each([
    [0xf1, 0x33, 0xffe],
    [0xff, 0x55, 0xff1],
    [0xff, 0x65, 0xff1],
  ])(
    'rejects out-of-bounds memory access for 0x%i',
    (highByte, lowByte, index) => {
      const machine = createMachine();
      loadRom(machine, Uint8Array.from([highByte, lowByte]));
      machine.index = index;

      expect(() => executeNextInstruction(machine)).toThrow(RangeError);
    },
  );
});
