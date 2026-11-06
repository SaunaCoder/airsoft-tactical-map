import { Events, type ClientToServerEvents, type RoomState } from '@airsoft/shared';
import { connectSocket, type AppSocket } from '#lib/core/socket.ts';
import { loadLeaderToken, loadMemberId, saveLastName, saveMemberId } from './rooms.storage.ts';

const ERROR_VISIBLE_MS = 5000;

/** One connection to one room. Other slices reuse `socket` for listening and `send` for emitting. */
export class RoomSession {
  state = $state<RoomState | null>(null);
  error = $state('');
  /** True between `room:state` and the next disconnect: only then does the server accept room events. */
  joined = $state(false);
  readonly socket: AppSocket;

  #errorTimer: ReturnType<typeof setTimeout> | undefined;
  // The browser knows about lost network long before a heartbeat times out; react to it right away.
  #onOffline = () => this.socket.disconnect();
  #onOnline = () => this.socket.connect();

  constructor(code: string, name: string) {
    saveLastName(name);
    this.socket = connectSocket();
    window.addEventListener('offline', this.#onOffline);
    window.addEventListener('online', this.#onOnline);

    // Fires on the first connect and on every reconnect, so the server always re-sends a fresh snapshot.
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
      this.joined = true;
    });

    this.socket.on('disconnect', () => {
      this.joined = false;
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

    this.socket.on(Events.error, ({ message }) => this.#showError(message));
  }

  /**
   * Emits a room event only while joined. Socket.IO would otherwise buffer it and flush it on
   * reconnect *before* `room:join`, where the server rejects it; better to say so now.
   */
  send<E extends keyof ClientToServerEvents>(event: E, ...args: Parameters<ClientToServerEvents[E]>): void {
    if (!this.joined) {
      this.#showError('You are offline. The change was not sent.');
      return;
    }
    // Socket.IO's emit overloads can't follow a generic event name; the signature above keeps callers typed.
    const emit = this.socket.emit.bind(this.socket) as (event: E, ...rest: typeof args) => void;
    emit(event, ...args);
  }

  leave(): void {
    window.removeEventListener('offline', this.#onOffline);
    window.removeEventListener('online', this.#onOnline);
    clearTimeout(this.#errorTimer);
    this.socket.disconnect();
  }

  #showError(message: string): void {
    this.error = message;
    clearTimeout(this.#errorTimer);
    // Before the first snapshot an error is fatal (e.g. "Room not found") and stays on screen.
    if (this.state) this.#errorTimer = setTimeout(() => (this.error = ''), ERROR_VISIBLE_MS);
  }
}
