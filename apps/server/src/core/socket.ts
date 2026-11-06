import type { Server as HttpServer } from 'node:http';
import { Events, type ClientToServerEvents, type ServerToClientEvents } from '@airsoft/shared';
import { Server, type Socket } from 'socket.io';
import type { z } from 'zod';

/** Set on the socket once `room:join` succeeds. Permission checks read it, never the client payload. */
export type Session = { code: string; memberId: string; isLeader: boolean };
type SocketData = { session?: Session };

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

export function createSocketServer(httpServer: HttpServer): AppServer {
  // Same-origin only (Vite proxy in dev, nginx in prod), so no CORS config.
  return new Server(httpServer);
}

/** An expected failure whose message is safe to show the client (e.g. "Room not found"). */
export class ClientError extends Error {}

/** Session of a socket that has joined a room; throws for sockets that haven't. */
export function requireSession(socket: Pick<AppSocket, 'data'>): Session {
  if (!socket.data.session) throw new ClientError('Join a room first');
  return socket.data.session;
}

/**
 * Registers a handler that only ever sees a payload parsed by `schema`.
 * Invalid payloads and thrown errors go back to this client as `error`; nothing is broadcast and nothing crashes.
 */
export function handle<S extends z.ZodType>(
  socket: AppSocket,
  event: keyof ClientToServerEvents,
  schema: S,
  handler: (payload: z.infer<S>) => Promise<void> | void,
): void {
  socket.on(event, async (raw: unknown) => {
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      socket.emit(Events.error, { event, message: 'Invalid payload' });
      return;
    }
    try {
      await handler(parsed.data);
    } catch (err) {
      if (!(err instanceof ClientError)) console.error(`[${event}]`, err);
      socket.emit(Events.error, { event, message: err instanceof ClientError ? err.message : 'Internal error' });
    }
  });
}
