import { Events } from '@airsoft/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '../../core/socket.ts';
import { fakeSocket } from '../../core/socket.testing.ts';
import { pullFeature, pushFeature, replaceFeature } from './drawings.schema.ts';
import { registerDrawingHandlers } from './drawings.socket.ts';

vi.mock('./drawings.schema.ts', () => ({
  pushFeature: vi.fn(async () => true),
  replaceFeature: vi.fn(async () => true),
  pullFeature: vi.fn(async () => true),
}));

const leader: Session = { code: 'ABC234', memberId: '11111111-1111-4111-8111-111111111111', isLeader: true };
const member: Session = { ...leader, memberId: '22222222-2222-4222-8222-222222222222', isLeader: false };

const id = '33333333-3333-4333-8333-333333333333';
const drawing = { geometry: { type: 'Point', coordinates: [30.52, 50.45] }, properties: { kind: 'marker' } };
const feature = { type: 'Feature', id, ...drawing };

const cases = [
  { event: Events.featureAdd, payload: drawing, persist: pushFeature, broadcast: Events.featureAdded },
  { event: Events.featureUpdate, payload: feature, persist: replaceFeature, broadcast: Events.featureUpdated },
  { event: Events.featureDelete, payload: { id }, persist: pullFeature, broadcast: Events.featureDeleted },
];

afterEach(() => vi.clearAllMocks());

describe.each(cases)('$event permissions', ({ event, payload, persist, broadcast }) => {
  it('lets the leader change drawings and broadcasts to the whole room', async () => {
    const { socket, emit, nspTo, roomEmit, send } = fakeSocket(leader);
    registerDrawingHandlers(socket);
    await send(event, payload);

    expect(persist).toHaveBeenCalledOnce();
    expect(nspTo).toHaveBeenCalledWith('ABC234');
    expect(roomEmit).toHaveBeenCalledWith(broadcast, expect.anything());
    expect(emit).not.toHaveBeenCalled();
  });

  it('rejects a member: nothing stored, nothing broadcast', async () => {
    const { socket, emit, roomEmit, send } = fakeSocket(member);
    registerDrawingHandlers(socket);
    await send(event, payload);

    expect(emit).toHaveBeenCalledWith(Events.error, { event, message: 'Only the leader can draw' });
    expect(persist).not.toHaveBeenCalled();
    expect(roomEmit).not.toHaveBeenCalled();
  });

  it('rejects a socket that has not joined', async () => {
    const { socket, emit, roomEmit, send } = fakeSocket();
    registerDrawingHandlers(socket);
    await send(event, payload);

    expect(emit).toHaveBeenCalledWith(Events.error, { event, message: 'Join a room first' });
    expect(persist).not.toHaveBeenCalled();
    expect(roomEmit).not.toHaveBeenCalled();
  });

  it('rejects an invalid payload even from the leader', async () => {
    const { socket, emit, roomEmit, send } = fakeSocket(leader);
    registerDrawingHandlers(socket);
    await send(event, { ...payload, id: 'not-a-uuid', geometry: { type: 'Point', coordinates: [500, 500] } });

    expect(emit).toHaveBeenCalledWith(Events.error, { event, message: 'Invalid payload' });
    expect(persist).not.toHaveBeenCalled();
    expect(roomEmit).not.toHaveBeenCalled();
  });
});

describe('feature:add', () => {
  it('assigns a fresh server id and ignores any client id', async () => {
    const { socket, roomEmit, send } = fakeSocket(leader);
    registerDrawingHandlers(socket);
    await send(Events.featureAdd, { ...drawing, id });

    const added = roomEmit.mock.calls[0]![1];
    expect(added).toMatchObject({ type: 'Feature', ...drawing });
    expect(added.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(added.id).not.toBe(id);
    expect(pushFeature).toHaveBeenCalledWith('ABC234', added);
  });

  it('reports the room drawing limit', async () => {
    vi.mocked(pushFeature).mockResolvedValueOnce(false);
    const { socket, emit, roomEmit, send } = fakeSocket(leader);
    registerDrawingHandlers(socket);
    await send(Events.featureAdd, drawing);

    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.featureAdd, message: 'Drawing limit reached' });
    expect(roomEmit).not.toHaveBeenCalled();
  });
});

describe.each([
  [Events.featureUpdate, feature, replaceFeature],
  [Events.featureDelete, { id }, pullFeature],
] as const)('%s on a missing drawing', (event, payload, persist) => {
  it('tells the leader and broadcasts nothing', async () => {
    vi.mocked(persist).mockResolvedValueOnce(false);
    const { socket, emit, roomEmit, send } = fakeSocket(leader);
    registerDrawingHandlers(socket);
    await send(event, payload);

    expect(emit).toHaveBeenCalledWith(Events.error, { event, message: 'Drawing not found' });
    expect(roomEmit).not.toHaveBeenCalled();
  });
});
