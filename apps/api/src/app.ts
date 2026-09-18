import Fastify from 'fastify';
import {
  parseClientMessage,
  parseFrameRequest,
  parseRomLoadRequest,
  type EmulatorSnapshot,
} from '@chip8/contracts';
import {
  consumeDisplayChange,
  createMachine,
  isSoundActive,
  loadRom,
  resetMachine,
  runFrame,
  setKeyState,
  type Chip8Machine,
} from '@chip8/core';

export function createApp() {
  const app = Fastify();
  const machine = createMachine();
  let running = false;

  app.get('/health', async () => ({ status: 'ready' }));

  app.post('/rom', async (request, reply) => {
    const romRequest = parseRomLoadRequest(request.body);
    if (romRequest === undefined) {
      return reply.code(400).send({ error: 'ROM must be an array of bytes' });
    }

    loadRom(machine, Uint8Array.from(romRequest.rom));
    running = false;
    return reply.code(204).send();
  });

  app.post('/session/start', async (_request, reply) => {
    running = true;
    return reply.code(204).send();
  });

  app.post('/session/stop', async (_request, reply) => {
    running = false;
    return reply.code(204).send();
  });

  app.post('/session/reset', async () => {
    running = false;
    resetMachine(machine);
    return serializeMachine(machine, running);
  });

  app.post('/frame', async (request, reply) => {
    const frameRequest = parseFrameRequest(request.body);
    if (frameRequest === undefined) {
      return reply
        .code(400)
        .send({ error: 'cycles must be a non-negative integer' });
    }

    runFrame(machine, frameRequest.cycles);
    return serializeMachine(machine, running);
  });

  app.post('/key', async (request, reply) => {
    const message = parseClientMessage(request.body);
    if (message === undefined) {
      return reply.code(400).send({ error: 'Invalid keypad message' });
    }

    setKeyState(machine, message.key, message.pressed);
    return reply.code(204).send();
  });

  return app;
}

function serializeMachine(
  machine: Chip8Machine,
  running: boolean,
): EmulatorSnapshot {
  return {
    display: Array.from(machine.display),
    displayChanged: consumeDisplayChange(machine),
    programCounter: machine.programCounter,
    registers: Array.from(machine.registers),
    running,
    soundActive: isSoundActive(machine),
  };
}
