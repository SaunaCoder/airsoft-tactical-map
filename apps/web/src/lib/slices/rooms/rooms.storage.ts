// Everything identifying this device in a room lives in localStorage. There are no accounts.
const leaderTokenKey = (code: string) => `leaderToken:${code}`;
const memberIdKey = (code: string) => `memberId:${code}`;
const LAST_NAME_KEY = 'displayName';

export function saveLeaderToken(code: string, token: string): void {
  localStorage.setItem(leaderTokenKey(code), token);
}

export function loadLeaderToken(code: string): string | undefined {
  return localStorage.getItem(leaderTokenKey(code)) ?? undefined;
}

/** Remembered so a reconnect or page reload resumes the same member instead of creating a new one. */
export function saveMemberId(code: string, memberId: string): void {
  localStorage.setItem(memberIdKey(code), memberId);
}

export function loadMemberId(code: string): string | undefined {
  return localStorage.getItem(memberIdKey(code)) ?? undefined;
}

export function saveLastName(name: string): void {
  localStorage.setItem(LAST_NAME_KEY, name);
}

export function loadLastName(): string {
  return localStorage.getItem(LAST_NAME_KEY) ?? '';
}
