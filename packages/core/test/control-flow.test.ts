import { describe, expect, it } from 'vitest';

import {
  UnsupportedOpcodeError,
  createMachine,
  executeNextInstruction,
  loadRom,
} from '../src/index.js';

describe('CHIP-8 control-flow opcodes', () => {
  it('jumps to NNN for 1NNN', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x12, 0x34]));

    executeNextInstruction(machine);

    expect(machine.programCounter).toBe(0x234);
  });

  it('stores the address after 2NNN before calling NNN', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x23, 0x4a]));

    executeNextInstruction(machine);

    expect(machine.programCounter).toBe(0x34a);
    expect(machine.stackPointer).toBe(1);
    expect(machine.stack[0]).toBe(0x202);
  });

  it('returns to the stored instruction address for 00EE', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x00, 0xee]));
    machine.stack[0] = 0x2ce;
    machine.stackPointer = 1;

    executeNextInstruction(machine);

    expect(machine.programCounter).toBe(0x2ce);
    expect(machine.stackPointer).toBe(0);
  });

  it('uses V0 as the offset for BNNN', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xb3, 0x40]));
    machine.registers[0] = 0x0a;

    executeNextInstruction(machine);

    expect(machine.programCounter).toBe(0x34a);
  });

  it('preserves return addresses through nested calls', () => {
    const machine = createMachine();
    loadRom(
      machine,
      Uint8Array.from([
        0x22,
        0x04, // 0x200: call 0x204
        0x12,
        0x00, // 0x202: loop
        0x22,
        0x08, // 0x204: call 0x208
        0x00,
        0xee, // 0x206: return
        0x00,
        0xee, // 0x208: return
      ]),
    );

    executeNextInstruction(machine);
    executeNextInstruction(machine);
    executeNextInstruction(machine);
    executeNextInstruction(machine);

    expect(machine.programCounter).toBe(0x202);
    expect(machine.stackPointer).toBe(0);
  });

  it('rejects stack underflow and overflow', () => {
    const returnMachine = createMachine();
    loadRom(returnMachine, Uint8Array.from([0x00, 0xee]));

    expect(() => executeNextInstruction(returnMachine)).toThrow(RangeError);

    const callMachine = createMachine();
    loadRom(callMachine, Uint8Array.from([0x22, 0x00]));
    callMachine.stackPointer = callMachine.stack.length;

    expect(() => executeNextInstruction(callMachine)).toThrow(RangeError);
  });

  it('rejects an opcode that has not been implemented', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xff, 0xff]));

    expect(() => executeNextInstruction(machine)).toThrow(
      UnsupportedOpcodeError,
    );
    expect(machine.programCounter).toBe(0x200);
  });
});
