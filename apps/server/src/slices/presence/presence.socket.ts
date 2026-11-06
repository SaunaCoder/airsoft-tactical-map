import { Events, positionUpdateSchema } from '@airsoft/shared';
import { handle, requireSession, type AppSocket } from '../../core/socket.ts';
import { setMemberPosition } from '../rooms/index.ts';
import { isTooFrequent } from './presence.service.ts';

export function registerPresenceHandlers(socket: AppSocket): void {
  let lastAcceptedAt: number | undefined;

  handle(socket, Events.positionUpdate, positionUpdateSchema, async ({ position }) => {
    const { code, memberId } = requireSession(socket);
    const now = Date.now();
    if (isTooFrequent(lastAcceptedAt, now)) return; // dropped silently: the next fix supersedes it
    lastAcceptedAt = now;

    await setMemberPosition(code, memberId, position, new Date(now));
    // The sender already shows its own GPS fix locally.
    socket.to(code).emit(Events.positionUpdated, { memberId, position });
  });
}
