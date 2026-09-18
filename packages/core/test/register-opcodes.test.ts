import { describe, expect, it } from 'vitest';

import {
  createMachine,
  executeNextInstruction,
  loadRom,
} from '../src/index.js';

describe('CHIP-8 register and skip opcodes', () => {
  it('loads and adds an immediate byte with 6XNN and 7XNN', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x61, 0xfe, 0x71, 0x03]));

    executeNextInstruction(machine);
    executeNextInstruction(machine);

    expect(machine.registers[1]).toBe(1);
  });

  it('performs register addition and records carry in VF', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x81, 0x24]));
    machine.registers[1] = 200;
    machine.registers[2] = 100;

    executeNextInstruction(machine);

    expect(machine.registers[1]).toBe(44);
    expect(machine.registers[0xf]).toBe(1);
  });

  it('performs register copy and bitwise operations', () => {
    const machine = createMachine();
    loadRom(
      machine,
      Uint8Array.from([0x81, 0x20, 0x81, 0x21, 0x81, 0x22, 0x81, 0x23]),
    );
    machine.registers[1] = 0b1100_1010;
    machine.registers[2] = 0b1010_1100;

    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(0b1010_1100);
    machine.registers[1] = 0b1100_1010;
    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(0b1110_1110);
    machine.registers[1] = 0b1100_1010;
    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(0b1000_1000);
    machine.registers[1] = 0b1100_1010;
    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(0b0110_0110);
  });

  it('skips exactly one instruction when a comparison matches', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x31, 0x0a, 0x60, 0x01]));
    machine.registers[1] = 0x0a;

    executeNextInstruction(machine);

    expect(machine.programCounter).toBe(0x204);
  });

  it('subtracts register values and records no-borrow in VF', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x81, 0x25, 0x81, 0x27]));
    machine.registers[1] = 9;
    machine.registers[2] = 4;

    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(5);
    expect(machine.registers[0xf]).toBe(1);

    machine.registers[1] = 9;
    machine.registers[2] = 4;
    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(251);
    expect(machine.registers[0xf]).toBe(0);
  });

  it('shifts VX and captures the shifted-out bit in VF', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x81, 0x26, 0x81, 0x2e]));
    machine.registers[1] = 0b1000_0011;

    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(0b0100_0001);
    expect(machine.registers[0xf]).toBe(1);

    machine.registers[1] = 0b1000_0001;
    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(0b0000_0010);
    expect(machine.registers[0xf]).toBe(1);
  });

  it('uses VX, rather than VY, as the selected shift source', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x81, 0x26, 0x81, 0x2e]));
    machine.registers[1] = 0b1000_0011;
    machine.registers[2] = 0b0111_1110;

    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(0b0100_0001);
    expect(machine.registers[0xf]).toBe(1);

    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(0b1000_0010);
    expect(machine.registers[0xf]).toBe(0);
  });

  it.each([
    [0x81, 0xf4, 200, 100, 44, 1],
    [0x81, 0xf5, 20, 10, 10, 1],
    [0x81, 0xf7, 10, 20, 10, 1],
  ])(
    'keeps operands stable when VF aliases an input for 0x%i',
    (opcodeHighByte, opcodeLowByte, v1, vf, expectedV1, expectedVf) => {
      const machine = createMachine();
      loadRom(machine, Uint8Array.from([opcodeHighByte, opcodeLowByte]));
      machine.registers[1] = v1;
      machine.registers[0xf] = vf;

      executeNextInstruction(machine);

      expect(machine.registers[1]).toBe(expectedV1);
      expect(machine.registers[0xf]).toBe(expectedVf);
    },
  );

  it('skips exactly one instruction for the remaining comparison variants', () => {
    const immediateMachine = createMachine();
    loadRom(immediateMachine, Uint8Array.from([0x41, 0x09, 0x60, 0x01]));
    immediateMachine.registers[1] = 0x0a;
    executeNextInstruction(immediateMachine);
    expect(immediateMachine.programCounter).toBe(0x204);

    const equalMachine = createMachine();
    loadRom(equalMachine, Uint8Array.from([0x51, 0x20, 0x60, 0x01]));
    equalMachine.registers[1] = 0x0a;
    equalMachine.registers[2] = 0x0a;
    executeNextInstruction(equalMachine);
    expect(equalMachine.programCounter).toBe(0x204);

    const unequalMachine = createMachine();
    loadRom(unequalMachine, Uint8Array.from([0x91, 0x20, 0x60, 0x01]));
    unequalMachine.registers[1] = 0x0a;
    unequalMachine.registers[2] = 0x0b;
    executeNextInstruction(unequalMachine);
    expect(unequalMachine.programCounter).toBe(0x204);
  });

  it.each([
    [0x31, 0x0a, 0x0a, true],
    [0x31, 0x0a, 0x0b, false],
    [0x41, 0x0a, 0x0b, true],
    [0x41, 0x0a, 0x0a, false],
  ])(
    'applies the expected immediate skip path for 0x%i',
    (opcodeHighByte, immediate, registerValue, shouldSkip) => {
      const machine = createMachine();
      loadRom(machine, Uint8Array.from([opcodeHighByte, immediate]));
      machine.registers[1] = registerValue;

      executeNextInstruction(machine);

      expect(machine.programCounter).toBe(shouldSkip ? 0x204 : 0x202);
    },
  );

  it.each([
    [0x51, 0x20, 0x0a, 0x0a, true],
    [0x51, 0x20, 0x0a, 0x0b, false],
    [0x91, 0x20, 0x0a, 0x0b, true],
    [0x91, 0x20, 0x0a, 0x0a, false],
  ])(
    'applies the expected register skip path for 0x%i',
    (opcodeHighByte, opcodeLowByte, xValue, yValue, shouldSkip) => {
      const machine = createMachine();
      loadRom(machine, Uint8Array.from([opcodeHighByte, opcodeLowByte]));
      machine.registers[1] = xValue;
      machine.registers[2] = yValue;

      executeNextInstruction(machine);

      expect(machine.programCounter).toBe(shouldSkip ? 0x204 : 0x202);
    },
  );
});
