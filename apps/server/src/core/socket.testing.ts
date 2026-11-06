import { vi } from 'vitest';
import type { AppSocket, Session } from './socket.ts';

/**
 * Test double for a server socket: captures listeners registered with `on`, records emits to this
 * client (`emit`) and broadcasts to the rest of a room (`to(room).emit` -> `broadcast`).
 */
export function fakeSocket(session?: Session) {
  const listeners = new Map<string, (raw: unknown) => Promise<void>>();
  const emit = vi.fn();
  const broadcast = vi.fn();
  const to = vi.fn(() => ({ emit: broadcast }));
  const socket = {
    data: { session },
    on: (event: string, listener: (raw: unknown) => Promise<void>) => listeners.set(event, listener),
    emit,
    to,
  } as unknown as AppSocket;

  async function send(event: string, raw: unknown): Promise<void> {
    const listener = listeners.get(event);
    if (!listener) throw new Error(`No listener for ${event}`);
    await listener(raw);
  }

  return { socket, emit, to, broadcast, send };
}
