import type { Drawing, MapFeature } from '@airsoft/shared';
import { ClientError, type Session } from '../../core/socket.ts';

/** Only the leader may change drawings. Leadership comes from the session (leader token), never the payload. */
export function assertCanEdit(session: Session): void {
  if (!session.isLeader) throw new ClientError('Only the leader can draw');
}

export function toFeature(drawing: Drawing, id: string): MapFeature {
  return { type: 'Feature', id, ...drawing };
}
