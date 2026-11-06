import { Events } from '@airsoft/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeSocket } from '../../core/socket.testing.ts';
import { setMemberPosition } from '../rooms/index.ts';
import { MIN_POSITION_INTERVAL_MS, isTooFrequent } from './presence.service.ts';
import { registerPresenceHandlers } from './presence.socket.ts';

vi.mock('../rooms/index.ts', () => ({ setMemberPosition: vi.fn() }));

const member = { code: 'ABC234', memberId: '11111111-1111-4111-8111-111111111111', isLeader: false };
const update = { position: [30.52, 50.45] };

afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('isTooFrequent', () => {
  it('accepts the first fix and fixes at least the minimum interval apart', () => {
    expect(isTooFrequent(undefined, 0)).toBe(false);
    expect(isTooFrequent(1000, 1000 + MIN_POSITION_INTERVAL_MS)).toBe(false);
    expect(isTooFrequent(1000, 1000 + MIN_POSITION_INTERVAL_MS - 1)).toBe(true);
  });
});

describe('position:update', () => {
  it('persists and broadcasts to the rest of the room as the session member', async () => {
    const { socket, to, broadcast, send } = fakeSocket(member);
    registerPresenceHandlers(socket);
    await send(Events.positionUpdate, update);

    expect(setMemberPosition).toHaveBeenCalledWith('ABC234', member.memberId, [30.52, 50.45], expect.any(Date));
    expect(to).toHaveBeenCalledWith('ABC234');
    expect(broadcast).toHaveBeenCalledWith(Events.positionUpdated, {
      memberId: member.memberId,
      position: [30.52, 50.45],
    });
  });

  it('ignores a memberId in the payload (identity comes from the session)', async () => {
    const { socket, broadcast, send } = fakeSocket(member);
    registerPresenceHandlers(socket);
    await send(Events.positionUpdate, { ...update, memberId: 'someone-else' });
    expect(broadcast).toHaveBeenCalledWith(Events.positionUpdated, expect.objectContaining({ memberId: member.memberId }));
  });

  it('rejects sockets that have not joined a room', async () => {
    const { socket, emit, broadcast, send } = fakeSocket();
    registerPresenceHandlers(socket);
    await send(Events.positionUpdate, update);
    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.positionUpdate, message: 'Join a room first' });
    expect(setMemberPosition).not.toHaveBeenCalled();
    expect(broadcast).not.toHaveBeenCalled();
  });

  it.each([{ position: [50.45, 120] }, { position: [30.52] }, {}])('rejects invalid position %j', async (raw) => {
    const { socket, emit, broadcast, send } = fakeSocket(member);
    registerPresenceHandlers(socket);
    await send(Events.positionUpdate, raw);
    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.positionUpdate, message: 'Invalid payload' });
    expect(broadcast).not.toHaveBeenCalled();
  });

  it('drops updates that arrive faster than the flood guard allows', async () => {
    vi.useFakeTimers();
    const { socket, broadcast, send } = fakeSocket(member);
    registerPresenceHandlers(socket);
    await send(Events.positionUpdate, update);
    await send(Events.positionUpdate, update);
    expect(broadcast).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(MIN_POSITION_INTERVAL_MS);
    await send(Events.positionUpdate, update);
    expect(broadcast).toHaveBeenCalledTimes(2);
  });
});
