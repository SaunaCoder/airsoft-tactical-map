import { Events, roomJoinSchema } from '@airsoft/shared';
import { describe, expect, it, vi } from 'vitest';
import { ClientError, handle, type AppSocket } from './socket.ts';

/** Minimal stand-in: captures the registered listener and records emits. */
function fakeSocket() {
  let listener: (raw: unknown) => Promise<void> = async () => {};
  const emit = vi.fn();
  const socket = { on: (_event: string, fn: typeof listener) => (listener = fn), emit } as unknown as AppSocket;
  return { socket, emit, send: (raw: unknown) => listener(raw) };
}

const validJoin = { code: 'ABC234', name: 'Alpha' };

describe('handle', () => {
  it('passes the parsed payload to the handler', async () => {
    const { socket, emit, send } = fakeSocket();
    const handler = vi.fn();
    handle(socket, Events.roomJoin, roomJoinSchema, handler);
    await send({ code: ' abc234 ', name: 'Alpha' });
    expect(handler).toHaveBeenCalledWith({ code: 'ABC234', name: 'Alpha' });
    expect(emit).not.toHaveBeenCalled();
  });

  it.each([undefined, 'junk', { code: 'ABC234' }, { ...validJoin, memberId: 'not-a-uuid' }])(
    'rejects invalid payload %j without calling the handler',
    async (raw) => {
      const { socket, emit, send } = fakeSocket();
      const handler = vi.fn();
      handle(socket, Events.roomJoin, roomJoinSchema, handler);
      await send(raw);
      expect(handler).not.toHaveBeenCalled();
      expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.roomJoin, message: 'Invalid payload' });
    },
  );

  it('sends ClientError messages to the client', async () => {
    const { socket, emit, send } = fakeSocket();
    handle(socket, Events.roomJoin, roomJoinSchema, () => {
      throw new ClientError('Room not found');
    });
    await send(validJoin);
    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.roomJoin, message: 'Room not found' });
  });

  it('hides unexpected error details', async () => {
    const { socket, emit, send } = fakeSocket();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    handle(socket, Events.roomJoin, roomJoinSchema, async () => {
      throw new Error('db exploded at 10.0.0.5');
    });
    await send(validJoin);
    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.roomJoin, message: 'Internal error' });
  });
});
