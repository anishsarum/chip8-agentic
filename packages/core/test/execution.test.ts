import { describe, expect, it } from 'vitest';

import {
  createExecutionLoop,
  createMachine,
  loadRom,
  runFrame,
} from '../src/index.js';

describe('CHIP-8 execution frames', () => {
  it('runs a configurable number of CPU instructions while ticking timers once', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0x70, 0x01, 0x70, 0x01]));
    machine.delayTimer = 2;
    machine.soundTimer = 1;

    runFrame(machine, 2);

    expect(machine.registers[0]).toBe(2);
    expect(machine.programCounter).toBe(0x204);
    expect(machine.delayTimer).toBe(1);
    expect(machine.soundTimer).toBe(0);
  });

  it('runs a configurable CPU rate while timers continue through FX0A waits', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xf0, 0x0a]));
    machine.delayTimer = 2;
    const loop = createExecutionLoop(machine, {
      cyclesPerSecond: 120,
      initialTimeMs: 0,
    });

    loop.start();
    loop.advanceTo(17);

    expect(machine.programCounter).toBe(0x200);
    expect(machine.delayTimer).toBe(1);
    expect(loop.isRunning()).toBe(true);

    loop.stop();
    loop.advanceTo(34);
    expect(machine.delayTimer).toBe(1);
  });

  it('stops the execution loop after an instruction error', () => {
    const machine = createMachine();
    loadRom(machine, Uint8Array.from([0xff, 0xff]));
    const loop = createExecutionLoop(machine, {
      cyclesPerSecond: 60,
      initialTimeMs: 0,
    });

    loop.start();

    expect(() => loop.advanceTo(17)).toThrow();
    expect(loop.isRunning()).toBe(false);
  });
});
