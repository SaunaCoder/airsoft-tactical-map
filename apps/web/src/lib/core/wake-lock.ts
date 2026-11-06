/**
 * Keeps the screen on while called (e.g. while in a room). A phone that auto-locks suspends the page,
 * which silently stops GPS sharing. Returns a release function.
 */
// ponytail: always on in a room, costs battery; add a toggle if players ask for one.
export function keepScreenOn(): () => void {
  if (!('wakeLock' in navigator)) return () => {};
  let lock: WakeLockSentinel | null = null;
  let released = false;

  const request = async () => {
    if (released || document.visibilityState !== 'visible') return;
    try {
      lock = await navigator.wakeLock.request('screen');
    } catch {
      // Refused (e.g. battery saver): the app still works, the screen may just lock.
    }
  };
  // The browser drops the lock whenever the tab is hidden; take it again on return.
  const onVisibility = () => void request();

  document.addEventListener('visibilitychange', onVisibility);
  void request();
  return () => {
    released = true;
    document.removeEventListener('visibilitychange', onVisibility);
    void lock?.release();
  };
}
