import type { ClientToServerEvents, ServerToClientEvents } from '@airsoft/shared';
import { io, type Socket } from 'socket.io-client';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** Same-origin connection (Vite proxy in dev, nginx in prod). Socket.IO reconnects on its own. */
export function connectSocket(): AppSocket {
  return io();
}
