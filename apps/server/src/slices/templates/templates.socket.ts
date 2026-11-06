import { randomUUID } from 'node:crypto';
import { Events, templateLoadSchema } from '@airsoft/shared';
import { ClientError, handle, requireSession, type AppSocket } from '../../core/socket.ts';
import { assertCanEdit, pushFeatures } from '../drawings/index.ts';
import { getTemplate } from './templates.service.ts';

export function registerTemplateHandlers(socket: AppSocket): void {
  // Appends the template's drawings to the room (nothing already drawn is lost).
  handle(socket, Events.templateLoad, templateLoadSchema, async ({ templateId, ownerKey }) => {
    const session = requireSession(socket);
    assertCanEdit(session);

    const template = await getTemplate(ownerKey, templateId);
    if (!template) throw new ClientError('Template not found');

    // Fresh ids, so loading the same template twice can't collide.
    const features = template.features.features.map((feature) => ({ ...feature, id: randomUUID() }));
    if (!(await pushFeatures(session.code, features))) throw new ClientError('Drawing limit reached');

    const room = socket.nsp.to(session.code);
    for (const feature of features) room.emit(Events.featureAdded, feature);
  });
}
