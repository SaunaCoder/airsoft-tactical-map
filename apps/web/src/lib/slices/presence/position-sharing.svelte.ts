import { Events, type LngLat } from '@airsoft/shared';
import { watchGps, type GpsStatus } from '#lib/core/geolocation.ts';
import type { RoomSession } from '#lib/slices/rooms/index.ts';
import { msUntilNextSend } from './presence.ts';

/** Shares this device's GPS with the room and applies everyone else's position updates. */
export class PositionSharing {
  status = $state<GpsStatus>('locating');
  /** Own position straight from GPS, shown without waiting for a server round trip. */
  position = $state<LngLat | null>(null);
  readonly stop: () => void;

  constructor(session: RoomSession) {
    const onUpdated = ({ memberId, position }: { memberId: string; position: LngLat }) => {
      const member = session.state?.members.find((m) => m.id === memberId);
      if (member) member.position = position;
    };
    session.socket.on(Events.positionUpdated, onUpdated);

    let lastSentAt: number | undefined;
    let trailing: ReturnType<typeof setTimeout> | undefined;
    // Leading + trailing throttle: the newest fix always goes out, at most once per interval.
    const send = (force: boolean) => {
      if (!this.position || !session.joined) return;
      const wait = force ? 0 : msUntilNextSend(lastSentAt, Date.now());
      if (wait > 0) {
        trailing ??= setTimeout(() => {
          trailing = undefined;
          send(true);
        }, wait);
        return;
      }
      clearTimeout(trailing);
      trailing = undefined;
      lastSentAt = Date.now();
      session.socket.emit(Events.positionUpdate, { position: this.position });
    };

    // A fix taken before the (re)join was not sent, and a stationary phone may not report again soon.
    // Registered after RoomSession's own listener, so `session.joined` is already true here.
    const onJoined = () => send(true);
    session.socket.on(Events.roomState, onJoined);

    const stopGps = watchGps(
      (position) => {
        this.position = position;
        send(false);
      },
      (status) => (this.status = status),
    );

    this.stop = () => {
      stopGps();
      clearTimeout(trailing);
      session.socket.off(Events.positionUpdated, onUpdated);
      session.socket.off(Events.roomState, onJoined);
    };
  }
}
