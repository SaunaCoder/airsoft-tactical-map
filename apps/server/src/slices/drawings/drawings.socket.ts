import { randomUUID } from 'node:crypto';
import { Events, drawingSchema, featureRefSchema, mapFeatureSchema } from '@airsoft/shared';
import { ClientError, handle, requireSession, type AppSocket } from '../../core/socket.ts';
import { pullFeature, pushFeature, replaceFeature } from './drawings.schema.ts';
import { assertCanEdit, toFeature } from './drawings.service.ts';

// Changes go to the whole room, sender included: the leader's map also renders only server-confirmed state.
export function registerDrawingHandlers(socket: AppSocket): void {
  const room = (code: string) => socket.nsp.to(code);

  handle(socket, Events.featureAdd, drawingSchema, async (drawing) => {
    const session = requireSession(socket);
    assertCanEdit(session);
    const feature = toFeature(drawing, randomUUID());
    if (!(await pushFeature(session.code, feature))) throw new ClientError('Drawing limit reached');
    room(session.code).emit(Events.featureAdded, feature);
  });

  handle(socket, Events.featureUpdate, mapFeatureSchema, async (feature) => {
    const session = requireSession(socket);
    assertCanEdit(session);
    if (!(await replaceFeature(session.code, feature))) throw new ClientError('Drawing not found');
    room(session.code).emit(Events.featureUpdated, feature);
  });

  handle(socket, Events.featureDelete, featureRefSchema, async ({ id }) => {
    const session = requireSession(socket);
    assertCanEdit(session);
    if (!(await pullFeature(session.code, id))) throw new ClientError('Drawing not found');
    room(session.code).emit(Events.featureDeleted, { id });
  });
}
