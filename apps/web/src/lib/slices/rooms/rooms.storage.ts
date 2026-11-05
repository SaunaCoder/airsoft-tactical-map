// The leader token lives only on the leader's device, keyed per room.
const leaderTokenKey = (code: string) => `leaderToken:${code}`;

export function saveLeaderToken(code: string, token: string): void {
  localStorage.setItem(leaderTokenKey(code), token);
}

export function loadLeaderToken(code: string): string | null {
  return localStorage.getItem(leaderTokenKey(code));
}
