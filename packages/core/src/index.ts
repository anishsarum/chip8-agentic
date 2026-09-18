export const MEMORY_SIZE = 4_096;
export const PROGRAM_START_ADDRESS = 0x200;
export const FONT_START_ADDRESS = 0x000;
export const DISPLAY_WIDTH = 64;
export const DISPLAY_HEIGHT = 32;

export const CHIP8_FONT = Uint8Array.from([
  0xf0,
  0x90,
  0x90,
  0x90,
  0xf0, // 0
  0x20,
  0x60,
  0x20,
  0x20,
  0x70, // 1
  0xf0,
  0x10,
  0xf0,
  0x80,
  0xf0, // 2
  0xf0,
  0x10,
  0xf0,
  0x10,
  0xf0, // 3
  0x90,
  0x90,
  0xf0,
  0x10,
  0x10, // 4
  0xf0,
  0x80,
  0xf0,
  0x10,
  0xf0, // 5
  0xf0,
  0x80,
  0xf0,
  0x90,
  0xf0, // 6
  0xf0,
  0x10,
  0x20,
  0x40,
  0x40, // 7
  0xf0,
  0x90,
  0xf0,
  0x90,
  0xf0, // 8
  0xf0,
  0x90,
  0xf0,
  0x10,
  0xf0, // 9
  0xf0,
  0x90,
  0xf0,
  0x90,
  0x90, // A
  0xe0,
  0x90,
  0xe0,
  0x90,
  0xe0, // B
  0xf0,
  0x80,
  0x80,
  0x80,
  0xf0, // C
  0xe0,
  0x90,
  0x90,
  0x90,
  0xe0, // D
  0xf0,
  0x80,
  0xf0,
  0x80,
  0xf0, // E
  0xf0,
  0x80,
  0xf0,
  0x80,
  0x80, // F
]);

export type Chip8Machine = {
  memory: Uint8Array;
  registers: Uint8Array;
  index: number;
  programCounter: number;
  stack: Uint16Array;
  stackPointer: number;
  delayTimer: number;
  soundTimer: number;
  display: Uint8Array;
  displayChanged: boolean;
  keys: Uint8Array;
};

export class UnsupportedOpcodeError extends Error {
  public constructor(opcode: number) {
    super(
      `Unsupported CHIP-8 opcode: 0x${opcode.toString(16).padStart(4, '0')}`,
    );
    this.name = 'UnsupportedOpcodeError';
  }
}

export function createMachine(): Chip8Machine {
  const machine: Chip8Machine = {
    memory: new Uint8Array(MEMORY_SIZE),
    registers: new Uint8Array(16),
    index: 0,
    programCounter: PROGRAM_START_ADDRESS,
    stack: new Uint16Array(16),
    stackPointer: 0,
    delayTimer: 0,
    soundTimer: 0,
    display: new Uint8Array(DISPLAY_WIDTH * DISPLAY_HEIGHT),
    displayChanged: false,
    keys: new Uint8Array(16),
  };

  resetMachine(machine);
  return machine;
}

export function resetMachine(machine: Chip8Machine): void {
  machine.memory.fill(0);
  machine.memory.set(CHIP8_FONT, FONT_START_ADDRESS);
  machine.registers.fill(0);
  machine.index = 0;
  machine.programCounter = PROGRAM_START_ADDRESS;
  machine.stack.fill(0);
  machine.stackPointer = 0;
  machine.delayTimer = 0;
  machine.soundTimer = 0;
  machine.display.fill(0);
  machine.displayChanged = false;
  machine.keys.fill(0);
}

export function loadRom(machine: Chip8Machine, rom: Uint8Array): void {
  if (rom.length > MEMORY_SIZE - PROGRAM_START_ADDRESS) {
    throw new RangeError('ROM does not fit in CHIP-8 program memory');
  }

  resetMachine(machine);
  machine.memory.set(rom, PROGRAM_START_ADDRESS);
}

export function executeNextInstruction(
  machine: Chip8Machine,
  randomByte: () => number = defaultRandomByte,
): void {
  const opcode = fetchOpcode(machine);
  machine.programCounter += 2;

  const instruction = opcode & 0xf000;
  const address = opcode & 0x0fff;
  const x = (opcode >> 8) & 0x000f;
  const y = (opcode >> 4) & 0x000f;
  const byte = opcode & 0x00ff;

  try {
    switch (instruction) {
      case 0x0000:
        if (opcode === 0x00e0) {
          machine.display.fill(0);
          machine.displayChanged = true;
          return;
        }

        if (opcode !== 0x00ee) {
          throw new UnsupportedOpcodeError(opcode);
        }

        if (machine.stackPointer === 0) {
          throw new RangeError('CHIP-8 stack underflow');
        }

        machine.stackPointer -= 1;
        machine.programCounter = machine.stack[machine.stackPointer] as number;
        return;
      case 0x1000:
        machine.programCounter = address;
        return;
      case 0x2000:
        if (machine.stackPointer >= machine.stack.length) {
          throw new RangeError('CHIP-8 stack overflow');
        }

        machine.stack[machine.stackPointer] = machine.programCounter;
        machine.stackPointer += 1;
        machine.programCounter = address;
        return;
      case 0x3000:
        if (machine.registers[x] === byte) {
          machine.programCounter += 2;
        }
        return;
      case 0x4000:
        if (machine.registers[x] !== byte) {
          machine.programCounter += 2;
        }
        return;
      case 0x5000:
        if ((opcode & 0x000f) !== 0) {
          throw new UnsupportedOpcodeError(opcode);
        }

        if (readRegister(machine, x) === readRegister(machine, y)) {
          machine.programCounter += 2;
        }
        return;
      case 0x6000:
        machine.registers[x] = byte;
        return;
      case 0x7000:
        machine.registers[x] = readRegister(machine, x) + byte;
        return;
      case 0x8000:
        switch (opcode & 0x000f) {
          case 0x0000:
            machine.registers[x] = readRegister(machine, y);
            return;
          case 0x0001:
            machine.registers[x] =
              readRegister(machine, x) | readRegister(machine, y);
            return;
          case 0x0002:
            machine.registers[x] =
              readRegister(machine, x) & readRegister(machine, y);
            return;
          case 0x0003:
            machine.registers[x] =
              readRegister(machine, x) ^ readRegister(machine, y);
            return;
          case 0x0004: {
            const sum = readRegister(machine, x) + readRegister(machine, y);
            machine.registers[x] = sum;
            machine.registers[0x0f] = sum > 0xff ? 1 : 0;
            return;
          }
          case 0x0005: {
            const left = readRegister(machine, x);
            const right = readRegister(machine, y);
            machine.registers[x] = left - right;
            machine.registers[0x0f] = left >= right ? 1 : 0;
            return;
          }
          case 0x0006: {
            const value = readRegister(machine, x);
            machine.registers[x] = value >> 1;
            machine.registers[0x0f] = value & 0x01;
            return;
          }
          case 0x0007: {
            const left = readRegister(machine, x);
            const right = readRegister(machine, y);
            machine.registers[x] = right - left;
            machine.registers[0x0f] = right >= left ? 1 : 0;
            return;
          }
          case 0x000e: {
            const value = readRegister(machine, x);
            machine.registers[x] = value << 1;
            machine.registers[0x0f] = (value >> 7) & 0x01;
            return;
          }
          default:
            throw new UnsupportedOpcodeError(opcode);
        }
      case 0x9000:
        if ((opcode & 0x000f) !== 0) {
          throw new UnsupportedOpcodeError(opcode);
        }

        if (readRegister(machine, x) !== readRegister(machine, y)) {
          machine.programCounter += 2;
        }
        return;
      case 0xa000:
        machine.index = address;
        return;
      case 0xb000:
        machine.programCounter = address + readRegister(machine, 0);
        return;
      case 0xc000:
        machine.registers[x] = randomByte() & byte;
        return;
      case 0xd000:
        drawSprite(machine, x, y, opcode & 0x000f);
        return;
      case 0xe000:
        executeKeyInstruction(machine, x, byte);
        return;
      case 0xf000:
        executeMemoryInstruction(machine, x, byte);
        return;
      default:
        throw new UnsupportedOpcodeError(opcode);
    }
  } catch (error) {
    machine.programCounter -= 2;
    throw error;
  }
}

function fetchOpcode(machine: Chip8Machine): number {
  const highByte = machine.memory[machine.programCounter];
  const lowByte = machine.memory[machine.programCounter + 1];

  if (highByte === undefined || lowByte === undefined) {
    throw new RangeError('CHIP-8 program counter is outside memory');
  }

  return (highByte << 8) | lowByte;
}

function readRegister(machine: Chip8Machine, index: number): number {
  const value = machine.registers[index];

  if (value === undefined) {
    throw new RangeError(`CHIP-8 register index ${index} is outside V0–VF`);
  }

  return value;
}

function executeMemoryInstruction(
  machine: Chip8Machine,
  x: number,
  byte: number,
): void {
  switch (byte) {
    case 0x07:
      machine.registers[x] = machine.delayTimer;
      return;
    case 0x0a: {
      const pressedKey = machine.keys.findIndex((keyState) => keyState === 1);
      if (pressedKey === -1) {
        machine.programCounter -= 2;
      } else {
        machine.registers[x] = pressedKey;
      }
      return;
    }
    case 0x1e:
      machine.index += readRegister(machine, x);
      return;
    case 0x15:
      machine.delayTimer = readRegister(machine, x);
      return;
    case 0x18:
      machine.soundTimer = readRegister(machine, x);
      return;
    case 0x29:
      machine.index = FONT_START_ADDRESS + readRegister(machine, x) * 5;
      return;
    case 0x33: {
      ensureMemoryRange(machine.index, 3);
      const value = readRegister(machine, x);
      machine.memory[machine.index] = Math.floor(value / 100);
      machine.memory[machine.index + 1] = Math.floor((value % 100) / 10);
      machine.memory[machine.index + 2] = value % 10;
      return;
    }
    case 0x55:
      ensureMemoryRange(machine.index, x + 1);
      for (let registerIndex = 0; registerIndex <= x; registerIndex += 1) {
        machine.memory[machine.index + registerIndex] = readRegister(
          machine,
          registerIndex,
        );
      }
      return;
    case 0x65:
      ensureMemoryRange(machine.index, x + 1);
      for (let registerIndex = 0; registerIndex <= x; registerIndex += 1) {
        machine.registers[registerIndex] = machine.memory[
          machine.index + registerIndex
        ] as number;
      }
      return;
    default:
      throw new UnsupportedOpcodeError((0xf000 | (x << 8) | byte) >>> 0);
  }
}

export function setKeyState(
  machine: Chip8Machine,
  key: number,
  pressed: boolean,
): void {
  if (!Number.isInteger(key) || key < 0 || key >= machine.keys.length) {
    throw new RangeError('CHIP-8 keypad index must be between 0 and F');
  }

  machine.keys[key] = pressed ? 1 : 0;
}

export function tickTimers(machine: Chip8Machine): void {
  if (machine.delayTimer > 0) {
    machine.delayTimer -= 1;
  }

  if (machine.soundTimer > 0) {
    machine.soundTimer -= 1;
  }
}

export type TimerScheduler = {
  advanceTo(timeMs: number): void;
};

export function createTimerScheduler(
  machine: Chip8Machine,
  initialTimeMs = 0,
): TimerScheduler {
  let lastTimeMs = initialTimeMs;
  let elapsedTickUnits = 0;

  return {
    advanceTo(timeMs: number): void {
      if (!Number.isFinite(timeMs) || timeMs < lastTimeMs) {
        throw new RangeError('Timer clock must advance monotonically');
      }

      elapsedTickUnits += (timeMs - lastTimeMs) * 60;
      const ticks = Math.floor(elapsedTickUnits / 1_000);
      elapsedTickUnits -= ticks * 1_000;
      lastTimeMs = timeMs;

      for (let tick = 0; tick < ticks; tick += 1) {
        tickTimers(machine);
      }
    },
  };
}

export function isSoundActive(machine: Chip8Machine): boolean {
  return machine.soundTimer > 0;
}

export function consumeDisplayChange(machine: Chip8Machine): boolean {
  const changed = machine.displayChanged;
  machine.displayChanged = false;
  return changed;
}

export function runFrame(machine: Chip8Machine, cyclesPerFrame: number): void {
  if (!Number.isInteger(cyclesPerFrame) || cyclesPerFrame < 0) {
    throw new RangeError(
      'CHIP-8 cycles per frame must be a non-negative integer',
    );
  }

  for (let cycle = 0; cycle < cyclesPerFrame; cycle += 1) {
    executeNextInstruction(machine);
  }

  tickTimers(machine);
}

export type ExecutionLoop = {
  advanceTo(timeMs: number): void;
  isRunning(): boolean;
  reset(timeMs?: number): void;
  start(): void;
  stop(): void;
};

export function createExecutionLoop(
  machine: Chip8Machine,
  options: { cyclesPerSecond: number; initialTimeMs?: number },
): ExecutionLoop {
  if (
    !Number.isFinite(options.cyclesPerSecond) ||
    options.cyclesPerSecond <= 0
  ) {
    throw new RangeError('CPU cycle rate must be a positive finite number');
  }

  let lastTimeMs = options.initialTimeMs ?? 0;
  let cpuUnits = 0;
  let timerUnits = 0;
  let running = false;

  return {
    advanceTo(timeMs: number): void {
      if (!Number.isFinite(timeMs) || timeMs < lastTimeMs) {
        throw new RangeError('Execution clock must advance monotonically');
      }

      const elapsedMs = timeMs - lastTimeMs;
      lastTimeMs = timeMs;
      if (!running) {
        return;
      }

      cpuUnits += elapsedMs * options.cyclesPerSecond;
      timerUnits += elapsedMs * 60;
      const timerTicks = Math.floor(timerUnits / 1_000);
      timerUnits -= timerTicks * 1_000;

      for (let tick = 0; tick < timerTicks; tick += 1) {
        tickTimers(machine);
      }

      const cpuCycles = Math.floor(cpuUnits / 1_000);
      cpuUnits -= cpuCycles * 1_000;
      for (let cycle = 0; cycle < cpuCycles; cycle += 1) {
        try {
          executeNextInstruction(machine);
        } catch (error) {
          running = false;
          throw error;
        }
      }
    },
    isRunning(): boolean {
      return running;
    },
    reset(timeMs = 0): void {
      if (!Number.isFinite(timeMs)) {
        throw new RangeError('Execution clock must be finite');
      }

      lastTimeMs = timeMs;
      cpuUnits = 0;
      timerUnits = 0;
    },
    start(): void {
      running = true;
    },
    stop(): void {
      running = false;
    },
  };
}

function executeKeyInstruction(
  machine: Chip8Machine,
  x: number,
  byte: number,
): void {
  const key = readRegister(machine, x);
  const isPressed = machine.keys[key] === 1;

  if (byte === 0x9e && isPressed) {
    machine.programCounter += 2;
    return;
  }

  if (byte === 0xa1 && !isPressed) {
    machine.programCounter += 2;
    return;
  }

  if (byte !== 0x9e && byte !== 0xa1) {
    throw new UnsupportedOpcodeError((0xe000 | (x << 8) | byte) >>> 0);
  }
}

function ensureMemoryRange(startAddress: number, length: number): void {
  if (startAddress < 0 || startAddress + length > MEMORY_SIZE) {
    throw new RangeError('CHIP-8 memory access is outside available memory');
  }
}

function defaultRandomByte(): number {
  return Math.floor(Math.random() * 256);
}

function drawSprite(
  machine: Chip8Machine,
  xRegister: number,
  yRegister: number,
  height: number,
): void {
  ensureMemoryRange(machine.index, height);
  const x = readRegister(machine, xRegister) % DISPLAY_WIDTH;
  const y = readRegister(machine, yRegister) % DISPLAY_HEIGHT;
  machine.registers[0x0f] = 0;

  for (let row = 0; row < height; row += 1) {
    const spriteRow = machine.memory[machine.index + row] as number;
    const displayY = (y + row) % DISPLAY_HEIGHT;

    for (let column = 0; column < 8; column += 1) {
      if ((spriteRow & (0x80 >> column)) === 0) {
        continue;
      }

      const displayX = (x + column) % DISPLAY_WIDTH;
      const pixelIndex = displayY * DISPLAY_WIDTH + displayX;
      const existingPixel = machine.display[pixelIndex] as number;

      if (existingPixel === 1) {
        machine.registers[0x0f] = 1;
      }

      machine.display[pixelIndex] = existingPixel ^ 1;
      machine.displayChanged = true;
    }
  }
}
