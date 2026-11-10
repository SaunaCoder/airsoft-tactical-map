import type { Member } from '@airsoft/shared';

const MINUTE = 60_000;

/** "just now", "5 min ago", "2 h ago", "3 d ago". A clock ahead of the server's reads as "just now". */
export function lastSeenLabel(lastSeen: string, now: number): string {
  const minutes = Math.floor((now - Date.parse(lastSeen)) / MINUTE);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.floor(hours / 24)} d ago`;
}

/** Offline members first (longest gone first), so the leader sees drop-outs at the top. Stable otherwise. */
export function sortMembers(members: readonly Member[]): Member[] {
  return members.toSorted((a, b) => {
    if (a.online !== b.online) return a.online ? 1 : -1;
    return a.online ? 0 : Date.parse(a.lastSeen) - Date.parse(b.lastSeen);
  });
}
