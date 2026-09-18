import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import type { EmulatorSnapshot } from '@chip8/contracts';

import './styles.css';

const KEY_MAP: Record<string, number> = {
  '1': 0x1,
  '2': 0x2,
  '3': 0x3,
  '4': 0xc,
  q: 0x4,
  w: 0x5,
  e: 0x6,
  r: 0xd,
  a: 0x7,
  s: 0x8,
  d: 0x9,
  f: 0xe,
  z: 0xa,
  x: 0x0,
  c: 0xb,
  v: 0xf,
};

export function App() {
  const [emulator, setEmulator] = useState<EmulatorSnapshot>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Service shell ready');

  useEffect(() => {
    function sendKey(event: KeyboardEvent, pressed: boolean) {
      const key = KEY_MAP[event.key.toLowerCase()];
      if (key === undefined) {
        return;
      }

      event.preventDefault();
      void fetch('/api/key', {
        body: JSON.stringify({ key, pressed, type: 'key' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      });
    }

    const keyDown = (event: KeyboardEvent) => sendKey(event, true);
    const keyUp = (event: KeyboardEvent) => sendKey(event, false);
    window.addEventListener('keydown', keyDown);
    window.addEventListener('keyup', keyUp);
    return () => {
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
    };
  }, []);

  const step = useCallback(async (cycles = 1) => {
    const response = await fetch('/api/frame', {
      body: JSON.stringify({ cycles }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    if (!response.ok) {
      setStatus('Emulator step failed.');
      return;
    }

    setEmulator((await response.json()) as EmulatorSnapshot);
    setStatus('Running ROM session.');
  }, []);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(() => void step(10), 1000 / 60);
    return () => window.clearInterval(interval);
  }, [running, step]);

  async function loadRom(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file === undefined) {
      return;
    }

    setStatus('Loading ROM…');
    const bytes = Array.from(new Uint8Array(await file.arrayBuffer()));
    const response = await fetch('/api/rom', {
      body: JSON.stringify({ rom: bytes }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    });

    if (response.ok) {
      setRunning(false);
      setStatus('ROM loaded — ready to step.');
    } else {
      setStatus('ROM loading failed.');
    }
  }

  async function resetSession() {
    const response = await fetch('/api/session/reset', { method: 'POST' });
    if (!response.ok) {
      setStatus('Session reset failed.');
      return;
    }

    setEmulator((await response.json()) as EmulatorSnapshot);
    setRunning(false);
    setStatus('Session reset.');
  }

  async function toggleRunning() {
    const nextRunning = !running;
    const response = await fetch(
      nextRunning ? '/api/session/start' : '/api/session/stop',
      { method: 'POST' },
    );
    if (!response.ok) {
      setStatus('Session control failed.');
      return;
    }

    setRunning(nextRunning);
    setStatus(nextRunning ? 'Running ROM session.' : 'ROM session paused.');
  }

  const display = emulator?.display ?? Array<number>(64 * 32).fill(0);

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d');
    if (context === undefined || context === null) {
      return;
    }

    context.fillStyle = '#02090d';
    context.fillRect(0, 0, 64, 32);
    context.fillStyle = '#45df92';
    display.forEach((pixel, index) => {
      if (pixel === 1) {
        context.fillRect(index % 64, Math.floor(index / 64), 1, 1);
      }
    });
  }, [display]);

  return (
    <main className="shell">
      <section aria-labelledby="page-title" className="panel">
        <p className="status">{status}</p>
        <h1 id="page-title">CHIP-8 Emulator</h1>
        <p className="detail">
          Load a ROM, then step its virtual machine. Keypad: 1–4, Q–R, A–F, Z–V.
        </p>
        <p aria-live="polite" className="detail">
          {emulator?.soundActive ? 'Sound timer active' : 'Sound timer idle'}
        </p>
        <div className="controls">
          <label>
            ROM file
            <input aria-label="ROM file" onChange={loadRom} type="file" />
          </label>
          <button onClick={() => void step()} type="button">
            Step
          </button>
          <button onClick={() => void resetSession()} type="button">
            Reset
          </button>
          <button onClick={() => void toggleRunning()} type="button">
            {running ? 'Pause' : 'Run'}
          </button>
        </div>
        <canvas
          aria-label="CHIP-8 display"
          className="display"
          data-lit-pixels={display.filter((pixel) => pixel === 1).length}
          height="32"
          ref={canvasRef}
          width="64"
        />
      </section>
    </main>
  );
}
