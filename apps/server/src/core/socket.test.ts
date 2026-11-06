import { Events, roomJoinSchema } from '@airsoft/shared';
import { describe, expect, it, vi } from 'vitest';
import { ClientError, handle, requireSession } from './socket.ts';
import { fakeSocket } from './socket.testing.ts';

const validJoin = { code: 'ABC234', name: 'Alpha' };

describe('handle', () => {
  it('passes the parsed payload to the handler', async () => {
    const { socket, emit, send } = fakeSocket();
    const handler = vi.fn();
    handle(socket, Events.roomJoin, roomJoinSchema, handler);
    await send(Events.roomJoin, { code: ' abc234 ', name: 'Alpha' });
    expect(handler).toHaveBeenCalledWith({ code: 'ABC234', name: 'Alpha' });
    expect(emit).not.toHaveBeenCalled();
  });

  it.each([undefined, 'junk', { code: 'ABC234' }, { ...validJoin, memberId: 'not-a-uuid' }])(
    'rejects invalid payload %j without calling the handler',
    async (raw) => {
      const { socket, emit, send } = fakeSocket();
      const handler = vi.fn();
      handle(socket, Events.roomJoin, roomJoinSchema, handler);
      await send(Events.roomJoin, raw);
      expect(handler).not.toHaveBeenCalled();
      expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.roomJoin, message: 'Invalid payload' });
    },
  );

  it('sends ClientError messages to the client', async () => {
    const { socket, emit, send } = fakeSocket();
    handle(socket, Events.roomJoin, roomJoinSchema, () => {
      throw new ClientError('Room not found');
    });
    await send(Events.roomJoin, validJoin);
    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.roomJoin, message: 'Room not found' });
  });

  it('hides unexpected error details', async () => {
    const { socket, emit, send } = fakeSocket();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    handle(socket, Events.roomJoin, roomJoinSchema, async () => {
      throw new Error('db exploded at 10.0.0.5');
    });
    await send(Events.roomJoin, validJoin);
    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.roomJoin, message: 'Internal error' });
  });
});

describe('requireSession', () => {
  it('returns the session of a joined socket', () => {
    const session = { code: 'ABC234', memberId: 'm', isLeader: false };
    expect(requireSession(fakeSocket(session).socket)).toBe(session);
  });

  it('rejects a socket that has not joined', () => {
    expect(() => requireSession(fakeSocket().socket)).toThrow(ClientError);
  });
});
