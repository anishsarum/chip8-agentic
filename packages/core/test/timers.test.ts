import { describe, expect, it } from 'vitest';

import {
  createMachine,
  createTimerScheduler,
  executeNextInstruction,
  loadRom,
  tickTimers,
  isSoundActive,
} from '../src/index.js';

describe('CHIP-8 timers', () => {
  it('reads and writes the delay and sound timers through FX opcodes', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xf1, 0x07, 0xf1, 0x15, 0xf1, 0x18]));
    machine.delayTimer = 8;

    executeNextInstruction(machine);
    expect(machine.registers[1]).toBe(8);
    machine.registers[1] = 5;
    executeNextInstruction(machine);
    expect(machine.delayTimer).toBe(5);
    machine.registers[1] = 3;
    executeNextInstruction(machine);
    expect(machine.soundTimer).toBe(3);
  });

  it('decrements non-zero timers once per 60 Hz tick without underflowing', () => {
    const machine = createMachine();
    machine.delayTimer = 1;
    machine.soundTimer = 2;

    tickTimers(machine);
    expect(machine.delayTimer).toBe(0);
    expect(machine.soundTimer).toBe(1);
    tickTimers(machine);
    expect(machine.delayTimer).toBe(0);
    expect(machine.soundTimer).toBe(0);
  });

  it('advances timers from an injected 60 Hz clock with deterministic catch-up', () => {
    const machine = createMachine();
    machine.delayTimer = 3;
    machine.soundTimer = 2;
    const scheduler = createTimerScheduler(machine, 0);

    scheduler.advanceTo(16);
    expect(machine.delayTimer).toBe(3);
    scheduler.advanceTo(17);
    expect(machine.delayTimer).toBe(2);
    scheduler.advanceTo(50);
    expect(machine.delayTimer).toBe(0);
    expect(machine.soundTimer).toBe(0);
  });

  it('exposes whether the sound timer is active', () => {
    const machine = createMachine();
    expect(isSoundActive(machine)).toBe(false);

    machine.soundTimer = 1;
    expect(isSoundActive(machine)).toBe(true);
  });
});
