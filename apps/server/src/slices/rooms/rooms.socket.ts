import { randomUUID } from 'node:crypto';
import { Events, roomJoinSchema } from '@airsoft/shared';
import { ClientError, handle, type AppServer, type AppSocket } from '../../core/socket.ts';
import { findRoom, touchMember, upsertMember } from './rooms.schema.ts';
import { buildRoomState, planJoin } from './rooms.service.ts';

async function onlineMemberIds(io: AppServer, code: string): Promise<Set<string>> {
  const sockets = await io.in(code).fetchSockets();
  return new Set(sockets.flatMap((s) => (s.data.session ? [s.data.session.memberId] : [])));
}

export function registerRoomHandlers(io: AppServer, socket: AppSocket): void {
  handle(socket, Events.roomJoin, roomJoinSchema, async (join) => {
    // The client opens a new socket per room (and per reconnect), so one join per socket is enough.
    if (socket.data.session) throw new ClientError('Already joined a room');

    const room = await findRoom(join.code);
    if (!room) throw new ClientError('Room not found');

    const plan = planJoin(room, join, randomUUID());
    await upsertMember(room.code, { id: plan.memberId, name: plan.name }, new Date());
    socket.data.session = { code: room.code, memberId: plan.memberId, isLeader: plan.isLeader };
    await socket.join(room.code);

    const [fresh, online] = await Promise.all([findRoom(room.code), onlineMemberIds(io, room.code)]);
    const state = buildRoomState(fresh ?? room, plan, online);
    socket.emit(Events.roomState, state);
    // Sent on every join (not just new members) so a reconnect with a new name updates everyone.
    const me = state.members.find((m) => m.id === plan.memberId);
    if (me) socket.to(room.code).emit(Events.memberJoined, me);
  });

  socket.on('disconnect', async () => {
    const session = socket.data.session;
    if (!session) return;
    try {
      await touchMember(session.code, session.memberId, new Date());
      // The same member may still be connected from another tab.
      if (!(await onlineMemberIds(io, session.code)).has(session.memberId)) {
        io.to(session.code).emit(Events.memberLeft, { memberId: session.memberId });
      }
    } catch (err) {
      console.error('[disconnect]', err);
    }
  });
}
