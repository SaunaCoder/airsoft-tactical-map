import { Events, type Template } from '@airsoft/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Session } from '../../core/socket.ts';
import { fakeSocket } from '../../core/socket.testing.ts';
import { pushFeatures } from '../drawings/index.ts';
import { getTemplate } from './templates.service.ts';
import { registerTemplateHandlers } from './templates.socket.ts';

vi.mock('../drawings/index.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../drawings/index.ts')>()),
  pushFeatures: vi.fn(async () => true),
}));
vi.mock('./templates.service.ts', () => ({ getTemplate: vi.fn() }));

const leader: Session = { code: 'ABC234', memberId: '11111111-1111-4111-8111-111111111111', isLeader: true };
const member: Session = { ...leader, isLeader: false };
const load = { templateId: 'a'.repeat(24), ownerKey: 'k'.repeat(43) };
const templateFeatureId = '33333333-3333-4333-8333-333333333333';
const template: Template = {
  id: load.templateId,
  name: 'Field A',
  center: [30.52, 50.45],
  zoom: 16,
  updatedAt: new Date().toISOString(),
  features: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: templateFeatureId,
        geometry: { type: 'Point', coordinates: [30.52, 50.45] },
        properties: { kind: 'marker' },
      },
    ],
  },
};

afterEach(() => vi.clearAllMocks());

describe('template:load', () => {
  it('appends the template drawings with fresh ids and broadcasts them to the room', async () => {
    vi.mocked(getTemplate).mockResolvedValueOnce(template);
    const { socket, emit, nspTo, roomEmit, send } = fakeSocket(leader);
    registerTemplateHandlers(socket);
    await send(Events.templateLoad, load);

    expect(getTemplate).toHaveBeenCalledWith(load.ownerKey, load.templateId);
    const [code, features] = vi.mocked(pushFeatures).mock.calls[0]!;
    expect(code).toBe('ABC234');
    expect(features).toHaveLength(1);
    expect(features[0]!.id).not.toBe(templateFeatureId);
    expect(nspTo).toHaveBeenCalledWith('ABC234');
    expect(roomEmit).toHaveBeenCalledWith(Events.featureAdded, features[0]);
    expect(emit).not.toHaveBeenCalled();
  });

  it('rejects a member before reading any template', async () => {
    const { socket, emit, roomEmit, send } = fakeSocket(member);
    registerTemplateHandlers(socket);
    await send(Events.templateLoad, load);

    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.templateLoad, message: 'Only the leader can draw' });
    expect(getTemplate).not.toHaveBeenCalled();
    expect(roomEmit).not.toHaveBeenCalled();
  });

  it('rejects a socket that has not joined', async () => {
    const { socket, emit, send } = fakeSocket();
    registerTemplateHandlers(socket);
    await send(Events.templateLoad, load);
    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.templateLoad, message: 'Join a room first' });
  });

  it('reports a template that is missing or owned by someone else', async () => {
    vi.mocked(getTemplate).mockResolvedValueOnce(null);
    const { socket, emit, roomEmit, send } = fakeSocket(leader);
    registerTemplateHandlers(socket);
    await send(Events.templateLoad, load);

    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.templateLoad, message: 'Template not found' });
    expect(pushFeatures).not.toHaveBeenCalled();
    expect(roomEmit).not.toHaveBeenCalled();
  });

  it('reports the room drawing limit and broadcasts nothing', async () => {
    vi.mocked(getTemplate).mockResolvedValueOnce(template);
    vi.mocked(pushFeatures).mockResolvedValueOnce(false);
    const { socket, emit, roomEmit, send } = fakeSocket(leader);
    registerTemplateHandlers(socket);
    await send(Events.templateLoad, load);

    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.templateLoad, message: 'Drawing limit reached' });
    expect(roomEmit).not.toHaveBeenCalled();
  });

  it.each([{ ...load, templateId: 'nope' }, { ...load, ownerKey: 'short' }, {}])('rejects invalid payload %j', async (raw) => {
    const { socket, emit, send } = fakeSocket(leader);
    registerTemplateHandlers(socket);
    await send(Events.templateLoad, raw);
    expect(emit).toHaveBeenCalledWith(Events.error, { event: Events.templateLoad, message: 'Invalid payload' });
    expect(getTemplate).not.toHaveBeenCalled();
  });
});
