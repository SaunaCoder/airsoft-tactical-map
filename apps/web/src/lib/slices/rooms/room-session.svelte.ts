import { Events, type RoomState } from '@airsoft/shared';
import { connectSocket, type AppSocket } from '#lib/core/socket.ts';
import { loadLeaderToken, loadMemberId, saveLastName, saveMemberId } from './rooms.storage.ts';

/** One connection to one room. Other slices reuse `socket` for their events. */
export class RoomSession {
  state = $state<RoomState | null>(null);
  error = $state('');
  readonly socket: AppSocket;

  constructor(code: string, name: string) {
    saveLastName(name);
    this.socket = connectSocket();

    // Fires on the first connect and on every auto-reconnect, so the server always re-sends a fresh snapshot.
    this.socket.on('connect', () => {
      this.socket.emit(Events.roomJoin, {
        code,
        name,
        leaderToken: loadLeaderToken(code),
        memberId: loadMemberId(code),
      });
    });

    this.socket.on(Events.roomState, (state) => {
      saveMemberId(code, state.memberId);
      this.state = state;
      this.error = '';
    });

    this.socket.on(Events.memberJoined, (member) => {
      if (!this.state) return;
      const members = this.state.members.filter((m) => m.id !== member.id);
      this.state.members = [...members, member];
    });

    this.socket.on(Events.memberLeft, ({ memberId }) => {
      const member = this.state?.members.find((m) => m.id === memberId);
      if (member) member.online = false;
    });

    this.socket.on(Events.error, ({ message }) => {
      this.error = message;
    });
  }

  leave(): void {
    this.socket.disconnect();
  }
}
